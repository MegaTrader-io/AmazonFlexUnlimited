-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create amazon_accounts table (stores encrypted Amazon Flex credentials)
CREATE TABLE IF NOT EXISTS public.amazon_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amazon_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  device_serial TEXT,
  device_id TEXT,
  flex_instance_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'error')),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create bot_configs table (stores bot settings per user)
CREATE TABLE IF NOT EXISTS public.bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Block filters
  min_block_rate DECIMAL(10, 2) DEFAULT 0,
  min_pay_rate_per_hour DECIMAL(10, 2) DEFAULT 0,
  arrival_buffer INTEGER DEFAULT 60,
  desired_warehouses TEXT[] DEFAULT '{}',
  -- Schedule settings
  desired_start_time TIME,
  desired_end_time TIME,
  desired_weekdays INTEGER[] DEFAULT '{0, 1, 2, 3, 4, 5, 6}',
  -- Speed settings
  request_interval DECIMAL(5, 2) DEFAULT 2.0,
  retry_limit INTEGER DEFAULT 3,
  -- Notifications
  twilio_enabled BOOLEAN DEFAULT FALSE,
  twilio_phone_from TEXT,
  twilio_phone_to TEXT,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  -- Discord
  discord_enabled BOOLEAN DEFAULT FALSE,
  discord_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create bot_sessions table (tracks bot runs)
CREATE TABLE IF NOT EXISTS public.bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'paused', 'error')),
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  blocks_searched INTEGER DEFAULT 0,
  blocks_accepted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table (real-time activity feed)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.bot_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('search', 'offer_found', 'offer_accepted', 'offer_rejected', 'error', 'info', 'warning')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create accepted_blocks table (history of accepted blocks)
CREATE TABLE IF NOT EXISTS public.accepted_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.bot_sessions(id) ON DELETE SET NULL,
  offer_id TEXT NOT NULL,
  block_rate DECIMAL(10, 2),
  service_area_id TEXT,
  service_area_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for amazon_accounts
CREATE POLICY "amazon_accounts_select_own" ON public.amazon_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amazon_accounts_insert_own" ON public.amazon_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amazon_accounts_update_own" ON public.amazon_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amazon_accounts_delete_own" ON public.amazon_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bot_configs
CREATE POLICY "bot_configs_select_own" ON public.bot_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bot_configs_insert_own" ON public.bot_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bot_configs_update_own" ON public.bot_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bot_configs_delete_own" ON public.bot_configs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bot_sessions
CREATE POLICY "bot_sessions_select_own" ON public.bot_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bot_sessions_insert_own" ON public.bot_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bot_sessions_update_own" ON public.bot_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bot_sessions_delete_own" ON public.bot_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for activity_logs
CREATE POLICY "activity_logs_select_own" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_insert_own" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_logs_update_own" ON public.activity_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_delete_own" ON public.activity_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accepted_blocks
CREATE POLICY "accepted_blocks_select_own" ON public.accepted_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accepted_blocks_insert_own" ON public.accepted_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accepted_blocks_update_own" ON public.accepted_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accepted_blocks_delete_own" ON public.accepted_blocks FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also create default bot config
  INSERT INTO public.bot_configs (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_amazon_accounts_user_id ON public.amazon_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configs_user_id ON public.bot_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user_id ON public.bot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON public.bot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accepted_blocks_user_id ON public.accepted_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_accepted_blocks_accepted_at ON public.accepted_blocks(accepted_at DESC);
