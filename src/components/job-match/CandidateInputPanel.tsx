"use client";

import { ChangeEvent } from "react";
import { Field } from "@/components/job-match/workspace/Field";
import { LANGUAGES, LEVELS, STATUSES } from "@/components/job-match/constants";
import { Card } from "@/components/ui/Card";
import { FileUpload } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  CurrentStatus,
  ExperienceLevel,
  JobMatchInput,
  PreferredLanguage,
} from "@/types/jobMatch";
import { cn } from "@/lib/utils";

const MIN_RESUME_CHARS = 100;

export function CandidateInputPanel({
  input,
  fieldError,
  uploadHint,
  isParsingFile,
  persistHistory = true,
  onPersistHistoryChange,
  onUpdate,
  onFillSample,
  onFileUpload,
}: {
  input: JobMatchInput;
  fieldError: string;
  uploadHint: string;
  isParsingFile: boolean;
  persistHistory?: boolean;
  onPersistHistoryChange?: (enabled: boolean) => void;
  onUpdate: <K extends keyof JobMatchInput>(key: K, value: JobMatchInput[K]) => void;
  onFillSample: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const resumeLength = input.resumeContent.trim().length;
  const resumeProgress = Math.min(100, Math.round((resumeLength / MIN_RESUME_CHARS) * 100));
  const resumeReady = resumeLength >= MIN_RESUME_CHARS;

  return (
    <Card className="interactive-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="pro-label">Step 1</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">先放入简历</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            粘贴文本最快；PDF / DOCX 上传会自动解析。简历内容将发送至 AI
            服务用于分析；会话默认保存结构化结果与摘要，不在历史中公开完整原文。
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-medium text-cyan-200 transition hover:border-cyan-400/35 hover:bg-cyan-400/15"
          onClick={onFillSample}
        >
          填入示例
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="简历正文 *">
          <Textarea
            className={cn(
              "min-h-[210px] resize-y sm:min-h-[260px]",
              fieldError ? "border-red-400/60" : "",
            )}
            value={input.resumeContent}
            onChange={(e) => onUpdate("resumeContent", e.target.value)}
            placeholder="粘贴完整简历，建议包含项目经历、技能栈、工作/实习经历、教育背景。"
          />
          <div className="mt-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span
                className={cn(
                  "font-medium",
                  resumeReady
                    ? "text-emerald-300"
                    : resumeLength > 0
                      ? "text-amber-300"
                      : "text-slate-500",
                )}
              >
                {resumeLength} / {MIN_RESUME_CHARS} 字
              </span>
              <FileUpload
                label={isParsingFile ? "解析中" : "上传 PDF/DOCX"}
                loading={isParsingFile}
                onFileChange={onFileUpload}
              />
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  resumeReady
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-amber-400 to-cyan-400",
                )}
                style={{ width: `${resumeProgress}%` }}
              />
            </div>
          </div>
          {uploadHint ? (
            <p className="mt-2 text-xs font-medium text-emerald-300">{uploadHint}</p>
          ) : null}
          {fieldError ? (
            <p className="mt-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium leading-5 text-red-200">
              {fieldError}
            </p>
          ) : null}
        </Field>

        {onPersistHistoryChange ? (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={!persistHistory}
              onChange={(e) => onPersistHistoryChange(!e.target.checked)}
              data-testid="opt-out-history"
            />
            <span className="text-xs leading-5 text-slate-300">
              <span className="font-medium text-slate-100">本次不保存历史</span>
              <span className="mt-0.5 block text-slate-500">
                关闭后会话仅进程内临时保留，不写入云端/历史列表（仍会发送给 AI 做分析）。
              </span>
            </span>
          </label>
        ) : null}

        <details className="group rounded-xl border border-white/10 bg-white/[0.03]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-medium text-slate-200">
            <span>候选人偏好（可选）</span>
            <span className="text-xs text-slate-500 transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="space-y-3 border-t border-white/10 px-3 py-3">
            <Field label="姓名">
              <Input
                value={input.fullName}
                onChange={(e) => onUpdate("fullName", e.target.value)}
                placeholder="可选"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <Select
                  value={input.currentStatus}
                  onChange={(e) =>
                    onUpdate("currentStatus", e.target.value as CurrentStatus)
                  }
                >
                  {STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="经验">
                <Select
                  value={input.experienceLevel}
                  onChange={(e) =>
                    onUpdate("experienceLevel", e.target.value as ExperienceLevel)
                  }
                >
                  {LEVELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="期望地点">
              <Input
                value={input.preferredLocation}
                onChange={(e) => onUpdate("preferredLocation", e.target.value)}
                placeholder="如：北京 / 远程"
              />
            </Field>
            <Field label="报告语言">
              <Select
                value={input.preferredLanguage}
                onChange={(e) =>
                  onUpdate("preferredLanguage", e.target.value as PreferredLanguage)
                }
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </details>
      </div>
    </Card>
  );
}
