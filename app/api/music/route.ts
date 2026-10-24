import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ELEVENLABS_API_KEY) });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Music generation is not connected yet. Add ELEVENLABS_API_KEY to your .env.local file, then restart the app." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const durationSeconds = Number(body.durationSeconds ?? 30);
    const instrumental = Boolean(body.instrumental);

    if (!prompt) return NextResponse.json({ error: "Please describe the music you want to create." }, { status: 400 });
    if (prompt.length > 2000) return NextResponse.json({ error: "Keep your music prompt under 2,000 characters." }, { status: 400 });
    if (![15, 30, 60, 120].includes(durationSeconds)) {
      return NextResponse.json({ error: "Choose a supported duration: 15, 30, 60, or 120 seconds." }, { status: 400 });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: durationSeconds * 1000,
        model_id: "music_v2_5",
        force_instrumental: instrumental,
      }),
      signal: AbortSignal.timeout(280_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `The music provider returned ${response.status}. ${detail.slice(0, 500) || "Check your API key, account access, and usage limits."}` },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
      );
    }

    if (!response.body) return NextResponse.json({ error: "The provider returned no audio." }, { status: 502 });
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="jass-generated-track.mp3"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while generating music.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
