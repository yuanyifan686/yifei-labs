"use client";

import { ChangeEvent, useCallback, useState } from "react";
import { parseResumeFileAction } from "@/app/apps/job-match/actions";
import {
  EMPTY_INPUT,
  SAMPLE_RESUME,
} from "@/components/job-match/constants";
import { JobMatchInput } from "@/types/jobMatch";

export function useResumeInput() {
  const [input, setInput] = useState<JobMatchInput>(EMPTY_INPUT);
  const [fieldError, setFieldError] = useState("");
  const [uploadHint, setUploadHint] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);

  const updateInput = useCallback(
    <K extends keyof JobMatchInput>(key: K, value: JobMatchInput[K]) => {
      setInput((current) => ({ ...current, [key]: value }));
      if (key === "resumeContent") setFieldError("");
    },
    [],
  );

  const fillSample = useCallback(() => {
    setInput({
      ...EMPTY_INPUT,
      fullName: "示例候选人",
      preferredLocation: "北京 / 远程",
      resumeContent: SAMPLE_RESUME,
    });
    setFieldError("");
    setUploadHint("");
  }, []);

  const validateResume = useCallback(() => {
    if (input.resumeContent.trim().length < 100) {
      setFieldError("请提供更完整的简历内容（至少 100 字）。");
      return false;
    }
    return true;
  }, [input.resumeContent]);

  const handleResumeFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsParsingFile(true);
      setUploadHint("");
      setFieldError("");

      try {
        const lower = file.name.toLowerCase();
        if (
          lower.endsWith(".txt") ||
          lower.endsWith(".md") ||
          lower.endsWith(".csv")
        ) {
          updateInput("resumeContent", await file.text());
          setUploadHint(`已导入文本文件：${file.name}`);
          return { ok: true as const };
        }

        const formData = new FormData();
        formData.append("file", file);
        const response = await parseResumeFileAction(formData);
        if (!response.ok) {
          setFieldError(response.error);
          return { ok: false as const, error: response.error, code: response.code };
        }
        updateInput("resumeContent", response.data.text);
        setUploadHint(
          `已解析 ${response.data.format.toUpperCase()}：${file.name}（${response.data.text.length} 字）`,
        );
        return { ok: true as const };
      } catch {
        const error = "简历文件解析失败，请改用文本粘贴或 PDF/DOCX。";
        setFieldError(error);
        return { ok: false as const, error, code: "PARSE_FAILED" as const };
      } finally {
        setIsParsingFile(false);
        event.target.value = "";
      }
    },
    [updateInput],
  );

  return {
    input,
    setInput,
    updateInput,
    fillSample,
    fieldError,
    setFieldError,
    uploadHint,
    isParsingFile,
    handleResumeFileUpload,
    validateResume,
  };
}
