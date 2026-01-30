import { Job } from "@/types";

const API_BASE = "/api/jobs";

export const getJobs = async (): Promise<Job[]> => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
};

export const getJobById = async (id: string): Promise<Job> => {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
};

export const createJob = async (job: Job): Promise<Job> => {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!res.ok) throw new Error("Failed to create job");
  return res.json();
};

export const updateJob = async (id: string, job: Job): Promise<Job> => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!res.ok) throw new Error("Failed to update job");
  return res.json();
};

export const deleteJob = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete job");
};
