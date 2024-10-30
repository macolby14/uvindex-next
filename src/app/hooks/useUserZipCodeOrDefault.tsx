import { useEffect, useState } from "react";

async function fetchZipCode(
  lat: number,
  lng: number
): Promise<{ zipcode: string }> {
  return fetch(`/api/zipcode?lat=${lat}&lng=${lng}`).then((response) => {
    if (response.ok) {
      return response.json() as Promise<{ zipcode: string }>;
    }
    throw new Error("Failed to fetch zip code");
  });
}

export function useUserZipCodeOrDefault(defaultValue: string) {
  const [zipcode, setZipcode] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        return await fetchZipCode(
          position.coords.latitude,
          position.coords.longitude
        )
          .then(({ zipcode }) => setZipcode(zipcode))
          .catch((e) => console.error(e))
          .finally(() => setIsLoading(false));
      });
    }
  }, []);

  return { isLoading, zipcode, setZipcode };
}
