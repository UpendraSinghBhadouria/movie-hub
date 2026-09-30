"use client";

import { SeatContext } from "@/context/seat-context";
import { useState } from "react";

interface SeatProviderProps {
  children: React.ReactNode;
}

export function SeatProvider({ children }: SeatProviderProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  return (
    <SeatContext.Provider
      value={{
        selectedSeats,
        setSelectedSeats,
      }}
    >
      {children}
    </SeatContext.Provider>
  );
}
