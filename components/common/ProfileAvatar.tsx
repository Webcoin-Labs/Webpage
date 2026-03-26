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
}

export function ProfileAvatar({
  src,
  alt,
  fallback,
  className,
  fallbackClassName,
  sizes = "64px",
}: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const shouldRenderImage = Boolean(src) && !hasError;
  const isRemoteImage = Boolean(src?.startsWith("http://") || src?.startsWith("https://"));

  if (shouldRenderImage) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {isRemoteImage ? (
          <img
            src={src ?? ""}
            alt={alt}
            onError={() => setHasError(true)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Image
            src={src ?? ""}
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
    <div className={cn("flex items-center justify-center font-semibold", className, fallbackClassName)}>
      {fallback}
    </div>
  );
}
