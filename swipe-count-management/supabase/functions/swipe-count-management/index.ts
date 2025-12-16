import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Service key to bypass RLS
  );

  // 1. Get free_swipes and paid_swipes from constants
  const { data: constantsData, error: constantsError } = await supabase
    .from("constants")
    .select("free_swipes, paid_swipes")
    .limit(1)
    .single();

  if (constantsError || !constantsData) {
    console.error("Failed to fetch constants:", constantsError);
    return new Response("Error getting constants", { status: 500 });
  }

  const { free_swipes: freeSwipes, paid_swipes: paidSwipes } = constantsData;

  // 2. Get user_ids of subscribed users
  const { data: activeSubs, error: subsError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("is_subscribed", true);

  if (subsError) {
    console.error("Failed to fetch subscriptions:", subsError);
    return new Response("Error getting subscriptions", { status: 500 });
  }

  const subscribedIds = activeSubs.map((s) => s.user_id);

  // 3. Update premium users (subscribed)
  if (subscribedIds.length > 0) {
    const { error: premiumUpdateError } = await supabase
      .from("profiles")
      .update({ swipe_count: paidSwipes })
      .in("user_id", subscribedIds);

    if (premiumUpdateError) {
      console.error("Failed to update premium users:", premiumUpdateError);
      return new Response("Error updating premium users", { status: 500 });
    }
  }

  // 4. Update non-premium users
  const { error: freeUpdateError } = await supabase
    .from("profiles")
    .update({ swipe_count: freeSwipes })
    .not("user_id", "in", `(${subscribedIds.join(",")})`);

  if (freeUpdateError) {
    console.error("Failed to update free users:", freeUpdateError);
    return new Response("Error updating free users", { status: 500 });
  }

  return new Response("Swipe counts reset successfully");
});
