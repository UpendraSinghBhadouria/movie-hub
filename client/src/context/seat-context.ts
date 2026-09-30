"use client";

import React from "react";

type SeatContextValue = {
  selectedSeats: string[];
  setSelectedSeats: React.Dispatch<React.SetStateAction<string[]>>;
};

export const SeatContext = React.createContext<SeatContextValue | undefined>(
  undefined,
);
