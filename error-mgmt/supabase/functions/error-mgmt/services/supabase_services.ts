import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js";

import { AuthIdResponse } from "@interface/authid_response.ts";
import { ErrorResponse } from "@interface/error_response.ts";

export class SupabaseServices {
  private serviceSupabase: SupabaseClient;
  private publicSupabase: SupabaseClient;

  constructor(bearerToken: string) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      throw new Error(
        `Missing supabase url, supabase anon key or supabase service role key`,
      );
    }
    // init supabase clients
    this.serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    this.publicSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          "Authorization": bearerToken,
        },
      },
    });
  }

  // Update the erorrs while orders creation
  async updateOrderError(errorResponse: ErrorResponse, id: string) {
    const { data, error } = await this.serviceSupabase.from("orders").update(
      {
        "error": errorResponse,
      },
    ).eq("user_id", id);
    if (error) {
      console.error(`GOT AN ERROR: ${error.message}`);
    }
    console.error(
      `[ORDERS] ADDED ERROR [CODE: ${errorResponse.code}, STATE: ${errorResponse.state}, MESSAGE: ${errorResponse.message}], DATA: ${data}`,
    );
  }

  // Update the erorr(s) while payment and the verification process
  async updatePaymentError(errorResponse: ErrorResponse, id: string) {
    const { data, error } = await this.serviceSupabase.from("subscriptions")
      .update(
        {
          "error": errorResponse,
        },
      ).eq("user_id", id);
    if (error) {
      console.error(`GOT AN ERROR: ${error.message}`);
    }
    console.error(
      `[SUBSCRIPTIONS] ADDED ERROR [CODE: ${errorResponse.code}, STATE: ${errorResponse.state}, MESSAGE: ${errorResponse.message}], DATA: ${data}`,
    );
  }

  // Secure auth with proper response and return
  // auth id or error respectively
  async getAuthId(): Promise<AuthIdResponse> {
    const {
      data: { user },
      error,
    } = await this.publicSupabase.auth.getUser();

    if (error || !user) {
      console.error(`Invalid JWT: ${error?.message}`);
      return AuthIdResponse.fromMap({
        "authenticated": false,
        "authId": null,
      });
    }
    return AuthIdResponse.fromMap({
      "authenticated": true,
      "authId": user.id,
    });
  }
}
