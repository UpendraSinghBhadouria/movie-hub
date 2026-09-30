export type BookingResponse = Booking[];

export interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  amount: Amount;
  show: Show;
  movie: Movie;
  theatre: Theatre;
  screen: Screen;
  seats: Seat[];
  payment: Payment;
  offer: Offer | null;
  expiresAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Amount {
  tickets: number;
  convenienceFee: number;
  taxes: number;
  discount: number;
  total: number;
}

export interface Show {
  id: string;
  startTime: string;
  endTime: string;
  format: string;
  cancellationAllowed: boolean;
}

export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  certificate: string;
  rating: number;
}

export interface Theatre {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
}

export interface Screen {
  id: string;
  name: string;
}

export interface Seat {
  id: string;
  seatId: string;
  row: string;
  number: number;
  category: string;
  price: number;
  status: string;
}

export interface Payment {
  id: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  status: string;
  method: string | null;
  paidAt?: string;
}

export interface Offer {
  id: string;
  code: string;
  type: string;
}
