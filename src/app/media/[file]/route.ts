import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "@/lib/env";
import { MEDIA_FILE_RE } from "@/lib/images";

const OG_RE = /^([a-z0-9]{6,40})-og\.jpg$/;

function send(data: Buffer, type: string) {
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": String(data.length),
    },
  });
}

/**
 * Serves product photos from the media volume. File names are unique, so browsers may cache them forever.
 * <key>-og.jpg is a JPEG copy for link previews (made on first request), because not every app reads WebP.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  try {
    if (MEDIA_FILE_RE.test(file)) return send(await readFile(path.join(env.mediaDir, file)), "image/webp");
    const og = OG_RE.exec(file);
    if (og) {
      const target = path.join(env.mediaDir, file);
      const cached = await readFile(target).catch(() => null);
      if (cached) return send(cached, "image/jpeg");
      const jpg = await sharp(await readFile(path.join(env.mediaDir, `${og[1]}-1200.webp`)))
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      await writeFile(target, jpg).catch(() => undefined);
      return send(jpg, "image/jpeg");
    }
  } catch {
    /* fall through to 404 */
  }
  return new Response("Not found", { status: 404 });
}
