import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/** For Docker / Dokploy: 200 when the app can reach the database. */
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
