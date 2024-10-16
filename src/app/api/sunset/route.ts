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

async function getSunsetTime(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&timezone=Etc/UTC`
  ).then((res) => res.json());
  if (res.status !== "OK") {
    throw new Error(`Sunrise-sunset API error: ${res.status}`);
  }
  return res.results.sunset;
}

export async function GET(request: Request) {
  // // await useProxyIfSet(); //eslint-disable-line react-hooks/rules-of-hooks
  const { searchParams } = new URL(request.url);
  const zipcode = searchParams.get("zipcode");
  if (zipcode == null) {
    return new Response("Missing zipcode", { status: 400 });
  }
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey == null) {
    return new Response("Missing API key", { status: 500 });
  }
  try {
    const { lat, lng } = await getLatLong(zipcode);
    const sunsetTime = await getSunsetTime(lat, lng);
    return new Response(JSON.stringify({ sunsetTime }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error fetching sunset data", { status: 500 });
  }
}
