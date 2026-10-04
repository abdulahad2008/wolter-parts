import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "./env";
import type { ProductImage } from "./schema";

/** Every photo is stored as a square WebP in two sizes: <key>-1200.webp and <key>-480.webp */
export const IMAGE_SIZES = [1200, 480] as const;
export const MEDIA_FILE_RE = /^[a-z0-9]{6,40}-(1200|480)\.webp$/;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function imageUrl(key: string, size: 480 | 1200 = 480): string {
  return `/media/${key}-${size}.webp`;
}

function newKey(): string {
  return `${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;
}

/** Turns an uploaded photo (JPG, PNG, WebP, AVIF…) into two square WebP files. */
export async function saveProductImage(input: Buffer): Promise<ProductImage> {
  await mkdir(env.mediaDir, { recursive: true });
  const key = newKey();
  // rotate() applies the phone's EXIF orientation; the square crop keeps the busiest part.
  const base = sharp(input, { failOn: "error" }).rotate();
  for (const size of IMAGE_SIZES) {
    const out = await base
      .clone()
      .resize(size, size, { fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: size === 1200 ? 82 : 78 })
      .toBuffer();
    await writeFile(path.join(env.mediaDir, `${key}-${size}.webp`), out);
  }
  return { key, w: 1200, h: 1200 };
}

export async function deleteProductImage(key: string): Promise<void> {
  if (!/^[a-z0-9]{6,40}$/.test(key)) return;
  const files = [...IMAGE_SIZES.map((size) => `${key}-${size}.webp`), `${key}-og.jpg`];
  await Promise.all(files.map((f) => rm(path.join(env.mediaDir, f), { force: true })));
}

/** Used only for the demo products: draws a line icon on the light tile colour. */
export async function saveIconImage(svgPath: string): Promise<ProductImage> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#F2F2EE"/>
    <g transform="translate(12 12) scale(0.5)">
      <path d="${svgPath}" fill="none" stroke="#0F0E0E" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g></svg>`;
  return saveProductImage(Buffer.from(svg));
}
