import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { getJobForUser, listJobUploads, questionsLeft } from "@/lib/jobs";
import { JOB_TYPE_LABEL, PLAN_CONFIG } from "@/lib/plans";
import { requireUser } from "@/lib/teams";
import { deleteJob } from "../actions";
import { JobLive } from "./JobLive";

export const metadata: Metadata = { title: "Job" };

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await requireUser(`/app/jobs/${id}`);
  const found = await getJobForUser(id, user.id);
  if (!found) notFound();
  const { job, team, role } = found;

  const [uploads, left] = await Promise.all([listJobUploads(job.id), questionsLeft(team.id, team.plan)]);
  const canDelete = job.createdBy === user.id || role !== "member";

  return (
    <div className="app-wide">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span className="eyebrow">
            <Link href="/app" style={{ color: "inherit", textDecoration: "none" }}>Jobs</Link> / {JOB_TYPE_LABEL[job.jobType]}
          </span>
          <h1 className="app-h1" style={{ fontSize: "clamp(26px, 3vw, 36px)", overflowWrap: "anywhere" }}>{job.title}</h1>
          <span style={{ fontSize: 14, color: "var(--text-3)" }}>
            FLEXCUBE UBS {job.release} · {job.layer} · release code{" "}
            <span className="mono">{job.patchVersion}</span> · {PLAN_CONFIG[job.plan].modelLabel}
          </span>
        </div>
        {canDelete && (
          <form action={deleteJob}>
            <input type="hidden" name="jobId" value={job.id} />
            <button type="submit" className="link-btn danger">Delete job</button>
          </form>
        )}
      </div>
      <Flash error={error} />
      <JobLive
        jobId={job.id}
        hasSession={Boolean(job.sessionId)}
        uploads={uploads.map((u) => ({ id: u.fileId, name: u.name, size: u.sizeBytes }))}
        questionsLeft={left}
        questionsLimit={PLAN_CONFIG[team.plan].questionsPerMonth}
      />
    </div>
  );
}
