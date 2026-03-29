import { randomUUID } from "crypto";

const jobs = new Map();
const MAX_JOB_AGE_MS = 30 * 60 * 1000;

export function createAuditJob(url) {
  const jobId = randomUUID();
  const now = new Date().toISOString();
  const job = {
    id: jobId,
    url,
    status: "queued",
    error: null,
    result: null,
    createdAt: now,
    updatedAt: now,
    progress: {
      step: "Queued",
      message: "Audit request received.",
      steps: [],
    },
  };

  jobs.set(jobId, job);
  pruneOldJobs();
  return job;
}

export function updateAuditJob(jobId, patch) {
  const job = jobs.get(jobId);
  if (!job) return null;

  const nextJob = {
    ...job,
    ...patch,
    updatedAt: new Date().toISOString(),
    progress: patch.progress ? { ...job.progress, ...patch.progress } : job.progress,
  };

  jobs.set(jobId, nextJob);
  return nextJob;
}

export function getAuditJob(jobId) {
  return jobs.get(jobId) || null;
}

function pruneOldJobs() {
  const cutoff = Date.now() - MAX_JOB_AGE_MS;
  for (const [jobId, job] of jobs.entries()) {
    if (Date.parse(job.updatedAt) < cutoff) {
      jobs.delete(jobId);
    }
  }
}
