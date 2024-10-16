import { useProxyIfSet } from "../util";

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
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${apiKey}`;
  const geocodeResponse = await fetch(geocodeUrl);
  const geocodeData = await geocodeResponse.json();
  if (geocodeData.status !== "OK") {
    console.error(geocodeData.status, geocodeData.error_message);
    return new Response("Something went wrong querying external services", {
      status: 500,
    });
  }
  const location = geocodeData.results[0].geometry.location;
  return new Response(JSON.stringify(location), {
    headers: { "content-type": "application/json" },
  });
}
