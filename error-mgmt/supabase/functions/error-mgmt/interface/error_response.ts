export interface ErrorResponse {
  code: number;
  state: ErrorState;
  message: string;
}

export enum ErrorState {
  orderCreation = "order_creation",
  paymentVerification = "payment_verification",
}
