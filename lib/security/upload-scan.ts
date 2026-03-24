import "server-only";

import { logError } from "@/lib/telemetry";

export async function runUploadSafetyChecks(file: File) {
  const allowed = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ""];
  if (!allowed.includes(file.type)) {
    throw new Error("Only CSV/XLSX files are allowed.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File exceeds 10MB.");
  }

  const hookUrl = process.env.UPLOAD_SCAN_HOOK_URL;
  if (!hookUrl) return;

  // Optional external scanner hook. Keep non-blocking if endpoint is unstable.
  try {
    const res = await fetch(hookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Scanner hook failed with status ${res.status}.`);
    }
  } catch (error) {
    logError("upload_scan_hook_failed", {
      message: error instanceof Error ? error.message : "Unknown scanner error.",
      fileName: file.name,
    });
    throw new Error("Upload safety scan failed. Please retry.");
  }
}
