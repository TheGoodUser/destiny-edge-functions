import { createHmac } from "node:crypto";
import { VerifySignatureParams } from "@interface/verify_payment_params.ts";

const razorpaySecretKey = Deno.env.get("RAZORPAY_SECRET_KEY");

// This is to verify te signature being generated is valid or not
// This will protect the tempering of the data and the transactions
export function verifySignature({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean {
  if (!razorpaySecretKey) {
    throw new Error("Environment variable RAZORPAY_SECRET_KEY is not set.");
  }
  const generatedSignature = createHmac("sha256", razorpaySecretKey!)
    .update(orderId + "|" + paymentId)
    .digest("hex");
  return signature == generatedSignature;
}
