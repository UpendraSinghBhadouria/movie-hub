"use client";

import { createContext } from "react";

type LocationContextType = {
  location: string;
  isLoading: boolean;
  error: string | null;
  setLocation: (city: string) => void;
  detectLocation: () => void;
};

export const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);
