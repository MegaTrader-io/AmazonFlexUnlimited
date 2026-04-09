"""
FlexBot API Service
FastAPI wrapper for the FlexUnlimited bot that enables web-based control.
"""

import os
import sys
import asyncio
import threading
from typing import Optional, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.FlexUnlimited import FlexUnlimited
from lib.Offer import Offer

# In-memory storage for bot instances per user
bot_instances: Dict[str, Dict[str, Any]] = {}

class BotConfig(BaseModel):
    user_id: str
    access_token: str
    refresh_token: str
    min_block_rate: float = 50.0
    min_pay_per_hour: float = 18.0
    arrival_buffer: int = 60
    desired_start_time: str = "00:00"
    desired_end_time: str = "23:59"
    desired_weekdays: list[str] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    desired_warehouses: list[str] = []
    retry_limit: int = 0
    refresh_interval: int = 10

class BotStatus(BaseModel):
    user_id: str
    status: str  # running, stopped, error
    started_at: Optional[str] = None
    offers_checked: int = 0
    blocks_accepted: int = 0
    last_check: Optional[str] = None
    error: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("FlexBot API Service starting...")
    yield
    # Shutdown - stop all bot instances
    print("Shutting down all bot instances...")
    for user_id in list(bot_instances.keys()):
        await stop_bot(user_id)


app = FastAPI(
    title="FlexBot API",
    description="API for controlling Amazon Flex bot instances",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FlexBotRunner:
    """Wrapper class for running FlexUnlimited bot with external config"""
    
    def __init__(self, config: BotConfig):
        self.config = config
        self.running = False
        self.offers_checked = 0
        self.blocks_accepted = 0
        self.started_at: Optional[datetime] = None
        self.last_check: Optional[datetime] = None
        self.error: Optional[str] = None
        self._stop_event = threading.Event()
        
    async def start(self):
        """Start the bot loop"""
        self.running = True
        self.started_at = datetime.utcnow()
        self._stop_event.clear()
        
        try:
            # Initialize the session
            self.session = httpx.AsyncClient()
            self.access_token = self.config.access_token
            self.refresh_token = self.config.refresh_token
            
            # Get service areas
            service_areas = await self._get_eligible_service_areas()
            
            while self.running and not self._stop_event.is_set():
                try:
                    # Check for offers
                    offers = await self._get_offers(service_areas)
                    self.offers_checked += len(offers) if offers else 0
                    self.last_check = datetime.utcnow()
                    
                    if offers:
                        for offer in offers:
                            if self._should_accept_offer(offer):
                                accepted = await self._accept_offer(offer)
                                if accepted:
                                    self.blocks_accepted += 1
                                    # Notify callback (could POST to Supabase)
                                    await self._on_block_accepted(offer)
                    
                    # Wait for refresh interval
                    await asyncio.sleep(self.config.refresh_interval)
                    
                except Exception as e:
                    print(f"Error in bot loop: {e}")
                    self.error = str(e)
                    await asyncio.sleep(5)  # Wait before retrying
                    
        except Exception as e:
            self.error = str(e)
            self.running = False
        finally:
            if self.session:
                await self.session.aclose()
    
    def stop(self):
        """Stop the bot"""
        self.running = False
        self._stop_event.set()
    
    def get_status(self) -> BotStatus:
        return BotStatus(
            user_id=self.config.user_id,
            status="running" if self.running else ("error" if self.error else "stopped"),
            started_at=self.started_at.isoformat() if self.started_at else None,
            offers_checked=self.offers_checked,
            blocks_accepted=self.blocks_accepted,
            last_check=self.last_check.isoformat() if self.last_check else None,
            error=self.error
        )
    
    async def _get_amz_date(self) -> str:
        return datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    
    async def _get_eligible_service_areas(self) -> list:
        """Get eligible service areas for the user"""
        headers = self._get_request_headers()
        response = await self.session.get(
            "https://flex-capacity-na.amazon.com/eligibleServiceAreas",
            headers=headers
        )
        if response.status_code == 403:
            await self._refresh_access_token()
            headers = self._get_request_headers()
            response = await self.session.get(
                "https://flex-capacity-na.amazon.com/eligibleServiceAreas",
                headers=headers
            )
        return response.json().get("serviceAreaIds", [])
    
    async def _get_offers(self, service_areas: list) -> list:
        """Get available offers"""
        headers = self._get_request_headers()
        body = {
            "apiVersion": "V2",
            "filters": {
                "serviceAreaFilter": self.config.desired_warehouses or [],
                "timeFilter": {
                    "startTime": self.config.desired_start_time,
                    "endTime": self.config.desired_end_time
                }
            },
            "serviceAreaIds": service_areas
        }
        
        response = await self.session.post(
            "https://flex-capacity-na.amazon.com/GetOffersForProviderPost",
            headers=headers,
            json=body
        )
        
        if response.status_code == 403:
            await self._refresh_access_token()
            headers = self._get_request_headers()
            response = await self.session.post(
                "https://flex-capacity-na.amazon.com/GetOffersForProviderPost",
                headers=headers,
                json=body
            )
        
        data = response.json()
        return data.get("offerList", [])
    
    async def _accept_offer(self, offer: dict) -> bool:
        """Accept an offer"""
        headers = self._get_request_headers()
        response = await self.session.post(
            "https://flex-capacity-na.amazon.com/AcceptOffer",
            headers=headers,
            json={"offerId": offer.get("offerId")}
        )
        return response.status_code == 200
    
    def _should_accept_offer(self, offer: dict) -> bool:
        """Check if offer meets criteria"""
        try:
            rate = offer.get("rateInfo", {}).get("priceAmount", 0) / 100
            duration_hours = (
                datetime.fromisoformat(offer.get("endTime").replace("Z", "+00:00")) -
                datetime.fromisoformat(offer.get("startTime").replace("Z", "+00:00"))
            ).total_seconds() / 3600
            
            hourly_rate = rate / duration_hours if duration_hours > 0 else 0
            
            # Check minimum block rate
            if rate < self.config.min_block_rate:
                return False
            
            # Check minimum hourly rate
            if hourly_rate < self.config.min_pay_per_hour:
                return False
            
            # Check weekday preference
            offer_weekday = datetime.fromisoformat(
                offer.get("startTime").replace("Z", "+00:00")
            ).strftime("%a").lower()
            if self.config.desired_weekdays and offer_weekday not in self.config.desired_weekdays:
                return False
            
            return True
        except Exception:
            return False
    
    async def _refresh_access_token(self):
        """Refresh the access token"""
        data = {
            "app_name": "com.amazon.rabbit",
            "app_version": "303338310",
            "source_token_type": "refresh_token",
            "source_token": self.refresh_token,
            "requested_token_type": "access_token",
        }
        headers = {
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 10; Pixel 2 Build/OPM1.171019.021)",
            "x-amzn-identity-auth-domain": "api.amazon.com",
        }
        response = await self.session.post(
            "https://api.amazon.com/auth/token",
            json=data,
            headers=headers
        )
        self.access_token = response.json().get("access_token")
    
    def _get_request_headers(self) -> dict:
        return {
            "Accept": "application/json",
            "x-amz-access-token": self.access_token,
            "X-Amz-Date": datetime.utcnow().strftime('%Y%m%dT%H%M%SZ'),
            "Accept-Encoding": "gzip, deflate, br",
            "x-flex-instance-id": "BEEBE19A-FF23-47C5-B1D2-21507C831580",
            "Accept-Language": "en-US",
            "Content-Type": "application/json",
            "User-Agent": "iOS/16.1 (iPhone Darwin) Model/iPhone Platform/iPhone14,2 RabbitiOS/2.112.2",
            "Connection": "keep-alive",
        }
    
    async def _on_block_accepted(self, offer: dict):
        """Callback when a block is accepted"""
        # In production, this would POST to your Supabase/backend
        print(f"Block accepted: {offer.get('offerId')}")


# API Routes

@app.get("/")
async def root():
    return {"message": "FlexBot API Service", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "active_bots": len(bot_instances)}


@app.post("/bot/start")
async def start_bot(config: BotConfig, background_tasks: BackgroundTasks):
    """Start a bot instance for a user"""
    user_id = config.user_id
    
    # Check if bot is already running
    if user_id in bot_instances and bot_instances[user_id].get("running"):
        raise HTTPException(status_code=400, detail="Bot is already running")
    
    # Create new bot instance
    runner = FlexBotRunner(config)
    bot_instances[user_id] = {
        "runner": runner,
        "running": True
    }
    
    # Start bot in background
    background_tasks.add_task(runner.start)
    
    return {"message": "Bot started", "user_id": user_id}


@app.post("/bot/stop/{user_id}")
async def stop_bot(user_id: str):
    """Stop a bot instance"""
    if user_id not in bot_instances:
        raise HTTPException(status_code=404, detail="No bot instance found")
    
    runner: FlexBotRunner = bot_instances[user_id]["runner"]
    runner.stop()
    bot_instances[user_id]["running"] = False
    
    return {"message": "Bot stopped", "user_id": user_id}


@app.get("/bot/status/{user_id}")
async def get_bot_status(user_id: str):
    """Get status of a bot instance"""
    if user_id not in bot_instances:
        return BotStatus(user_id=user_id, status="stopped")
    
    runner: FlexBotRunner = bot_instances[user_id]["runner"]
    return runner.get_status()


@app.get("/bot/offers/{user_id}")
async def get_current_offers(user_id: str):
    """Get current offers (for debugging/display)"""
    if user_id not in bot_instances:
        raise HTTPException(status_code=404, detail="No bot instance found")
    
    runner: FlexBotRunner = bot_instances[user_id]["runner"]
    if not runner.running:
        raise HTTPException(status_code=400, detail="Bot is not running")
    
    # This would need to be implemented to return cached offers
    return {"message": "Not implemented yet"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
