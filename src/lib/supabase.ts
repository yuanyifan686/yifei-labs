import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  JobMatchInput,
  JobMatchProject,
  JobMatchResult,
  ResumeOptimizationInput,
  ResumeOptimizationRecord,
  ResumeOptimizationResult,
} from "@/types/jobMatch";

export { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function saveJobMatchProject(
  input: JobMatchInput,
  result: JobMatchResult,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("job_match_projects")
    .insert({
      full_name: input.fullName,
      current_status: input.currentStatus,
      experience_level: input.experienceLevel,
      preferred_language: input.preferredLanguage,
      preferred_location: input.preferredLocation || null,
      resume_content: input.resumeContent,
      job_match_result: result,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save job match project:", error);
    return null;
  }

  return data.id as string;
}

/** Legacy list — prefer listSessionsForClient for privacy-scoped archives. */
export async function listJobMatchProjects() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [] as JobMatchProject[];

  const { data, error } = await supabase
    .from("job_match_projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to read job match projects:", error);
    return [];
  }

  return (data || []) as JobMatchProject[];
}

export async function getJobMatchProject(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("job_match_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to read job match project:", error);
    return null;
  }

  return data as JobMatchProject;
}

export async function saveResumeOptimization(
  input: ResumeOptimizationInput,
  result: ResumeOptimizationResult,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resume_optimizations")
    .insert({
      job_match_project_id: input.jobMatchProjectId || null,
      selected_role: input.selectedRole,
      optional_job_description: input.optionalJobDescription || null,
      optimization_result: result,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save resume optimization:", error);
    return null;
  }

  return data.id as string;
}

export async function listResumeOptimizations(projectId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [] as ResumeOptimizationRecord[];

  const { data, error } = await supabase
    .from("resume_optimizations")
    .select("*")
    .eq("job_match_project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to read resume optimizations:", error);
    return [];
  }

  return (data || []) as ResumeOptimizationRecord[];
}
