import sharp from "sharp";
import { getAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, saveProductImage } from "@/lib/images";

/** Admin photo upload: one file per request, returns { key, w, h }. */
export async function POST(req: Request) {
  if (!(await getAdmin())) return Response.json({ error: "Sessiya tugagan. Qayta kiring." }, { status: 401 });
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ error: "Ruxsat yo‘q." }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) {
    return Response.json({ error: "Rasm 15 MB dan katta." }, { status: 413 });
  }

  let file: File | null = null;
  try {
    const f = (await req.formData()).get("file");
    file = f instanceof File ? f : null;
  } catch {
    file = null;
  }
  if (!file) return Response.json({ error: "Fayl topilmadi." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Rasm 15 MB dan katta." }, { status: 413 });

  const input = Buffer.from(await file.arrayBuffer());
  try {
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) throw new Error("no size");
  } catch {
    return Response.json({ error: "Rasmni o‘qib bo‘lmadi. JPG, PNG yoki WebP yuklang." }, { status: 415 });
  }
  try {
    return Response.json(await saveProductImage(input));
  } catch (err) {
    console.error("[upload] could not save image:", err);
    return Response.json({ error: "Serverda saqlab bo‘lmadi (disk yoki ruxsat). Administratorga ayting." }, { status: 500 });
  }
}
