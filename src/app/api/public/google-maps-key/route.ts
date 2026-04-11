import { NextResponse } from "next/server";

/**
 * Exposes the browser Maps key at runtime so the client works even if
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY was missing at build time (server env still has it).
 * Key is restricted by HTTP referrer in Google Cloud; this is not a secret.
 */
export async function GET() {
  const key = (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY
  )
    ?.trim()
    .replace(/^["']|["']$/g, "");

  return NextResponse.json({ key: key ?? "" });
}
