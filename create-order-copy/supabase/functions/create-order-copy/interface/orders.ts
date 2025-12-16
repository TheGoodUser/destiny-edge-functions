export interface Order {
  order_id: string;
  user_id: string;
  amount: number;
  currency?: string; // Optional (defaults to 'INR')
  payment_environment: "test" | "live";
}
