import { NextResponse } from "next/server";

/**
 * Server-side proxy for Places API (New) autocomplete.
 * The API key lives only in GOOGLE_MAPS_API_KEY (server env) — never sent to the browser.
 * Browsers call this route; this route calls Google.
 */

const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type GoogleStructuredText = { text?: string };
type GoogleSuggestion = {
  placePrediction?: {
    placeId?: string;
    text?: GoogleStructuredText;
    structuredFormat?: {
      mainText?: GoogleStructuredText;
      secondaryText?: GoogleStructuredText;
    };
  };
};
type GoogleAutocompleteResponse = {
  suggestions?: GoogleSuggestion[];
};

export async function POST(req: Request) {
  const apiKey = (
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  ).trim();

  if (!apiKey) {
    return NextResponse.json(
      { suggestions: [], error: "Places API not configured" },
      { status: 503 },
    );
  }

  let input = "";
  try {
    const body = (await req.json()) as { input?: unknown };
    input = typeof body.input === "string" ? body.input.trim() : "";
  } catch {
    return NextResponse.json({ suggestions: [] });
  }

  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const payload = {
    input,
    includedRegionCodes: ["us"],
    includedPrimaryTypes: ["address"],
    locationBias: {
      rectangle: {
        low: { latitude: 36.42, longitude: -87.52 },
        high: { latitude: 36.62, longitude: -87.22 },
      },
    },
  };

  try {
    const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[HydroNet Places] API error:", res.status, errText);
      return NextResponse.json(
        { suggestions: [], error: "Places API error" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as GoogleAutocompleteResponse;

    const suggestions: PlaceSuggestion[] = (data.suggestions ?? [])
      .filter((s) => s.placePrediction?.placeId)
      .map((s) => ({
        placeId: s.placePrediction!.placeId!,
        description:
          s.placePrediction?.text?.text ??
          s.placePrediction?.structuredFormat?.mainText?.text ??
          "",
        mainText:
          s.placePrediction?.structuredFormat?.mainText?.text ??
          s.placePrediction?.text?.text ??
          "",
        secondaryText:
          s.placePrediction?.structuredFormat?.secondaryText?.text ?? "",
      }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[HydroNet Places] Fetch error:", err);
    return NextResponse.json(
      { suggestions: [], error: "Network error" },
      { status: 502 },
    );
  }
}
