import { getFileStorage } from "@/lib/storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MIN_IMAGE_DIMENSION = 32;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

type UploadVariant = "avatar" | "company-logo";

type OptimizedImage = {
  fileUrl: string;
  storageKey: string;
  mimeType: "image/webp" | "image/avif";
  fileSize: number;
  width: number | null;
  height: number | null;
  originalName: string;
  originalMimeType: string;
  originalSize: number;
};

function sanitizeFileBase(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  return (base || "image").slice(0, 80);
}

function getVariantConfig(variant: UploadVariant) {
  if (variant === "avatar") {
    return {
      pathPrefix: "uploads/avatars",
      width: 512,
      height: 512,
      fit: "cover" as const,
    };
  }
  return {
    pathPrefix: "uploads/company-logos",
    width: 720,
    height: 720,
    fit: "inside" as const,
  };
}

function buildStorageKey(variant: UploadVariant, entityId: string): string {
  const version = Date.now();
  if (variant === "avatar") return `avatars/${entityId}-${version}`;
  return `company-logos/${entityId}-${version}`;
}

export function validateImageFile(file: File | null): string | null {
  if (!file) return "Please select an image file.";
  if (file.size <= 0) return "Uploaded file is empty.";
  if (file.size > MAX_IMAGE_BYTES) return "Image exceeds 5MB. Please upload a smaller file.";
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return "Only PNG and JPEG/JPG images are supported.";
  }
  return null;
}

export async function optimizeAndStoreImage(
  file: File,
  variant: UploadVariant,
  entityId: string
): Promise<OptimizedImage> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  let sharp: typeof import("sharp");
  try {
    const sharpImport = await import("sharp");
    sharp =
      ((sharpImport as unknown as { default: typeof import("sharp") }).default ??
        (sharpImport as unknown as typeof import("sharp")));
  } catch (_error) {
    throw new Error("Image processing is unavailable. Install sharp to enable uploads.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const config = getVariantConfig(variant);
  const inputImage = sharp(buffer, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS });
  const inputMeta = await inputImage.metadata();
  const inputFormat = inputMeta.format?.toLowerCase();
  if (!inputFormat || (inputFormat !== "jpeg" && inputFormat !== "png")) {
    throw new Error("Invalid image data. Please upload a real PNG or JPEG image.");
  }
  const width = inputMeta.width ?? 0;
  const height = inputMeta.height ?? 0;
  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    throw new Error(`Image is too small. Minimum size is ${MIN_IMAGE_DIMENSION}px by ${MIN_IMAGE_DIMENSION}px.`);
  }

  const transformed = sharp(buffer, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({
    width: config.width,
    height: config.height,
    fit: config.fit,
    withoutEnlargement: true,
  });

  const webpBuffer = await transformed.clone().webp({ quality: 82, effort: 5 }).toBuffer();
  const avifBuffer = await transformed.clone().avif({ quality: 64, effort: 6 }).toBuffer();
  const useAvif = avifBuffer.length > 0 && avifBuffer.length < webpBuffer.length;
  const optimizedBuffer = useAvif ? avifBuffer : webpBuffer;
  const mimeType = useAvif ? "image/avif" : "image/webp";
  const extension = useAvif ? "avif" : "webp";
  const optimizedMeta = await sharp(optimizedBuffer).metadata();

  const fileBase = sanitizeFileBase(file.name);
  const storageKey = `${buildStorageKey(variant, entityId)}.${extension}`;
  const storage = getFileStorage();
  const stored = await storage.store({
    fileName: `${fileBase}.${extension}`,
    contentType: mimeType,
    buffer: optimizedBuffer,
    visibility: "public",
    pathPrefix: config.pathPrefix,
    storageKey,
  });

  return {
    fileUrl: stored.fileUrl,
    storageKey: stored.storageKey,
    mimeType,
    fileSize: optimizedBuffer.length,
    width: optimizedMeta.width ?? null,
    height: optimizedMeta.height ?? null,
    originalName: file.name,
    originalMimeType: file.type,
    originalSize: file.size,
  };
}
