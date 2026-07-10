import { JobBankBrowser } from "@/components/job-match/JobBankBrowser";
import { listStoredJobs } from "@/lib/jobDatabase";

export default async function JobBankPage() {
  const jobs = await listStoredJobs();
  return <JobBankBrowser jobs={jobs} />;
}
