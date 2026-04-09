import { createClient } from "@/lib/supabase/server";
import { AmazonAccountCard } from "@/components/dashboard/amazon-account-card";
import { LinkAccountFlow } from "@/components/dashboard/link-account-flow";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: amazonAccount } = await supabase
    .from("amazon_accounts")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Amazon Account</h1>
        <p className="text-muted-foreground">
          Link your Amazon Flex account to enable automated block hunting
        </p>
      </div>

      {amazonAccount ? (
        <AmazonAccountCard account={amazonAccount} />
      ) : (
        <LinkAccountFlow />
      )}
    </div>
  );
}
