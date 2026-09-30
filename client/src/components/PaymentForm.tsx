"use client";

import api from "@/lib/axios";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronRight, Loader2 } from "lucide-react";

type PaymentFormProps = {
  bookingNumber: string;
  amount: number;
  onSuccess: (bookingNumber: string) => void;
};

export default function PaymentForm({
  bookingNumber,
  amount,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError("Payment system is still loading. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /*
       * Confirm Stripe PaymentIntent.
       *
       * Stripe handles:
       * - Card
       * - UPI
       * - 3D Secure
       * - Other enabled payment methods
       */
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,

        confirmParams: {
          return_url: `${window.location.origin}/booking/success?bookingNumber=${bookingNumber}`,
        },

        redirect: "if_required",
      });

      if (error) {
        setError(error.message || "Payment could not be completed.");

        return;
      }

      /*
       * Payment succeeded immediately.
       */
      if (paymentIntent?.status === "succeeded") {
        /*
         * Verify PaymentIntent with our backend.
         *
         * Backend retrieves the PaymentIntent directly
         * from Stripe and never trusts the frontend.
         */
        await api.post("/payment/verify", {
          paymentIntentId: paymentIntent.id,
        });

        onSuccess(bookingNumber);

        return;
      }

      /*
       * Stripe may still be processing the payment.
       */
      if (paymentIntent?.status === "processing") {
        setError("Your payment is being processed. Please wait.");

        return;
      }

      setError(`Payment status: ${paymentIntent?.status ?? "unknown"}`);
    } catch (error: any) {
      console.error("[Stripe Payment]", error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while processing payment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stripe Payment Element */}
      <div className="rounded-xl border border-border/60 bg-background p-4">
        <PaymentElement />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Pay */}
      <Button
        type="button"
        disabled={!stripe || !elements || loading}
        onClick={handlePayment}
        className="h-12 w-full rounded-xl bg-pink-600 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-pink-500 dark:hover:bg-pink-600"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            Pay ₹{amount.toLocaleString("en-IN")}
            <ChevronRight className="ml-1 size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
