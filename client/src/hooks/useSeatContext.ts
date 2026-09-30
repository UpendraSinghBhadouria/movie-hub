import { SeatContext } from "@/context/seat-context";
import { useContext } from "react";

interface SeatContextValue {
  selectedSeats: string[];
  setSelectedSeats: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useSeatContext(): SeatContextValue {
  const context = useContext(SeatContext);

  if (!context) {
    throw new Error("useSeatContext must be used within SeatProvider");
  }

  return context;
}
