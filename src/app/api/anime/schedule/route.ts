import { NextResponse } from "next/server";
import { getAiringSchedule } from "@/lib/api/anilist";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get("start") || "0", 10);
    const end = parseInt(searchParams.get("end") || "0", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!start || !end) {
      return NextResponse.json({ error: "start and end timestamps required" }, { status: 400 });
    }

    const data = await getAiringSchedule(start, end, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/anime/schedule]", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}
