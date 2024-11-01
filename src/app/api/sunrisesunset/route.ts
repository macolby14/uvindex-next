import { useProxyIfSet } from "../util";

/**
 * Get the latlong for the zipcode from the Google Maps Geocoding API
 */
async function getLatLong(
  zipcode: string
): Promise<{ lat: number; lng: number }> {
  await useProxyIfSet(); //eslint-disable-line react-hooks/rules-of-hooks
  const geocodeResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${process.env.GOOGLE_API_KEY}`
  );
  const geocodeData = await geocodeResponse.json();
  if (geocodeData.status !== "OK" || geocodeData.results.length !== 1) {
    throw new Error(
      `Google Maps Geocode Error. status"${geocodeData.status}, error_message:${geocodeData.error_message}`
    );
  }
  return geocodeData.results[0].geometry.location;
}

export interface ISunriseSunsetResponse {
  status: string;
  results: { sunrise: string; sunset: string };
}

async function getSunsetTime(
  lat: number,
  lng: number,
  date: string
): Promise<ISunriseSunsetResponse> {
  const res = await fetch(
    `https://api.sunrisesunset.io/json?lat=${38.907192}&lng=${-77.036873}&timezone=UTC&date=${date}&time_format=unix`
  ).then((res) => res.json());
  if (res.status !== "OK") {
    throw new Error(`Sunrise-sunset API error: ${res.status}`);
  }
  return res;
}

export async function GET(request: Request) {
  // // await useProxyIfSet(); //eslint-disable-line react-hooks/rules-of-hooks
  const { searchParams } = new URL(request.url);
  const zipcode = searchParams.get("zipcode");
  let date = searchParams.get("date");
  if (zipcode == null) {
    return new Response("Missing zipcode", { status: 400 });
  }
  if (date == null) {
    date = "today";
  }
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey == null) {
    return new Response("Missing API key", { status: 500 });
  }
  try {
    const { lat, lng } = await getLatLong(zipcode);
    const results = await getSunsetTime(lat, lng, date);
    return new Response(JSON.stringify({ ...results }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error fetching sunset data", { status: 500 });
  }
}
