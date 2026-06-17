(function () {
  "use strict";

  const STORAGE_KEY = "ya_little_thoughts_records";
  const moods = ["未标记", "平静", "兴奋", "混乱", "低落", "清醒", "麻木", "想逃", "烦躁", "顿悟"];
  const thinkingStates = ["未归类", "发散", "分析", "复盘", "怀疑", "沉浸", "空白", "卡住", "顿悟"];
  const thoughtStatuses = ["未整理", "可继续发展", "已整理", "已放弃", "以后再想"];
  const presetTags = ["文学", "语言学", "神话", "修辞", "AI", "论文", "课堂", "梦", "日常", "情绪", "问题", "灵感", "人物分析", "考试", "朋友圈文案", "可写论文", "可继续想"];
  const prompts = [
    "你今天真正感兴趣的东西是什么？",
    "有什么想法虽然没用，但让你觉得很有意思？",
    "你今天有没有突然看透某件事？",
    "你现在的问题是真问题，还是情绪伪装成的问题？",
    "如果把今天压缩成一句判断，会是什么？",
    "今天有什么东西值得以后继续想？",
    "这个想法为什么会抓住你？",
    "它可以发展成一篇文章、一个选题，还是只是一个瞬间？",
    "你是在分析问题，还是在逃避问题？",
    "这条想法以后可能和什么主题有关？",
    "你现在反复想起的，是一个问题，还是一个执念？",
    "这句话以后能不能变成论文里的一个判断？",
    "今天有什么东西看起来很小，但其实值得保存？"
  ];

  let records = [];
  let currentId = null;
  let pendingImport = null;
  let toastTimer = null;

  const $ = (id) => document.getElementById(id);
  const fields = {
    title: $("titleInput"),
    date: $("dateInput"),
    content: $("contentInput"),
    tags: $("tagsInput"),
    mood: $("moodInput"),
    thinkingState: $("thinkingInput"),
    thoughtStatus: $("statusInput"),
    suddenThought: $("suddenThoughtInput"),
    whyAttractive: $("whyAttractiveInput"),
    association: $("associationInput"),
    mainQuestion: $("mainQuestionInput"),
    avoidance: $("avoidanceInput"),
    futureUse: $("futureUseInput"),
    oneSentence: $("oneSentenceInput")
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function nowParts() {
    const date = new Date();
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return { day, stamp: `${day} ${time}` };
  }

  function makeId() {
    return `thought-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function countWords(text) {
    const clean = normalizeText(text);
    if (!clean) return 0;
    const cjk = clean.match(/[\u4e00-\u9fa5]/g) || [];
    const words = clean.replace(/[\u4e00-\u9fa5]/g, " ").match(/[A-Za-z0-9_]+/g) || [];
    return cjk.length + words.length;
  }

  function parseTags(value) {
    return Array.from(new Set(String(value || "")
      .split(/[\s,，、\n]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)));
  }

  function titleFromContent(title, content) {
    const manual = normalizeText(title);
    if (manual) return manual;
    const body = normalizeText(content);
    if (!body) return "未命名巧思";
    const sentence = body.split(/[。！？!?；;\n]/).find(Boolean) || body;
    return sentence.slice(0, 20) || "未命名巧思";
  }

  function summaryFromContent(content) {
    const body = normalizeText(content);
    return body ? body.slice(0, 60) : "暂无内容";
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function loadFromStorage() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      records = Array.isArray(stored) ? stored.map(sanitizeRecord) : [];
    } catch (error) {
      records = [];
    }
  }

  function sanitizeRecord(record) {
    const now = nowParts();
    const content = normalizeText(record.content);
    const title = titleFromContent(record.title, content);
    return {
      id: record.id || makeId(),
      title,
      content,
      tags: Array.isArray(record.tags) ? Array.from(new Set(record.tags.filter(Boolean))) : parseTags(record.tags),
      mood: record.mood || "未标记",
      thinkingState: record.thinkingState || "未归类",
      thoughtStatus: record.thoughtStatus || "未整理",
      createdAt: record.createdAt || now.stamp,
      updatedAt: record.updatedAt || record.createdAt || now.stamp,
      date: record.date || now.day,
      summary: summaryFromContent(content),
      wordCount: countWords(content),
      suddenThought: normalizeText(record.suddenThought),
      whyAttractive: normalizeText(record.whyAttractive),
      association: normalizeText(record.association),
      mainQuestion: normalizeText(record.mainQuestion),
      avoidance: normalizeText(record.avoidance),
      futureUse: normalizeText(record.futureUse),
      oneSentence: normalizeText(record.oneSentence)
    };
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
  }

  function fillSelect(select, values, includeAll) {
    select.innerHTML = "";
    if (includeAll) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "全部";
      select.append(option);
    }
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  function makeRecordFromQuick() {
    const time = nowParts();
    const content = normalizeText($("quickInput").value);
    return sanitizeRecord({
      id: makeId(),
      title: titleFromContent("", content),
      content,
      tags: [],
      mood: "未标记",
      thinkingState: "未归类",
      thoughtStatus: "未整理",
      createdAt: time.stamp,
      updatedAt: time.stamp,
      date: time.day
    });
  }

  function makeRecordFromEditor() {
    const time = nowParts();
    const existing = records.find((item) => item.id === currentId);
    const base = existing || { id: makeId(), createdAt: time.stamp };
    return sanitizeRecord({
      ...base,
      title: fields.title.value,
      date: fields.date.value || time.day,
      content: fields.content.value,
      tags: parseTags(fields.tags.value),
      mood: fields.mood.value || "未标记",
      thinkingState: fields.thinkingState.value || "未归类",
      thoughtStatus: fields.thoughtStatus.value || "未整理",
      updatedAt: time.stamp,
      suddenThought: fields.suddenThought.value,
      whyAttractive: fields.whyAttractive.value,
      association: fields.association.value,
      mainQuestion: fields.mainQuestion.value,
      avoidance: fields.avoidance.value,
      futureUse: fields.futureUse.value,
      oneSentence: fields.oneSentence.value
    });
  }

  function upsertRecord(record) {
    const index = records.findIndex((item) => item.id === record.id);
    if (index >= 0) records[index] = record;
    else records.unshift(record);
    records.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    currentId = record.id;
    saveToStorage();
    renderAll();
  }

  function clearEditor() {
    currentId = null;
    const time = nowParts();
    Object.values(fields).forEach((field) => {
      field.value = "";
    });
    fields.date.value = time.day;
    fields.mood.value = "未标记";
    fields.thinkingState.value = "未归类";
    fields.thoughtStatus.value = "未整理";
    $("editorHeading").textContent = "未命名巧思";
    $("editingMeta").textContent = "Ctrl + S 可以保存当前记录";
    renderList();
  }

  function openRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    currentId = id;
    fields.title.value = record.title;
    fields.date.value = record.date;
    fields.content.value = record.content;
    fields.tags.value = record.tags.join("、");
    fields.mood.value = record.mood || "未标记";
    fields.thinkingState.value = record.thinkingState || "未归类";
    fields.thoughtStatus.value = record.thoughtStatus || "未整理";
    fields.suddenThought.value = record.suddenThought || "";
    fields.whyAttractive.value = record.whyAttractive || "";
    fields.association.value = record.association || "";
    fields.mainQuestion.value = record.mainQuestion || "";
    fields.avoidance.value = record.avoidance || "";
    fields.futureUse.value = record.futureUse || "";
    fields.oneSentence.value = record.oneSentence || "";
    $("editorHeading").textContent = record.title || "未命名巧思";
    $("editingMeta").textContent = `创建：${record.createdAt} ｜ 修改：${record.updatedAt}`;
    renderList();
    document.getElementById("editor").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getFilteredRecords() {
    const query = normalizeText($("searchInput").value).toLowerCase();
    const tag = normalizeText($("filterTag").value);
    const mood = $("filterMood").value;
    const thinking = $("filterThinking").value;
    const status = $("filterStatus").value;
    return records.filter((record) => {
      const searchable = [
        record.title,
        record.content,
        record.tags.join(" "),
        record.oneSentence,
        record.suddenThought,
        record.whyAttractive,
        record.association,
        record.mainQuestion,
        record.avoidance,
        record.futureUse
      ].join(" ").toLowerCase();
      return (!query || searchable.includes(query))
        && (!tag || record.tags.includes(tag))
        && (!mood || record.mood === mood)
        && (!thinking || record.thinkingState === thinking)
        && (!status || record.thoughtStatus === status);
    });
  }

  function renderList() {
    const list = $("thoughtList");
    const filtered = getFilteredRecords();
    $("resultCount").textContent = `${filtered.length} / ${records.length} 条`;
    list.innerHTML = "";
    if (!records.length) {
      list.innerHTML = '<div class="empty-state">这里还没有巧思。先写下一句脑子里的东西。</div>';
      return;
    }
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">没有符合筛选条件的小巧思。</div>';
      return;
    }
    filtered.forEach((record) => {
      const card = document.createElement("article");
      card.className = `thought-card${record.id === currentId ? " active" : ""}`;
      card.innerHTML = `
        <div class="thought-top">
          <div>
            <h3 class="thought-title">${escapeHtml(record.title)}</h3>
            <div class="thought-meta">
              <span>${escapeHtml(record.date)}</span>
              <span>${record.wordCount} 字</span>
              <span>修改 ${escapeHtml(record.updatedAt)}</span>
            </div>
          </div>
          ${record.id === currentId ? '<span class="chip">正在编辑</span>' : ""}
        </div>
        <p class="thought-summary">${escapeHtml(record.summary)}</p>
        <div class="chip-row">
          ${record.tags.length ? record.tags.map((tagItem) => `<span class="chip">${escapeHtml(tagItem)}</span>`).join("") : '<span class="chip">未分类</span>'}
          <span class="chip">${escapeHtml(record.mood || "未标记")}</span>
          <span class="chip">${escapeHtml(record.thinkingState || "未归类")}</span>
          <span class="chip">${escapeHtml(record.thoughtStatus || "未整理")}</span>
        </div>
        <div class="card-actions">
          <button class="secondary-button" data-action="open" data-id="${record.id}" type="button">编辑</button>
          <button class="ghost-button" data-action="copy" data-id="${record.id}" type="button">复制</button>
          <button class="ghost-button" data-action="later" data-id="${record.id}" type="button">以后再想</button>
          <button class="danger-button" data-action="delete" data-id="${record.id}" type="button">删除</button>
        </div>`;
      list.append(card);
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function mostCommon(values, fallback) {
    const counts = new Map();
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    let best = fallback;
    let bestCount = 0;
    counts.forEach((count, value) => {
      if (count > bestCount) {
        best = value;
        bestCount = count;
      }
    });
    return best;
  }

  function renderStats() {
    const now = nowParts();
    const month = now.day.slice(0, 7);
    const totalWords = records.reduce((sum, item) => sum + (item.wordCount || 0), 0);
    const allTags = records.flatMap((item) => item.tags || []);
    const stats = [
      ["总记录", records.length],
      ["本月", records.filter((item) => String(item.date).startsWith(month)).length],
      ["总字数", totalWords],
      ["平均字数", records.length ? Math.round(totalWords / records.length) : 0],
      ["常用标签", mostCommon(allTags, "未分类")],
      ["常见心情", mostCommon(records.map((item) => item.mood), "未标记")],
      ["常见思维", mostCommon(records.map((item) => item.thinkingState), "未归类")],
      ["以后再想", records.filter((item) => item.thoughtStatus === "以后再想").length],
      ["可继续发展", records.filter((item) => item.thoughtStatus === "可继续发展").length]
    ];
    $("statsGrid").innerHTML = stats.map(([label, value]) => `
      <div class="stat-item">
        <span class="stat-value">${escapeHtml(value)}</span>
        <span class="stat-label">${escapeHtml(label)}</span>
      </div>`).join("");
  }

  function renderAll() {
    renderStats();
    renderList();
  }

  function pickPrompt() {
    $("dailyPrompt").textContent = prompts[Math.floor(Math.random() * prompts.length)];
  }

  function renderTags() {
    const bank = $("tagBank");
    bank.innerHTML = "";
    presetTags.forEach((tag) => {
      const button = document.createElement("button");
      button.className = "tag-chip";
      button.type = "button";
      button.textContent = tag;
      button.addEventListener("click", () => {
        const tags = parseTags(fields.tags.value);
        if (!tags.includes(tag)) tags.push(tag);
        fields.tags.value = tags.join("、");
      });
      bank.append(button);
    });
  }

  function exportBackup() {
    const today = nowParts().day;
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ya-little-thoughts-backup-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("备份已导出");
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  function validateImport(value) {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed.map(sanitizeRecord);
  }

  function mergeImported(imported) {
    const existingIds = new Set(records.map((item) => item.id));
    const normalized = imported.map((item) => {
      if (existingIds.has(item.id)) item.id = makeId();
      existingIds.add(item.id);
      return sanitizeRecord(item);
    });
    records = [...normalized, ...records].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    saveToStorage();
    renderAll();
    showToast("导入完成");
  }

  function replaceImported(imported) {
    if (!confirm("覆盖导入会替换当前所有记录，确定继续吗？")) return;
    records = imported.map(sanitizeRecord).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    currentId = null;
    saveToStorage();
    clearEditor();
    renderAll();
    showToast("导入完成");
  }

  function bindEvents() {
    $("quickSave").addEventListener("click", () => {
      const record = makeRecordFromQuick();
      upsertRecord(record);
      $("quickInput").value = "";
      showToast("已保存");
    });

    $("saveFullThought").addEventListener("click", () => {
      const record = makeRecordFromEditor();
      upsertRecord(record);
      openRecord(record.id);
      showToast("已保存");
    });

    $("newFullThought").addEventListener("click", clearEditor);
    $("refreshPrompt").addEventListener("click", pickPrompt);
    $("exportBackup").addEventListener("click", exportBackup);

    $("randomThought").addEventListener("click", () => {
      if (!records.length) {
        showToast("还没有可以回看的巧思。");
        return;
      }
      const record = records[Math.floor(Math.random() * records.length)];
      openRecord(record.id);
      showToast("这是一条旧巧思。");
    });

    ["searchInput", "filterTag", "filterMood", "filterThinking", "filterStatus"].forEach((id) => {
      $(id).addEventListener("input", renderList);
      $(id).addEventListener("change", renderList);
    });

    $("clearFilters").addEventListener("click", () => {
      $("searchInput").value = "";
      $("filterTag").value = "";
      $("filterMood").value = "";
      $("filterThinking").value = "";
      $("filterStatus").value = "";
      renderList();
    });

    $("thoughtList").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const record = records.find((item) => item.id === button.dataset.id);
      if (!record) return;
      if (button.dataset.action === "open") openRecord(record.id);
      if (button.dataset.action === "copy") {
        try {
          await copyText(record.content || record.title);
          showToast("已复制");
        } catch (error) {
          showToast("复制失败，请手动选择文本");
        }
      }
      if (button.dataset.action === "later") {
        record.thoughtStatus = "以后再想";
        record.updatedAt = nowParts().stamp;
        upsertRecord(record);
        showToast("已保存");
      }
      if (button.dataset.action === "delete" && confirm("确定删除这条小巧思吗？")) {
        records = records.filter((item) => item.id !== record.id);
        if (currentId === record.id) clearEditor();
        saveToStorage();
        renderAll();
        showToast("已删除");
      }
    });

    $("importBackup").addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          pendingImport = validateImport(reader.result);
          $("importChoice").classList.remove("hidden");
        } catch (error) {
          pendingImport = null;
          $("importChoice").classList.add("hidden");
          showToast("文件格式不正确");
        }
      };
      reader.readAsText(file);
    });

    $("mergeImport").addEventListener("click", () => {
      if (!pendingImport) return;
      mergeImported(pendingImport);
      pendingImport = null;
      $("importChoice").classList.add("hidden");
    });

    $("replaceImport").addEventListener("click", () => {
      if (!pendingImport) return;
      replaceImported(pendingImport);
      pendingImport = null;
      $("importChoice").classList.add("hidden");
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const record = makeRecordFromEditor();
        upsertRecord(record);
        openRecord(record.id);
        showToast("已保存");
      }
    });

    document.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const body = $(button.dataset.toggle);
        body.classList.toggle("mobile-open");
        body.classList.toggle("open");
      });
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  function init() {
    fillSelect(fields.mood, moods, false);
    fillSelect(fields.thinkingState, thinkingStates, false);
    fillSelect(fields.thoughtStatus, thoughtStatuses, false);
    fillSelect($("filterMood"), moods, true);
    fillSelect($("filterThinking"), thinkingStates, true);
    fillSelect($("filterStatus"), thoughtStatuses, true);
    renderTags();
    loadFromStorage();
    clearEditor();
    pickPrompt();
    bindEvents();
    renderAll();
    registerServiceWorker();
  }

  init();
}());
