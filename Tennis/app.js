const rankLabels = ["第1名", "第2名", "第3名", "第4名", "第5名", "第6名", "第7名", "第8名"];

let events = [];
let matches = [];
let participants = [];
let schools = [];
let singles = [];
let doubles = [];
let watchlist = [];
let selectedPlayer = "";
let searchText = "";
let selectedImportFile = null;
let currentDataType = "regional";
let currentCorrectionType = "regional";
let currentLibraryTab = "schools";
const storageKey = "tennisScoutStateV2";

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
  long: {
    label: "长表导入",
    help: "对应最终模板页签：长表导入。字段：赛事阶段、届次、赛区、项目、名次、参赛对象、对象类型、学校、来源页。",
    rowsWhenBlank: 6,
    columns: [
      ["stage", "赛事阶段"],
      ["edition", "届次"],
      ["region", "赛区"],
      ["project", "项目"],
      ["rank", "名次"],
      ["participant", "参赛对象"],
      ["objectType", "对象类型"],
      ["school", "学校"],
      ["sourcePage", "来源页"],
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
  teamA: ["团体A"],
  teamB: ["团体B"],
  rubber: ["分场"],
  playerA: ["A方选手"],
  score: ["比分"],
  playerB: ["B方选手"],
  winner: ["分场胜方"],
  teamWinner: ["团体胜方"],
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
  const state = { events, matches, participants, schools, singles, doubles, watchlist };
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
  } catch {
    events = [];
    matches = [];
    participants = [];
    schools = [];
    singles = [];
    doubles = [];
    watchlist = [];
  }
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

function buildPlayers() {
  const map = new Map();
  singles.forEach(item => {
    if (!map.has(item.name)) {
      map.set(item.name, { name: item.name, school: item.school || "", kind: "单打选手", projects: new Set(), levels: new Set(), achievements: [] });
    }
    map.get(item.name).projects.add(item.project || "单打");
  });
  doubles.forEach(item => {
    if (!map.has(item.name)) {
      map.set(item.name, { name: item.name, school: item.school || "", kind: "双打组合", projects: new Set(), levels: new Set(), achievements: [] });
    }
    map.get(item.name).projects.add(item.project || "双打");
  });
  allAchievements().filter(item => /单打|双打/.test(item.project)).forEach(item => {
    if (!map.has(item.player)) {
      map.set(item.player, { name: item.player, school: item.school, kind: item.project.includes("双打") ? "双打组合" : "单打选手", projects: new Set(), levels: new Set(), achievements: [] });
    }
    const player = map.get(item.player);
    player.projects.add(item.project);
    player.levels.add(item.levelName);
    player.achievements.push(item);
  });
  matches.forEach(match => {
    [match.playerA, match.playerB].filter(Boolean).forEach(name => {
      if (!map.has(name)) {
        map.set(name, { name, school: "", projects: new Set(["单打"]), levels: new Set([match.levelName]), achievements: [] });
      }
    });
  });
  return [...map.values()].map(player => ({
    ...player,
    projects: [...player.projects],
    levels: [...player.levels],
    matches: matches.filter(match => match.playerA === player.name || match.playerB === player.name)
  })).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function getPlayers() {
  return buildPlayers();
}

function metricData() {
  const players = getPlayers();
  return [
    ["赛事记录", events.length],
    ["选手档案", players.length],
    ["成绩条目", allAchievements().length],
    ["关键对阵", matches.length]
  ];
}

function renderMetrics() {
  $("#metricsGrid").innerHTML = metricData().map(([label, value]) => `
    <article class="metric"><span>${label}</span><strong>${value}</strong></article>
  `).join("");
}

function renderRegionalPreview() {
  if (!events.length) {
    $("#regionalPreview").innerHTML = `
      <thead><tr><th>赛区</th><th>第1名</th><th>第2名</th><th>第3名</th><th>第4名</th></tr></thead>
      <tbody><tr><td colspan="5">暂无录入数据</td></tr></tbody>
    `;
    return;
  }
  const regionalRows = events.filter(event => event.level === "regional").slice(0, 5);
  $("#regionalPreview").innerHTML = `
    <thead><tr><th>赛区</th><th>第1名</th><th>第2名</th><th>第3名</th><th>第4名</th></tr></thead>
    <tbody>${regionalRows.map(event => `
      <tr><td>${escapeHtml(event.region)}</td>${[0, 1, 2, 3].map(index => `<td>${escapeHtml(event.ranks[index] || "")}</td>`).join("")}</tr>
    `).join("") || `<tr><td colspan="5">暂无分区赛数据</td></tr>`}</tbody>
  `;
}

function renderNationalBoard() {
  const finals = events.filter(event => event.level === "final" || event.levelName === "全国赛");
  if (!finals.length) {
    $("#nationalBoard").innerHTML = `<div class="empty-state">暂无全国赛录入数据。</div>`;
    return;
  }
  $("#nationalBoard").innerHTML = finals.map(event => `
    <section class="rank-column national-card">
      <h3>${escapeHtml(event.name)}</h3>
      ${event.ranks.map((rank, index) => `
        <div class="rank-item">
          <span class="rank">${escapeHtml(event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`)}</span>
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
        <input data-event-field="name" value="${escapeHtml(event.name)}" title="赛事名">
        <input data-event-field="year" value="${escapeHtml(event.year)}" title="年份">
        <input data-event-field="levelName" value="${escapeHtml(event.levelName)}" title="级别">
        <input data-event-field="region" value="${escapeHtml(event.region)}" title="赛区">
        <input data-event-field="project" value="${escapeHtml(event.project)}" title="项目">
      </div>
      <div class="event-ranks">
        ${Array.from({ length: Math.max(4, event.ranks.length) }, (_, index) => `<div><strong>${escapeHtml(event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`)}</strong><input data-event-rank="${index}" list="participantOptions" value="${escapeHtml(event.ranks[index] || "")}"></div>`).join("")}
      </div>
      <button class="remove-button" data-event-delete="${escapeHtml(event.id)}">删除赛事</button>
    </article>
  `).join("") || `<div class="empty-state">没有匹配的赛事记录。</div>`;
}

function renderPlayers() {
  const project = $("#playerProjectFilter").value;
  const level = $("#playerLevelFilter").value;
  const players = getPlayers().filter(player =>
    (!project || player.projects.includes(project)) &&
    (!level || player.levels.includes(level)) &&
    includesSearch(player.name, player.school, player.projects.join(" "), player.levels.join(" "))
  );
  if (!players.some(player => player.name === selectedPlayer)) selectedPlayer = players[0]?.name || "";
  $("#playerList").innerHTML = players.map(player => `
    <button class="player-row ${player.name === selectedPlayer ? "active" : ""}" data-player="${escapeHtml(player.name)}">
      <strong>${escapeHtml(player.name)}</strong>
      <span class="meta">${escapeHtml(player.kind || "选手")} · ${player.achievements.length} 条战绩 · ${player.matches.length} 场对阵</span>
    </button>
  `).join("") || `<div class="empty-state">暂无选手。请先导入“单打选手库”“双打选手库”，或导入含单打/双打项目的全国赛、长表导入数据。</div>`;
  renderPlayerDetail(selectedPlayer);
}

function bestAchievement(player) {
  const order = Object.fromEntries(rankLabels.map((rank, index) => [rank, index + 1]));
  return [...player.achievements].sort((a, b) => (order[a.rank] || 99) - (order[b.rank] || 99))[0];
}

function closeScoreCount(playerMatches) {
  return playerMatches.filter(match => /7-6|7-5|10-|决胜|4-6|5-7/.test(match.score || "")).length;
}

function inferredOpponents(player) {
  const names = new Map();
  player.achievements.forEach(achievement => {
    const event = events.find(item => item.name === achievement.event && item.project === achievement.project);
    if (!event) return;
    event.ranks.forEach((name, index) => {
      if (!name || name === player.name) return;
      if (!names.has(name)) {
        names.set(name, {
          name,
          event: event.name,
          project: event.project,
          rank: event.rankDisplayLabels?.[index] || rankLabels[index] || `第${index + 1}名`
        });
      }
    });
  });
  return [...names.values()];
}

function renderPlayerDetail(name) {
  const player = getPlayers().find(item => item.name === name);
  if (!player) {
    $("#playerDetail").innerHTML = `<div class="empty-state">请选择一名选手查看档案。</div>`;
    return;
  }
  const wins = player.matches.filter(match => match.winner === player.name);
  const losses = player.matches.filter(match => match.winner && match.winner !== player.name);
  const best = bestAchievement(player);
  const opponents = inferredOpponents(player);
  $("#playerDetail").innerHTML = `
    <div class="panel-heading">
      <div><p class="eyebrow">选手档案</p><h2>${escapeHtml(player.name)}</h2></div>
      <span class="tag">${escapeHtml(player.kind || "选手")}</span>
    </div>
    <div class="event-meta">
      ${player.projects.map(project => `<span class="pill">${escapeHtml(project)}</span>`).join("")}
      ${player.levels.map(level => `<span class="pill">${escapeHtml(level)}</span>`).join("")}
      <span class="pill">${wins.length}胜 ${losses.length}负</span>
      <span class="pill">${opponents.length} 名同场对手</span>
    </div>
    <div class="detail-grid">
      <section class="detail-block">
        <h3>参加比赛 / 战绩</h3>
        ${player.achievements.map(item => `<div class="record-line"><span>${escapeHtml(item.event)}</span><strong>${escapeHtml(item.rank)}</strong></div>`).join("") || `<p class="meta">暂无正式成绩，仅存在对阵记录。</p>`}
      </section>
      <section class="detail-block">
        <h3>对手 / 关键对阵</h3>
        ${player.matches.map(match => `<div class="record-line"><span>${escapeHtml(match.playerA)} vs ${escapeHtml(match.playerB)}<br><small>${escapeHtml(match.round)} · ${escapeHtml(match.score)}</small></span><strong>${match.winner === player.name ? "胜" : "负"}</strong></div>`).join("") || opponents.slice(0, 8).map(item => `<div class="record-line"><span>${escapeHtml(item.name)}<br><small>${escapeHtml(item.event)} · ${escapeHtml(item.project)}</small></span><strong>${escapeHtml(item.rank)}</strong></div>`).join("") || `<p class="meta">暂无关键对阵比分；导入比分表后可显示直接交手。</p>`}
      </section>
      <section class="detail-block">
        <h3>事实标签</h3>
        <div class="event-meta">
          ${best ? `<span class="pill">${escapeHtml(best.levelName)}${escapeHtml(best.rank)}</span>` : ""}
          ${closeScoreCount(player.matches) ? `<span class="pill">${closeScoreCount(player.matches)} 场接近比分</span>` : ""}
          <span class="pill">${player.achievements.length + player.matches.length} 条数据</span>
          ${opponents.length ? `<span class="pill">${opponents.length} 名同项目对手</span>` : ""}
        </div>
      </section>
      <section class="detail-block">
        <h3>事实型总结</h3>
        <p class="meta">${escapeHtml(player.name)}当前有 ${player.achievements.length} 条成绩记录、${player.matches.length} 场关键对阵，系统从同赛事同项目中识别到 ${opponents.length} 名潜在对手。${best ? `最好成绩为${escapeHtml(best.event)}${escapeHtml(best.rank)}。` : "正式赛事成绩仍需补充。"}当前分析只基于已录入数据，不能直接判断下一场胜负。</p>
      </section>
    </div>
  `;
}

function directMatches(a, b) {
  return matches.filter(match => [match.playerA, match.playerB].includes(a) && [match.playerA, match.playerB].includes(b));
}

function commonOpponents(a, b) {
  const opponentsFor = name => new Set(matches.filter(match => match.playerA === name || match.playerB === name).map(match => match.playerA === name ? match.playerB : match.playerA));
  const aOpp = opponentsFor(a);
  const bOpp = opponentsFor(b);
  return [...aOpp].filter(name => bOpp.has(name));
}

function renderCompareOptions() {
  const playablePlayers = getPlayers().filter(player => player.projects.includes("单打") || player.matches.length);
  const options = playablePlayers.map(player => `<option value="${escapeHtml(player.name)}">${escapeHtml(player.name)}</option>`).join("");
  $("#compareA").innerHTML = options;
  $("#compareB").innerHTML = options;
  $("#watchPlayer").innerHTML = getPlayers().map(player => `<option value="${escapeHtml(player.name)}">${escapeHtml(player.name)}</option>`).join("");
  if (playablePlayers.length >= 2) {
    $("#compareA").value = playablePlayers[0].name;
    $("#compareB").value = playablePlayers[1].name;
  }
}

function runCompare() {
  const aName = $("#compareA").value;
  const bName = $("#compareB").value;
  const players = getPlayers();
  const a = players.find(player => player.name === aName);
  const b = players.find(player => player.name === bName);
  if (!a || !b || aName === bName) {
    $("#compareResult").innerHTML = `<div class="empty-state">暂无足够选手数据，请先录入至少两名选手。</div>`;
    return;
  }
  const heads = directMatches(aName, bName);
  const common = commonOpponents(aName, bName);
  const aBest = bestAchievement(a);
  const bBest = bestAchievement(b);
  const aWins = heads.filter(match => match.winner === aName).length;
  const bWins = heads.filter(match => match.winner === bName).length;
  $("#compareResult").innerHTML = `
    <section class="panel"><div class="compare-grid">
      ${[a, b].map(player => {
        const best = bestAchievement(player);
        return `<div class="detail-block"><h3>${escapeHtml(player.name)}</h3><p class="meta">${escapeHtml(player.school || "归属待补充")}</p><div class="record-line"><span>最好成绩</span><strong>${best ? `${escapeHtml(best.event)}${escapeHtml(best.rank)}` : "待补充"}</strong></div><div class="record-line"><span>已录入战绩</span><strong>${player.achievements.length} 条成绩 / ${player.matches.length} 场对阵</strong></div></div>`;
      }).join("")}
    </div></section>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">直接交手</p><h2>${heads.length} 场记录</h2></div></div>
      ${heads.length ? `<table><thead><tr><th>赛事</th><th>轮次</th><th>比分</th><th>胜者</th><th>可信度</th></tr></thead><tbody>${heads.map(match => `<tr><td>${escapeHtml(match.event)}</td><td>${escapeHtml(match.round)}</td><td>${escapeHtml(match.score)}</td><td>${escapeHtml(match.winner)}</td><td>${escapeHtml(match.confidence)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">暂无直接交手记录。</div>`}
    </section>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">共同对手</p><h2>${common.length} 名</h2></div></div>
      <div class="event-meta">${common.map(name => `<span class="pill">${escapeHtml(name)}</span>`).join("") || `<span class="meta">暂无共同对手数据。</span>`}</div>
    </section>
    <section class="summary-box">
      根据已录入数据，${escapeHtml(aName)}与${escapeHtml(bName)}${heads.length ? `共有 ${heads.length} 次直接交手，${escapeHtml(aName)}${aWins}胜，${escapeHtml(bName)}${bWins}胜。` : "暂无直接交手记录。"}${common.length ? `双方有 ${common.length} 名共同对手，可继续核对相关比分。` : "共同对手数据暂不足。"}${aBest && bBest ? `${escapeHtml(aName)}最好成绩为${escapeHtml(aBest.event)}${escapeHtml(aBest.rank)}，${escapeHtml(bName)}最好成绩为${escapeHtml(bBest.event)}${escapeHtml(bBest.rank)}。` : ""}该结论只说明已录入事实，不能直接判断本场胜负。
    </section>
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
  setHint(`已显示“${dataTypeConfig[currentDataType].label}”空表。你可以从 Excel 复制包含表头的数据区域，粘贴到下方文本框后解析。`);
}

function parsePastedTable() {
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
  setHint(`已解析 ${rows.length} 行粘贴数据，请复核后保存入库。`, "success");
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
  setHint(`已选择文件。当前数据类型是“${dataTypeConfig[currentDataType].label}”，点击“解析导入”生成校对表。`);
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
  const parts = String(name || "")
    .split(/[\/／、,，&＋+]/)
    .map(part => part.trim())
    .filter(Boolean);
  return [parts[0] || "", parts[1] || ""];
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
  });
  matches.forEach(match => {
    if (match.playerA === oldName) match.playerA = newName;
    if (match.playerB === oldName) match.playerB = newName;
    if (match.winner === oldName) match.winner = newName;
  });
  singles.forEach(item => {
    if (item.name === oldName) item.name = newName;
  });
  doubles.forEach(item => {
    if (item.name === oldName) item.name = newName;
    if (item.player1 === oldName) item.player1 = newName;
    if (item.player2 === oldName) item.player2 = newName;
  });
  participants.forEach(item => {
    if (item.name === oldName) item.name = newName;
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

  const longGroups = new Map();
  for (const row of sheetRowsAny(importResult, ["长表导入"])) {
    if (!row["参赛对象"] || !row["名次"]) continue;
    const key = [row["赛事阶段"], row["届次"], row["赛区"], row["项目"]].join("|");
    if (!longGroups.has(key)) {
      longGroups.set(key, { ranks: [], rankSchools: [], rankDisplayLabels: [] });
    }
    const group = longGroups.get(key);
    group.ranks.push(row["参赛对象"]);
    group.rankSchools.push(row["学校"] || "");
    group.rankDisplayLabels.push(`第${row["名次"]}名`);
    upsertByName(participants, { name: row["参赛对象"], type: row["对象类型"], school: row["学校"], project: row["项目"] });
  }
  for (const [key, group] of longGroups) {
    const [stage, edition, region, project] = key.split("|");
    events.push({
      id: `long-${Date.now()}-${count}`,
      name: `${edition || ""}${stage || "赛事"} ${region || ""}`.trim(),
      year: new Date().getFullYear(),
      level: stage === "全国赛" ? "final" : "regional",
      levelName: stage || "赛事",
      region: region || "全国",
      project: project || "团体",
      source: selectedImportFile?.name || "长表导入",
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
    const project = row["分场"] === "双打" ? "双打" : "单打";
    const match = {
      event: `${row["届次"] || ""}${row["赛事类型"] || ""} ${row["赛区"] || ""} ${row["项目"] || ""}`.trim(),
      year: new Date().getFullYear(),
      levelName: row["赛事类型"] || "分区赛",
      round: `${row["轮次"] || ""} ${row["分场"] || ""}`.trim(),
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
    if (project === "单打") {
      upsertByName(singles, { name: playerA, school: row["团体A"] || "", project: "单打" });
      upsertByName(singles, { name: playerB, school: row["团体B"] || "", project: "单打" });
    } else {
      const [a1, a2] = splitDoublePlayers(playerA);
      const [b1, b2] = splitDoublePlayers(playerB);
      upsertByName(doubles, { name: playerA, player1: a1, player2: a2, school: row["团体A"] || "", project: "双打" });
      upsertByName(doubles, { name: playerB, player1: b1, player2: b2, school: row["团体B"] || "", project: "双打" });
    }
    count += 1;
  });
  return count;
}

function importTemplateWorkbook(importResult) {
  const knownSheets = ["分区赛", "全国赛", "长表导入", "参赛对象库", "学校库", "双打选手库", "单打选手库", "对阵表"];
  if (!(importResult.sheets || []).some(sheet => knownSheets.includes(sheet.name))) return false;
  const libraryCount = importLibrarySheets(importResult);
  const achievementCount = importTemplateAchievements(importResult);
  const matchCount = importTeamMatches(importResult);
  setupFilters();
  refreshAll();
  renderLibraryTable();
  saveState();
  setHint(`模板导入完成：新增/更新 ${libraryCount} 条库信息，导入 ${achievementCount} 条赛事成绩、${matchCount} 场个人对阵。`, "success");
  return true;
}

async function parseCurrentImportFile() {
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
    setHint(`解析完成：已生成 ${rows.length} 行“${dataTypeConfig[currentDataType].label}”校对数据。请复核后保存入库。`, "success");
  } catch (error) {
    renderCorrectionTable(blankCorrectionRows(currentDataType), currentDataType);
    setHint(`导入失败：${error.message}`, "error");
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

function saveCorrection() {
  const rawRows = readCorrectionRows();
  const timestamp = Date.now();
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
    setupFilters();
    refreshAll();
    saveState();
    alert(`已保存 ${rows.length} 条分区赛记录`);
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
    setupFilters();
    refreshAll();
    saveState();
    alert(`已保存 ${count} 条全国赛记录`);
    return;
  }
  if (currentCorrectionType === "long") {
    const grouped = new Map();
    rawRows.forEach(row => {
      if (!row.participant || !row.rank) return;
      const key = [row.stage, row.edition, row.region, row.project].join("|");
      if (!grouped.has(key)) grouped.set(key, { ranks: [], rankSchools: [], rankDisplayLabels: [] });
      const group = grouped.get(key);
      group.ranks.push(row.participant);
      group.rankSchools.push(row.school || "");
      group.rankDisplayLabels.push(`第${row.rank}名`);
      upsertByName(participants, { name: row.participant, type: row.objectType, school: row.school, project: row.project });
    });
    let count = 0;
    for (const [key, group] of grouped) {
      const [stage, edition, region, project] = key.split("|");
      if (!group.ranks.length) continue;
      events.push({
        id: `manual-long-${timestamp}-${count}`,
        name: `${edition || ""}${stage || "赛事"} ${region || ""}`.trim(),
        year: new Date().getFullYear(),
        level: stage === "全国赛" ? "final" : "regional",
        levelName: stage || "赛事",
        region: region || "全国",
        project: project || "团体",
        source: selectedImportFile?.name || "长表导入校对页",
        ranks: group.ranks,
        rankSchools: group.rankSchools,
        rankDisplayLabels: group.rankDisplayLabels
      });
      count += 1;
    }
    setupFilters();
    refreshAll();
    saveState();
    alert(`已保存 ${count} 条长表赛事记录`);
    return;
  }
  if (currentCorrectionType === "teamMatches") {
    let count = 0;
    rawRows.forEach(row => {
      if (!row.playerA || !row.playerB || !row.score || row.score === "-") return;
      matches.push({
        event: `${row.edition || ""}${row.eventType || ""} ${row.region || ""} ${row.project || ""}`.trim(),
        year: new Date().getFullYear(),
        levelName: row.eventType || "分区赛",
        round: `${row.round || ""} ${row.rubber || ""}`.trim(),
        playerA: row.playerA,
        playerB: row.playerB,
        winner: row.winner,
        score: row.score,
        confidence: row.confidence || "已导入",
        teamA: row.teamA,
        teamB: row.teamB,
        teamWinner: row.teamWinner,
        project: row.rubber === "双打" ? "双打" : "单打"
      });
      count += 1;
    });
    setupFilters();
    refreshAll();
    saveState();
    alert(`已保存 ${count} 场个人对阵记录`);
    return;
  }
  const rows = rawRows.map(row => ({
    name: row.participant,
    type: row.objectType,
    school: row.school,
    project: row.project
  })).filter(row => row.name);
  rows.forEach(row => upsertByName(participants, row));
  setupFilters();
  refreshAll();
  saveState();
  alert(`已保存 ${rows.length} 条参赛对象记录`);
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

function addLibraryItem() {
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
  refreshAll();
  saveState();
}

function renderWatchlist() {
  const players = getPlayers();
  $("#watchItems").innerHTML = watchlist.map(name => {
    const player = players.find(item => item.name === name);
    if (!player) return "";
    const best = bestAchievement(player);
    return `<article class="watch-card"><header><strong>${escapeHtml(player.name)}</strong><button class="remove-button" data-remove-watch="${escapeHtml(player.name)}">移除</button></header><p class="meta">${escapeHtml(player.school || "归属待补充")} · ${best ? `${escapeHtml(best.event)}${escapeHtml(best.rank)}` : "成绩待补充"} · ${player.matches.length} 场关键对阵</p></article>`;
  }).join("") || `<div class="empty-state">关注名单为空。</div>`;
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
  renderMetrics();
  renderRegionalPreview();
  renderNationalBoard();
  renderEvents();
  renderPlayers();
  renderCompareOptions();
  renderLibraryTable();
  renderWatchlist();
  runCompare();
}

function bindEvents() {
  $$(".nav-item").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
  $$("[data-view-jump]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.viewJump)));
  $$(".segment").forEach(button => button.addEventListener("click", () => {
    $$(".segment").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentDataType = button.dataset.shotType;
    $("#typeHelp").textContent = dataTypeConfig[currentDataType].help;
    showBlankCorrectionTable();
    if (!selectedImportFile) {
      $("#mockPreview").textContent = `等待选择 ${dataTypeConfig[currentDataType].label} 的 Excel / CSV 文件`;
    } else {
      setHint(`已切换为“${dataTypeConfig[currentDataType].label}”。点击“解析导入”会按这个类型整理。`);
    }
  }));
  $("#globalSearch").addEventListener("input", event => {
    searchText = event.target.value.trim();
    renderEvents();
    renderPlayers();
  });
  ["eventYearFilter", "eventLevelFilter", "eventRegionFilter", "eventProjectFilter"].forEach(id => $(`#${id}`).addEventListener("change", renderEvents));
  $("#eventGrid").addEventListener("input", event => {
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
    const button = event.target.closest("[data-event-delete]");
    if (!button) return;
    events = events.filter(item => item.id !== button.dataset.eventDelete);
    setupFilters();
    refreshAll();
    saveState();
  });
  ["playerProjectFilter", "playerLevelFilter"].forEach(id => $(`#${id}`).addEventListener("change", renderPlayers));
  $("#playerList").addEventListener("click", event => {
    const row = event.target.closest("[data-player]");
    if (!row) return;
    selectedPlayer = row.dataset.player;
    renderPlayers();
  });
  $("#runCompare").addEventListener("click", runCompare);
  $("#importInput").addEventListener("change", event => renderImportPreview(event.target.files[0]));
  $("#mockRecognize").addEventListener("click", parseCurrentImportFile);
  $("#parsePastedTable").addEventListener("click", parsePastedTable);
  $("#pasteTableInput").addEventListener("paste", () => setTimeout(parsePastedTable, 0));
  $("#saveCorrection").addEventListener("click", saveCorrection);
  $("#addLibraryItem").addEventListener("click", addLibraryItem);
  $$("[data-library-tab]").forEach(button => button.addEventListener("click", () => {
    $$("[data-library-tab]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentLibraryTab = button.dataset.libraryTab;
    renderLibraryTable();
  }));
  $("#libraryTable").addEventListener("input", event => {
    const input = event.target.closest("[data-library-field]");
    if (!input) return;
    const row = input.closest("[data-library-index]");
    const item = libraryRows()[Number(row.dataset.libraryIndex)];
    const previousValue = input.dataset.previousValue || "";
    const fieldName = input.dataset.libraryField;
    item[input.dataset.libraryField] = input.value;
    const shouldReplaceName = fieldName === "name" && previousValue && previousValue !== input.value;
    if (shouldReplaceName) {
      replaceNameReferences(previousValue, input.value);
    }
    if (currentLibraryTab === "doubles" && fieldName === "name") {
      const [player1, player2] = splitDoublePlayers(input.value);
      item.player1 = player1;
      item.player2 = player2;
      renderLibraryTable();
    }
    setupFilters();
    renderPlayers();
    renderCompareOptions();
    updateSchoolOptions();
    input.dataset.previousValue = input.value;
    saveState();
  });
  $("#libraryTable").addEventListener("click", event => {
    const button = event.target.closest("[data-library-delete]");
    if (!button) return;
    libraryRows().splice(Number(button.dataset.libraryDelete), 1);
    refreshAll();
    saveState();
  });
  $("#addWatch").addEventListener("click", () => {
    const name = $("#watchPlayer").value;
    if (name && !watchlist.includes(name)) watchlist.push(name);
    renderWatchlist();
    saveState();
  });
  $("#watchItems").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-watch]");
    if (!button) return;
    watchlist = watchlist.filter(name => name !== button.dataset.removeWatch);
    renderWatchlist();
    saveState();
  });
  $("#exportAll").addEventListener("click", exportAll);
  $("#saveLocal").addEventListener("click", () => {
    saveState();
    setHint("已保存到本机浏览器。刷新页面后会自动恢复当前赛事、选手库、对阵和关注名单。", "success");
  });
  $("#exportCompare").addEventListener("click", () => {
    const rows = [["模块", "内容"], ["选手A", $("#compareA").value], ["选手B", $("#compareB").value], ["说明", $("#compareResult").innerText.trim()]];
    downloadCsv("tennis-scout-compare.csv", rows);
  });
  $("#exportWatch").addEventListener("click", () => downloadCsv("tennis-scout-watchlist.csv", [["选手"], ...watchlist.map(name => [name])]));
}

function switchView(view) {
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  $$(".view").forEach(item => item.classList.remove("active"));
  $(`#${view}View`).classList.add("active");
  const titles = { dashboard: "总览", upload: "批量导入", events: "赛事库", players: "选手库", library: "库管理", compare: "对阵分析", watchlist: "关注名单" };
  $("#viewTitle").textContent = titles[view];
}

loadState();
setupFilters();
showBlankCorrectionTable();
bindEvents();
refreshAll();
