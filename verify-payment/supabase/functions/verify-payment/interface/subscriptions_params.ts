export interface SubcriptionsParams {
  user_id: string;
  payment_id: string;
  order_id: string;
  plan_type: SubscriptionPlan;
  amount: number;
  currency?: string;
  is_subscribed?: boolean;
  payment_success?: boolean;
  start_date: string;
  end_date: string;
  subscription_source: SubscriptionSource;
  signature?: string;
  error?: string;
  gateway?: string; // default = 'razorpay'
  refund_amount?: number;
  cancelled_at?: string;
}

export enum SubscriptionSource {
  mobileAppIos = "mobile_app_ios",
  mobileAppAndroid = "mobile_app_android",
  adminPortal = "admin_portal",
}

export enum SubscriptionPlan {
  monthly = "monthly",
  quarterly = "quarterly",
  half_yearly = "half_yearly",
  yearly = "yearly",
  biennial = "biennial",
  enterprise = "enterprise",
}
