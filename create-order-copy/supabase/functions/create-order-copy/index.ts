import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SupabaseServices } from "@services/supabase_services.ts";

import { OrderRequestType } from "@interface/order_request.ts";

import { RazorpayResponse } from "@interface/order_responses.ts";

Deno.serve(async (req) => {
  const { currency, planType, source } = await req.json();
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

  // Generate the order id
  const orderGeneratedDetails: RazorpayResponse = await services.createOrder(
    OrderRequestType.fromMap({
      "currency": currency,
      "userId": isAuthenticated.authId,
      "planType": planType,
      "source": source,
    }),
  );

  return new Response(
    JSON.stringify(orderGeneratedDetails),
    { headers: { "Content-Type": "application/json" } },
  );
});
