import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { drainQueuedPitchDeckAnalysesBySystem } from "@/app/actions/pitchdeck";
import { processDueEventRemindersBySystem } from "@/app/actions/events";

function isAuthorized(request: Request) {
  const expected = process.env.INTERNAL_JOBS_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-webcoinlabs-job-secret");
  if (!provided) return false;

  const expectedBuffer = Buffer.from(expected, "utf-8");
  const providedBuffer = Buffer.from(provided, "utf-8");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  try {
    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const pitch = await drainQueuedPitchDeckAnalysesBySystem(8);
  const reminders = await processDueEventRemindersBySystem(300);

  return NextResponse.json({
    success: true,
    pitch,
    reminders,
  });
}
