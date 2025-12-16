export interface OrderRequestType {
  currency: string;
  userId: string;
  planType: string;
  source: string;
}

export const OrderRequestType = {
  fromMap: (map: Record<string, any>): OrderRequestType => {
    return {
      currency: map["currency"],
      userId: map["userId"],
      planType: map["planType"],
      source: map["source"],
    };
  },
};
