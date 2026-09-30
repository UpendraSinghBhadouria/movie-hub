"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useState } from "react";
import { CreateOrderResponse } from "@/types/create-order.types";
import PaymentForm from "./PaymentForm";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type PayButtonProps = {
  termsAccepted: boolean;
  showId: string;
  lockId: string | null;
  seatIds: string[];
  amount: number;
};

export function PayButton({
  termsAccepted,
  showId,
  lockId,
  seatIds,
  amount,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /*
   * Create Booking + Stripe PaymentIntent.
   */
  const createPayment = async () => {
    if (!isLoading && !isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;

      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);

      return;
    }

    if (!termsAccepted) {
      setError("Please accept the Terms & Conditions.");

      return;
    }

    if (!lockId) {
      setError("Your seat lock has expired. Please select your seats again.");

      return;
    }

    if (!seatIds.length) {
      setError("Please select at least one seat.");

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<CreateOrderResponse>(
        "/payment/create-order",
        {
          showId,
          lockId,
          seatIds,
        },
      );

      const data = response.data?.data;

      if (!data) {
        throw new Error("Invalid payment response from server.");
      }

      if (!data.booking.id) {
        throw new Error("Booking ID was not returned.");
      }

      if (!data.payment.stripe.clientSecret) {
        throw new Error("Stripe client secret was not returned.");
      }

      /*
       * Store booking/payment information.
       */
      setBookingNumber(data.booking.bookingNumber);

      setClientSecret(data.payment.stripe.clientSecret);
    } catch (error: any) {
      console.error("[Create Stripe Payment]", error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create payment.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Payment succeeded.
   */
  const handleSuccess = (confirmedBookingNumber: string) => {
    /*
     * Redirect to booking confirmation page.
     *
     * Change this route if your application
     * uses a different success page.
     */
    window.location.href = `/bookings/success?bookingNumber=${confirmedBookingNumber}`;
  };

  /*
   * First stage:
   *
   * Create Stripe PaymentIntent.
   */
  if (!clientSecret || !bookingNumber) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button
          type="button"
          disabled={
            !termsAccepted || loading || !lockId || seatIds.length === 0
          }
          onClick={createPayment}
          className="h-12 w-full rounded-xl bg-pink-600 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-pink-500 dark:hover:bg-pink-600"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Preparing payment...
            </>
          ) : (
            <>
              Proceed to Pay
              <ChevronRight className="ml-1 size-4" />
            </>
          )}
        </Button>
      </div>
    );
  }

  /*
   * Second stage:
   *
   * Stripe PaymentElement + Confirm Payment.
   */
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,

        appearance: {
          theme: "stripe",

          variables: {
            colorPrimary: "#db2777",
            borderRadius: "10px",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        },
      }}
    >
      <PaymentForm
        bookingNumber={bookingNumber}
        amount={amount}
        onSuccess={handleSuccess}
      />
    </Elements>
  );
}
