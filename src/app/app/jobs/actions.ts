"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { type JobType, jobFiles, jobs } from "@/db/schema";
import { anthropic, ensureAgentsCurrent } from "@/lib/agent";
import {
  checkUploads,
  deleteAnthropicFiles,
  getJobForUser,
  listJobUploads,
  MANAGED_AGENTS_BETA,
  questionsLeft,
  recordQuestion,
  touchJob,
  uploadFiles,
} from "@/lib/jobs";
import { JOB_TYPE_LABEL, LAYERS, PLAN_CONFIG, RELEASES } from "@/lib/plans";
import { getMembership, requireUser } from "@/lib/teams";
import { headroomForNewJob, limitReachedMessage, startTurn, UsageLimitReached } from "@/lib/usage";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function limitMessage() {
  return `You’ve used this month’s ${PLAN_CONFIG.free.questionsPerMonth} Free questions. They reset on the 1st, or move to Partner for every job type.`;
}

/** Partner: counts the job's cost so far and gives this member's turn a ceiling of what they have left. */
async function beginTurn(
  team: NonNullable<Awaited<ReturnType<typeof getJobForUser>>>["team"],
  userId: string,
  job: NonNullable<Awaited<ReturnType<typeof getJobForUser>>>["job"],
  path: string,
) {
  try {
    await startTurn(team, userId, job);
  } catch (err) {
    if (err instanceof UsageLimitReached) fail(path, limitReachedMessage(err.window));
    console.error("[usage] start turn failed", err);
    fail(path, "TrustForge couldn’t check your usage just now. Please try again.");
  }
}

export async function createJob(formData: FormData) {
  const NEW = "/app/jobs/new";
  const user = await requireUser(NEW);
  const m = await getMembership(user.id);
  if (!m) redirect("/app");
  const plan = m.team.plan;
  const cfg = PLAN_CONFIG[plan];

  const jobType = String(formData.get("jobType") ?? "") as JobType;
  const requirement = String(formData.get("requirement") ?? "").trim();
  const release = String(formData.get("release") ?? "");
  const layer = String(formData.get("layer") ?? "CUSTOM");
  const patchVersion = String(formData.get("patchVersion") ?? "").trim();

  if (!cfg.jobTypes.includes(jobType)) fail(NEW, `${JOB_TYPE_LABEL[jobType] ?? "That job type"} needs the Partner plan.`);
  if (requirement.length < 5 || requirement.length > 20000) fail(NEW, "Describe what you need (5 to 20,000 characters).");
  if (!(RELEASES as readonly string[]).includes(release)) fail(NEW, "Choose a FLEXCUBE release.");
  if (!(LAYERS as readonly string[]).includes(layer)) fail(NEW, "Choose a layer.");
  if (jobType !== "ask" && !/^[A-Za-z0-9._-]{1,60}$/.test(patchVersion)) {
    fail(NEW, "Type the release code exactly as it is named in ODT (letters, digits, dots, dashes, underscores).");
  }

  const left = await questionsLeft(m.team.id, plan);
  if (left !== null && left <= 0) fail(NEW, limitMessage());

  const setup = await ensureAgentsCurrent();
  const agentId = plan === "partner" ? setup.agentPartnerId : setup.agentFreeId;
  if (!agentId || !setup.environmentId) fail(NEW, "TrustForge isn’t switched on yet. Please try again later.");

  const { files, error } = checkUploads(formData.getAll("files"));
  if (error) fail(NEW, error);

  // Partner: the job's first turn may spend at most what this member has left today / this week / this month.
  let budgetCents = cfg.budgetCents;
  try {
    const headroom = await headroomForNewJob(m.team, user.id);
    if (headroom !== null) budgetCents = headroom;
  } catch (err) {
    if (err instanceof UsageLimitReached) fail(NEW, limitReachedMessage(err.window));
    throw err;
  }

  const c = anthropic();
  let uploaded: Awaited<ReturnType<typeof uploadFiles>> = [];
  let jobId: string | null = null;
  let sessionId: string | null = null;
  try {
    uploaded = await uploadFiles(files, new Set());
    const title = requirement.split("\n")[0].slice(0, 90);

    const [job] = await db
      .insert(jobs)
      .values({
        teamId: m.team.id,
        createdBy: user.id,
        title,
        jobType,
        release,
        layer,
        patchVersion: patchVersion || "-",
        plan,
        actorId: user.id,
        budgetCents,
        costOpen: 1,
      })
      .returning();
    jobId = job.id;
    if (uploaded.length) {
      await db.insert(jobFiles).values(uploaded.map((u) => ({ jobId: job.id, name: u.name, sizeBytes: u.size, fileId: u.fileId, uploadedBy: user.id })));
    }

    const session = await c.beta.sessions.create({
      agent: agentId,
      environment_id: setup.environmentId,
      title: `${JOB_TYPE_LABEL[jobType]}: ${title}`.slice(0, 200),
      metadata: { job_id: job.id, team_id: m.team.id },
      resources: uploaded.map((u) => ({ type: "file" as const, file_id: u.fileId, mount_path: `/${u.name}` })),
      budget: { type: "limit", max_list_cost: { amount: String(budgetCents), currency: "USD" } },
    });
    sessionId = session.id;
    await db.update(jobs).set({ sessionId: session.id }).where(eq(jobs.id, job.id));

    const fileList = uploaded.length
      ? uploaded.map((u) => `- /mnt/session/uploads/${u.name}`).join("\n")
      : "- (none yet)";
    const brief = [
      `Job type: ${JOB_TYPE_LABEL[jobType]}`,
      `FLEXCUBE release: UBS ${release}`,
      `Layer: ${layer}`,
      `Release code in ODT (patch version): ${patchVersion || "not given"}`,
      `Uploaded files:\n${fileList}`,
      "",
      "Requirement:",
      requirement,
    ].join("\n");

    await c.beta.sessions.events.send(session.id, {
      events: [{ type: "user.message", content: [{ type: "text", text: brief }] }],
    });
    await recordQuestion(m.team.id, job.id, user.id);
  } catch (err) {
    console.error("[jobs] create failed", err);
    if (sessionId) await c.beta.sessions.delete(sessionId).catch(() => undefined);
    if (jobId) await db.delete(jobs).where(eq(jobs.id, jobId));
    await deleteAnthropicFiles(uploaded.map((u) => u.fileId));
    fail(NEW, "TrustForge couldn’t start the job. Please try again.");
  }
  redirect(`/app/jobs/${jobId}`);
}

export async function replyToJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const path = `/app/jobs/${encodeURIComponent(jobId)}`;
  const user = await requireUser(path);
  const found = await getJobForUser(jobId, user.id);
  if (!found?.job.sessionId) redirect("/app");
  const { job, team } = found;
  const sessionId = job.sessionId!;

  const text = String(formData.get("message") ?? "").trim();
  const { files, error } = checkUploads(formData.getAll("files"));
  if (error) fail(path, error);
  if (!text && !files.length) fail(path, "Type a message or attach a file.");
  if (text.length > 20000) fail(path, "That message is too long (20,000 characters at most).");

  const left = await questionsLeft(team.id, team.plan);
  if (left !== null && left <= 0) fail(path, limitMessage());
  await beginTurn(team, user.id, job, path);

  const c = anthropic();
  try {
    let note = "";
    if (files.length) {
      const existing = await listJobUploads(job.id);
      const uploaded = await uploadFiles(files, new Set(existing.map((f) => f.name)));
      for (const u of uploaded) {
        await c.beta.sessions.resources.add(sessionId, { type: "file", file_id: u.fileId, mount_path: `/${u.name}` });
      }
      await db.insert(jobFiles).values(uploaded.map((u) => ({ jobId: job.id, name: u.name, sizeBytes: u.size, fileId: u.fileId, uploadedBy: user.id })));
      note = `\n\nNew files:\n${uploaded.map((u) => `- /mnt/session/uploads/${u.name}`).join("\n")}`;
    }
    await c.beta.sessions.events.send(sessionId, {
      events: [{ type: "user.message", content: [{ type: "text", text: (text || "I’ve uploaded the files.") + note }] }],
    });
    await recordQuestion(team.id, job.id, user.id);
    await touchJob(job.id);
  } catch (err) {
    console.error("[jobs] reply failed", err);
    fail(path, "TrustForge couldn’t take that message. If it’s waiting for an approval, answer that first, then try again.");
  }
  redirect(path);
}

export async function answerApproval(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const path = `/app/jobs/${encodeURIComponent(jobId)}`;
  const user = await requireUser(path);
  const found = await getJobForUser(jobId, user.id);
  if (!found?.job.sessionId) redirect("/app");
  const eventId = String(formData.get("eventId") ?? "");
  const decision = formData.get("decision") === "allow" ? "allow" : "deny";
  await beginTurn(found.team, user.id, found.job, path);
  try {
    await anthropic().beta.sessions.events.send(found.job.sessionId, {
      events: [
        decision === "allow"
          ? { type: "user.tool_confirmation", tool_use_id: eventId, result: "allow" }
          : { type: "user.tool_confirmation", tool_use_id: eventId, result: "deny", deny_message: "The user declined this step. Ask them how to continue." },
      ],
    });
  } catch (err) {
    console.error("[jobs] approval failed", err);
    fail(path, "That approval couldn’t be sent. Refresh and try again.");
  }
  redirect(path);
}

export async function stopJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const path = `/app/jobs/${encodeURIComponent(jobId)}`;
  const user = await requireUser(path);
  const found = await getJobForUser(jobId, user.id);
  if (!found?.job.sessionId) redirect("/app");
  try {
    await anthropic().beta.sessions.events.send(found.job.sessionId, { events: [{ type: "user.interrupt" }] });
  } catch (err) {
    console.error("[jobs] interrupt failed", err);
  }
  redirect(path);
}

/** Deletes the job, its conversation and sandbox at Anthropic, and every file uploaded for it. */
export async function deleteJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const path = `/app/jobs/${encodeURIComponent(jobId)}`;
  const user = await requireUser(path);
  const found = await getJobForUser(jobId, user.id);
  if (!found) redirect("/app");
  const { job, role } = found;
  if (job.createdBy !== user.id && role === "member") fail(path, "Only the person who started the job, or an owner or admin, can delete it.");

  const c = anthropic();
  const uploads = await listJobUploads(job.id);
  const outputIds: string[] = [];
  if (job.sessionId) {
    try {
      for await (const f of c.beta.files.list({ scope_id: job.sessionId, betas: [MANAGED_AGENTS_BETA] })) outputIds.push(f.id);
    } catch (err) {
      console.error("[jobs] listing outputs failed", err);
    }
    try {
      await c.beta.sessions.delete(job.sessionId);
    } catch (err) {
      console.error("[jobs] session delete failed", err);
    }
  }
  await deleteAnthropicFiles([...uploads.map((u) => u.fileId), ...outputIds]);
  await db.delete(jobs).where(eq(jobs.id, job.id));
  redirect("/app?notice=" + encodeURIComponent("Job deleted, with its files and conversation."));
}
