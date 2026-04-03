"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  style?: React.CSSProperties;
}

function normalizeLegacyR2ImageUrl(src?: string | null): string | null | undefined {
  if (!src) return src;
  try {
    const parsed = new URL(src);
    const endpointMatch = parsed.hostname.match(/^([a-z0-9-]+)\.r2\.cloudflarestorage\.com$/i);
    if (!endpointMatch) return src;
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2) return src;
    const [bucket, ...keyParts] = pathParts;
    if (!bucket || keyParts.length === 0) return src;
    const key = keyParts.join("/");
    return `https://${bucket}.${endpointMatch[1]}.r2.dev/${key}`;
  } catch {
    return src;
  }
}

export function ProfileAvatar({
  src,
  alt,
  fallback,
  className,
  fallbackClassName,
  sizes = "64px",
  style,
}: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedSrc = normalizeLegacyR2ImageUrl(src);
  const shouldRenderImage = Boolean(normalizedSrc) && !hasError;
  const isRemoteImage = Boolean(normalizedSrc?.startsWith("http://") || normalizedSrc?.startsWith("https://"));

  if (shouldRenderImage) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {isRemoteImage ? (
          <img
            src={normalizedSrc ?? ""}
            alt={alt}
            onError={() => setHasError(true)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Image
            src={normalizedSrc ?? ""}
            alt={alt}
            fill
            sizes={sizes}
            onError={() => setHasError(true)}
            className="object-cover"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center font-semibold", className, fallbackClassName)} style={style}>
      {fallback}
    </div>
  );
}
