export interface CreateOrderResponse {
  success: boolean;
  data: Data;
}

export interface Data {
  booking: Booking;
  payment: Payment;
  show: Show;
  seats: Seat[];
}

export interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  expiresAt: string;
}

export interface Payment {
  id: string;
  stripe: Stripe;
  amount: number;
  ticketsAmount: number;
  convenienceFee: number;
  taxes: number;
  discount: number;
}

export interface Stripe {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface Show {
  id: string;
  movie: Movie;
  theatre: Theatre;
  screen: Screen;
}

export interface Movie {
  id: string;
  title: string;
}

export interface Theatre {
  id: string;
  name: string;
}

export interface Screen {
  id: string;
  name: string;
}

export interface Seat {
  id: string;
  seatId: string;
  price: number;
}
