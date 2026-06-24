const rankLabels = ["第1名", "第2名", "第3名", "第4名", "第5名", "第6名", "第7名", "第8名"];

let events = [];
let matches = [];
let participants = [];
let schools = [];
let singles = [];
let doubles = [];
let watchlist = [];
let importHistory = [];
let correctionRequests = [];
let operationLogs = [];
let selectedPlayer = "";
let selectedPersonalPlayer = "";
let searchText = "";
let selectedImportFile = null;
let currentDataType = "regional";
let currentCorrectionType = "regional";
let currentLibraryTab = "schools";
let currentObjectType = "school";
let currentCompareMode = "singles";
let currentView = "dashboard";
let isAdmin = false;
let activeGovernanceTab = "objects";
let currentPlayerDetailTab = "achievements";
let dashboardEdition = "";
const storageKey = "tennisScoutStateV2";
const adminPassword = "tennis-admin";

const dataTypeConfig = {
  regional: {
    label: "分区赛",
    help: "对应最终模板页签：分区赛。字段：届次、赛事阶段、赛区、项目、第1名、第2名、第3名、第4名。",
    rowsWhenBlank: 4,
    columns: [
      ["edition", "届次"],
      ["stage", "赛事阶段"],
      ["region", "赛区"],
      ["project", "项目"],
      ["rank1", "第1名"],
      ["rank2", "第2名"],
      ["rank3", "第3名"],
      ["rank4", "第4名"],
      ["confidence", "可信度", "select"]
    ]
  },
  national: {
    label: "全国赛",
    help: "对应最终模板页签：全国赛。字段：届次、赛事阶段、名次、团体、团体学校、双打、双打学校、单打、单打学校。",
    rowsWhenBlank: 6,
    columns: [
      ["edition", "届次"],
      ["stage", "赛事阶段"],
      ["rank", "名次"],
      ["team", "团体"],
      ["teamSchool", "团体学校"],
      ["doubles", "双打"],
      ["doublesSchool", "双打学校"],
      ["single", "单打"],
      ["singleSchool", "单打学校"],
      ["confidence", "可信度", "select"]
    ]
  },
  participants: {
    label: "参赛对象库",
    help: "对应最终模板页签：参赛对象库。字段：参赛对象、对象类型、学校、项目。",
    rowsWhenBlank: 6,
    columns: [
      ["participant", "参赛对象"],
      ["objectType", "对象类型"],
      ["school", "学校"],
      ["project", "项目"],
      ["confidence", "可信度", "select"]
    ]
  }
  ,
  teamMatches: {
    label: "团体对阵",
    help: "对应对阵表。字段：赛事类型、届次、赛区、项目、轮次、团体A、团体B、分场、A方选手、比分、B方选手、分场胜方、团体胜方。",
    rowsWhenBlank: 6,
    columns: [
      ["eventType", "赛事类型"],
      ["edition", "届次"],
      ["region", "赛区"],
      ["project", "项目"],
      ["round", "轮次"],
      ["teamA", "团体A"],
      ["teamB", "团体B"],
      ["rubber", "分场"],
      ["playerA", "A方选手"],
      ["score", "比分"],
      ["playerB", "B方选手"],
      ["winner", "分场胜方"],
      ["teamWinner", "团体胜方"],
      ["confidence", "可信度", "select"]
    ]
  },
  individualMatches: {
    label: "单项对阵",
    help: "对应单项对阵表。字段：赛事类型、届次、赛区、项目、轮次、分项、A方学校、A方选手/组合、比分、B方学校、B方选手/组合、胜方、胜方学校。",
    rowsWhenBlank: 6,
    columns: [
      ["eventType", "赛事类型"],
      ["edition", "届次"],
      ["region", "赛区"],
      ["project", "项目"],
      ["round", "轮次"],
      ["division", "分项"],
      ["seedA", "签位A"],
      ["schoolA", "A方学校"],
      ["playerA", "A方选手/组合"],
      ["score", "比分"],
      ["seedB", "签位B"],
      ["schoolB", "B方学校"],
      ["playerB", "B方选手/组合"],
      ["winner", "胜方"],
      ["winnerSchool", "胜方学校"],
      ["sourcePage", "数据来源"],
      ["note", "备注"],
      ["confidence", "可信度", "select"]
    ]
  }
};

const fieldAliases = {
  edition: ["届次"],
  stage: ["赛事阶段"],
  region: ["赛区"],
  project: ["项目"],
  rank: ["名次"],
  rank1: ["第1名", "第一名"],
  rank2: ["第2名", "第二名"],
  rank3: ["第3名", "第三名"],
  rank4: ["第4名", "第四名"],
  team: ["团体"],
  teamSchool: ["团体学校"],
  doubles: ["双打"],
  doublesSchool: ["双打学校"],
  single: ["单打"],
  singleSchool: ["单打学校"],
  participant: ["参赛对象"],
  objectType: ["对象类型"],
  school: ["学校"],
  sourcePage: ["来源页"],
  eventType: ["赛事类型"],
  round: ["轮次"],
  division: ["分项"],
  seedA: ["签位A"],
  seedB: ["签位B"],
  schoolA: ["A方学校"],
  schoolB: ["B方学校"],
  teamA: ["团体A"],
  teamB: ["团体B"],
  rubber: ["分场"],
  playerA: ["A方选手", "A方选手/组合"],
  score: ["比分"],
  playerB: ["B方选手", "B方选手/组合"],
  winner: ["分场胜方", "胜方"],
  winnerSchool: ["胜方学校"],
  teamWinner: ["团体胜方"],
  note: ["备注"],
  confidence: ["可信度", "confidence"]
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "").replace(/[：:]/g, "");
}

function setHint(message, tone = "info") {
  let hintNode = $("#mockPreview .recognition-hint");
  if (!hintNode) {
    $("#mockPreview").insertAdjacentHTML("beforeend", `<p class="recognition-hint"></p>`);
    hintNode = $("#mockPreview .recognition-hint");
  }
  hintNode.textContent = message;
  hintNode.dataset.tone = tone;
}

function saveState() {
  const state = { events, matches, participants, schools, singles, doubles, watchlist, importHistory, correctionRequests, operationLogs };
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem(storageKey) || "{}");
    events = Array.isArray(state.events) ? state.events : [];
    matches = Array.isArray(state.matches) ? state.matches : [];
    participants = Array.isArray(state.participants) ? state.participants : [];
    schools = Array.isArray(state.schools) ? state.schools : [];
    singles = Array.isArray(state.singles) ? state.singles : [];
    doubles = Array.isArray(state.doubles) ? state.doubles : [];
    watchlist = Array.isArray(state.watchlist) ? state.watchlist : [];
    importHistory = Array.isArray(state.importHistory) ? state.importHistory : [];
    correctionRequests = Array.isArray(state.correctionRequests) ? state.correctionRequests : [];
    operationLogs = Array.isArray(state.operationLogs) ? state.operationLogs : [];
  } catch {
    events = [];
    matches = [];
    participants = [];
    schools = [];
    singles = [];
    doubles = [];
    watchlist = [];
    importHistory = [];
    correctionRequests = [];
    operationLogs = [];
  }
}

function createStateSnapshot() {
  return JSON.parse(JSON.stringify({ events, matches, participants, schools, singles, doubles, watchlist }));
}

function restoreStateSnapshot(snapshot) {
  events = Array.isArray(snapshot?.events) ? snapshot.events : [];
  matches = Array.isArray(snapshot?.matches) ? snapshot.matches : [];
  participants = Array.isArray(snapshot?.participants) ? snapshot.participants : [];
  schools = Array.isArray(snapshot?.schools) ? snapshot.schools : [];
  singles = Array.isArray(snapshot?.singles) ? snapshot.singles : [];
  doubles = Array.isArray(snapshot?.doubles) ? snapshot.doubles : [];
  watchlist = Array.isArray(snapshot?.watchlist) ? snapshot.watchlist : [];
}

function setSaveStatus(text = "自动保存已开启") {
  const node = $("#saveStatus");
  if (node) node.textContent = text;
}

function requireAdmin(message = "该操作仅管理员可用。") {
  if (isAdmin) return true;
  alert(message);
  openCorrectionModal({ issueType: "新数据补充" });
  return false;
}

function logOperation(type, objectName, before, after, scope = "") {
  operationLogs.unshift({
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    operator: isAdmin ? "管理员" : "访客",
    type,
    objectName,
    before,
    after,
    scope
  });
  operationLogs = operationLogs.slice(0, 300);
}

function visibleViewTitle() {
  return $("#viewTitle")?.textContent || "未知页面";
}

function selectedContextText() {
  if (currentView === "events") return $("#eventGrid")?.innerText.slice(0, 120) || "";
  if (currentView === "players") return selectedPlayer || "";
  if (currentView === "personal") return selectedPersonalPlayer || "";
  if (currentView === "compare") return [$("#compareA")?.selectedOptions?.[0]?.textContent, $("#compareB")?.selectedOptions?.[0]?.textContent].filter(Boolean).join(" vs ");
  return visibleViewTitle();
}

function renderAuthState() {
  const roleBadge = $("#roleBadge");
  const adminToggle = $("#adminToggle");
  if (roleBadge) roleBadge.textContent = isAdmin ? "管理员模式" : "访客模式";
  if (roleBadge) roleBadge.dataset.mode = isAdmin ? "admin" : "visitor";
  if (adminToggle) adminToggle.textContent = isAdmin ? "退出管理员" : "管理员登录";
  const adminImportPanel = $("#adminImportPanel");
  const visitorImportNotice = $("#visitorImportNotice");
  const adminCorrectionPanel = $("#adminCorrectionPanel");
  const uploadImportHistory = document.querySelector(".import-history-panel");
  if (adminImportPanel) adminImportPanel.hidden = !isAdmin;
  if (visitorImportNotice) visitorImportNotice.hidden = isAdmin;
  if (adminCorrectionPanel) adminCorrectionPanel.hidden = !isAdmin;
  if (uploadImportHistory) uploadImportHistory.hidden = true;
  const libraryNoAccess = $("#libraryNoAccess");
  const libraryAdminPanel = $("#libraryAdminPanel");
  if (libraryNoAccess) libraryNoAccess.hidden = isAdmin;
  if (libraryAdminPanel) libraryAdminPanel.hidden = !isAdmin;
}

function recordImportBatch({ before, label, source, summary }) {
  importHistory.unshift({
    id: `import-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    label,
    source: source || "手动录入",
    summary,
    before
  });
  importHistory = importHistory.slice(0, 8);
  renderImportHistory();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function allAchievements() {
  return events.flatMap(event => event.ranks.map((entry, index) => ({
    player: entry,
    school: event.rankSchools?.[index] || "",
    event: event.name,
    year: event.year,
    levelName: event.levelName,
    region: event.region,
    project: event.project,
    rank: event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`,
    source: event.source
  })));
}

function objectTypeFrom({ name = "", type = "", project = "", school = "" } = {}) {
  const text = `${type} ${project}`;
  if (/学校|团体/.test(text)) return "school";
  if (isDoubleName(name) || /双打/.test(text)) return "doubles";
  if (/单打/.test(text)) return "singles";
  if (schools.some(item => [item.name, item.school].filter(Boolean).includes(name))) return "school";
  if (school && name === school) return "school";
  return name ? "singles" : "unknown";
}

function objectTypeLabel(type) {
  return { school: "学校/团体", doubles: "双打组合", singles: "单打选手", unknown: "待确认" }[type] || "待确认";
}

function normalizePersonName(value) {
  return cleanPersonalName(value)
    .name
    .replace(/\s+/g, "")
    .replace(/[【】\[\]（）()]/g, "")
    .trim();
}

function splitDoublesMembers(name) {
  return String(name || "")
    .replace(/[；;]/g, "/")
    .split(/\/|／|、|,|，|&|＋|\+|和/)
    .map(normalizePersonName)
    .filter(Boolean);
}

function normalizeDoublesKey(name) {
  const members = splitDoublesMembers(name).filter(isPersonName);
  if (members.length !== 2) return String(name || "").trim();
  return [...new Set(members)].sort((a, b) => a.localeCompare(b, "zh-Hans-CN")).join(" / ");
}

function normalizeObjectName(name) {
  if (!isDoubleName(name)) return String(name || "").trim();
  return normalizeDoublesKey(name);
}

function ensureObject(map, rawName, type, data = {}) {
  const name = normalizeObjectName(rawName);
  if (!name) return null;
  const key = `${type}|${name}`;
  if (!map.has(key)) {
    map.set(key, {
      key,
      name,
      type,
      kind: objectTypeLabel(type),
      school: "",
      projects: new Set(),
      levels: new Set(),
      achievements: [],
      matches: [],
      teamDetails: [],
      aliases: new Set(),
      schools: new Set()
    });
  }
  const object = map.get(key);
  if (type === "doubles" && rawName && String(rawName).trim() !== name) object.aliases.add(String(rawName).trim());
  if (!object.school && data.school) object.school = data.school;
  if (data.school) object.schools.add(data.school);
  if (!object.school && type === "school") object.school = name;
  if (data.project) object.projects.add(data.project);
  if (data.levelName) object.levels.add(data.levelName);
  return object;
}

function isTeamMatch(match) {
  return Boolean(match.teamA || match.teamB || match.teamWinner);
}

function teamSideResult(match, teamName) {
  if (match.teamWinner) {
    if (match.teamWinner === teamName) return "胜";
    if ([match.teamA, match.teamB].includes(teamName)) return "负";
  }
  const isA = match.teamA === teamName;
  const sidePlayer = isA ? match.playerA : match.playerB;
  if (match.winner && sidePlayer) return match.winner === sidePlayer ? "胜" : "负";
  return "待确认";
}

function teamOpponent(match, teamName) {
  return match.teamA === teamName ? match.teamB : match.teamA;
}

function rubberName(match) {
  return match.rubber || String(match.round || "").match(/第一单打|第二单打|双打/)?.[0] || match.project || "分场";
}

function baseRound(match) {
  return String(match.round || "").replace(/第一单打|第二单打|双打/g, "").trim() || match.round || "";
}

function buildPlayers() {
  const map = new Map();

  schools.forEach(item => ensureObject(map, item.name || item.school, "school", { school: item.school || item.name, project: item.project || "团体" }));
  singles.forEach(item => ensureObject(map, item.name, objectTypeFrom(item), { school: item.school, project: item.project || "单打" }));
  doubles.forEach(item => ensureObject(map, item.name, "doubles", { school: item.school, project: item.project || "双打" }));
  participants.forEach(item => ensureObject(map, item.name, objectTypeFrom(item), { school: item.school, project: item.project }));

  allAchievements().forEach(item => {
    const type = objectTypeFrom({ name: item.player, project: item.project, school: item.school });
    const object = ensureObject(map, item.player, type, { school: item.school, project: item.project, levelName: item.levelName });
    if (object) object.achievements.push(item);
  });

  matches.forEach(match => {
    if (isTeamMatch(match)) {
      [match.teamA, match.teamB].filter(Boolean).forEach(team => {
        const object = ensureObject(map, team, "school", { school: team, project: match.project || "团体", levelName: match.levelName });
        if (object) object.teamDetails.push(match);
      });
    }
    [match.playerA, match.playerB].filter(Boolean).forEach((name, index) => {
      const project = match.project || (isDoubleName(name) ? "双打" : "单打");
      const type = objectTypeFrom({ name, project });
      const school = index === 0 ? match.schoolA : match.schoolB;
      const object = ensureObject(map, name, type, { school, project, levelName: match.levelName });
      if (object) object.matches.push(match);
    });
  });

  return [...map.values()].map(object => ({
    ...object,
    projects: [...object.projects],
    levels: [...object.levels],
    aliases: [...object.aliases],
    schools: [...object.schools],
    teamMatches: buildTeamOverviews(object)
  })).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, "zh-CN"));
}

function getPlayers() {
  return buildPlayers();
}

function metricData() {
  const players = getPlayers();
  return [
    { label: "赛事记录", value: events.length, note: "已导入分区赛与全国赛成绩", view: "events" },
    { label: "参赛对象", value: players.length, note: "学校、双打组合与单打选手", view: "players" },
    { label: "成绩条目", value: allAchievements().length, note: "正式名次与排名资料", view: "events" },
    { label: "关键对阵", value: matches.length, note: "单项赛与团体分场比分", view: "compare" },
    { label: "数据状态", value: isAdmin ? "管理" : "访客", note: `本地存储 · 最近导入：${importHistory[0]?.time || "暂无"} · 待处理申请：${correctionRequests.filter(item => item.status === "待处理").length}`, view: "library" }
  ];
}

function renderMetrics() {
  $("#metricsGrid").innerHTML = metricData().map(item => `
    <button class="metric" data-view-jump="${escapeHtml(item.view)}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.note)}</small>
    </button>
  `).join("");
}

function dashboardEditions() {
  return [...new Set(events.map(event => editionOf(event.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function renderDashboardEditionTabs() {
  const node = $("#dashboardEditionTabs");
  if (!node) return;
  const editions = dashboardEditions();
  if (!dashboardEdition || (dashboardEdition !== "__all__" && !editions.includes(dashboardEdition))) dashboardEdition = editions.at(-1) || "__all__";
  node.innerHTML = [
    `<button class="segment ${dashboardEdition === "__all__" ? "active" : ""}" data-dashboard-edition="__all__">全部届次</button>`,
    ...editions.map(edition => `<button class="segment ${dashboardEdition === edition ? "active" : ""}" data-dashboard-edition="${escapeHtml(edition)}">${escapeHtml(edition)}</button>`)
  ].join("");
}

function renderRegionalPreview() {
  renderDashboardEditionTabs();
  if (!events.length) {
    $("#regionalPreview").innerHTML = `<div class="empty-state">暂无录入数据</div>`;
    return;
  }
  const regionalRows = events.filter(event =>
    event.level === "regional" &&
    (dashboardEdition === "__all__" || !dashboardEdition || editionOf(event.name) === dashboardEdition) &&
    includesSearch(event.name, event.region, event.project, event.ranks.join(" "), event.rankSchools?.join(" "))
  );
  $("#regionalPreview").innerHTML = regionalRows.map(event => `
    <article class="region-card">
      <div>
        <h3>${escapeHtml(event.region || event.name)}</h3>
        <p class="meta">${escapeHtml(editionOf(event.name))} · ${escapeHtml(event.levelName)} · ${escapeHtml(event.project)}</p>
      </div>
      <div class="region-rank-list">
        ${[0, 1, 2, 3].map(index => `<div><span class="rank-medal rank-${index + 1}">${escapeHtml(event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`)}</span><span class="rank-name">${escapeHtml(event.ranks[index] || "待补充")}</span></div>`).join("")}
      </div>
    </article>
  `).join("") || `<div class="empty-state">暂无分区赛数据</div>`;
}

function renderNationalBoard() {
  const finals = events.filter(event =>
    (event.level === "final" || event.levelName === "全国赛") &&
    (dashboardEdition === "__all__" || !dashboardEdition || editionOf(event.name) === dashboardEdition) &&
    includesSearch(event.name, event.region, event.project, event.ranks.join(" "), event.rankSchools?.join(" "))
  );
  if (!finals.length) {
    $("#nationalBoard").innerHTML = `<div class="empty-state">暂无全国赛录入数据。</div>`;
    return;
  }
  $("#nationalBoard").innerHTML = finals.map(event => `
    <section class="rank-column national-card">
      <h3>${escapeHtml(event.name)}</h3>
      ${event.ranks.map((rank, index) => `
        <div class="rank-item">
          <span class="rank-medal rank-${index + 1}">${escapeHtml(event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`)}</span>
          <span>${escapeHtml(rank)}${event.rankSchools?.[index] ? `<small>${escapeHtml(event.rankSchools[index])}</small>` : ""}</span>
        </div>
      `).join("")}
    </section>
  `).join("");
}

function optionList(values, allLabel = "全部") {
  return [`<option value="">${allLabel}</option>`, ...[...new Set(values)].filter(Boolean).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
}

function setupFilters() {
  $("#eventYearFilter").innerHTML = optionList(events.map(event => event.year));
  $("#eventLevelFilter").innerHTML = optionList(events.map(event => event.levelName));
  $("#eventRegionFilter").innerHTML = optionList(events.map(event => event.region));
  $("#eventProjectFilter").innerHTML = optionList(events.map(event => event.project));
  $("#playerProjectFilter").innerHTML = optionList(getPlayers().flatMap(player => player.projects));
  $("#playerLevelFilter").innerHTML = optionList(getPlayers().flatMap(player => player.levels));
}

function includesSearch(...values) {
  if (!searchText) return true;
  return values.join(" ").toLowerCase().includes(searchText.toLowerCase());
}

function renderEvents() {
  const year = $("#eventYearFilter").value;
  const level = $("#eventLevelFilter").value;
  const region = $("#eventRegionFilter").value;
  const project = $("#eventProjectFilter").value;
  const filtered = events.filter(event =>
    (!year || String(event.year) === year) &&
    (!level || event.levelName === level) &&
    (!region || event.region === region) &&
    (!project || event.project === project) &&
    includesSearch(event.name, event.region, event.project, event.ranks.join(" "))
  );
  $("#eventGrid").innerHTML = filtered.map(event => `
    <article class="event-card" data-event-id="${escapeHtml(event.id)}">
      <div><h3>${escapeHtml(event.name)}</h3><p class="meta">${escapeHtml(event.source)}</p></div>
      <div class="event-meta">
        <span class="pill">${escapeHtml(event.year)}</span>
        <span class="pill">${escapeHtml(event.levelName)}</span>
        <span class="pill">${escapeHtml(event.region)}</span>
        <span class="pill">${escapeHtml(event.project)}</span>
      </div>
      <div class="event-ranks">
        ${Array.from({ length: Math.max(4, event.ranks.length) }, (_, index) => `<div><strong>${escapeHtml(event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`)}</strong><span>${escapeHtml(event.ranks[index] || "待补充")}</span></div>`).join("")}
      </div>
      <div class="card-actions">
        <button class="ghost-button" data-event-detail="${escapeHtml(event.id)}">查看详情</button>
        ${isAdmin ? `<button class="ghost-button" data-view-jump="library">去库管理修改</button>` : ""}
      </div>
    </article>
  `).join("") || `<div class="empty-state">没有匹配的赛事记录。</div>`;
}

function openDetailModal({ title, eyebrow = "详情", body }) {
  const modal = $("#detailModal");
  if (!modal) return;
  $("#detailModalEyebrow").textContent = eyebrow;
  $("#detailModalTitle").textContent = title;
  $("#detailModalBody").innerHTML = body;
  modal.hidden = false;
}

function closeDetailModal() {
  const modal = $("#detailModal");
  if (modal) modal.hidden = true;
}

function sameEventScope(eventItem, match) {
  return editionOf(eventItem.name) === editionOf(match.event) &&
    (!eventItem.levelName || !match.levelName || eventItem.levelName === match.levelName) &&
    (!eventItem.region || !match.region || eventItem.region === match.region || eventItem.region === "全国") &&
    (!eventItem.project || !match.project || eventProjectType(eventItem.project) === eventProjectType(match.project));
}

function eventRoster(eventItem) {
  const map = new Map();
  const ensure = school => {
    const key = school || "学校待补充";
    if (!map.has(key)) map.set(key, { school: key, singles: new Set(), doubles: new Set(), team: new Set() });
    return map.get(key);
  };
  const knownSchools = new Set();
  eventItem.ranks.forEach((rank, index) => {
    const school = eventItem.rankSchools?.[index] || (eventProjectType(eventItem.project) === "团体" ? rank : "");
    const bucket = ensure(school || rank);
    if (school || eventProjectType(eventItem.project) === "团体") knownSchools.add(school || rank);
    if (eventProjectType(eventItem.project) === "单打" && !objectTypeFrom({ name: rank, project: eventItem.project, school }).includes("school")) bucket.singles.add(rank);
    else if (eventProjectType(eventItem.project) === "双打") bucket.doubles.add(normalizeObjectName(rank));
  });
  knownSchools.forEach(school => {
    singles.filter(item => item.school === school).forEach(item => ensure(school).singles.add(item.name));
    doubles.filter(item => item.school === school).forEach(item => ensure(school).doubles.add(normalizeObjectName(item.name)));
  });
  matches.filter(match => {
    const sameEdition = !editionOf(eventItem.name) || !editionOf(match.event) || editionOf(eventItem.name) === editionOf(match.event);
    const sameLevel = !eventItem.levelName || !match.levelName || eventItem.levelName === match.levelName;
    const sameRegion = !eventItem.region || !match.region || eventItem.region === match.region || eventItem.region === "全国";
    const relatedSchool = [match.schoolA, match.schoolB, match.teamA, match.teamB].some(school => knownSchools.has(school));
    return sameEdition && sameLevel && sameRegion && relatedSchool;
  }).forEach(match => {
    [[match.playerA, match.schoolA || match.teamA], [match.playerB, match.schoolB || match.teamB]].forEach(([side, school]) => {
      if (!knownSchools.has(school)) return;
      if (!side || side === school) return;
      const bucket = ensure(school);
      const names = personalNamesFrom(side);
      if (names.length > 1) {
        bucket.doubles.add(normalizeObjectName(side));
        names.forEach(name => bucket.team.add(name));
      } else if (names[0]) {
        if (/双打/.test(match.project || match.round || "")) bucket.doubles.add(names[0]);
        else bucket.singles.add(names[0]);
        if (match.teamA || match.teamB) bucket.team.add(names[0]);
      }
    });
  });
  return [...map.values()].map(item => ({
    school: item.school,
    singles: [...item.singles],
    doubles: [...item.doubles],
    team: [...item.team]
  })).filter(item => item.school || item.singles.length || item.doubles.length || item.team.length);
}

function openEventDetail(eventId) {
  const eventItem = events.find(item => item.id === eventId);
  if (!eventItem) return;
  const rankRows = eventItem.ranks.map((rank, index) => [eventItem.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`, rank, eventItem.rankSchools?.[index] || ""]);
  const relatedObjects = [...new Set([...eventItem.ranks, ...(eventItem.rankSchools || [])].filter(Boolean))];
  const rosterCards = eventRoster(eventItem).map(item => `
    <article class="mini-profile-card">
      <strong>${escapeHtml(item.school)}</strong>
      ${item.team.length ? `<span>团体出场：${escapeHtml(item.team.join("、"))}</span>` : ""}
      ${item.singles.length ? `<span>单打人员：${escapeHtml(item.singles.join("、"))}</span>` : ""}
      ${item.doubles.length ? `<span>双打组合：${escapeHtml(item.doubles.join("、"))}</span>` : ""}
      ${!item.team.length && !item.singles.length && !item.doubles.length ? `<span>暂无已关联到该校的人员记录</span>` : ""}
    </article>
  `).join("");
  openDetailModal({
    eyebrow: "赛事详情",
    title: eventItem.name,
    body: `
      <section class="detail-block featured">
        <div class="object-summary">
          <span><strong>年份</strong>${escapeHtml(eventItem.year)}</span>
          <span><strong>赛事类型</strong>${escapeHtml(eventItem.levelName)}</span>
          <span><strong>赛区</strong>${escapeHtml(eventItem.region)}</span>
          <span><strong>项目</strong>${escapeHtml(eventItem.project)}</span>
          <span><strong>数据来源</strong>${escapeHtml(eventItem.source || "待补充")}</span>
        </div>
      </section>
      <section class="detail-block"><h3>名次列表</h3>${renderTable(["名次", "对象", "学校"], rankRows, "暂无名次数据。")}</section>
      <section class="detail-block"><h3>参赛人员</h3><div class="mini-card-grid">${rosterCards || `<div class="empty-state compact">暂无可关联到该赛事的参赛人员。</div>`}</div></section>
      <section class="detail-block"><h3>关联对象</h3><div class="event-meta">${relatedObjects.map(name => `<span class="pill">${escapeHtml(name)}</span>`).join("") || `<span class="meta">暂无关联对象</span>`}</div></section>
      <div class="modal-actions">
        ${isAdmin ? `<button class="primary-button" data-view-jump="library">去库管理处理</button>` : ""}
      </div>
    `
  });
}

function renderPlayers() {
  const project = $("#playerProjectFilter").value;
  const level = $("#playerLevelFilter").value;
  const objects = getPlayers().filter(object =>
    (searchText || object.type === currentObjectType) &&
    (!project || object.projects.includes(project)) &&
    (!level || object.levels.includes(level)) &&
    includesSearch(object.name, object.kind, object.school, object.projects.join(" "), object.levels.join(" "), object.achievements.map(formatBestAchievement).join(" "))
  );
  if (!objects.some(object => object.key === selectedPlayer)) selectedPlayer = objects[0]?.key || "";
  const duplicateAliasCount = currentObjectType === "doubles" ? getPlayers().filter(object => object.type === "doubles").reduce((sum, object) => sum + (object.aliases?.length || 0), 0) : 0;
  const listHint = currentObjectType === "doubles"
    ? `<div class="list-hint">已按标准组合名合并顺序不同的双打组合${duplicateAliasCount ? `，已合并 ${duplicateAliasCount} 个别名` : ""}。</div>`
    : "";
  $("#playerList").innerHTML = listHint + (objects.map(object => {
    const best = bestAchievement(object);
    const tags = dataStatusTags(object);
    const matchCount = object.type === "school" ? object.teamMatches.length : object.matches.length;
    const detailText = object.type === "school"
      ? `${object.achievements.length}条成绩 / ${object.teamMatches.length}场团体对阵 / ${object.teamDetails.length}条分场`
      : `${object.achievements.length}条成绩 / ${matchCount}场对阵`;
    return `
      <button class="player-row ${object.key === selectedPlayer ? "active" : ""}" data-player="${escapeHtml(object.key)}">
        <span class="player-row-title"><strong>${escapeHtml(object.name)}</strong><em>${escapeHtml(object.kind)}</em></span>
        <span class="meta">${escapeHtml(object.school || object.schools?.join("、") || "学校待补充")}</span>
        <span class="meta">${escapeHtml(detailText)} · 最好成绩：${best ? escapeHtml(formatBestAchievement(best)) : "待补充"}</span>
        <span class="status-pill-row">${tags.map(tag => `<span class="status-pill">${escapeHtml(tag)}</span>`).join("")}</span>
      </button>
    `;
  }).join("") || `<div class="empty-state">暂无${escapeHtml(objectTypeLabel(currentObjectType))}。请导入对应成绩或对阵表补充。</div>`);
  renderPlayerDetail(selectedPlayer);
}

function rankNumber(rank) {
  return Number(String(rank || "").match(/\d+/)?.[0] || 99);
}

function levelPriority(levelName) {
  if (/全国/.test(levelName)) return 1;
  if (/分区/.test(levelName)) return 2;
  if (/省/.test(levelName)) return 3;
  return 9;
}

function bestAchievement(object) {
  return [...object.achievements].sort((a, b) =>
    levelPriority(a.levelName) - levelPriority(b.levelName) || rankNumber(a.rank) - rankNumber(b.rank)
  )[0];
}

function formatBestAchievement(item) {
  const project = String(item.project || "").replace(/^女子甲组/, "");
  const region = item.region && item.region !== "全国" && item.region !== "全国赛" ? ` ${item.region}` : "";
  return `${item.event}${region} ${project}${item.rank}`.trim();
}

function matchResult(match, objectName) {
  if (!match.winner) return "待确认";
  return match.winner === objectName ? "胜" : "负";
}

function closeScoreCount(playerMatches) {
  return playerMatches.filter(match => {
    const score = String(match.score || "");
    const nums = score.match(/\d+/g)?.map(Number) || [];
    return /7-6|7-5|决胜|抢十|10-/.test(score) || (nums.length >= 2 && Math.abs(nums[0] - nums[1]) <= 2);
  }).length;
}

function bigScoreCount(playerMatches) {
  return playerMatches.filter(match => /6-0|6-1|0-6|1-6/.test(match.score || "")).length;
}

function highestRound(playerMatches) {
  const order = ["决赛", "半决赛", "1/4决赛", "四分之一", "八强", "小组", "第一轮"];
  return order.find(name => playerMatches.some(match => String(match.round || "").includes(name))) || "待补充";
}

function dataStatusTags(object) {
  const achievementCount = object.achievements.length;
  const matchCount = object.type === "school" ? object.teamMatches.length : object.matches.length;
  const teamDetailCount = object.teamDetails.length;
  const tags = [];
  if (object.type === "school" && teamDetailCount > 0) tags.push("可团体分析");
  if (achievementCount > 0 && matchCount === 0) tags.push("仅有成绩");
  if (achievementCount === 0 && matchCount > 0) tags.push("仅有对阵");
  if (achievementCount > 0 && matchCount > 0) tags.push("可基础分析");
  if (achievementCount + matchCount < 2) tags.push("数据不足");
  if (!object.school) tags.push("学校待补充");
  return tags.length ? tags : ["数据不足"];
}

function buildTeamOverviews(object) {
  if (object.type !== "school") return [];
  const groups = new Map();
  object.teamDetails.forEach(match => {
    const opponent = teamOpponent(match, object.name) || "待确认";
    const key = [match.event, baseRound(match), opponent].join("|");
    if (!groups.has(key)) {
      groups.set(key, { event: match.event, levelName: match.levelName, region: match.region || "", project: match.project || "团体", round: baseRound(match), opponent, details: [], result: "待确认" });
    }
    const group = groups.get(key);
    group.details.push(match);
    if (match.teamWinner) group.result = match.teamWinner === object.name ? "胜" : "负";
  });
  return [...groups.values()].map(group => {
    const wins = group.details.filter(match => teamSideResult(match, object.name) === "胜").length;
    const losses = group.details.filter(match => teamSideResult(match, object.name) === "负").length;
    return { ...group, totalScore: `${wins}-${losses}`, result: group.result === "待确认" && wins + losses ? (wins > losses ? "胜" : "负") : group.result };
  });
}

function rubberStat(object, rubber) {
  const related = object.teamDetails.filter(match => rubberName(match) === rubber);
  const wins = related.filter(match => teamSideResult(match, object.name) === "胜").length;
  const losses = related.filter(match => teamSideResult(match, object.name) === "负").length;
  return `${wins} 胜 ${losses} 负`;
}

function objectRosterCards(object) {
  if (object.type !== "school") return "";
  const singlesSet = new Set();
  const doublesSet = new Set();
  const teamSet = new Set();
  object.teamDetails.forEach(match => {
    const side = match.teamA === object.name ? match.playerA : match.playerB;
    personalNamesFrom(side).forEach(name => teamSet.add(name));
    if (isDoubleName(side) || /双打/.test(rubberName(match))) doublesSet.add(normalizeObjectName(side));
    else if (side) singlesSet.add(side);
  });
  singles.filter(item => item.school === object.name || item.school === object.school).forEach(item => singlesSet.add(item.name));
  doubles.filter(item => item.school === object.name || item.school === object.school).forEach(item => doublesSet.add(item.name));
  const cards = [
    ["团体出场队员", [...teamSet]],
    ["单打人员", [...singlesSet]],
    ["双打组合", [...doublesSet]]
  ].filter(([, rows]) => rows.length);
  return cards.length ? `
    <section class="detail-block roster-overview">
      <h3>队员概览</h3>
      <div class="mini-card-grid">${cards.map(([title, rows]) => `<article class="mini-profile-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(rows.join("、"))}</span></article>`).join("")}</div>
    </section>
  ` : "";
}

function renderTable(headers, rows, emptyText) {
  if (!rows.length) return `<div class="empty-state compact">${escapeHtml(emptyText)}</div>`;
  return `<div class="compact-table-wrap"><table class="compact-table"><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderPlayerDetail(key) {
  const object = getPlayers().find(item => item.key === key);
  if (!object) {
    $("#playerDetail").innerHTML = `<div class="empty-state">请选择一个参赛对象查看档案。</div>`;
    return;
  }
  const best = bestAchievement(object);
  const tags = dataStatusTags(object);
  const matchRows = object.matches.map(match => [
    match.event,
    match.levelName,
    match.region || "",
    match.project || "",
    match.round || "",
    match.playerA === object.name ? match.playerB : match.playerA,
    match.score,
    matchResult(match, object.name)
  ]);
  const achievementRows = object.achievements.map(item => [item.event, item.levelName, item.region, item.project, item.rank, item.school]);
  const teamOverviewRows = object.teamMatches.map(item => [item.event, item.levelName, item.region, item.project, item.round, item.opponent, item.totalScore, item.result]);
  const teamDetailRows = object.teamDetails.map(match => [
    baseRound(match),
    teamOpponent(match, object.name),
    rubberName(match),
    match.teamA === object.name ? match.playerA : match.playerB,
    match.score,
    match.teamA === object.name ? match.playerB : match.playerA,
    teamSideResult(match, object.name)
  ]);
  const wins = object.matches.filter(match => matchResult(match, object.name) === "胜").length;
  const losses = object.matches.filter(match => matchResult(match, object.name) === "负").length;
  const teamWins = object.teamMatches.filter(match => match.result === "胜").length;
  const teamLosses = object.teamMatches.filter(match => match.result === "负").length;
  const tips = [
    "当前数据仅基于已导入记录，不判断下一场胜负。",
    object.achievements.length + object.matches.length + object.teamDetails.length < 2 ? "当前记录较少，仅能展示已录入事实，不能判断整体水平。" : "",
    !object.school ? "学校信息待补充，请在对象管理中完善。" : ""
  ].filter(Boolean);
  const doublesMembers = object.type === "doubles" ? splitDoublePlayers(object.name).filter(Boolean) : [];
  const aliasInfo = object.type === "doubles" && object.aliases?.length ? `<span><strong>已合并别名</strong>${escapeHtml(object.aliases.join("、"))}</span>` : "";
  const tabButtons = [
    ["achievements", "成绩记录"],
    ["matches", "对阵记录"],
    ["stats", "统计摘要"],
    ["notes", "数据说明"]
  ].map(([keyName, label]) => `<button class="segment ${currentPlayerDetailTab === keyName ? "active" : ""}" data-player-detail-tab="${keyName}">${label}</button>`).join("");
  const teamCards = object.teamMatches.map(item => `
    <details class="team-match-card">
      <summary>
        <strong>${escapeHtml(item.round || "轮次待补充")}｜vs ${escapeHtml(item.opponent)}</strong>
        <span class="score-badge">${escapeHtml(item.totalScore)}</span>
        <span class="result-pill">${escapeHtml(item.result)}</span>
      </summary>
      <div class="match-card-list">
        ${item.details.map(match => `
          <article class="match-mini-card result-${teamSideResult(match, object.name)}">
            <div><strong>${escapeHtml(rubberName(match))}</strong><span class="score-badge">${escapeHtml(match.score || "比分待补充")}</span></div>
            <p>本方：${escapeHtml(match.teamA === object.name ? match.playerA : match.playerB)}</p>
            <p>对方：${escapeHtml(match.teamA === object.name ? match.playerB : match.playerA)}</p>
            <p>结果：${escapeHtml(teamSideResult(match, object.name))}</p>
          </article>
        `).join("")}
      </div>
    </details>
  `).join("");
  const tabContent = {
    achievements: `<section class="detail-block"><h3>成绩记录</h3>${renderTable(["届次", "赛事类型", "赛区", "项目", "名次", "学校"], achievementRows, "暂无正式名次记录。")}</section>`,
    matches: `<section class="detail-block"><h3>对阵记录</h3>${object.type === "school" ? (teamCards || `<div class="empty-state compact">暂无团体对阵记录。</div>`) : renderTable(["届次", "赛事类型", "赛区", "项目", "轮次", object.type === "doubles" ? "对手组合" : "对手", "比分", "结果"], matchRows, "暂无对阵记录。可以通过导入单项赛对阵表或团体分场表补充。")}</section>`,
    stats: `<section class="detail-block"><h3>统计摘要</h3>${object.type === "school" ? renderTable(["指标", "内容"], [
      ["团体对阵", `${object.teamMatches.length} 场`],
      ["团体胜负", `${teamWins} 胜 ${teamLosses} 负`],
      ["分场总记录", `${object.teamDetails.length} 条`],
      ["第一单打", rubberStat(object, "第一单打")],
      ["第二单打", rubberStat(object, "第二单打")],
      ["双打", rubberStat(object, "双打")]
    ], "暂无可统计数据。") : renderTable(["指标", "内容"], [
      ["已录入对阵", `${object.matches.length} 场`],
      ["胜负", `${wins} 胜 ${losses} 负`],
      ["胜率", object.matches.length ? `${Math.round((wins / object.matches.length) * 100)}%（仅作为已录入数据统计）` : "暂无"],
      ["最高轮次", highestRound(object.matches)],
      ["接近比分", `${closeScoreCount(object.matches)} 场`],
      ["大比分胜场", `${bigScoreCount(object.matches)} 场`]
    ], "暂无可统计数据。")}</section>`,
    notes: `<section class="detail-block"><h3>数据说明</h3><div class="event-meta">${tags.map(tag => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>${tips.map(tip => `<p class="meta">${escapeHtml(tip)}</p>`).join("")}<button class="ghost-button" data-open-correction data-context="${escapeHtml(object.name)}">提交错误反馈</button>${isAdmin ? `<button class="ghost-button" data-view-jump="library">去库管理修改/合并</button>` : ""}</section>`
  };
  $("#playerDetail").innerHTML = `
    <div class="panel-heading">
      <div><p class="eyebrow">对象档案</p><h2>${escapeHtml(object.name)}</h2></div>
      <span class="tag">${escapeHtml(object.kind)}</span>
    </div>
    <section class="detail-block featured">
      <h3>基础信息</h3>
      <div class="object-summary">
        <span><strong>类型</strong>${escapeHtml(object.kind)}</span>
        ${object.type === "doubles" ? `<span><strong>标准组合名</strong>${escapeHtml(object.name)}</span><span><strong>成员</strong>${escapeHtml(doublesMembers.join("、") || "待补充")}</span>` : ""}
        <span><strong>学校</strong>${escapeHtml(object.school || "待补充")}</span>
        <span><strong>项目</strong>${escapeHtml(object.projects.join("、") || "待补充")}</span>
        <span><strong>最好成绩</strong>${best ? escapeHtml(formatBestAchievement(best)) : "待补充"}</span>
        <span><strong>记录</strong>${object.achievements.length}条成绩，${object.type === "school" ? `${object.teamMatches.length}场团体对阵，${object.teamDetails.length}条分场` : `${object.matches.length}场对阵`}</span>
        ${isAdmin ? aliasInfo : ""}
      </div>
      <div class="event-meta">${tags.map(tag => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>
      ${!object.achievements.length && (object.matches.length || object.teamDetails.length) ? `<p class="meta">当前仅有对阵记录，暂未录入正式名次。</p>` : ""}
    </section>
    ${objectRosterCards(object)}
    <div class="segmented compact-tabs">${tabButtons}</div>
    ${tabContent[currentPlayerDetailTab] || tabContent.achievements}
  `;
}

function ensurePersonal(map, name) {
  const clean = cleanPersonalName(name);
  if (!isPersonName(clean.name)) return null;
  if (!map.has(clean.name)) {
    map.set(clean.name, {
      name: clean.name,
      schools: new Set(clean.school ? [clean.school] : []),
      projects: new Set(),
      partners: new Set(),
      achievements: [],
      matches: [],
      schoolLinks: [],
      partnerLinks: [],
      eventLinks: []
    });
  }
  return map.get(clean.name);
}

function addPersonalSchool(person, school, eventName, project, sourceType) {
  if (!person || !school) return;
  person.schools.add(school);
  person.schoolLinks.push({ school, eventName: eventName || "", project: project || "", sourceType: sourceType || "记录" });
}

function addPersonalPartner(map, pairName, school, project, eventName, sourceType) {
  const standardPairName = normalizeDoublesKey(pairName);
  const names = personalNamesFrom(standardPairName);
  if (names.length < 2) return;
  names.forEach(name => {
    const person = ensurePersonal(map, name);
    if (!person) return;
    const partner = names.find(item => item !== name) || "";
    person.partners.add(partner);
    person.projects.add("双打");
    addPersonalSchool(person, school, eventName, project, sourceType);
    if (!person.partnerLinks.some(item => item.partner === partner && item.pairName === standardPairName && item.eventName === (eventName || ""))) {
      person.partnerLinks.push({ partner, pairName: standardPairName, school: school || "", project: project || "", eventName: eventName || "", sourceType: sourceType || "双打" });
    }
  });
}

function addPersonalAchievement(person, item, type, representedEntity, school) {
  if (!person) return;
  person.projects.add(/双打/.test(item.project) ? "双打" : /团体/.test(item.project) ? "团体" : "单打");
  person.achievements.push({ type, event: item.event, levelName: item.levelName, region: item.region, project: item.project, rank: item.rank, representedEntity, school: school || item.school || "" });
  addPersonalSchool(person, school || item.school, item.event, item.project, type);
  person.eventLinks.push({ event: item.event, levelName: item.levelName, region: item.region, project: item.project, role: type, entity: representedEntity, result: item.rank });
}

function editionOf(value) {
  return String(value || "").match(/第\d+届/)?.[0] || "";
}

function achievementKey(playerName, achievement) {
  return [
    playerName,
    achievement.type,
    editionOf(achievement.event),
    achievement.levelName || "",
    achievement.region || "",
    achievement.project || "",
    achievement.rank || "",
    achievement.representedEntity || ""
  ].join("|");
}

function sameTeamAchievement(match, achievement) {
  if (!achievement || objectTypeFrom({ name: achievement.player, project: achievement.project, school: achievement.school }) !== "school") return false;
  if (!match.teamA && !match.teamB) return false;
  return [match.teamA, match.teamB].includes(achievement.player) &&
    editionOf(achievement.event) === editionOf(match.event) &&
    (!achievement.levelName || !match.levelName || achievement.levelName === match.levelName) &&
    (!achievement.region || !match.region || achievement.region === match.region || match.event.includes(achievement.region)) &&
    /团体/.test(achievement.project || match.event);
}

function dedupePersonalAchievements(person) {
  const seen = new Map();
  const duplicates = [];
  const before = person.achievements.length;
  person.achievements.forEach(achievement => {
    const key = achievementKey(person.name, achievement);
    if (seen.has(key)) {
      duplicates.push(achievement);
      return;
    }
    seen.set(key, achievement);
  });
  person.achievements = [...seen.values()];
  person.achievementDebug = {
    player: person.name,
    direct: person.achievements.filter(item => item.type === "个人直接成绩").length,
    doubles: person.achievements.filter(item => item.type === "双打组合成绩").length,
    team: person.achievements.filter(item => item.type === "团体关联成绩").length,
    before,
    after: person.achievements.length,
    duplicates
  };
}

function logPersonalAchievementDebug(people) {
  const rows = people.map(person => person.achievementDebug).filter(Boolean);
  if (!rows.length) return;
  const signature = rows.map(row => `${row.player}:${row.before}:${row.after}:${row.duplicates.length}`).join("|");
  if (window.__personalAchievementDebugSignature === signature) return;
  window.__personalAchievementDebugSignature = signature;
  console.group("Tennis Scout 选手卡片成绩去重检查");
  console.table(rows.map(row => ({
    选手: row.player,
    个人直接成绩: row.direct,
    双打组合成绩: row.doubles,
    团体关联成绩: row.team,
    去重前成绩数: row.before,
    去重后成绩数: row.after,
    被去重数量: row.duplicates.length
  })));
  const duplicatedRows = rows.flatMap(row => row.duplicates.map(item => ({
    选手: row.player,
    成绩类型: item.type,
    届次: editionOf(item.event),
    赛事类型: item.levelName,
    赛区: item.region,
    项目: item.project,
    名次: item.rank,
    代表对象: item.representedEntity
  })));
  if (duplicatedRows.length) {
    console.table(duplicatedRows);
  } else {
    console.info("没有发现重复个人成绩。");
  }
  const jinya = rows.find(row => row.player === "金晓雅");
  if (jinya) {
    console.info("金晓雅成绩检查", jinya);
  }
  console.groupEnd();
}

function addPersonalMatch(person, match, role, partner, opponent, team) {
  if (!person) return;
  person.projects.add(role.includes("双打") ? "双打" : role.includes("团体") ? "团体" : "单打");
  const sideName = personalNamesFrom(match.playerA).includes(person.name) ? match.playerA : match.playerB;
  const result = match.winner ? (match.winner === sideName ? "胜" : "负") : "未知";
  person.matches.push({ event: match.event, levelName: match.levelName, region: match.region || "", project: match.project || "", round: match.round || "", role, partner: partner || "", opponent: opponent || "", score: match.score || "", result, team: team || "", source: match.source || match.confidence || "对阵记录" });
  addPersonalSchool(person, team, match.event, match.project, role);
  person.eventLinks.push({ event: match.event, levelName: match.levelName, region: match.region || "", project: match.project || "", role, entity: team || sideName, result: result === "未知" ? "已出场" : result });
}

function personalStatus(person) {
  const tags = [];
  if (person.achievements.length && person.matches.length) tags.push("可基础查看");
  else if (person.achievements.length) tags.push("仅有成绩");
  else if (person.matches.length) tags.push("仅有对阵");
  if (person.partners.size) tags.push("有搭档记录");
  if (person.matches.some(match => match.role.includes("团体"))) tags.push("有团体分场");
  if (!person.schools.size) tags.push("学校待补充");
  if (person.achievements.length + person.matches.length < 2) tags.push("数据较少");
  return tags.length ? tags : ["数据较少"];
}

function buildPersonalPlayers() {
  const map = new Map();
  singles.forEach(item => {
    const person = ensurePersonal(map, item.name);
    if (!person) return;
    person.projects.add("单打");
    addPersonalSchool(person, item.school, "单打选手库", item.project || "单打", "单打库");
  });
  doubles.forEach(item => addPersonalPartner(map, item.name, item.school, item.project || "双打", "双打选手库", "双打库"));
  participants.forEach(item => {
    if (objectTypeFrom(item) === "singles") {
      const person = ensurePersonal(map, item.name);
      if (person) addPersonalSchool(person, item.school, "参赛对象库", item.project, "单打对象");
    } else if (objectTypeFrom(item) === "doubles") {
      addPersonalPartner(map, item.name, item.school, item.project, "参赛对象库", "双打对象");
    }
  });
  allAchievements().forEach(item => {
    const type = objectTypeFrom({ name: item.player, project: item.project, school: item.school });
    if (type === "singles") {
      addPersonalAchievement(ensurePersonal(map, item.player), item, "个人直接成绩", item.player, item.school);
    } else if (type === "doubles") {
      addPersonalPartner(map, item.player, item.school, item.project, item.event, "正式双打");
      personalNamesFrom(item.player).forEach(name => addPersonalAchievement(ensurePersonal(map, name), item, "双打组合成绩", normalizeObjectName(item.player), item.school));
    }
  });
  matches.forEach(match => {
    const project = match.project || inferMatchProject(match);
    const isTeam = isTeamMatch(match);
    const roleBase = isTeam ? "团体分场选手" : /双打/.test(project) ? "双打成员" : "单打选手";
    [["A", match.playerA, match.playerB, match.schoolA || match.teamA], ["B", match.playerB, match.playerA, match.schoolB || match.teamB]].forEach(([, side, opponent, team]) => {
      const names = personalNamesFrom(side);
      names.forEach(name => {
        const person = ensurePersonal(map, name);
        const partner = names.length > 1 ? names.filter(item => item !== name).join(" / ") : "";
        if (partner && person) person.partners.add(partner);
        addPersonalMatch(person, match, roleBase, partner, opponent, team);
      });
      if (names.length > 1) addPersonalPartner(map, side, team, project, match.event, isTeam ? "团体双打分场" : "正式双打对阵");
    });
  });
  const teamAchievements = allAchievements().filter(item => objectTypeFrom({ name: item.player, project: item.project, school: item.school }) === "school");
  map.forEach(person => {
    const teamAppearances = person.matches.filter(match => match.role.includes("团体") && match.team);
    teamAppearances.forEach(appearance => {
      const sourceMatch = matches.find(match =>
        match.event === appearance.event &&
        match.round === appearance.round &&
        match.score === appearance.score &&
        [match.teamA, match.teamB].includes(appearance.team)
      );
      if (!sourceMatch) return;
      teamAchievements
        .filter(item => item.player === appearance.team && sameTeamAchievement(sourceMatch, item))
        .forEach(item => addPersonalAchievement(person, item, "团体关联成绩", item.player, item.school || item.player));
    });
    dedupePersonalAchievements(person);
  });
  const people = [...map.values()].map(person => ({ ...person, schools: [...person.schools], projects: [...person.projects], partners: [...person.partners], status: personalStatus(person) })).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  logPersonalAchievementDebug(people);
  return people;
}

function renderPersonalFilters() {
  const people = buildPersonalPlayers();
  const current = {
    school: $("#personalSchoolFilter").value,
    project: $("#personalProjectFilter").value,
    status: $("#personalStatusFilter").value,
    level: $("#personalLevelFilter").value
  };
  $("#personalSchoolFilter").innerHTML = optionList(people.flatMap(person => person.schools));
  $("#personalProjectFilter").innerHTML = optionList(people.flatMap(person => person.projects));
  $("#personalStatusFilter").innerHTML = optionList(people.flatMap(person => person.status));
  $("#personalLevelFilter").innerHTML = optionList([...people.flatMap(person => person.achievements.map(item => item.levelName)), ...people.flatMap(person => person.matches.map(item => item.levelName))]);
  $("#personalSchoolFilter").value = current.school;
  $("#personalProjectFilter").value = current.project;
  $("#personalStatusFilter").value = current.status;
  $("#personalLevelFilter").value = current.level;
}

function countGrouped(rows, keyFn) {
  const map = new Map();
  rows.forEach(row => {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, { ...row, count: 0 });
    map.get(key).count += 1;
  });
  return [...map.values()];
}

function renderPersonalCards() {
  if (!$("#personalList")) return;
  renderPersonalFilters();
  const query = $("#personalSearch").value.trim();
  const school = $("#personalSchoolFilter").value;
  const project = $("#personalProjectFilter").value;
  const status = $("#personalStatusFilter").value;
  const level = $("#personalLevelFilter").value;
  const people = buildPersonalPlayers().filter(person => (!query || person.name.includes(query)) && (!school || person.schools.includes(school)) && (!project || person.projects.includes(project)) && (!status || person.status.includes(status)) && (!level || person.achievements.some(item => item.levelName === level) || person.matches.some(item => item.levelName === level)));
  if (!people.some(person => person.name === selectedPersonalPlayer)) selectedPersonalPlayer = people[0]?.name || "";
  $("#personalList").innerHTML = people.map(person => `
    <button class="player-row ${person.name === selectedPersonalPlayer ? "active" : ""}" data-personal-player="${escapeHtml(person.name)}">
      <strong>${escapeHtml(person.name)}</strong>
      <span class="meta">${escapeHtml(person.schools[0] || "学校待补充")}</span>
      <span class="meta">项目：${escapeHtml(person.projects.join("、") || "待补充")}</span>
      <span class="meta">${buildPlayerProfile(person).summary.eventCount}个赛事 / ${buildPlayerProfile(person).summary.matchCount}场比赛</span>
      <span class="meta">最好成绩：${escapeHtml(buildPlayerProfile(person).summary.bestAchievement || "待补充")}</span>
      <span class="tag">${escapeHtml(person.status[0] || "数据较少")}</span>
    </button>
  `).join("") || `<div class="empty-state">暂无个人选手。请先导入单打、双打或团体分场记录。</div>`;
  renderPersonalDetail(selectedPersonalPlayer);
}

function normalizeEventType(value) {
  const text = String(value || "");
  if (/全国/.test(text)) return "全国赛";
  if (/分区/.test(text)) return "分区赛";
  if (/省/.test(text)) return "省赛";
  return text || "赛事";
}

function eventProjectType(project = "") {
  if (/团体/.test(project)) return "团体";
  if (/双打/.test(project)) return "双打";
  if (/单打/.test(project)) return "单打";
  return "其他";
}

function careerProjectKey(project = "") {
  const type = eventProjectType(project);
  return type === "其他" ? String(project || "") : type;
}

function normalizeResult(result = "") {
  if (result.includes("胜")) return "胜";
  if (result.includes("负")) return "负";
  return result || "未知";
}

function playerAchievementLabel(achievement) {
  if (!achievement) return "";
  return `${editionOf(achievement.event) || achievement.event}${achievement.levelName || ""}${achievement.project || ""}${achievement.rank || ""}（${achievement.type}）`;
}

function bestPersonalAchievement(person) {
  return [...person.achievements].sort((a, b) => {
    const levelDiff = levelPriority(a.levelName) - levelPriority(b.levelName);
    if (levelDiff) return levelDiff;
    return rankNumber(a.rank) - rankNumber(b.rank);
  })[0];
}

function eventKeyOfRecord({ edition, eventType, region, project, school }) {
  return [edition || "", eventType || "", region || "", careerProjectKey(project), school || ""].join("|");
}

function matchCareerKey(playerName, match) {
  return [playerName, editionOf(match.event), normalizeEventType(match.levelName), match.region || "", match.project || "", match.round || "", match.role || "", match.partner || "", match.opponent || "", match.score || ""].join("|");
}

function ensureCareerEvent(map, data) {
  const key = eventKeyOfRecord(data);
  if (!map.has(key)) {
    map.set(key, {
      eventKey: key,
      eventName: `${data.edition || ""}${data.eventType || ""}`.trim() || data.eventName || "未命名赛事",
      edition: data.edition || "",
      eventType: data.eventType || "",
      region: data.region || "",
      project: data.project || "",
      school: data.school || "",
      roles: new Set(),
      finalResults: [],
      matches: [],
      matchKeys: new Set()
    });
  } else {
    const existing = map.get(key);
    if ((!existing.project || existing.project === careerProjectKey(existing.project)) && data.project) existing.project = data.project;
    if (!existing.school && data.school) existing.school = data.school;
  }
  return map.get(key);
}

function addFinalResultToCareer(eventItem, achievement) {
  const key = [achievement.type, achievement.rank, achievement.representedEntity, achievement.school].join("|");
  if (eventItem.finalResults.some(item => item.key === key)) return;
  eventItem.finalResults.push({
    key,
    result: achievement.rank || "已录入成绩",
    type: achievement.type,
    representedEntity: achievement.representedEntity || "",
    school: achievement.school || ""
  });
}

function addMatchToCareer(eventItem, personName, match) {
  const key = matchCareerKey(personName, match);
  if (eventItem.matchKeys.has(key)) return;
  eventItem.matchKeys.add(key);
  const roleText = match.role || "";
  const matchType = roleText.includes("团体") && match.partner ? "团体双打" : roleText.includes("团体") ? rubberName(match) || "团体分场" : match.partner ? "双打" : "单打";
  eventItem.roles.add(roleText || matchType);
  eventItem.matches.push({
    round: match.round || "轮次待补充",
    matchType,
    slotType: rubberName(match) || matchType,
    partner: match.partner || "",
    opponent: match.opponent || "对手待补充",
    opponentSchool: "",
    score: match.score || "比分待补充",
    result: normalizeResult(match.result),
    source: match.source || "对阵记录"
  });
}

function summarizeCareerEvent(eventItem) {
  const wins = eventItem.matches.filter(match => match.result === "胜").length;
  const losses = eventItem.matches.filter(match => match.result === "负").length;
  const singlesMatches = eventItem.matches.filter(match => !match.partner).length;
  const doublesMatches = eventItem.matches.filter(match => match.partner).length;
  const teamMatches = eventItem.matches.filter(match => /团体|第一|第二/.test(match.matchType + match.slotType)).length;
  const partnerCounts = countGrouped(eventItem.matches.filter(match => match.partner), row => row.partner).map(row => ({ name: row.partner, count: row.count }));
  const final = eventItem.finalResults[0];
  eventItem.role = [...eventItem.roles].filter(Boolean).join("、") || "参赛选手";
  eventItem.finalResult = final?.result || "暂无名次";
  eventItem.finalResultType = final?.type || "";
  eventItem.eventSummary = {
    totalMatches: eventItem.matches.length,
    singlesMatches,
    doublesMatches,
    teamMatches,
    wins,
    losses,
    noResultMatches: eventItem.matches.length - wins - losses,
    partners: partnerCounts,
    teamResult: eventItem.finalResults.find(item => item.type === "团体关联成绩")?.result || ""
  };
  return eventItem;
}

function buildPlayerProfile(person) {
  const eventMap = new Map();
  person.achievements.forEach(achievement => {
    const eventItem = ensureCareerEvent(eventMap, {
      edition: editionOf(achievement.event),
      eventType: normalizeEventType(achievement.levelName),
      region: achievement.region || (/全国/.test(achievement.levelName) ? "全国" : ""),
      project: achievement.project || "",
      school: achievement.school || "",
      eventName: achievement.event
    });
    eventItem.roles.add(achievement.type);
    addFinalResultToCareer(eventItem, achievement);
  });
  person.matches.forEach(match => {
    const eventItem = ensureCareerEvent(eventMap, {
      edition: editionOf(match.event),
      eventType: normalizeEventType(match.levelName),
      region: match.region || (/全国/.test(match.levelName) ? "全国" : ""),
      project: match.project || "",
      school: match.team || "",
      eventName: match.event
    });
    addMatchToCareer(eventItem, person.name, match);
  });
  const eventsList = [...eventMap.values()].map(summarizeCareerEvent).sort((a, b) => {
    const levelDiff = levelPriority(a.eventType) - levelPriority(b.eventType);
    if (levelDiff) return levelDiff;
    return a.eventName.localeCompare(b.eventName, "zh-CN");
  });
  const best = bestPersonalAchievement(person);
  const partnerCards = countGrouped(person.partnerLinks, row => [row.partner, row.pairName, row.school].join("|")).map(row => {
    const relatedEvents = eventsList.filter(eventItem => eventItem.matches.some(match => match.partner === row.partner));
    const bestInEvents = relatedEvents.flatMap(eventItem => eventItem.finalResults.map(result => `${eventItem.eventName}${eventItem.project}${result.result}（${result.type}）`))[0] || "待补充";
    return {
      partner: row.partner,
      pairName: row.pairName,
      school: row.school || "待补充",
      eventCount: relatedEvents.length,
      matchCount: relatedEvents.reduce((sum, eventItem) => sum + eventItem.matches.filter(match => match.partner === row.partner).length, 0),
      best: bestInEvents
    };
  });
  const schoolMap = new Map();
  person.schoolLinks.forEach(row => {
    const school = row.school || "待补充";
    if (!schoolMap.has(school)) schoolMap.set(school, { school, projects: new Set(), sources: new Set(), count: 0 });
    const item = schoolMap.get(school);
    if (row.project) item.projects.add(eventProjectType(row.project) === "其他" ? row.project : eventProjectType(row.project));
    if (row.sourceType) item.sources.add(row.sourceType);
    item.count += 1;
  });
  const schoolCards = [...schoolMap.values()].map(item => ({
    school: item.school,
    project: [...item.projects].join("、") || "待补充",
    sourceType: [...item.sources].slice(0, 4).join("、") || "记录",
    count: item.count
  }));
  const notes = [
    "当前选手卡片基于已导入的成绩表和对阵表自动生成。",
    "团体成绩仅在该选手有实际团体分场出场记录时作为团体关联成绩展示。",
    "系统不会根据学校自动推断选手个人成绩或下一场胜负。",
    !person.matches.length && person.achievements.length ? "当前该选手只有成绩记录，暂无具体对阵比分。" : "",
    person.matches.length && !person.achievements.length ? "当前该选手只有对阵记录，暂无正式名次成绩。" : ""
  ].filter(Boolean);
  return {
    summary: {
      playerName: person.name,
      schools: person.schools,
      projects: person.projects,
      partners: person.partners,
      eventCount: eventsList.length,
      matchCount: eventsList.reduce((sum, eventItem) => sum + eventItem.matches.length, 0),
      bestAchievement: playerAchievementLabel(best),
      dataTags: person.status
    },
    events: eventsList,
    partners: partnerCards,
    schools: schoolCards,
    dataNotes: notes,
    debug: {
      rawAchievements: person.achievements.length,
      rawMatches: person.matches.length,
      achievementDebug: person.achievementDebug,
      eventKeys: eventsList.map(item => item.eventKey),
      matchKeys: eventsList.flatMap(item => [...item.matchKeys])
    }
  };
}

function personalEventFilterOptions(profile) {
  return {
    eventTypes: ["", ...new Set(profile.events.map(item => item.eventType).filter(Boolean))],
    projects: ["", ...new Set(profile.events.map(item => eventProjectType(item.project)).filter(Boolean))],
    editions: ["", ...new Set(profile.events.map(item => item.edition).filter(Boolean))]
  };
}

function selectedCareerFilters() {
  return {
    eventType: $("#careerEventTypeFilter")?.value || "",
    project: $("#careerProjectFilter")?.value || "",
    edition: $("#careerEditionFilter")?.value || "",
    result: $("#careerResultFilter")?.value || ""
  };
}

function filterCareerEvents(eventsList, filters) {
  return eventsList.filter(item => {
    const hasRank = item.finalResults.length > 0;
    const hasWin = item.eventSummary.wins > 0;
    const hasLoss = item.eventSummary.losses > 0;
    return (!filters.eventType || item.eventType === filters.eventType) &&
      (!filters.project || eventProjectType(item.project) === filters.project) &&
      (!filters.edition || item.edition === filters.edition) &&
      (!filters.result || (filters.result === "胜场" ? hasWin : filters.result === "负场" ? hasLoss : filters.result === "有名次" ? hasRank : !hasRank));
  });
}

function renderCareerFilters(profile) {
  const options = personalEventFilterOptions(profile);
  const filters = selectedCareerFilters();
  const optionHtml = (values, allLabel = "全部") => values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value || allLabel)}</option>`).join("");
  return `
    <div class="career-filters">
      <label>赛事类型<select id="careerEventTypeFilter" class="personal-event-filter">${optionHtml(options.eventTypes)}</select></label>
      <label>项目<select id="careerProjectFilter" class="personal-event-filter">${optionHtml(["", "单打", "双打", "团体"])}</select></label>
      <label>届次<select id="careerEditionFilter" class="personal-event-filter">${optionHtml(options.editions)}</select></label>
      <label>结果<select id="careerResultFilter" class="personal-event-filter">${optionHtml(["", "胜场", "负场", "有名次", "无名次"])}</select></label>
    </div>
  `.replace(`value="${escapeHtml(filters.eventType)}"`, `value="${escapeHtml(filters.eventType)}" selected`);
}

function restoreCareerFilterValues(filters) {
  [["careerEventTypeFilter", filters.eventType], ["careerProjectFilter", filters.project], ["careerEditionFilter", filters.edition], ["careerResultFilter", filters.result]].forEach(([id, value]) => {
    const node = $(`#${id}`);
    if (node) node.value = value;
  });
}

function renderCareerEventCard(eventItem) {
  const summary = eventItem.eventSummary;
  const resultText = eventItem.finalResults.length
    ? eventItem.finalResults.map(item => `${item.type === "团体关联成绩" ? "所属团体最终成绩" : "最终结果"}：${item.result}（${item.type}）`).join("；")
    : "最终结果：暂无名次";
  const partnerText = summary.partners.length ? summary.partners.map(item => `${item.name} ${item.count}场`).join("、") : "暂无";
  return `
    <details class="career-card project-${eventProjectType(eventItem.project)}">
      <summary>
        <div>
          <strong>${escapeHtml(eventItem.eventName)}｜${escapeHtml(eventItem.project || "项目待补充")}</strong>
          <span>${escapeHtml(eventItem.eventType)}｜${escapeHtml(eventItem.region || "赛区待补充")}｜${escapeHtml(eventItem.school || "代表学校待补充")}</span>
        </div>
        <div class="career-card-stats">
          <span class="pill">${escapeHtml(eventItem.role)}</span>
          <span>${escapeHtml(resultText)}</span>
          <span>${summary.totalMatches}场，${summary.wins}胜${summary.losses}负</span>
        </div>
      </summary>
      <div class="career-card-body">
        <div class="career-overview">
          <span><strong>届次</strong>${escapeHtml(eventItem.edition || "待补充")}</span>
          <span><strong>赛事类型</strong>${escapeHtml(eventItem.eventType || "待补充")}</span>
          <span><strong>赛区</strong>${escapeHtml(eventItem.region || "待补充")}</span>
          <span><strong>项目</strong>${escapeHtml(eventItem.project || "待补充")}</span>
          <span><strong>代表学校</strong>${escapeHtml(eventItem.school || "待补充")}</span>
          <span><strong>本人身份</strong>${escapeHtml(eventItem.role)}</span>
          <span><strong>成绩类型</strong>${escapeHtml(eventItem.finalResults.map(item => item.type).join("、") || "暂无")}</span>
        </div>
        <h4>本赛事比赛清单</h4>
        <div class="match-card-list">
          ${eventItem.matches.map(match => `
            <article class="match-mini-card result-${match.result}">
              <div><strong>${escapeHtml(match.round)}｜${escapeHtml(match.matchType)}</strong><span class="score-badge">${escapeHtml(match.score)}</span></div>
              ${match.partner ? `<p>搭档：${escapeHtml(match.partner)}</p>` : ""}
              <p>对手：${escapeHtml(match.opponent)}${match.opponentSchool ? `（${escapeHtml(match.opponentSchool)}）` : ""}</p>
              <p>结果：<span class="result-pill">${escapeHtml(match.result)}</span></p>
            </article>
          `).join("") || `<div class="empty-state compact">暂无本赛事具体对阵记录。</div>`}
        </div>
        <div class="career-summary">
          本赛事共出场 ${summary.totalMatches} 次，其中单打 ${summary.singlesMatches} 场、双打 ${summary.doublesMatches} 场，战绩为 ${summary.wins}胜${summary.losses}负。
          主要搭档：${escapeHtml(partnerText)}。
          ${summary.teamResult ? `所属团体最终成绩为${escapeHtml(summary.teamResult)}。` : ""}
          以上仅基于已导入数据。
        </div>
      </div>
    </details>
  `;
}

function renderPartnerCards(profile) {
  return profile.partners.map(item => `
    <article class="mini-profile-card">
      <strong>${escapeHtml(item.partner)}</strong>
      <span>组合：${escapeHtml(item.pairName || "待补充")}</span>
      <span>学校：${escapeHtml(item.school)}</span>
      <span>${item.eventCount}个合作赛事 / ${item.matchCount}场合作比赛</span>
      <span>最好成绩：${escapeHtml(item.best)}</span>
    </article>
  `).join("") || `<div class="empty-state compact">暂无双打搭档记录。</div>`;
}

function renderSchoolCards(profile) {
  return profile.schools.map(item => `
    <article class="mini-profile-card">
      <strong>${escapeHtml(item.school)}</strong>
      <span>涉及项目：${escapeHtml(item.project)}</span>
      <span>来源类型：${escapeHtml(item.sourceType)}</span>
      <span>出现次数：${item.count}</span>
    </article>
  `).join("") || `<div class="empty-state compact">学校信息待补充。</div>`;
}

function renderPersonalDetail(name) {
  const person = buildPersonalPlayers().find(item => item.name === name);
  if (!person) {
    $("#personalDetail").innerHTML = `<div class="empty-state">请选择一名个人选手查看卡片。</div>`;
    return;
  }
  const profile = buildPlayerProfile(person);
  const filters = selectedCareerFilters();
  const filteredEvents = filterCareerEvents(profile.events, filters);
  const debug = person.achievementDebug || { direct: 0, doubles: 0, team: 0, before: 0, after: 0, duplicates: [] };
  const duplicateRows = debug.duplicates.map(row => [row.type, row.event, row.levelName, row.region, row.project, row.rank, row.representedEntity]);
  $("#personalDetail").innerHTML = `
    <div class="panel-heading">
      <div><p class="eyebrow">选手卡片</p><h2>${escapeHtml(person.name)}</h2></div>
      <span class="tag">${escapeHtml(person.status[0] || "数据较少")}</span>
    </div>
    <section class="detail-block featured career-identity">
      <div class="object-summary">
        <span><strong>关联学校</strong>${escapeHtml(profile.summary.schools.join("、") || "待补充")}</span>
        <span><strong>参与项目</strong>${escapeHtml(profile.summary.projects.join("、") || "待补充")}</span>
        <span><strong>双打搭档</strong>${escapeHtml(profile.summary.partners.slice(0, 4).join("、") || "暂无")}</span>
        <span><strong>参加赛事</strong>${profile.summary.eventCount}个</span>
        <span><strong>比赛场次</strong>${profile.summary.matchCount}场</span>
        <span><strong>最好成绩</strong>${escapeHtml(profile.summary.bestAchievement || "待补充")}</span>
      </div>
      <div class="event-meta">${profile.summary.dataTags.map(tag => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>
    </section>
    <section class="detail-block">
      <div class="section-title-row"><h3>赛事履历</h3><span class="meta">${filteredEvents.length} / ${profile.events.length} 个赛事</span></div>
      ${renderCareerFilters(profile)}
      <div class="career-list">${filteredEvents.map(renderCareerEventCard).join("") || `<div class="empty-state">当前筛选下暂无赛事履历。</div>`}</div>
    </section>
    <section class="detail-block"><h3>双打搭档概览</h3><div class="mini-card-grid">${renderPartnerCards(profile)}</div></section>
    <section class="detail-block"><h3>学校经历</h3><div class="mini-card-grid">${renderSchoolCards(profile)}</div></section>
    <section class="detail-block"><h3>数据提示</h3>${profile.dataNotes.map(tip => `<p class="meta">${escapeHtml(tip)}</p>`).join("")}</section>
    ${isAdmin ? `<details class="detail-block admin-debug"><summary>管理员调试信息</summary>${renderTable(["项目", "数量"], [["原始成绩数", profile.debug.rawAchievements], ["原始对阵数", profile.debug.rawMatches], ["个人直接成绩", debug.direct], ["双打组合成绩", debug.doubles], ["团体关联成绩", debug.team], ["去重前成绩数", debug.before], ["去重后成绩数", debug.after], ["被去重数量", debug.duplicates.length], ["eventKey 数", profile.debug.eventKeys.length], ["matchKey 数", profile.debug.matchKeys.length]], "暂无调试信息。")}${renderTable(["成绩类型", "届次", "赛事类型", "赛区", "项目", "名次", "代表对象"], duplicateRows, "没有被去重的重复成绩。")}</details>` : ""}
  `;
  restoreCareerFilterValues(filters);
}

function compareModeLabel(mode = currentCompareMode) {
  return { singles: "单打对比", doubles: "双打对比", school: "团体对比" }[mode] || "赛前对比";
}

function compareTypeForMode(mode = currentCompareMode) {
  return { singles: "singles", doubles: "doubles", school: "school" }[mode] || "singles";
}

function compareOptions() {
  return getPlayers().filter(object => object.type === compareTypeForMode());
}

function directMatchesForObjects(a, b) {
  if (a.type === "school") {
    return a.teamMatches.filter(item => item.opponent === b.name);
  }
  return matches.filter(match => [match.playerA, match.playerB].includes(a.name) && [match.playerA, match.playerB].includes(b.name));
}

function opponentRecords(object) {
  const map = new Map();
  if (object.type === "school") {
    object.teamMatches.forEach(item => {
      if (!item.opponent) return;
      if (!map.has(item.opponent)) map.set(item.opponent, []);
      map.get(item.opponent).push({ result: item.result, score: item.totalScore, round: item.round, event: item.event });
    });
    return map;
  }
  object.matches.forEach(match => {
    const opponent = match.playerA === object.name ? match.playerB : match.playerA;
    if (!opponent) return;
    if (!map.has(opponent)) map.set(opponent, []);
    map.get(opponent).push({ result: matchResult(match, object.name), score: match.score, round: match.round, event: match.event });
  });
  return map;
}

function commonOpponentsForObjects(a, b) {
  const aRecords = opponentRecords(a);
  const bRecords = opponentRecords(b);
  return [...aRecords.keys()].filter(name => bRecords.has(name)).map(name => ({
    name,
    a: aRecords.get(name),
    b: bRecords.get(name)
  }));
}

function summarizeRecord(records = []) {
  if (!records.length) return "暂无";
  return records.slice(0, 2).map(record => `${record.result || "待确认"}，${record.score || "比分待补充"}`).join("；");
}

function bestByLevel(object, pattern) {
  return bestAchievement({ ...object, achievements: object.achievements.filter(item => pattern.test(item.levelName)) });
}

function renderCompareOptions() {
  const objects = compareOptions();
  const options = objects.map(object => `<option value="${escapeHtml(object.key)}">${escapeHtml(object.name)}</option>`).join("");
  $("#compareA").innerHTML = options;
  $("#compareB").innerHTML = options;
  if (objects.length >= 2) {
    $("#compareA").value = objects[0].key;
    $("#compareB").value = objects[1].key;
  }
  $("#compareResult").innerHTML = objects.length < 2
    ? `<div class="empty-state">当前数据不足，请先导入更多${escapeHtml(objectTypeLabel(compareTypeForMode()))}。</div>`
    : "";
  renderComparePreview();
}

function compareObjectCard(object, sideLabel) {
  if (!object) return `<article class="analysis-card"><strong>${sideLabel}</strong><span class="meta">请选择对象</span></article>`;
  const best = bestAchievement(object);
  const matchCount = object.type === "school" ? object.teamMatches.length : object.matches.length;
  return `
    <article class="analysis-card">
      <span class="tag">${escapeHtml(sideLabel)} · ${escapeHtml(object.kind)}</span>
      <h3>${escapeHtml(object.name)}</h3>
      <p class="meta">${escapeHtml(object.school || "学校待补充")}</p>
      <p>最好成绩：${best ? escapeHtml(formatBestAchievement(best)) : "待补充"}</p>
      <p class="meta">${object.achievements.length}条成绩 · ${matchCount}场对阵</p>
      <div class="event-meta">${dataStatusTags(object).map(tag => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `;
}

function renderComparePreview() {
  const controls = $(".compare-controls");
  if (!controls) return;
  let node = $("#comparePreview");
  if (!node) {
    controls.insertAdjacentHTML("beforeend", `<div class="vs-panel" id="comparePreview"></div>`);
    node = $("#comparePreview");
  }
  const objects = getPlayers();
  const a = objects.find(object => object.key === $("#compareA")?.value);
  const b = objects.find(object => object.key === $("#compareB")?.value);
  node.innerHTML = `${compareObjectCard(a, "对象 A")}<div class="vs-badge">VS</div>${compareObjectCard(b, "对象 B")}`;
}

function compareInfoRows(a, b) {
  const countA = a.type === "school" ? `${a.teamMatches.length} 场` : `${a.matches.length} 场`;
  const countB = b.type === "school" ? `${b.teamMatches.length} 场` : `${b.matches.length} 场`;
  return [
    ["名称", a.name, b.name],
    ["类型", a.kind, b.kind],
    ["学校", a.school || "待补充", b.school || "待补充"],
    ["项目", a.projects.join("、") || "待补充", b.projects.join("、") || "待补充"],
    ["最好成绩", bestAchievement(a) ? formatBestAchievement(bestAchievement(a)) : "待补充", bestAchievement(b) ? formatBestAchievement(bestAchievement(b)) : "待补充"],
    ["已录入成绩", `${a.achievements.length} 条`, `${b.achievements.length} 条`],
    [a.type === "school" ? "已录入团体对阵" : "已录入对阵", countA, countB],
    ["分场记录", `${a.teamDetails.length || 0} 条`, `${b.teamDetails.length || 0} 条`],
    ["数据状态", dataStatusTags(a).join("、"), dataStatusTags(b).join("、")]
  ];
}

function renderCompareHistoryRows(a, b) {
  const rows = [
    ["全国赛最好成绩", bestByLevel(a, /全国/) ? formatBestAchievement(bestByLevel(a, /全国/)) : "暂无", bestByLevel(b, /全国/) ? formatBestAchievement(bestByLevel(b, /全国/)) : "暂无"],
    ["分区赛最好成绩", bestByLevel(a, /分区/) ? formatBestAchievement(bestByLevel(a, /分区/)) : "暂无", bestByLevel(b, /分区/) ? formatBestAchievement(bestByLevel(b, /分区/)) : "暂无"],
    ["省赛最好成绩", bestByLevel(a, /省/) ? formatBestAchievement(bestByLevel(a, /省/)) : "暂无", bestByLevel(b, /省/) ? formatBestAchievement(bestByLevel(b, /省/)) : "暂无"]
  ];
  return renderTable(["指标", a.name, b.name], rows, "暂无成绩记录。");
}

function compareMatchRows(object) {
  if (object.type === "school") {
    return object.teamMatches.map(item => [object.name, item.event, item.levelName, item.project, item.round, item.opponent, item.totalScore, item.result]);
  }
  return object.matches.map(match => [object.name, match.event, match.levelName, match.project, match.round, match.playerA === object.name ? match.playerB : match.playerA, match.score, matchResult(match, object.name)]);
}

function renderTeamCompareBlock(a, b, direct) {
  const detailRows = a.teamDetails.filter(match => teamOpponent(match, a.name) === b.name).map(match => [
    baseRound(match),
    b.name,
    rubberName(match),
    match.teamA === a.name ? match.playerA : match.playerB,
    match.score,
    match.teamA === a.name ? match.playerB : match.playerA,
    teamSideResult(match, a.name)
  ]);
  const statRows = ["第一单打", "第二单打", "双打"].map(rubber => [rubber, rubberStat(a, rubber), rubberStat(b, rubber)]);
  return `
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">团体分场分析</p><h2>已录入分场数据</h2></div></div>
      <h3>团体直接交手</h3>
      ${renderTable(["届次", "赛事", "轮次", "团体 A", "总比分", "团体 B", "胜方"], direct.map(item => [item.event, item.levelName, item.round, a.name, item.totalScore, b.name, item.result === "胜" ? a.name : b.name]), "暂无团体直接交手记录。")}
      <h3>分场明细</h3>
      ${renderTable(["轮次", "对手学校", "分场", "本方选手", "比分", "对方选手", "分场胜方"], detailRows, "暂无团体分场记录。")}
      <h3>分场统计</h3>
      ${renderTable(["分场", `${a.name} 胜负`, `${b.name} 胜负`], statRows, "暂无可统计分场。")}
    </section>
  `;
}

function compareSummary(a, b, direct, common) {
  const aCount = a.type === "school" ? `${a.teamMatches.length} 场团体对阵、${a.teamDetails.length} 条分场` : `${a.matches.length} 场对阵`;
  const bCount = b.type === "school" ? `${b.teamMatches.length} 场团体对阵、${b.teamDetails.length} 条分场` : `${b.matches.length} 场对阵`;
  if (direct.length) {
    const first = direct[0];
    const winner = a.type === "school" ? (first.result === "胜" ? a.name : b.name) : first.winner;
    const score = a.type === "school" ? first.totalScore : first.score;
    return `根据已录入数据，${a.name}与${b.name}有 ${direct.length} 次直接交手，代表记录为${first.event}${first.round ? ` ${first.round}` : ""}，${winner || "胜方待确认"} ${score || "比分待补充"}。${a.name}当前有 ${a.achievements.length} 条成绩记录、${aCount}；${b.name}当前有 ${b.achievements.length} 条成绩记录、${bCount}。该结论仅基于已录入数据，不代表下一场比赛结果。`;
  }
  return `根据已录入数据，${a.name}与${b.name}暂无直接交手记录。${a.name}当前有 ${a.achievements.length} 条成绩记录、${aCount}；${b.name}当前有 ${b.achievements.length} 条成绩记录、${bCount}。${common.length ? `双方有 ${common.length} 个共同对手可作为事实参考。` : "双方暂无共同对手数据。"}由于数据量有限，本页面仅展示已录入事实，不判断下一场胜负。`;
}

function runCompare() {
  const objects = getPlayers();
  const a = objects.find(object => object.key === $("#compareA").value);
  const b = objects.find(object => object.key === $("#compareB").value);
  if (!a || !b || a.key === b.key) {
    $("#compareResult").innerHTML = `<div class="empty-state">请选择两个不同的同类型对象进行对比。</div>`;
    return;
  }
  if (a.type !== b.type || a.type !== compareTypeForMode()) {
    $("#compareResult").innerHTML = `<div class="empty-state">请选择两个同类型对象进行对比。</div>`;
    return;
  }
  const direct = directMatchesForObjects(a, b);
  const common = commonOpponentsForObjects(a, b);
  const directRows = a.type === "school"
    ? direct.map(item => [item.event, item.levelName, item.region, item.project, item.round, `${a.name} ${item.totalScore} ${b.name}`, item.result === "胜" ? a.name : b.name])
    : direct.map(match => [match.event, match.levelName, match.region || "", match.project || "", match.round || "", `${match.playerA} ${match.score} ${match.playerB}`, match.winner || "待确认"]);
  const commonRows = common.map(item => [item.name, summarizeRecord(item.a), summarizeRecord(item.b), item.a.length && item.b.length ? "双方均有记录" : "数据不足"]);
  const historyRows = [...compareMatchRows(a), ...compareMatchRows(b)];
  const aWins = a.type === "school"
    ? direct.filter(item => item.result === "胜").length
    : direct.filter(match => match.winner === a.name || matchResult(match, a.name) === "胜").length;
  const bWins = direct.length - aWins;
  const latestDirect = direct[0];
  $("#compareResult").innerHTML = `
    <section class="compare-card-grid">
      <article class="analysis-card"><span class="tag">直接交手</span><h3>${direct.length} 场</h3><p>${escapeHtml(a.name)} ${aWins} 胜 · ${escapeHtml(b.name)} ${Math.max(0, bWins)} 胜</p><p class="meta">最近：${latestDirect ? escapeHtml(`${latestDirect.event || ""} ${latestDirect.round || ""}`) : "暂无"}</p></article>
      <article class="analysis-card"><span class="tag">共同对手</span><h3>${common.length} 个</h3><p class="meta">${common.slice(0, 3).map(item => item.name).join("、") || "暂无共同对手"}</p></article>
      <article class="analysis-card"><span class="tag">成绩数量</span><h3>${a.achievements.length} : ${b.achievements.length}</h3><p class="meta">只统计已录入正式名次</p></article>
      <article class="analysis-card"><span class="tag">对阵数量</span><h3>${a.type === "school" ? a.teamMatches.length : a.matches.length} : ${b.type === "school" ? b.teamMatches.length : b.matches.length}</h3><p class="meta">单项赛与团体分场记录</p></article>
    </section>
    <details class="panel analysis-detail" open><summary>基础信息对比</summary>${renderTable(["指标", "对象 A", "对象 B"], compareInfoRows(a, b), "暂无基础信息。")}</details>
    <details class="panel analysis-detail"><summary>直接交手明细</summary>${renderTable(["届次", "赛事类型", "赛区", "项目", "轮次", a.type === "school" ? "总比分" : "比分", "胜方"], directRows, "暂无直接交手记录。可以参考双方成绩对比、共同对手和已录入对阵记录。")}</details>
    <details class="panel analysis-detail"><summary>共同对手明细</summary>${renderTable(["共同对手", "A 对该对象的记录", "B 对该对象的记录", "说明"], commonRows, "暂无共同对手数据。")}</details>
    <details class="panel analysis-detail"><summary>成绩与历史对阵</summary><h3>成绩对比</h3>${renderCompareHistoryRows(a, b)}<h3>对阵记录对比</h3>${renderTable(["对象", "届次", "赛事类型", "项目", "轮次", "对手", "比分", "结果"], historyRows, "暂无已录入对阵记录。")}</details>
    ${a.type === "school" ? renderTeamCompareBlock(a, b, direct) : ""}
    <section class="summary-box">${escapeHtml(compareSummary(a, b, direct, common))}</section>
  `;
}

function blankCorrectionRows(type = currentDataType, count = dataTypeConfig[type].rowsWhenBlank) {
  const config = dataTypeConfig[type];
  return Array.from({ length: count }, () => ({
    ...Object.fromEntries(config.columns.map(([key]) => [key, ""])),
    confidence: "待复核"
  }));
}

function normalizeRows(rows, type) {
  const config = dataTypeConfig[type];
  return (Array.isArray(rows) ? rows : []).map(row => {
    const normalized = {};
    config.columns.forEach(([key]) => {
      normalized[key] = String(row?.[key] ?? "").trim();
    });
    normalized.confidence = normalized.confidence || "已导入";
    return normalized;
  });
}

function parseDelimitedText(text) {
  const rows = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(line => line.split(line.includes("\t") ? "\t" : ",").map(cell => cell.trim()))
    .filter(row => row.some(Boolean));
  if (!rows.length) return [];
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header || `列${index + 1}`, values[index] || ""])));
}

function showBlankCorrectionTable() {
  renderCorrectionTable(blankCorrectionRows(currentDataType), currentDataType);
  setHint(`已显示“${dataTypeConfig[currentDataType].label}”空表。先读取文件或粘贴表格生成校对表，确认无误后再点击“确认无误，导入入库”。`);
}

function parsePastedTable() {
  if (!requireAdmin("粘贴导入仅管理员可用。如需补充数据，请提交数据补充申请。")) return;
  const text = $("#pasteTableInput").value.trim();
  if (!text) {
    showBlankCorrectionTable();
    return;
  }
  const rawRows = parseDelimitedText(text);
  const rows = normalizeRows(mapImportedRows(rawRows, currentDataType), currentDataType);
  if (!rows.length) {
    renderCorrectionTable(blankCorrectionRows(currentDataType), currentDataType);
    setHint("粘贴内容没有匹配到当前表头，请确认第一行包含模板字段名。", "warn");
    return;
  }
  renderCorrectionTable(rows, currentDataType);
  setHint(`已读取粘贴内容：生成 ${rows.length} 行校对数据。请先复核右侧表格，再点击“确认无误，导入入库”。`, "success");
}

function mapImportedRows(rawRows, type) {
  const config = dataTypeConfig[type];
  return rawRows.map(raw => {
    const row = {};
    config.columns.forEach(([field]) => {
      const aliases = fieldAliases[field] || [field];
      const matchKey = Object.keys(raw).find(key => aliases.some(alias => normalizeHeader(alias) === normalizeHeader(key)));
      row[field] = matchKey ? raw[matchKey] : "";
    });
    row.confidence = row.confidence || "已导入";
    return row;
  }).filter(row => Object.entries(row).some(([key, value]) => key !== "confidence" && String(value || "").trim()));
}

function renderCorrectionTable(rows = [], type = currentDataType) {
  currentCorrectionType = type;
  const config = dataTypeConfig[type];
  $("#correctionTable").innerHTML = `
    <thead><tr>${config.columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `
      <tr>
        ${config.columns.map(([key, , kind]) => {
          if (kind === "select") {
            return `<td><select data-field="${key}">${["已导入", "已校对", "待复核", "导入失败"].map(value => `<option ${row[key] === value ? "selected" : ""}>${value}</option>`).join("")}</select></td>`;
          }
          const list = ["rank1", "rank2", "rank3", "rank4", "playerA", "playerB", "winner"].includes(key) ? ` list="participantOptions"` : "";
          return `<td><input data-field="${key}"${list} value="${escapeHtml(row[key] || "")}"></td>`;
        }).join("")}
      </tr>
    `).join("")}</tbody>
  `;
}

function readCorrectionRows() {
  const config = dataTypeConfig[currentCorrectionType];
  return $$("#correctionTable tbody tr").map(tr => {
    const row = {};
    config.columns.forEach(([key]) => {
      const control = tr.querySelector(`[data-field="${key}"]`);
      row[key] = control ? control.value.trim() : "";
    });
    return row;
  });
}

async function renderImportPreview(file) {
  if (!requireAdmin("上传文件仅管理员可用。如需补充数据，请提交数据补充申请。")) {
    if ($("#importInput")) $("#importInput").value = "";
    return;
  }
  if (!file) {
    selectedImportFile = null;
    $("#mockPreview").textContent = "等待选择 Excel / CSV 文件";
    return;
  }
  selectedImportFile = {
    file,
    dataUrl: await fileToDataUrl(file),
    name: file.name || "未命名文件"
  };
  $("#mockPreview").innerHTML = `
    <div class="file-preview">
      <strong>${escapeHtml(selectedImportFile.name)}</strong>
      <span>${Math.max(1, Math.round(file.size / 1024))} KB</span>
    </div>
  `;
  setHint(`已选择文件。当前数据类型是“${dataTypeConfig[currentDataType].label}”，点击“读取文件，生成校对表”后再复核入库。`);
}

function sheetRows(importResult, sheetName) {
  return (importResult.sheets || []).find(sheet => sheet.name === sheetName)?.rows || [];
}

function sheetRowsAny(importResult, names) {
  for (const name of names) {
    const rows = sheetRows(importResult, name);
    if (rows.length) return rows;
  }
  return [];
}

function upsertByName(list, item) {
  if (!item.name) return;
  const existing = list.find(entry => entry.name === item.name);
  if (existing) Object.assign(existing, item);
  else list.push(item);
}

function splitDoublePlayers(name) {
  const parts = splitDoublesMembers(name);
  return [parts[0] || "", parts[1] || ""];
}

function cleanPersonalName(value) {
  const raw = String(value || "").trim();
  const school = raw.match(/[（(]([^（）()]+)[）)]/)?.[1] || "";
  const name = raw.replace(/[（(][^（）()]+[）)]/g, "").trim();
  return { name, school };
}

function isSchoolName(name) {
  const value = String(name || "").trim();
  return /大学|学院|学校|附中|中学|队$/.test(value) || schools.some(item => [item.name, item.school].filter(Boolean).includes(value));
}

function isPersonName(name) {
  const value = String(name || "").trim();
  return Boolean(value) && !isSchoolName(value) && !/第\d+名|第一单打|第二单打|双打|单打|团体|决赛|半决赛|赛区|全国赛/.test(value);
}

function personalNamesFrom(value) {
  const [first, second] = splitDoublePlayers(value);
  const names = (second ? [first, second] : [String(value || "")])
    .map(item => cleanPersonalName(item).name)
    .filter(isPersonName);
  return [...new Set(names)];
}

function isDoubleName(name) {
  const [player1, player2] = splitDoublePlayers(name);
  return Boolean(player1 && player2);
}

function inferMatchProject(row = {}) {
  const text = [row.rubber, row.division, row.project, row.playerA, row.playerB].join(" ");
  return /双打/.test(text) || isDoubleName(row.playerA) || isDoubleName(row.playerB) ? "双打" : "单打";
}

function upsertMatchSide(name, school, project) {
  if (!name) return;
  if (project === "双打") {
    const standardName = normalizeDoublesKey(name);
    const [player1, player2] = splitDoublePlayers(name);
    upsertByName(doubles, { name: standardName, player1, player2, school: school || "", project: "双打", aliases: standardName !== name ? [name] : [] });
  } else {
    upsertByName(singles, { name, school: school || "", project: "单打" });
  }
}

function hasPlayedScore(score) {
  const value = String(score || "").trim();
  if (!value) return false;
  return !["-", "--", "—", "未赛", "未出场", "未打"].includes(value);
}

function replaceNameReferences(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;
  events.forEach(event => {
    event.ranks = event.ranks.map(name => name === oldName ? newName : name);
    if (Array.isArray(event.rankSchools)) event.rankSchools = event.rankSchools.map(name => name === oldName ? newName : name);
    if (event.name === oldName) event.name = newName;
    if (event.region === oldName) event.region = newName;
    if (event.project === oldName) event.project = newName;
  });
  matches.forEach(match => {
    ["playerA", "playerB", "winner", "teamA", "teamB", "teamWinner", "schoolA", "schoolB", "winnerSchool"].forEach(key => {
      if (match[key] === oldName) match[key] = newName;
    });
  });
  schools.forEach(item => {
    if (item.name === oldName) item.name = newName;
    if (item.school === oldName) item.school = newName;
  });
  singles.forEach(item => {
    if (item.name === oldName) item.name = newName;
    if (item.school === oldName) item.school = newName;
  });
  doubles.forEach(item => {
    if (item.name === oldName) item.name = newName;
    if (item.player1 === oldName) item.player1 = newName;
    if (item.player2 === oldName) item.player2 = newName;
    if (item.school === oldName) item.school = newName;
  });
  participants.forEach(item => {
    if (item.name === oldName) item.name = newName;
    if (item.school === oldName) item.school = newName;
  });
  watchlist = watchlist.map(name => name === oldName ? newName : name);
}

function importLibrarySheets(importResult) {
  let count = 0;
  for (const row of sheetRowsAny(importResult, ["学校库"])) {
    upsertByName(schools, { name: row["学校对象"] || row["学校"], school: row["学校"] || row["学校对象"], project: row["项目"] || "团体" });
    count += 1;
  }
  for (const row of sheetRowsAny(importResult, ["单打选手库"])) {
    upsertByName(singles, { name: row["单打选手"], school: row["学校"], project: row["项目"] || "单打" });
    count += 1;
  }
  for (const row of sheetRowsAny(importResult, ["双打选手库"])) {
    const [player1, player2] = splitDoublePlayers(row["双打组合"]);
    upsertByName(doubles, { name: row["双打组合"], player1: row["选手1"] || player1, player2: row["选手2"] || player2, school: row["学校"], project: row["项目"] || "双打" });
    count += 1;
  }
  for (const row of sheetRowsAny(importResult, ["参赛对象库"])) {
    upsertByName(participants, { name: row["参赛对象"], type: row["对象类型"], school: row["学校"], project: row["项目"] });
    count += 1;
  }
  return count;
}

function importTemplateAchievements(importResult) {
  let count = 0;
  for (const row of sheetRowsAny(importResult, ["分区赛"])) {
    const ranks = [row["第1名"], row["第2名"], row["第3名"], row["第4名"]].filter(Boolean);
    if (!row["赛区"] || !ranks.length) continue;
    events.push({
      id: `regional-${Date.now()}-${count}`,
      name: `${row["届次"] || ""}${row["赛事阶段"] || "分区赛"} ${row["赛区"]}`.trim(),
      year: new Date().getFullYear(),
      level: "regional",
      levelName: row["赛事阶段"] || "分区赛",
      region: row["赛区"],
      project: row["项目"] || "团体",
      source: selectedImportFile?.name || "导入模板",
      ranks,
      rankSchools: ranks,
      rankDisplayLabels: ranks.map((_, index) => rankLabels[index] || `第${index + 1}名`)
    });
    count += 1;
  }

  const nationalGroups = new Map();
  for (const row of sheetRowsAny(importResult, ["全国赛"])) {
    const rank = row["名次"];
    if (!rank) continue;
    [
      { project: "团体", objectName: row["团体"], school: row["团体学校"] },
      { project: "双打", objectName: row["双打"], school: row["双打学校"] },
      { project: "单打", objectName: row["单打"], school: row["单打学校"] }
    ].forEach(item => {
      if (!item.objectName) return;
      const key = `${row["届次"] || ""}|${row["赛事阶段"] || "全国赛"}|${item.project}`;
      if (!nationalGroups.has(key)) {
        nationalGroups.set(key, {
          edition: row["届次"] || "",
          stage: row["赛事阶段"] || "全国赛",
          project: item.project,
          ranks: [],
          rankSchools: [],
          rankDisplayLabels: []
        });
      }
      const group = nationalGroups.get(key);
      group.ranks.push(item.objectName);
      group.rankSchools.push(item.school || "");
      group.rankDisplayLabels.push(`第${rank}名`);
      if (item.project === "团体") upsertByName(schools, { name: item.objectName, school: item.school || item.objectName, project: "团体" });
      if (item.project === "单打") upsertByName(singles, { name: item.objectName, school: item.school || "", project: "女子甲组单打" });
      if (item.project === "双打") {
        const [player1, player2] = splitDoublePlayers(item.objectName);
        upsertByName(doubles, { name: item.objectName, player1, player2, school: item.school || "", project: "女子甲组双打" });
      }
      count += 1;
    });
  }
  for (const group of nationalGroups.values()) {
    events.push({
      id: `final-${Date.now()}-${count}`,
      name: `${group.edition}${group.stage} ${group.project}`.trim(),
      year: new Date().getFullYear(),
      level: "final",
      levelName: group.stage,
      region: "全国",
      project: group.project,
      source: selectedImportFile?.name || "导入模板",
      ranks: group.ranks,
      rankSchools: group.rankSchools,
      rankDisplayLabels: group.rankDisplayLabels
    });
    count += 1;
  }

  return count;
}

function importTeamMatches(importResult) {
  const rows = sheetRowsAny(importResult, ["对阵表"]);
  if (!rows.length) return 0;
  let count = 0;
  rows.forEach(row => {
    const playerA = row["A方选手"];
    const playerB = row["B方选手"];
    const score = row["比分"];
    if (!playerA || !playerB || !hasPlayedScore(score)) return;
    const project = inferMatchProject({
      rubber: row["分场"],
      project: row["项目"],
      playerA,
      playerB
    });
    const match = {
      event: `${row["届次"] || ""}${row["赛事类型"] || ""} ${row["赛区"] || ""} ${row["项目"] || ""}`.trim(),
      year: new Date().getFullYear(),
      levelName: row["赛事类型"] || "分区赛",
      region: row["赛区"] || "",
      round: `${row["轮次"] || ""} ${row["分场"] || ""}`.trim(),
      rubber: row["分场"] || "",
      playerA,
      playerB,
      winner: row["分场胜方"] || "",
      score,
      confidence: "已导入",
      teamA: row["团体A"] || "",
      teamB: row["团体B"] || "",
      teamWinner: row["团体胜方"] || "",
      project
    };
    matches.push(match);
    upsertMatchSide(playerA, row["团体A"] || "", project);
    upsertMatchSide(playerB, row["团体B"] || "", project);
    count += 1;
  });
  return count;
}

function importIndividualMatches(importResult) {
  const rows = sheetRowsAny(importResult, ["单项对阵表", "单项对阵"]);
  if (!rows.length) return 0;
  let count = 0;
  rows.forEach(row => {
    const playerA = row["A方选手/组合"] || row["A方选手"];
    const playerB = row["B方选手/组合"] || row["B方选手"];
    const score = row["比分"];
    if (!playerA || !playerB || !hasPlayedScore(score)) return;
    const project = inferMatchProject({
      division: row["分项"],
      project: row["项目"],
      playerA,
      playerB
    });
    matches.push({
      event: `${row["届次"] || ""}${row["赛事类型"] || ""} ${row["赛区"] || ""} ${row["项目"] || ""}`.trim(),
      year: new Date().getFullYear(),
      levelName: row["赛事类型"] || "全国赛",
      region: row["赛区"] || "",
      round: row["轮次"] || "",
      playerA,
      playerB,
      winner: row["胜方"] || "",
      score,
      confidence: row["可信度"] || "已导入",
      schoolA: row["A方学校"] || "",
      schoolB: row["B方学校"] || "",
      winnerSchool: row["胜方学校"] || "",
      source: row["数据来源"] || selectedImportFile?.name || "单项对阵表",
      note: row["备注"] || "",
      project
    });
    upsertMatchSide(playerA, row["A方学校"] || "", project);
    upsertMatchSide(playerB, row["B方学校"] || "", project);
    count += 1;
  });
  return count;
}

function importTemplateWorkbook(importResult) {
  const knownSheets = ["分区赛", "全国赛", "参赛对象库", "学校库", "双打选手库", "单打选手库", "对阵表", "单项对阵表", "单项对阵"];
  if (!(importResult.sheets || []).some(sheet => knownSheets.includes(sheet.name))) return false;
  const before = createStateSnapshot();
  const libraryCount = importLibrarySheets(importResult);
  const achievementCount = importTemplateAchievements(importResult);
  const matchCount = importTeamMatches(importResult);
  const individualMatchCount = importIndividualMatches(importResult);
  const total = libraryCount + achievementCount + matchCount + individualMatchCount;
  finishImportBatch(
    before,
    "模板文件导入",
    selectedImportFile?.name || "模板文件",
    `新增/更新 ${libraryCount} 条库信息，${achievementCount} 条赛事成绩，${matchCount + individualMatchCount} 场个人对阵`,
    total
  );
  return true;
}

async function parseCurrentImportFile() {
  if (!requireAdmin("批量导入仅管理员可用。如需补充数据，请提交数据补充申请。")) return;
  const button = $("#mockRecognize");
  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = "解析中...";
  try {
    if (!selectedImportFile) {
      renderCorrectionTable(blankCorrectionRows(currentDataType), currentDataType);
      setHint(`还没有选择文件，已按“${dataTypeConfig[currentDataType].label}”生成空白校对表。`, "warn");
      return;
    }
    setHint("正在解析 Excel / CSV 文件，请稍等...");
    const response = await fetch("/api/import-spreadsheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: selectedImportFile.name, dataUrl: selectedImportFile.dataUrl })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `导入服务返回 ${response.status}`);
    if (importTemplateWorkbook(result)) return;
    const rows = normalizeRows(mapImportedRows(result.rows || [], currentDataType), currentDataType);
    if (!rows.length) {
      renderCorrectionTable(blankCorrectionRows(currentDataType), currentDataType);
      setHint("文件已读取，但没有匹配到当前数据类型的字段。请检查表头或切换数据类型。", "warn");
      return;
    }
    renderCorrectionTable(rows, currentDataType);
    setHint(`文件读取完成：已生成 ${rows.length} 行“${dataTypeConfig[currentDataType].label}”校对数据。请复核后点击“确认无误，导入入库”。`, "success");
  } catch (error) {
    renderCorrectionTable(blankCorrectionRows(currentDataType), currentDataType);
    setHint(`导入失败：${error.message}`, "error");
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

function saveCorrection() {
  if (!requireAdmin("确认入库仅管理员可用。如需补充数据，请提交数据补充申请。")) return;
  const rawRows = readCorrectionRows();
  const timestamp = Date.now();
  const before = createStateSnapshot();
  if (currentCorrectionType === "regional") {
    const rows = rawRows.map((row, index) => {
      const ranks = [row.rank1, row.rank2, row.rank3, row.rank4].filter(Boolean);
      return {
        id: `manual-${timestamp}-${index}`,
        name: `${row.edition || ""}${row.stage || "分区赛"} ${row.region || "未命名"}`.trim(),
        year: new Date().getFullYear(),
        level: row.stage === "全国赛" ? "final" : "regional",
        levelName: row.stage || "分区赛",
        region: row.region,
        project: row.project || "团体",
        source: selectedImportFile?.name || "分区赛校对页",
        ranks,
        rankSchools: ranks,
        rankDisplayLabels: ranks.map((_, rankIndex) => rankLabels[rankIndex] || `第${rankIndex + 1}名`)
      };
    }).filter(event => event.region && event.ranks.length);
    events = [...events, ...rows];
    finishImportBatch(before, "分区赛导入", selectedImportFile?.name || "校对表", `${rows.length} 条分区赛记录`, rows.length);
    return;
  }
  if (currentCorrectionType === "national") {
    const groups = new Map();
    rawRows.forEach(row => {
      [["团体", row.team, row.teamSchool], ["双打", row.doubles, row.doublesSchool], ["单打", row.single, row.singleSchool]].forEach(([project, objectName, school]) => {
        if (!objectName || !row.rank) return;
        const key = `${row.edition || ""}|${row.stage || "全国赛"}|${project}`;
        if (!groups.has(key)) {
          groups.set(key, { edition: row.edition || "", stage: row.stage || "全国赛", project, ranks: [], rankSchools: [], rankDisplayLabels: [] });
        }
        const group = groups.get(key);
        group.ranks.push(objectName);
        group.rankSchools.push(school || "");
        group.rankDisplayLabels.push(`第${row.rank}名`);
        if (project === "团体") upsertByName(schools, { name: objectName, school: school || objectName, project });
        if (project === "单打") upsertByName(singles, { name: objectName, school, project });
        if (project === "双打") {
          const [player1, player2] = splitDoublePlayers(objectName);
          upsertByName(doubles, { name: objectName, player1, player2, school, project });
        }
      });
    });
    let count = 0;
    for (const group of groups.values()) {
      events.push({
        id: `manual-national-${timestamp}-${count}`,
        name: `${group.edition}${group.stage} ${group.project}`.trim(),
        year: new Date().getFullYear(),
        level: "final",
        levelName: group.stage,
        region: "全国",
        project: group.project,
        source: selectedImportFile?.name || "全国赛校对页",
        ranks: group.ranks,
        rankSchools: group.rankSchools,
        rankDisplayLabels: group.rankDisplayLabels
      });
      count += 1;
    }
    finishImportBatch(before, "全国赛导入", selectedImportFile?.name || "校对表", `${count} 条全国赛记录`, count);
    return;
  }
  if (currentCorrectionType === "teamMatches") {
    let count = 0;
    rawRows.forEach(row => {
      if (!row.playerA || !row.playerB || !hasPlayedScore(row.score)) return;
      const project = inferMatchProject(row);
      matches.push({
        event: `${row.edition || ""}${row.eventType || ""} ${row.region || ""} ${row.project || ""}`.trim(),
        year: new Date().getFullYear(),
        levelName: row.eventType || "分区赛",
        region: row.region || "",
        round: `${row.round || ""} ${row.rubber || ""}`.trim(),
        rubber: row.rubber || "",
        playerA: row.playerA,
        playerB: row.playerB,
        winner: row.winner,
        score: row.score,
        confidence: row.confidence || "已导入",
        teamA: row.teamA,
        teamB: row.teamB,
        teamWinner: row.teamWinner,
        project
      });
      upsertMatchSide(row.playerA, row.teamA || "", project);
      upsertMatchSide(row.playerB, row.teamB || "", project);
      count += 1;
    });
    finishImportBatch(before, "团体对阵导入", selectedImportFile?.name || "校对表", `${count} 场个人对阵记录`, count);
    return;
  }
  if (currentCorrectionType === "individualMatches") {
    let count = 0;
    rawRows.forEach(row => {
      if (!row.playerA || !row.playerB || !hasPlayedScore(row.score)) return;
      const project = inferMatchProject(row);
      matches.push({
        event: `${row.edition || ""}${row.eventType || ""} ${row.region || ""} ${row.project || ""}`.trim(),
        year: new Date().getFullYear(),
        levelName: row.eventType || "全国赛",
        region: row.region || "",
        round: row.round || "",
        playerA: row.playerA,
        playerB: row.playerB,
        winner: row.winner,
        score: row.score,
        confidence: row.confidence || "已导入",
        seedA: row.seedA,
        seedB: row.seedB,
        schoolA: row.schoolA,
        schoolB: row.schoolB,
        winnerSchool: row.winnerSchool,
        source: row.sourcePage || selectedImportFile?.name || "单项对阵校对页",
        note: row.note,
        project
      });
      upsertMatchSide(row.playerA, row.schoolA || "", project);
      upsertMatchSide(row.playerB, row.schoolB || "", project);
      count += 1;
    });
    finishImportBatch(before, "单项对阵导入", selectedImportFile?.name || "校对表", `${count} 场单项对阵记录`, count);
    return;
  }
  const rows = rawRows.map(row => ({
    name: row.participant,
    type: row.objectType,
    school: row.school,
    project: row.project
  })).filter(row => row.name);
  rows.forEach(row => upsertByName(participants, row));
  finishImportBatch(before, "参赛对象导入", selectedImportFile?.name || "校对表", `${rows.length} 条参赛对象记录`, rows.length);
}

function libraryRows() {
  if (currentLibraryTab === "schools") return schools;
  if (currentLibraryTab === "singles") return singles;
  if (currentLibraryTab === "doubles") return doubles;
  return participants;
}

function libraryColumns() {
  if (currentLibraryTab === "schools") return [["name", "学校对象"], ["school", "学校"], ["project", "项目"]];
  if (currentLibraryTab === "singles") return [["name", "单打选手"], ["school", "学校"], ["project", "项目"]];
  if (currentLibraryTab === "doubles") return [["name", "双打组合"], ["player1", "选手1"], ["player2", "选手2"], ["school", "学校"], ["project", "项目"]];
  return [["name", "参赛对象"], ["type", "对象类型"], ["school", "学校"], ["project", "项目"]];
}

function updateSchoolOptions() {
  $("#schoolOptions").innerHTML = schools.map(item => `<option value="${escapeHtml(item.school || item.name)}"></option>`).join("");
  const names = [
    ...schools.map(item => item.name),
    ...singles.map(item => item.name),
    ...doubles.map(item => item.name),
    ...participants.map(item => item.name)
  ].filter(Boolean);
  $("#participantOptions").innerHTML = [...new Set(names)].map(name => `<option value="${escapeHtml(name)}"></option>`).join("");
}

function renderLibraryTable() {
  if (!$("#libraryTable")) {
    renderGovernance();
    return;
  }
  const rows = libraryRows();
  const columns = libraryColumns();
  $("#libraryTable").innerHTML = `
    <thead><tr>${columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}<th>操作</th></tr></thead>
    <tbody>${rows.map((row, index) => `
      <tr data-library-index="${index}">
        ${columns.map(([key]) => `<td><input data-library-field="${key}" data-previous-value="${escapeHtml(row[key] || "")}" value="${escapeHtml(row[key] || "")}"></td>`).join("")}
        <td><button class="remove-button" data-library-delete="${index}">删除</button></td>
      </tr>
    `).join("")}</tbody>
  `;
  updateSchoolOptions();
}

function objectReferenceCounts(name) {
  const achievementCount = allAchievements().filter(item => item.player === name || item.school === name).length;
  const matchCount = matches.filter(match => [match.playerA, match.playerB, match.winner, match.teamA, match.teamB, match.teamWinner, match.schoolA, match.schoolB, match.winnerSchool].includes(name)).length;
  return { achievementCount, matchCount };
}

function governanceRows() {
  const label = currentLibraryTab === "schools" ? "学校库" : currentLibraryTab === "singles" ? "单打库" : "双打库";
  return libraryRows().map((row, index) => ({ ...row, index, label, counts: objectReferenceCounts(row.name) }));
}

function renderObjectManagement() {
  const rows = governanceRows();
  return `
    <div class="governance-panel">
      <div class="segmented compact-tabs">
        <button class="segment ${currentLibraryTab === "schools" ? "active" : ""}" data-library-tab="schools">学校库</button>
        <button class="segment ${currentLibraryTab === "singles" ? "active" : ""}" data-library-tab="singles">单打库</button>
        <button class="segment ${currentLibraryTab === "doubles" ? "active" : ""}" data-library-tab="doubles">双打库</button>
      </div>
      <div class="governance-form">
        <label>对象类型
          <select id="libraryType">
            <option value="school">学校 / 团体</option>
            <option value="single">单打选手</option>
            <option value="double">双打组合</option>
          </select>
        </label>
        <label>标准名称
          <input id="libraryName" placeholder="例如：同济大学 / 金晓雅 / 金晓雅 / 龙凌洁">
        </label>
        <label>学校
          <input id="librarySchool" list="schoolOptions" placeholder="可从已有学校中选择">
        </label>
        <label>项目
          <input id="libraryProject" placeholder="例如：女子甲组单打">
        </label>
        <button class="primary-button" id="addLibraryItem">加入对象库</button>
      </div>
      <div class="editable-table-wrap">
        <table class="editable-table">
          <thead><tr><th>库</th><th>标准名称</th><th>别名</th><th>学校</th><th>项目</th><th>关联成绩数</th><th>关联对阵数</th><th>操作</th></tr></thead>
          <tbody>${rows.map(row => `
            <tr data-library-index="${row.index}">
              <td>${escapeHtml(row.label)}</td>
              <td><input data-library-field="name" data-previous-value="${escapeHtml(row.name || "")}" value="${escapeHtml(row.name || "")}"></td>
              <td><input data-library-field="aliases" value="${escapeHtml((row.aliases || []).join("、"))}" placeholder="别名，用、分隔"></td>
              <td><input data-library-field="school" value="${escapeHtml(row.school || "")}"></td>
              <td><input data-library-field="project" value="${escapeHtml(row.project || "")}"></td>
              <td>${row.counts.achievementCount}</td>
              <td>${row.counts.matchCount}</td>
              <td><button class="ghost-button" data-merge-from="${escapeHtml(row.name || "")}">合并</button><button class="remove-button" data-disable-object="${row.index}">禁用</button></td>
            </tr>
          `).join("") || `<tr><td colspan="8" class="empty-state">暂无对象。</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
}

function mergePreview(sources, target) {
  const sourceSet = new Set(sources);
  const affectedAchievements = allAchievements().filter(item => sourceSet.has(item.player) || sourceSet.has(item.school)).length;
  const affectedMatches = matches.filter(match => [match.playerA, match.playerB, match.winner, match.teamA, match.teamB, match.teamWinner, match.schoolA, match.schoolB, match.winnerSchool].some(value => sourceSet.has(value))).length;
  return { affectedAchievements, affectedMatches, affectedObjects: sources.length, target };
}

function dedupeByName(list) {
  const map = new Map();
  list.forEach(item => {
    if (!item.name) return;
    if (!map.has(item.name)) map.set(item.name, { ...item });
    else map.set(item.name, { ...map.get(item.name), ...item, aliases: [...new Set([...(map.get(item.name).aliases || []), ...(item.aliases || [])])] });
  });
  return [...map.values()];
}

function confirmNameMerge() {
  if (!requireAdmin("名称合并仅管理员可用。")) return;
  const sources = $("#mergeSources").value.split(/[、,\n]/).map(item => item.trim()).filter(Boolean);
  const target = $("#mergeTarget").value.trim();
  if (!sources.length || !target) {
    alert("请填写待合并名称和标准名称。");
    return;
  }
  const preview = mergePreview(sources, target);
  if (!confirm(`确认合并 ${sources.join("、")} 到 ${target}？将影响 ${preview.affectedAchievements} 条成绩、${preview.affectedMatches} 条对阵。`)) return;
  const before = JSON.stringify(preview);
  sources.filter(name => name !== target).forEach(name => replaceNameReferences(name, target));
  [schools, singles, doubles, participants].forEach(list => {
    list.forEach(item => {
      if (sources.includes(item.name) && item.name !== target) {
        item.aliases = [...new Set([...(item.aliases || []), item.name])];
        item.name = target;
      }
    });
  });
  schools = dedupeByName(schools);
  singles = dedupeByName(singles);
  doubles = dedupeByName(doubles);
  participants = dedupeByName(participants);
  logOperation("合并", target, before, JSON.stringify({ sources, target }), "全量引用级联更新");
  setupFilters();
  refreshAll();
  saveState();
  setSaveStatus("名称合并完成，已自动保存");
}

function renderMergePanel() {
  return `
    <div class="governance-panel">
      <div class="governance-form">
        <label class="wide-field">待合并对象
          <textarea id="mergeSources" placeholder="每行一个名称，或用顿号/逗号分隔"></textarea>
        </label>
        <label>标准名称
          <input id="mergeTarget" list="participantOptions" placeholder="合并后的标准名称">
        </label>
        <button class="primary-button" id="confirmMerge">确认合并并级联更新</button>
      </div>
      <div class="permission-note">合并会更新 events、matches、schools、singles、doubles、participants，并重新生成参赛对象库、选手卡片和对阵分析索引。</div>
    </div>
  `;
}

function renderCorrectionRequests() {
  const rows = correctionRequests.map((item, index) => `
    <tr>
      <td><select data-request-status="${index}"><option ${item.status === "待处理" ? "selected" : ""}>待处理</option><option ${item.status === "已接受" ? "selected" : ""}>已接受</option><option ${item.status === "已拒绝" ? "selected" : ""}>已拒绝</option><option ${item.status === "已完成" ? "selected" : ""}>已完成</option></select></td>
      <td>${escapeHtml(item.time)}</td>
      <td>${escapeHtml(item.issueType)}</td>
      <td>${escapeHtml(item.page)}</td>
      <td>${escapeHtml(item.objectName)}</td>
      <td>${escapeHtml(item.note || item.correct || "")}</td>
      <td><button class="ghost-button" data-request-complete="${index}">标记完成</button><button class="remove-button" data-request-reject="${index}">拒绝</button></td>
    </tr>
  `).join("");
  return `<div class="editable-table-wrap"><table class="editable-table"><thead><tr><th>状态</th><th>提交时间</th><th>问题类型</th><th>关联页面</th><th>关联对象</th><th>用户说明</th><th>操作</th></tr></thead><tbody>${rows || `<tr><td colspan="7" class="empty-state">暂无修正申请。</td></tr>`}</tbody></table></div>`;
}

function renderImportRecords() {
  const rows = importHistory.map(item => `
    <tr>
      <td>${escapeHtml(item.time)}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.summary)}</td>
      <td>管理员</td>
      <td>已导入</td>
      <td><button class="ghost-button" data-undo-import="${escapeHtml(item.id)}">撤销</button></td>
    </tr>
  `).join("");
  return `<div class="editable-table-wrap"><table class="editable-table"><thead><tr><th>导入时间</th><th>导入类型</th><th>导入数量</th><th>操作者</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="empty-state">暂无导入记录。</td></tr>`}</tbody></table></div>`;
}

function findSuspiciousData() {
  const rows = [];
  const addDuplicate = (label, list) => {
    const names = list.map(item => item.name).filter(Boolean);
    names.forEach(name => {
      const similar = names.filter(other => other !== name && other.replace(/\s+/g, "") === name.replace(/\s+/g, ""));
      if (similar.length) rows.push([`疑似重复${label}`, name, `可能与 ${similar.join("、")} 重复`, "合并"]);
    });
  };
  addDuplicate("学校", schools);
  addDuplicate("选手", singles);
  addDuplicate("双打组合", doubles);
  const doublesGroups = new Map();
  [...doubles.map(item => item.name), ...participants.filter(item => objectTypeFrom(item) === "doubles").map(item => item.name), ...matches.flatMap(match => [match.playerA, match.playerB]).filter(isDoubleName)].filter(Boolean).forEach(name => {
    const key = normalizeDoublesKey(name);
    if (!doublesGroups.has(key)) doublesGroups.set(key, new Set());
    doublesGroups.get(key).add(name);
  });
  doublesGroups.forEach((names, key) => {
    if (names.size > 1) rows.push(["疑似重复双打组合", [...names].join("、"), `已标准化为 ${key}`, "合并"]);
  });
  doublesGroups.forEach((names, key) => {
    const schoolsForPair = new Set();
    doubles.filter(item => normalizeDoublesKey(item.name) === key).forEach(item => item.school && schoolsForPair.add(item.school));
    matches.forEach(match => {
      if (normalizeDoublesKey(match.playerA) === key && match.schoolA) schoolsForPair.add(match.schoolA);
      if (normalizeDoublesKey(match.playerB) === key && match.schoolB) schoolsForPair.add(match.schoolB);
    });
    if (schoolsForPair.size > 1) rows.push(["同一双打组合多个学校", key, [...schoolsForPair].join("、"), "检查"]);
  });
  doubles.filter(item => item.name && !item.name.includes("/") && !item.name.includes("／")).forEach(item => rows.push(["双打组合格式不统一", item.name, "建议使用 A / B", "编辑"]));
  [...singles, ...doubles].filter(item => !item.school).forEach(item => rows.push(["学校缺失", item.name, "对象缺少学校字段", "编辑"]));
  matches.filter(item => !item.score || item.score === "-").forEach(item => rows.push(["比分为空", `${item.playerA} vs ${item.playerB}`, item.event, "编辑"]));
  matches.filter(item => !item.winner).forEach(item => rows.push(["胜方缺失", `${item.playerA} vs ${item.playerB}`, item.score || item.event, "编辑"]));
  buildPersonalPlayers().filter(person => person.achievements.length > 12).forEach(person => rows.push(["选手卡片成绩异常偏高", person.name, `${person.achievements.length} 条成绩`, "检查"]));
  ["第一单打", "第二单打", "双打"].forEach(bad => {
    if (singles.some(item => item.name === bad)) rows.push(["字段被误识别成人名", bad, "应作为分场字段", "编辑"]);
  });
  return rows;
}

function renderSuspiciousPanel() {
  return renderTable(["类型", "对象", "说明", "建议操作"], findSuspiciousData(), "暂无可疑数据。");
}

function renderOperationLogs() {
  const rows = operationLogs.map(item => [item.time, item.operator, item.type, item.objectName, item.before, item.after, item.scope]);
  return renderTable(["时间", "操作者", "操作类型", "修改对象", "修改前", "修改后", "影响范围"], rows, "暂无操作日志。");
}

function renderGovernance() {
  const panel = $("#governancePanel");
  if (!panel) return;
  if (!isAdmin) {
    renderAuthState();
    return;
  }
  const content = {
    objects: renderObjectManagement,
    merge: renderMergePanel,
    requests: renderCorrectionRequests,
    imports: renderImportRecords,
    suspicious: renderSuspiciousPanel,
    logs: renderOperationLogs
  }[activeGovernanceTab]?.() || "";
  panel.innerHTML = content;
  updateSchoolOptions();
}

function addLibraryItem() {
  if (!requireAdmin("对象管理仅管理员可用。")) return;
  const type = $("#libraryType").value;
  const name = $("#libraryName").value.trim();
  const school = $("#librarySchool").value.trim();
  const project = $("#libraryProject").value.trim();
  if (!name) {
    alert("请先填写名称。");
    return;
  }
  if (type === "school") {
    upsertByName(schools, { name, school: school || name, project: project || "团体" });
    upsertByName(participants, { name, type: "团体", school: school || name, project: project || "团体" });
    currentLibraryTab = "schools";
  } else if (type === "single") {
    upsertByName(singles, { name, school, project: project || "单打" });
    upsertByName(participants, { name, type: "单打", school, project: project || "单打" });
    currentLibraryTab = "singles";
  } else {
    const [player1 = "", player2 = ""] = splitDoublePlayers(name);
    upsertByName(doubles, { name, player1, player2, school, project: project || "双打" });
    upsertByName(participants, { name, type: "双打", school, project: project || "双打" });
    currentLibraryTab = "doubles";
  }
  $("#libraryName").value = "";
  $("#librarySchool").value = "";
  $("#libraryProject").value = "";
  logOperation("编辑", name, "", JSON.stringify({ type, name, school, project }), "手动加入对象库");
  refreshAll();
  saveState();
}

function renderImportHistory() {
  const node = $("#importHistoryList");
  if (!node) return;
  node.innerHTML = importHistory.length ? importHistory.map(item => `
    <article class="import-history-item">
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.summary)}</span>
        <small>${escapeHtml(item.time)} · ${escapeHtml(item.source)}</small>
      </div>
      <button class="remove-button" data-undo-import="${escapeHtml(item.id)}">撤销本次导入</button>
    </article>
  `).join("") : `<div class="empty-state compact">暂无导入记录。确认入库后会在这里生成可撤销记录。</div>`;
}

function undoImportBatch(id) {
  if (!requireAdmin("撤销导入仅管理员可用。")) return;
  const index = importHistory.findIndex(item => item.id === id);
  if (index < 0) return;
  const item = importHistory[index];
  const message = index === 0
    ? `确定撤销“${item.label}”吗？本次导入产生的数据会整体回到导入前。`
    : `确定撤销“${item.label}”吗？这会回到该次导入前，并同时移除它之后的导入变更。`;
  if (!confirm(message)) return;
  restoreStateSnapshot(item.before);
  importHistory = importHistory.slice(index + 1);
  logOperation("撤销", item.label, JSON.stringify(item.summary), "已恢复到导入前快照", "events/matches/participants/schools/singles/doubles");
  setupFilters();
  refreshAll();
  renderImportHistory();
  saveState();
  setSaveStatus("已撤销并自动保存");
  setHint(`已撤销“${item.label}”。`, "success");
}

function openCorrectionModal(overrides = {}) {
  const modal = $("#correctionModal");
  if (!modal) return;
  $("#correctionIssueType").value = overrides.issueType || "其他";
  $("#correctionPage").value = overrides.page || visibleViewTitle();
  $("#correctionObject").value = overrides.objectName || overrides.context || selectedContextText();
  $("#correctionLocation").value = overrides.location || "";
  $("#correctionCurrent").value = overrides.current || selectedContextText();
  $("#correctionCorrect").value = overrides.correct || "";
  $("#correctionNote").value = overrides.note || "";
  $("#correctionFile").value = "";
  $("#correctionContact").value = "";
  modal.hidden = false;
}

function closeCorrectionModal() {
  const modal = $("#correctionModal");
  if (modal) modal.hidden = true;
}

function submitCorrectionRequest() {
  const item = {
    id: `request-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    status: "待处理",
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    issueType: $("#correctionIssueType").value,
    page: $("#correctionPage").value.trim(),
    objectName: $("#correctionObject").value.trim(),
    location: $("#correctionLocation").value.trim(),
    current: $("#correctionCurrent").value.trim(),
    correct: $("#correctionCorrect").value.trim(),
    note: $("#correctionNote").value.trim(),
    file: $("#correctionFile").value.trim(),
    contact: $("#correctionContact").value.trim()
  };
  correctionRequests.unshift(item);
  logOperation("处理申请", item.objectName || item.page, "", JSON.stringify(item), "访客提交修正申请");
  saveState();
  closeCorrectionModal();
  renderGovernance();
  setSaveStatus("修正申请已提交");
  alert("修正申请已提交，管理员会在库管理中处理。");
}

function finishImportBatch(before, label, source, summary, count) {
  setupFilters();
  refreshAll();
  if (count > 0) {
    recordImportBatch({ before, label, source, summary });
    logOperation("导入", label, "", summary, source);
    setSaveStatus("导入成功，已自动保存");
    setHint(`导入成功：${summary}。已生成导入记录，可在左侧撤销整次导入。`, "success");
  } else {
    setHint("没有可入库的数据，请检查校对表是否为空。", "warn");
  }
  saveState();
}

function toCsv(rows) {
  return rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

function downloadCsv(filename, rows) {
  const blob = new Blob(["\ufeff" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAll() {
  const rows = [["类型", "名称", "年份", "级别", "赛区", "项目", "名次/轮次", "对象", "来源"]];
  allAchievements().forEach(item => rows.push(["成绩", item.event, item.year, item.levelName, item.region, item.project, item.rank, `${item.player} ${item.school || ""}`.trim(), item.source]));
  matches.forEach(match => rows.push(["对阵", match.event, match.year, match.levelName, "", "单打", match.round, `${match.playerA} vs ${match.playerB} ${match.score} 胜者:${match.winner}`, match.confidence]));
  downloadCsv("tennis-scout-data.csv", rows);
}

function refreshAll() {
  renderAuthState();
  renderMetrics();
  renderRegionalPreview();
  renderNationalBoard();
  renderEvents();
  renderPlayers();
  renderPersonalCards();
  renderCompareOptions();
  renderLibraryTable();
  renderImportHistory();
  runCompare();
  renderAuthState();
}

function bindEvents() {
  $$(".nav-item").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
  $$("[data-view-jump]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.viewJump)));
  $("#adminToggle").addEventListener("click", () => {
    if (isAdmin) {
      isAdmin = false;
      setSaveStatus("已退出管理员模式");
      refreshAll();
      return;
    }
    const password = prompt("请输入管理员密码");
    if (password === adminPassword) {
      isAdmin = true;
      setSaveStatus("已进入管理员模式");
      refreshAll();
    } else if (password !== null) {
      alert("管理员密码错误。");
    }
  });
  $("#openCorrection").addEventListener("click", () => openCorrectionModal());
  $("#closeCorrection").addEventListener("click", closeCorrectionModal);
  $("#cancelCorrection").addEventListener("click", closeCorrectionModal);
  $("#submitCorrectionRequest").addEventListener("click", submitCorrectionRequest);
  $("#closeDetailModal").addEventListener("click", closeDetailModal);
  $("#detailModal").addEventListener("click", event => {
    if (event.target.id === "detailModal") closeDetailModal();
  });
  $("#correctionModal").addEventListener("click", event => {
    if (event.target.id === "correctionModal") closeCorrectionModal();
  });
  $$("[data-shot-type]").forEach(button => button.addEventListener("click", () => {
    $$("[data-shot-type]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentDataType = button.dataset.shotType;
    $("#typeHelp").textContent = dataTypeConfig[currentDataType].help;
    showBlankCorrectionTable();
    if (!selectedImportFile) {
      $("#mockPreview").textContent = `等待选择 ${dataTypeConfig[currentDataType].label} 的 Excel / CSV 文件`;
    } else {
      setHint(`已切换为“${dataTypeConfig[currentDataType].label}”。点击“读取文件，生成校对表”会按这个类型整理。`);
    }
  }));
  $("#globalSearch").addEventListener("input", event => {
    searchText = event.target.value.trim();
    renderRegionalPreview();
    renderNationalBoard();
    renderEvents();
    renderPlayers();
    renderPersonalCards();
  });
  ["eventYearFilter", "eventLevelFilter", "eventRegionFilter", "eventProjectFilter"].forEach(id => $(`#${id}`).addEventListener("change", renderEvents));
  $("#eventGrid").addEventListener("input", event => {
    if (!requireAdmin("赛事库为查看页，请到库管理中处理修改。")) return;
    const card = event.target.closest("[data-event-id]");
    if (!card) return;
    const item = events.find(entry => entry.id === card.dataset.eventId);
    if (!item) return;
    const fieldInput = event.target.closest("[data-event-field]");
    const rankInput = event.target.closest("[data-event-rank]");
    if (fieldInput) {
      item[fieldInput.dataset.eventField] = fieldInput.value;
      if (fieldInput.dataset.eventField === "levelName") item.level = fieldInput.value.includes("全国") ? "final" : "regional";
    }
    if (rankInput) {
      item.ranks[Number(rankInput.dataset.eventRank)] = rankInput.value;
      item.ranks = item.ranks.map(value => value || "").filter((value, index, array) => value || index < 4 || array.slice(index + 1).some(Boolean));
    }
    setupFilters();
    renderRegionalPreview();
    renderPlayers();
    renderCompareOptions();
    saveState();
  });
  $("#eventGrid").addEventListener("click", event => {
    const detailButton = event.target.closest("[data-event-detail]");
    if (detailButton) {
      openEventDetail(detailButton.dataset.eventDetail);
      return;
    }
    const feedback = event.target.closest("[data-open-correction]");
    if (feedback) {
      openCorrectionModal({ context: feedback.dataset.context || selectedContextText() });
      return;
    }
    const button = event.target.closest("[data-event-delete]");
    if (!button) return;
    if (!requireAdmin("赛事库不再直接删除赛事，请到库管理处理。")) return;
    events = events.filter(item => item.id !== button.dataset.eventDelete);
    setupFilters();
    refreshAll();
    saveState();
  });
  ["playerProjectFilter", "playerLevelFilter"].forEach(id => $(`#${id}`).addEventListener("change", renderPlayers));
  $$("[data-object-type]").forEach(button => button.addEventListener("click", () => {
    $$("[data-object-type]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentObjectType = button.dataset.objectType;
    selectedPlayer = "";
    renderPlayers();
  }));
  $("#playerList").addEventListener("click", event => {
    const row = event.target.closest("[data-player]");
    if (!row) return;
    selectedPlayer = row.dataset.player;
    renderPlayers();
  });
  ["personalSearch", "personalSchoolFilter", "personalProjectFilter", "personalStatusFilter", "personalLevelFilter"].forEach(id => {
    const node = $(`#${id}`);
    node.addEventListener(id === "personalSearch" ? "input" : "change", renderPersonalCards);
  });
  $("#personalList").addEventListener("click", event => {
    const row = event.target.closest("[data-personal-player]");
    if (!row) return;
    selectedPersonalPlayer = row.dataset.personalPlayer;
    renderPersonalCards();
  });
  $("#runCompare").addEventListener("click", runCompare);
  ["compareA", "compareB"].forEach(id => $(`#${id}`).addEventListener("change", renderComparePreview));
  $$("[data-compare-mode]").forEach(button => button.addEventListener("click", () => {
    $$("[data-compare-mode]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentCompareMode = button.dataset.compareMode;
    renderCompareOptions();
  }));
  $("#importInput").addEventListener("change", event => renderImportPreview(event.target.files[0]));
  $("#mockRecognize").addEventListener("click", parseCurrentImportFile);
  $("#parsePastedTable").addEventListener("click", parsePastedTable);
  $("#pasteTableInput").addEventListener("paste", () => setTimeout(parsePastedTable, 0));
  $("#saveCorrection").addEventListener("click", saveCorrection);
  $("#importHistoryList").addEventListener("click", event => {
    const button = event.target.closest("[data-undo-import]");
    if (!button) return;
    undoImportBatch(button.dataset.undoImport);
  });
  document.addEventListener("click", event => {
    const correctionButton = event.target.closest("[data-open-correction]");
    if (correctionButton) {
      openCorrectionModal({ context: correctionButton.dataset.context || selectedContextText() });
      return;
    }
    const jumpButton = event.target.closest("[data-view-jump]");
    if (jumpButton) {
      switchView(jumpButton.dataset.viewJump);
      return;
    }
    const dashboardEditionButton = event.target.closest("[data-dashboard-edition]");
    if (dashboardEditionButton) {
      dashboardEdition = dashboardEditionButton.dataset.dashboardEdition || "";
      renderRegionalPreview();
      renderNationalBoard();
      return;
    }
    const scrollButton = event.target.closest("[data-scroll-target]");
    if (scrollButton) {
      const target = $(`#${scrollButton.dataset.scrollTarget}`);
      if (target) target.scrollBy({ left: Number(scrollButton.dataset.scrollDir || 1) * 360, behavior: "smooth" });
      return;
    }
    const governanceTab = event.target.closest("[data-governance-tab]");
    if (governanceTab) {
      activeGovernanceTab = governanceTab.dataset.governanceTab;
      $$("[data-governance-tab]").forEach(item => item.classList.toggle("active", item === governanceTab));
      renderGovernance();
      return;
    }
    const libraryTab = event.target.closest("[data-library-tab]");
    if (libraryTab) {
      currentLibraryTab = libraryTab.dataset.libraryTab;
      renderGovernance();
      return;
    }
    const playerDetailTab = event.target.closest("[data-player-detail-tab]");
    if (playerDetailTab) {
      currentPlayerDetailTab = playerDetailTab.dataset.playerDetailTab;
      renderPlayerDetail(selectedPlayer);
      return;
    }
    if (event.target.closest("#addLibraryItem")) {
      addLibraryItem();
      return;
    }
    if (event.target.closest("#confirmMerge")) {
      confirmNameMerge();
      return;
    }
    const mergeFrom = event.target.closest("[data-merge-from]");
    if (mergeFrom) {
      activeGovernanceTab = "merge";
      renderGovernance();
      $("#mergeSources").value = mergeFrom.dataset.mergeFrom;
      $("#mergeTarget").value = mergeFrom.dataset.mergeFrom;
      return;
    }
    const disableButton = event.target.closest("[data-disable-object]");
    if (disableButton) {
      if (!requireAdmin("禁用对象仅管理员可用。")) return;
      const item = libraryRows()[Number(disableButton.dataset.disableObject)];
      if (!item || !confirm(`确认禁用 ${item.name}？`)) return;
      item.disabled = true;
      logOperation("删除", item.name, JSON.stringify(item), "已标记禁用", currentLibraryTab);
      refreshAll();
      saveState();
      return;
    }
    const completeRequest = event.target.closest("[data-request-complete]");
    if (completeRequest) {
      const item = correctionRequests[Number(completeRequest.dataset.requestComplete)];
      if (item) {
        item.status = "已完成";
        logOperation("处理申请", item.objectName || item.page, "", "已完成", item.issueType);
        renderGovernance();
        saveState();
      }
      return;
    }
    const rejectRequest = event.target.closest("[data-request-reject]");
    if (rejectRequest) {
      const item = correctionRequests[Number(rejectRequest.dataset.requestReject)];
      if (item) {
        item.status = "已拒绝";
        logOperation("处理申请", item.objectName || item.page, "", "已拒绝", item.issueType);
        renderGovernance();
        saveState();
      }
      return;
    }
    const undoButton = event.target.closest("[data-undo-import]");
    if (undoButton) {
      undoImportBatch(undoButton.dataset.undoImport);
    }
  });
  document.addEventListener("change", event => {
    const input = event.target.closest("[data-library-field]");
    if (!input) return;
    if (!requireAdmin("对象编辑仅管理员可用。")) return;
    const row = input.closest("[data-library-index]");
    const item = libraryRows()[Number(row.dataset.libraryIndex)];
    if (!item) return;
    const previousValue = input.dataset.previousValue || "";
    const fieldName = input.dataset.libraryField;
    const before = JSON.stringify(item);
    if (fieldName === "aliases") {
      item.aliases = input.value.split(/[、,\n]/).map(value => value.trim()).filter(Boolean);
    } else {
      item[fieldName] = input.value;
    }
    if (fieldName === "name" && previousValue && previousValue !== input.value) {
      replaceNameReferences(previousValue, input.value);
    }
    if (currentLibraryTab === "doubles" && fieldName === "name") {
      const [player1, player2] = splitDoublePlayers(input.value);
      item.player1 = player1;
      item.player2 = player2;
    }
    logOperation("编辑", input.value || previousValue, before, JSON.stringify(item), currentLibraryTab);
    setupFilters();
    renderPlayers();
    renderPersonalCards();
    renderCompareOptions();
    updateSchoolOptions();
    input.dataset.previousValue = input.value;
    saveState();
  });
  document.addEventListener("change", event => {
    if (event.target.closest(".personal-event-filter")) {
      renderPersonalDetail(selectedPersonalPlayer);
      return;
    }
    const status = event.target.closest("[data-request-status]");
    if (!status) return;
    const item = correctionRequests[Number(status.dataset.requestStatus)];
    if (!item) return;
    const before = item.status;
    item.status = status.value;
    logOperation("处理申请", item.objectName || item.page, before, item.status, item.issueType);
    saveState();
  });
  $("#exportAll").addEventListener("click", exportAll);
  $("#exportCompare").addEventListener("click", () => {
    const rows = [["模块", "内容"], ["分析模式", compareModeLabel()], ["对象A", $("#compareA").selectedOptions[0]?.textContent || ""], ["对象B", $("#compareB").selectedOptions[0]?.textContent || ""], ["说明", $("#compareResult").innerText.trim()]];
    downloadCsv("tennis-scout-compare.csv", rows);
  });
}

function switchView(view) {
  currentView = view;
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  $$(".view").forEach(item => item.classList.remove("active"));
  $(`#${view}View`).classList.add("active");
  const titles = { dashboard: "总览", upload: "批量导入", events: "赛事库", players: "参赛对象库", personal: "选手卡片", library: "库管理", compare: "对阵分析" };
  const subtitles = {
    dashboard: "查看 Tennis Scout 当前数据概况、导入状态与关键榜单。",
    upload: "管理员导入 Excel / CSV 并生成校对表；访客可提交数据补充申请。",
    events: "查看分区赛、全国赛的正式成绩资料。正式数据修改请前往库管理。",
    players: "查询学校/团体、双打组合、单打选手的成绩、对阵和数据状态。",
    personal: "按赛事聚合个人履历，查看选手参加过的赛事、场次、比分和最终结果。",
    library: "管理员集中处理对象编辑、名称合并、修正申请、导入记录与操作日志。",
    compare: "选择同类型对象进行赛前事实对比，只展示已录入记录，不输出预测。"
  };
  $("#viewTitle").textContent = titles[view];
  if ($("#viewSubtitle")) $("#viewSubtitle").textContent = subtitles[view] || "";
  renderAuthState();
  if (view === "library") renderGovernance();
}

loadState();
setupFilters();
showBlankCorrectionTable();
bindEvents();
refreshAll();
