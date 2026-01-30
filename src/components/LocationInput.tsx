"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapPinIcon } from "lucide-react";

interface LocationInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;            
  defaultValue?: string;     
  className?: string;
  onChange?: (value: string) => void;
}

// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("Window is undefined");

    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);

    document.head.appendChild(script);
  });
};

export function LocationInput({
  id,
  label,
  placeholder = "Enter location",
  value: valueProp,
  defaultValue = "",
  className = "",
  onChange,
}: LocationInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  
  // Sync controlled value
  useEffect(() => {
    if (valueProp !== undefined) {
      setInternalValue(valueProp);
    }
  }, [valueProp]);

  // Load Google Maps
  useEffect(() => {
    if (!apiKey) {
      console.error("Google Maps API key is missing!");
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => setIsLoaded(true))
      .catch((err) => {
        console.error("Failed to load Google Maps script:", err);
        setIsLoaded(false);
      });
  }, [apiKey]);

  // Initialize autocomplete
  useEffect(() => {
    if (isLoaded && inputRef.current) {
      try {
        // Note: google.maps.places.Autocomplete is still supported but deprecated
        // Migration to PlaceAutocompleteElement is recommended but requires significant changes
        // For now, we continue using Autocomplete as it's still maintained
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["geocode"],
        });

        const listener = autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            setInternalValue(place.formatted_address);
            onChange?.(place.formatted_address);
          }
        });

        return () => {
          if (listener) listener.remove();
        };
      } catch (error) {
        console.error("Error initializing Google Maps Autocomplete:", error);
      }
    }
  }, [isLoaded, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className={className}>
      <label className="block text-gray-700 mb-2" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <MapPinIcon size={18} className="text-gray-400" />
        </div>
      </div>
      {!isLoaded && (
        <p className="mt-1 text-xs text-gray-500">
          Note: Google Maps autocomplete not available. Manual entry supported.
        </p>
      )}
    </div>
  );
}
