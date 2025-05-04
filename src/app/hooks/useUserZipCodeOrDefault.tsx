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
    console.log("Attempting to get user location and zipcode");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log("Fetching zip code for user location");
          return await fetchZipCode(
            position.coords.latitude,
            position.coords.longitude
          )
            .then(({ zipcode }) => setZipcode(zipcode))
            .catch((e) => {
              console.error(
                "Failed to fetch zip code frome external source",
                e
              );
              setZipcode(defaultValue);
            })
            .finally(() => setIsLoading(false));
        },
        function (error) {
          console.error("Failed to fetch user location", error);
          setZipcode(defaultValue);
          setIsLoading(false);
        }
      );
    } else {
      console.log("Geolocation not supported, using default zip code");
      setZipcode(defaultValue);
      setIsLoading(false);
    }
  }, [defaultValue]);

  return { isLoading, zipcode, setZipcode };
}
