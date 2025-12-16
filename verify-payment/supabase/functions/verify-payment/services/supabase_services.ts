import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js";

import { CompanyProfileModel } from "@interface/profiles.ts";
// import { RazorpayResponse } from "@interface/order_responses.ts";
// import { OrderRequestType } from "@interface/order_request.ts";
import { AuthIdResponse } from "@interface/authid_response.ts";
import { SubcriptionsParams } from "@interface/subscriptions_params.ts";

export class SupabaseServices {
  private serviceSupabase: SupabaseClient;
  private publicSupabase: SupabaseClient;
  private paidSwipesCount: number = 1000;

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

  // get the pricings
  async getCompanyProfiles(): Promise<CompanyProfileModel> {
    try {
      const { data, error } = await this.serviceSupabase.from("constants")
        .select()
        .single();
      if (!error) {
        // get the company profiles
        return CompanyProfileModel.fromMap(data);
      }
    } catch (e) {
      throw new Error(`GOT AN ERROR: ${e}`);
    }
    return CompanyProfileModel.fromMap({});
  }

  // Update the Subscriptions table
  // This has been named changeSubscription rather than changeSubcription or addSubcription
  // knowingly.
  async changeSubscription(subcriptionsDetails: SubcriptionsParams) {
    try {
      // update the subscriptions table
      await this.serviceSupabase.from("subscriptions")
        .insert(subcriptionsDetails);

      // its a successful order completion, update the orders table
      await this.serviceSupabase.from(
        "orders",
      ).update({
        order_completed: true,
      }).eq("order_id", subcriptionsDetails.order_id);

      // Update the swipes count in profiles
      await this.updateSwipeCount(subcriptionsDetails.user_id);
    } catch (error) {
      throw new Error(
        `ERROR DURING SUBSCRIPTIONS UPDATE: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // Update the the swipe count to paid swipes count
  // For premium users
  private async updateSwipeCount(userId: string) {
    try {
      // get the paid users swipes limits
      const swipeCount: number =
        (await this.getCompanyProfiles()).paidSwipesCount ??
          this.paidSwipesCount;
      // now update the swipe count in database
      const { error } = await this.serviceSupabase
        .from("profiles")
        .update({ swipe_count: swipeCount })
        .eq("user_id", userId);
      if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
      }
    } catch (e) {
      throw Error(`UPDATING PREMIUM USERS SWIPE COUNT: ${e}`);
    }
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
