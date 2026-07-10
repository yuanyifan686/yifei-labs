const stopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "you",
  "your",
  "will",
  "are",
  "our",
  "this",
  "that",
  "岗位",
  "职位",
  "公司",
  "地点",
  "城市",
  "要求",
  "负责",
  "薪资",
  "来源",
  "boss直聘",
  "boss",
  "直聘",
  "智联招聘",
  "相关",
  "经验",
  "能力",
  "熟悉",
  "具有",
  "以及",
  "进行",
]);

export function tokenize(text: string) {
  const words = text
    .toLowerCase()
    .match(/[a-z][a-z0-9+#.-]{1,}|[\u4e00-\u9fa5]{2,}/g);

  return new Set(
    (words || [])
      .map((word) => word.trim())
      .filter((word) => word.length >= 2)
      .filter((word) => !/^\d/.test(word) && !/\d+k/i.test(word))
      .filter((word) => !stopWords.has(word)),
  );
}

export function extractSkillText(job: string) {
  return job
    .replace(
      /(公司|地点|城市|薪资|来源|Company|Location|Salary|Source)[:：][\s\S]*?(?=(公司|地点|城市|薪资|来源|要求|Company|Location|Salary|Source|Requirements?)[:：]|$)/gi,
      "",
    )
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        !/^(公司|地点|城市|薪资|来源|Company|Location|Salary|Source)[:：]/i.test(
          line,
        ),
    )
    .join("\n");
}

export function splitJobList(content: string) {
  const blocks = content
    .split(/\n\s*\n|---+|={3,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (blocks.length > 1) {
    return blocks;
  }

  return content
    .split(/\n(?=\s*(?:\d+[\).、]|岗位|职位|Job|Role|Title))/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function inferJobTitle(job: string, index: number) {
  const titleLine =
    job
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && line.length <= 80) || `岗位 ${index + 1}`;

  return titleLine
    .replace(/^\d+[\).、]\s*/, "")
    .replace(/^(岗位|职位|Job|Role|Title)[:：]\s*/i, "");
}

export function inferCompany(job: string) {
  const match = job.match(/(?:公司|Company)[:：]\s*([^\n]+)/i);
  return match?.[1]?.trim();
}

export function inferLocation(job: string) {
  const match = job.match(/(?:地点|城市|Location)[:：]\s*([^\n]+)/i);
  return match?.[1]?.trim();
}
