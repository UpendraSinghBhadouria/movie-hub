"use client";

import { LocationContext } from "@/context/location-context";
import { GeoLocationResponse } from "@/types";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_LOCATION = "Bhopal";

const SUPPORTED_CITIES = [
  "Bhopal",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Pune",
  "Hyderabad",
];

async function getCityFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
  );

  const data: GeoLocationResponse = await response.json();
  return data.address.city_district;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setLocation = useCallback((city: string) => {
    if (!SUPPORTED_CITIES.includes(city)) {
      return;
    }

    setLocationState(city);

    // Persist user's manually selected city.
    localStorage.setItem("moviehub-location", city);
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await getCityFromCoordinates(
            position.coords.latitude,
            position.coords.longitude,
          );

          setLocationState(city);
          localStorage.setItem("moviehub-location", city);
        } catch {
          setError("Unable to determine your current city.");
        } finally {
          setIsLoading(false);
        }
      },
      (geoError) => {
        let message = "Unable to detect your location.";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = "Location permission was denied.";
        }

        if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message = "Your location is currently unavailable.";
        }

        if (geoError.code === geoError.TIMEOUT) {
          message = "Location detection timed out.";
        }

        setError(message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, []);

  useEffect(() => {
    const savedLocation = localStorage.getItem("moviehub-location");

    if (savedLocation && SUPPORTED_CITIES.includes(savedLocation)) {
      setLocationState(savedLocation);
      setIsLoading(false);
      return;
    }

    detectLocation();
  }, [detectLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        setLocation,
        detectLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
