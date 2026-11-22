import { auth } from "@/auth";
import { anthropic } from "@/lib/agent";
import { getJobForUser, listJobUploads, MANAGED_AGENTS_BETA } from "@/lib/jobs";

export const dynamic = "force-dynamic";

/** Downloads one of the job's files: an upload, or a file TrustForge wrote to its outputs. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Sign in again.", { status: 401 });

  const { id, fileId } = await params;
  const found = await getJobForUser(id, userId);
  if (!found?.job.sessionId) return new Response("Not found.", { status: 404 });

  // Only files that belong to this job can be downloaded.
  const c = anthropic();
  let filename: string | null = null;
  const upload = (await listJobUploads(found.job.id)).find((u) => u.fileId === fileId);
  if (upload) filename = upload.name;
  if (!filename) {
    for await (const f of c.beta.files.list({ scope_id: found.job.sessionId, betas: [MANAGED_AGENTS_BETA] })) {
      if (f.id === fileId) {
        filename = f.filename;
        break;
      }
    }
  }
  if (!filename) return new Response("Not found.", { status: 404 });

  const res = await c.files.download(fileId);
  const safe = filename.replace(/["\\\r\n]/g, "_");
  return new Response(res.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
