"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  fallbackClassName?: string;
}

export function ProfileAvatar({ src, alt, fallback, className, fallbackClassName }: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const shouldRenderImage = Boolean(src) && !hasError;

  if (shouldRenderImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src ?? ""}
        alt={alt}
        onError={() => setHasError(true)}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center font-semibold", className, fallbackClassName)}>
      {fallback}
    </div>
  );
}
