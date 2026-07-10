import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResumeTextFromFile(file: {
  name: string;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
}): Promise<{ text: string; format: string }> {
  if (file.size <= 0) {
    throw new Error("文件为空，请重新选择。");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("文件过大，请上传 8MB 以内的简历。");
  }

  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || type.startsWith("text/")) {
    const text = normalizeExtractedText(buffer.toString("utf8"));
    if (text.length < 30) throw new Error("未能从文本文件中提取到有效内容。");
    return { text, format: "text" };
  }

  if (name.endsWith(".pdf") || type === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    const text = normalizeExtractedText(
      Array.isArray(result.text) ? result.text.join("\n") : String(result.text || ""),
    );
    if (text.length < 30) {
      throw new Error("PDF 可提取文字过少（可能是扫描件）。请粘贴文本或使用可选中文字的 PDF。");
    }
    return { text, format: "pdf" };
  }

  if (
    name.endsWith(".docx") ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeExtractedText(result.value || "");
    if (text.length < 30) throw new Error("未能从 Word 文档中提取到有效内容。");
    return { text, format: "docx" };
  }

  if (name.endsWith(".doc")) {
    throw new Error("暂不支持旧版 .doc，请另存为 .docx 或 PDF 后上传。");
  }

  throw new Error("暂不支持该格式。请上传 PDF / DOCX / TXT / MD / CSV。");
}
