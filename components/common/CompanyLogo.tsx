"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  fallbackClassName?: string;
  imgClassName?: string;
}

function getFallbackText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "C";
  return trimmed.charAt(0).toUpperCase();
}

export function CompanyLogo({
  src,
  alt,
  fallback,
  className,
  fallbackClassName,
  imgClassName,
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(src) && !hasError;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src ?? ""}
        alt={alt}
        onError={() => setHasError(true)}
        className={cn("object-cover", className, imgClassName)}
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center font-semibold", className, fallbackClassName)}>
      {getFallbackText(fallback)}
    </div>
  );
}
