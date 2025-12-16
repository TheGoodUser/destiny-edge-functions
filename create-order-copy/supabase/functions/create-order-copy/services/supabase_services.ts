import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js";

import { CompanyProfileModel } from "@interface/profiles.ts";
import {
  ErrorResponse,
  OrderResponse,
  RazorpayResponse,
} from "@interface/order_responses.ts";
import { OrderRequestType } from "@interface/order_request.ts";
import { AuthIdResponse } from "@interface/authid_response.ts";
import { Order } from "@interface/orders.ts";

// If there's any error or exception causing to fetch plans info then
// this default value of premium plan will be used
const defaultPremiumPrice: number = 99;

export class SupabaseServices {
  private serviceSupabase: SupabaseClient;
  private publicSupabase: SupabaseClient;
  private headerRazorpay: Record<string, string>;

  constructor(bearerToken: string) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    const razorpayId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpaySecretKey = Deno.env.get("RAZORPAY_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      throw new Error(
        `Missing supabase url, supabase anon key or supabase service role key`,
      );
    }
    if (!razorpayId || !razorpaySecretKey) {
      throw new Error(`Missing razorpay api keys`);
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
    // init headers
    this.headerRazorpay = {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${razorpayId}:${razorpaySecretKey}`),
    };
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

  // create orders
  async createOrder(
    orderDetails: OrderRequestType,
  ): Promise<RazorpayResponse> {
    const body = {
      amount: ((await this.getCompanyProfiles()).plans?.["premium_plan"] ??
        defaultPremiumPrice) * 100,
      currency: orderDetails.currency.toUpperCase(),
      receipt: this.receitIdGenerator(orderDetails.userId.substring(0, 5)),
      notes: {
        "plan_type": orderDetails.planType,
        "source": orderDetails.source,
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: this.headerRazorpay,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.status === 200) {
      const finalData: OrderResponse = data;

      // update into the orders table
      const order: Order = {
        order_id: finalData.id,
        user_id: orderDetails.userId,
        amount: finalData.amount,
        payment_environment: "test",
        currency: finalData.currency,
      };

      await this.addOrder(order);
    } else if ("error" in data) {
      const data_: ErrorResponse = data;
      console.error(`Error Known: ${data_.error.description}`);
    } else {
      console.error(`Error Unknown: ${response.statusText}`);
    }

    return data;
  }

  // Create a recient id
  private receitIdGenerator(id: string): string {
    return `receipt_${id}_${Date.now()}`;
  }

  // update the orders table
  private async addOrder(order: Order) {
    const { data, error } = await this.serviceSupabase.from("orders").insert(
      order,
    );
    if (error) {
      console.error(`GOT AN ERROR: ${error.message}`);
    }
    console.info(
      `ADDED ORDER [ORDER_ID: ${order.order_id}, USER_ID: ${order.user_id}, DATA: ${data}]`,
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
