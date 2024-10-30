interface IZipCodeResponse {
  status: string;
  error_message: string;
  results: {
    address_components: {
      long_name: string;
      types: string[];
    }[];
  }[];
}

async function getZipCode(lat: string, lng: string): Promise<string> {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`
  );
  const data = (await response.json()) as IZipCodeResponse;
  if (data.status !== "OK") {
    throw new Error(
      `Failed to get zip code. Response from external service not ok. Status:${data.status} Message: ${data.error_message}`
    );
  }
  if (data.results.length === 0) {
    throw new Error("Failed to get zip code. No results from external service");
  }
  const addressComponents = data.results[0].address_components;
  const zipCodeComponent = addressComponents.find((component) =>
    component.types.includes("postal_code")
  );
  if (zipCodeComponent == null) {
    throw new Error("Failed to get zip code from external service");
  }
  return zipCodeComponent.long_name;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (lat == null || lng == null) {
    return new Response("Missing lat or lng in request", { status: 400 });
  }
  try {
    const zipcode = await getZipCode(lat, lng);
    return new Response(JSON.stringify({ zipcode }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error fetching zip code", { status: 500 });
  }
}
