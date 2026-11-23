import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobForUser, getJobView } from "@/lib/jobs";
import { memberUsage, recordCost } from "@/lib/usage";

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
    // The job's welcome is TrustForge's first chat message, right after the user's request.
    if (found.job.welcome) {
      const firstUser = view.items.findIndex((it) => it.kind === "user");
      const at = firstUser >= 0 ? view.items[firstUser].at : "";
      view.items.splice(firstUser + 1, 0, { kind: "agent", id: `welcome-${found.job.id}`, text: found.job.welcome, at });
    }
    // Count new cost against the member who started the current turn, then report this member's usage.
    await recordCost(found.job, view.costCents ?? 0, view.status).catch((e) => console.error("[usage] record failed", e));
    view.usage = await memberUsage(found.team, userId, { sync: false, exceptJobId: found.job.id }).catch(() => null);
    return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[jobs] state failed", err);
    return NextResponse.json({ error: "Couldn’t reach TrustForge. Retrying…" }, { status: 502 });
  }
}
