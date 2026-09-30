import api from "@/lib/axios";

export type CreatePaymentOrderResponse = {
  success: boolean;
  message: string;

  data: {
    orderId: string;
    amount: number;
    currency: string;
  };
};

export async function createPaymentOrder(
  bookingId: string,
): Promise<CreatePaymentOrderResponse> {
  const response = await api.post<CreatePaymentOrderResponse>(
    "/payments/create-order",
    {
      bookingId,
    },
  );

  return response.data;
}
