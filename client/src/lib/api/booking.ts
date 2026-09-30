import api from "@/lib/axios";

export type CreateBookingPayload = {
  showId: string;
  lockId: string;
  seatIds: string[];
  offerId?: string;
};

export type CreateBookingResponse = {
  success: boolean;
  message: string;

  data: {
    bookingId: string;
    bookingNumber: string;

    pricing: {
      subtotal: number;
      discount: number;
      totalAmount: number;
    };

    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

    lock: {
      lockId: string;
      remainingSeconds: number;
    };
  };
};

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<CreateBookingResponse> {
  const response = await api.post<CreateBookingResponse>("/bookings", payload);

  return response.data;
}
