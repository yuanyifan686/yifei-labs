/**
 * JSON-Resume-inspired structured resume for evidence pipelines.
 * Education is stored for display only — never used for capability scoring.
 */

export type StructuredResumeSource = "ai" | "rules";

export interface StructuredResumeBasics {
  summary?: string;
  yearsTotal?: number;
  locations?: string[];
  /** External links found in resume text */
  links?: string[];
  headline?: string;
}

export interface StructuredWorkItem {
  company?: string;
  title?: string;
  start?: string;
  end?: string;
  highlights: string[];
  tech: string[];
}

export interface StructuredEducationItem {
  institution?: string;
  degree?: string;
  field?: string;
  year?: string;
}

export interface StructuredSkillItem {
  name: string;
  level?: "basic" | "proficient" | "expert";
  evidence?: string;
}

export interface StructuredProjectItem {
  name: string;
  url?: string;
  impact?: string;
  tech: string[];
  metrics?: string;
}

export interface StructuredAwardItem {
  title: string;
  year?: string;
}

export interface StructuredCertificateItem {
  name: string;
  issuer?: string;
}

export interface StructuredProfileLink {
  network: string;
  url: string;
}

export interface StructuredResume {
  basics: StructuredResumeBasics;
  work: StructuredWorkItem[];
  education: StructuredEducationItem[];
  skills: StructuredSkillItem[];
  projects: StructuredProjectItem[];
  awards: StructuredAwardItem[];
  certificates: StructuredCertificateItem[];
  profiles: StructuredProfileLink[];
  rawTextHash: string;
  source: StructuredResumeSource;
  /** One-line for UI */
  summaryLine: string;
}

export type EvidenceCategory =
  | "skill_coverage"
  | "project_depth"
  | "production_experience"
  | "proof_assets"
  | "role_fit";

export interface CandidateEvidenceScore {
  category: EvidenceCategory;
  label: string;
  score: number;
  max: number;
  evidence: string[];
  risks: string[];
  nextActions: string[];
}

export interface ProofLinkInput {
  github?: string;
  portfolio?: string;
  demos?: string[];
  blog?: string;
  linkedin?: string;
}

export interface ProofCheckResult {
  url: string;
  kind: "github" | "demo" | "portfolio" | "blog" | "linkedin" | "other";
  reachable: boolean;
  notes: string[];
}
