function textOf(el) {
  return (el?.innerText || el?.textContent || "").replace(/\s+\n/g, "\n").trim();
}

function firstText(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = textOf(node);
    if (text) return text;
  }
  return "";
}

function extractBoss() {
  const title = firstText([
    ".job-detail-body h1",
    ".info-primary .name h1",
    "h1",
    "[class*='job-title']",
  ]);
  const company = firstText([
    ".company-info a",
    ".sider-company .name",
    "[class*='company-name']",
  ]);
  const salary = firstText([".salary", "[class*='salary']"]);
  const location = firstText([".job-location", "[class*='job-location']", ".text-desc"]);
  const desc = firstText([
    ".job-detail-section .job-sec-text",
    ".job-detail .text",
    ".job-sec-text",
    "[class*='job-detail']",
  ]);

  const body = [
    title ? `岗位：${title}` : "",
    company ? `公司：${company}` : "",
    location ? `地点：${location}` : "",
    salary ? `薪资：${salary}` : "",
    "来源：Boss直聘",
    desc ? `要求：\n${desc}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: title || document.title,
    body,
    source: "boss",
  };
}

function extractZhaopin() {
  const title = firstText([
    ".jobsummary__jobname",
    ".summary-plane__title",
    "h1",
    "[class*='jobname']",
  ]);
  const company = firstText([
    ".company__title",
    ".company-name a",
    "[class*='company'] a",
  ]);
  const salary = firstText([".jobsummary__salary", "[class*='salary']"]);
  const location = firstText([".jobsummary__city", "[class*='city']"]);
  const desc = firstText([
    ".describtion__detail-content",
    ".description__detail",
    "[class*='describtion']",
    "[class*='description']",
  ]);

  const body = [
    title ? `岗位：${title}` : "",
    company ? `公司：${company}` : "",
    location ? `地点：${location}` : "",
    salary ? `薪资：${salary}` : "",
    "来源：智联招聘",
    desc ? `要求：\n${desc}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: title || document.title,
    body,
    source: "zhilian",
  };
}

function extractJd() {
  const host = location.hostname;
  if (host.includes("zhipin.com")) return extractBoss();
  if (host.includes("zhaopin.com")) return extractZhaopin();

  const title = document.title;
  const body = textOf(document.body).slice(0, 4000);
  return { title, body, source: "page" };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "YIFEI_EXTRACT_JD") {
    try {
      sendResponse({ ok: true, data: extractJd() });
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.message || error) });
    }
  }
  return true;
});
