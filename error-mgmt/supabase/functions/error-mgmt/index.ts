import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SupabaseServices } from "@services/supabase_services.ts";
import { ErrorResponse, ErrorState } from "@interface/error_response.ts";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  const { code, state, message } = await req.json();

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

  // NOTE: All these errors are happened from client side only

  // Parse the error data
  const errorData: ErrorResponse = {
    code,
    state,
    message,
  };

  if (errorData.state == ErrorState.orderCreation) {
    // Got an order creation error
    await services.updateOrderError(errorData, isAuthenticated.authId!);
  } else {
    // Got an payment creation/verification error
    await services.updatePaymentError(errorData, isAuthenticated.authId!);
  }

  return new Response(
    JSON.stringify("OK"),
    { headers: { "Content-Type": "application/json" } },
  );
});
