export interface GeoLocationResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: Address;
  boundingbox: string[];
}

export interface Address {
  city_district: string;
  city: string;
  county: string;
  state_district: string;
  state: string;
  "ISO3166-2-lvl4": string;
  postcode: string;
  country: string;
  country_code: string;
}

export type SeatCategory = "NORMAL" | "EXECUTIVE" | "PREMIUM";

// export type Seat = {
//   id: string;
//   row: string;
//   number: number;
//   category: SeatCategory;
//   status?: "available" | "booked";
// };

// export type SeatSection = {
//   category: SeatCategory;
//   label: string;
//   price: number;
//   description: string;
// };

export interface Offer {
  id: number;
  title: string;
  description: string;
  code: string;
}

export interface MovieOld {
  title: string;
  poster: string;
  certificate: string;
  language: string;
  genre: string;
}
export interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl: string;
  certificate: string;
  rating: number;
  votes: number;
  status: string;
  durationMin: number;
  releaseDate: string;
  promoted: boolean;
  languages: string[];
  genres: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Theatre {
  name: string;
  location: string;
}

export interface Show {
  date: string;
  time: string;
  screen: string;
}

export interface Ticket {
  category: string;
  seats: string[];
  quantity: number;
  price: number;
}

export interface TicketSummary {
  category: string;
  label: string;
  price: number;
  quantity: number;
  seats: string[];
}

export interface CancellationPolicy {
  allowed: boolean;
  message: string;
}

export interface Customer {
  name: string;
  mobile: string;
}

export interface Pricing {
  ticketAmount: number;
  convenienceFee: number;
  taxes: number;
  discount: number;
}

export interface Booking {
  movie: Movie;
  theatre: Theatre;
  show: Show;
  tickets: Ticket[];
  cancellation: CancellationPolicy;
  customer: Customer;
  pricing: Pricing;
}

export interface ShowSeatResponse {
  show: ShowSeat;
  movie: MovieSeat;
  theatre: TheatreSeat;
  screen: ScreenSeat;
  sections: SeatSection[];
  seats: Seat[];
}

export interface ShowSeat {
  id: string;
  startTime: string;
  endTime: string;
  format: string;
  cancellationAllowed: boolean;
}

export interface MovieSeat {
  id: string;
  title: string;
  posterUrl: string;
  certificate: string;
  rating: number;
}

export interface TheatreSeat {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
}

export interface ScreenSeat {
  id: string;
  name: string;
}

export interface SeatSection {
  category: SeatCategory;
  price: number;
  seatCount: number;
}

export interface Seat {
  id: string;
  seatId: string;
  row: string;
  number: number;
  category: SeatCategory;
  price: number;
  status: string;
}
