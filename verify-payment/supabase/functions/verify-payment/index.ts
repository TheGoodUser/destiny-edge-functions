import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { SupabaseServices } from "@services/supabase_services.ts";
import { verifySignature } from "@services/verify_signature.ts";
import { VerifySignatureParams } from "@interface/verify_payment_params.ts";
import {
  SubcriptionsParams,
  SubscriptionPlan,
  SubscriptionSource,
} from "@interface/subscriptions_params.ts";

// If there's any error or exception causing to fetch plans info then
// this default value of premium plan will be used
const defaultPremiumPrice: number = 99;

Deno.serve(async (req) => {
  const { paymentId, orderId, signature, subscriptionSource } = await req
    .json();
  const token = req.headers.get("Authorization");

  if (!token) {
    return new Response("Unauthorized or Invalid Token", {
      status: 401,
    });
  }

  // After a successful JWT verification
  // start the supabase service
  const services = new SupabaseServices(token!);

  // get the auth id
  const isAuthenticated = await services.getAuthId();
  if (!isAuthenticated.authenticated) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
      },
    );
  }

  console.log(
    `payment: ${paymentId}, order: ${orderId}, signature: ${signature}`,
  );

  // Verify the payment signature
  // Confirming whether the payment is verified
  const isPaymentVerified: boolean = await verifySignature(
    <VerifySignatureParams> {
      orderId,
      paymentId,
      signature,
    },
  );

  // Ff verification fails
  if (!isPaymentVerified) {
    return new Response(
      JSON.stringify({ success: false, error: "Payment verification failed" }),
      { status: 400 },
    );
  }

  // set the date limits
  // 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS #
  // 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS #
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);
  // 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS #
  // 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS # 30 DAYS #

  // Verification is successful
  // The parameters being updated
  const subcriptionsDetails: SubcriptionsParams = {
    user_id: isAuthenticated.authId!,
    payment_id: paymentId,
    order_id: orderId,
    plan_type: SubscriptionPlan.monthly,
    amount: ((await services.getCompanyProfiles()).plans?.["premium_plan"] ??
      defaultPremiumPrice) * 100,
    currency: "INR", // This has been hardcoded here but can need to managed dynamically after a good no. of user base
    is_subscribed: true,
    payment_success: true,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    subscription_source: subscriptionSource
      ? SubscriptionSource.mobileAppAndroid
      : SubscriptionSource.mobileAppIos,
    signature: signature,
    gateway: "razorpay", // This has been hardcoded here but can need to managed dynamically after a good no. of user base
    refund_amount: 0,
  };
  // Change the subscription (can say add or update subscription too)
  await services.changeSubscription(subcriptionsDetails);

  return new Response(
    JSON.stringify("OK"),
    { headers: { "Content-Type": "application/json" } },
  );
});
