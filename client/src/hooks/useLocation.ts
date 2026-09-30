import { LocationContext } from "@/context/location-context";
import { useContext } from "react";

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocation must be used inside a LocationProvider");
  }

  return context;
}
