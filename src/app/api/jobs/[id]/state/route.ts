import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobForUser, getJobView } from "@/lib/jobs";

export const dynamic = "force-dynamic";

/** Live state of a job for the job page: conversation, status, approvals, output files. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const { id } = await params;
  const found = await getJobForUser(id, userId);
  if (!found?.job.sessionId) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  const withOutputs = new URL(req.url).searchParams.get("outputs") === "1";
  try {
    const view = await getJobView(found.job.sessionId, withOutputs);
    return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[jobs] state failed", err);
    return NextResponse.json({ error: "Couldn’t reach TrustForge. Retrying…" }, { status: 502 });
  }
}
