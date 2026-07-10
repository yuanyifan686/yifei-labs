const extractBtn = document.getElementById("extractBtn");
const openBtn = document.getElementById("openBtn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const baseUrlInput = document.getElementById("baseUrl");

let payload = null;

function setStatus(text) {
  statusEl.textContent = text;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function shortId() {
  return `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

extractBtn.addEventListener("click", async () => {
  extractBtn.disabled = true;
  openBtn.disabled = true;
  setStatus("正在提取…");
  previewEl.hidden = true;
  payload = null;

  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("未找到当前标签页");

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "YIFEI_EXTRACT_JD",
    });

    if (!response?.ok) {
      throw new Error(response?.error || "提取失败，请刷新岗位详情页后重试");
    }

    payload = response.data;
    previewEl.hidden = false;
    previewEl.textContent = (payload.body || "").slice(0, 800);
    openBtn.disabled = false;
    setStatus(`已提取：${payload.title || "未命名岗位"}`);
  } catch (error) {
    setStatus(String(error?.message || error));
  } finally {
    extractBtn.disabled = false;
  }
});

openBtn.addEventListener("click", async () => {
  if (!payload) return;
  const base = (baseUrlInput.value || "http://localhost:3000").replace(/\/$/, "");
  const importId = shortId();
  const url = new URL(`${base}/apps/job-match`);
  url.searchParams.set("mode", "market-fit");
  url.searchParams.set("importId", importId);
  // Keep short role only; full JD goes via sessionStorage on target origin
  if (payload.title) url.searchParams.set("role", String(payload.title).slice(0, 80));

  const tab = await chrome.tabs.create({ url: url.toString() });
  // Inject sessionStorage payload after tab starts loading workspace origin
  const writeScript = (id, data) => {
    try {
      sessionStorage.setItem(`yl-jd-import:${id}`, JSON.stringify(data));
    } catch (e) {
      console.warn(e);
    }
  };

  // Retry inject briefly until page can accept sessionStorage
  const data = {
    title: payload.title || "",
    body: payload.body || "",
    source: payload.source || "import",
  };
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    try {
      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: writeScript,
          args: [importId, data],
        });
      }
      clearInterval(timer);
      setStatus("已打开工作台（短链 importId，JD 走 sessionStorage）");
    } catch {
      if (attempts >= 8) {
        clearInterval(timer);
        // Fallback: truncated URL for older pages
        const fallback = new URL(`${base}/apps/job-match`);
        fallback.searchParams.set("mode", "market-fit");
        if (payload.title) fallback.searchParams.set("role", payload.title);
        if (payload.body) {
          fallback.searchParams.set("jd", String(payload.body).slice(0, 1200));
        }
        if (tab.id) chrome.tabs.update(tab.id, { url: fallback.toString() });
        setStatus("注入失败，已降级为短 URL 片段");
      }
    }
  }, 400);
});
