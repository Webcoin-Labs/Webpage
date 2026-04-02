"use client";

import { useRef, useState } from "react";
import { sendConnectionRequest } from "@/app/actions/connections";
import { Lock, Send } from "lucide-react";

export function ConnectRequestCard({
  toUserId,
  toUsername,
  source,
  openToConnections,
  isLoggedIn,
  isSelf,
}: {
  toUserId: string;
  toUsername: string;
  source: string;
  openToConnections: boolean;
  isLoggedIn: boolean;
  isSelf: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (isSelf || !isLoggedIn) return null;

  if (!openToConnections) {
    return (
      <div
        className="rounded-[16px] p-5"
        style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
      >
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" style={{ color: "#3f3f46" }} />
          <p className="text-[13px] font-medium" style={{ color: "#71717a" }}>
            Not accepting connections
          </p>
        </div>
        <p className="mt-1 text-[12px]" style={{ color: "#3f3f46" }}>
          This profile is currently closed to new connection requests.
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div
        className="rounded-[16px] p-5 text-center"
        style={{ backgroundColor: "rgba(52,211,153,0.05)", border: "0.5px solid rgba(52,211,153,0.2)" }}
      >
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(52,211,153,0.12)" }}
        >
          <Send className="h-4 w-4" style={{ color: "#34d399" }} />
        </div>
        <p className="text-[13px] font-semibold" style={{ color: "#34d399" }}>
          Connection request sent
        </p>
        <p className="mt-1 text-[12px]" style={{ color: "#71717a" }}>
          @{toUsername} will be notified. You can follow up via public contact methods if available.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[16px] p-5 space-y-4"
      style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
    >
      <div>
        <p className="text-[14px] font-semibold" style={{ color: "#e4e4e7" }}>
          Send a connection request
        </p>
        <p className="mt-1 text-[12px]" style={{ color: "#71717a" }}>
          Introduce yourself briefly. Keep it relevant to why you want to connect.
        </p>
      </div>
      <form
        ref={formRef}
        action={async (formData) => {
          setPending(true);
          await sendConnectionRequest(formData);
          setPending(false);
          setSent(true);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="toUserId" value={toUserId} />
        <input type="hidden" name="toUsername" value={toUsername} />
        <input type="hidden" name="source" value={source} />
        <textarea
          name="message"
          rows={3}
          placeholder="Short intro message (optional) — who you are, why you're reaching out"
          className="w-full resize-none rounded-[12px] px-3 py-2.5 text-[13px] leading-5 outline-none placeholder:text-[#3f3f46]"
          style={{
            backgroundColor: "#0d0d0f",
            border: "0.5px solid #27272a",
            color: "#d4d4d8",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-50"
          style={{ border: "0.5px solid #4c1d95", backgroundColor: "#1a1040", color: "#a78bfa" }}
        >
          {pending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Send request
        </button>
      </form>
    </div>
  );
}
