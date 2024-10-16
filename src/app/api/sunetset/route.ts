import { useProxyIfSet } from "../util";

async function getLatLong(
  zipcode: string
): Promise<{ lat: number; lng: number }> {
  const geocodeResponse = await fetch(`/api/sunetset?zipcode=${zipcode}`).then(
    (res) => res.json()
  );
  const geocodeData = await geocodeResponse.json();
  if (geocodeData.status !== "OK" || geocodeData.results.length !== 1) {
    throw new Error(geocodeData.status, geocodeData.error_message);
  }
  return geocodeData.results[0].geometry.location;
}

export async function GET(request: Request) {
  useProxyIfSet(); //eslint-disable-line react-hooks/rules-of-hooks
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
    const sunsetResponse = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`
    ).then((res) => res.json());
    return new Response(JSON.stringify(sunsetResponse), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error fetching sunset data", { status: 500 });
  }
}
