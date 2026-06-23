const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = __dirname;
const port = Number(process.env.PORT || 4174);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req, limitBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > limitBytes) {
        reject(new Error("文件太大，请拆分后再导入。"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function bufferFromDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:.*?;base64,(.*)$/);
  if (!match) throw new Error("文件数据格式不正确。");
  return Buffer.from(match[1], "base64");
}

function decodeXml(value) {
  return String(value || "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some(value => value !== "")) rows.push(row);
  const headers = (rows.shift() || []).map(value => value.trim());
  return rows
    .filter(values => values.some(value => String(value || "").trim()))
    .map(values => Object.fromEntries(headers.map((header, index) => [header || `列${index + 1}`, String(values[index] || "").trim()])));
}

function findEndOfCentralDirectory(buffer) {
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("不是有效的 xlsx 文件。");
}

function unzipEntries(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const centralDirOffset = buffer.readUInt32LE(eocd + 16);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const entries = new Map();
  let offset = centralDirOffset;
  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString("utf8");

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.slice(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = zlib.inflateRawSync(compressed);
    else throw new Error(`xlsx 压缩格式不支持：${method}`);
    entries.set(name, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function getWorkbookSheets(entries) {
  const workbook = entries.get("xl/workbook.xml")?.toString("utf8");
  const rels = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbook || !rels) return [{ name: "Sheet1", path: "xl/worksheets/sheet1.xml" }];
  const relMap = new Map();
  for (const rel of rels.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    relMap.set(rel[1], `xl/${rel[2].replace(/^\/?xl\//, "")}`);
  }
  return [...workbook.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map(match => ({
    name: decodeXml(match[1]),
    path: relMap.get(match[2]) || "xl/worksheets/sheet1.xml"
  }));
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(match => {
    const parts = [...match[0].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1]));
    return parts.join("");
  });
}

function columnIndex(cellRef) {
  const letters = String(cellRef || "").match(/[A-Z]+/)?.[0] || "A";
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return index - 1;
}

function cellValue(cellXml, sharedStrings) {
  const type = cellXml.match(/\bt="([^"]+)"/)?.[1] || "";
  if (type === "inlineStr") {
    return decodeXml(cellXml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] || "");
  }
  const raw = decodeXml(cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "");
  if (type === "s") return sharedStrings[Number(raw)] || "";
  return raw;
}

function parseSheetRows(sheetXml, sharedStrings) {
  if (!sheetXml) throw new Error("没有找到 xlsx 的第一张工作表。");
  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const ref = attrs.match(/\br="([^"]+)"/)?.[1] || "";
      row[columnIndex(ref)] = cellValue(`<c ${attrs}>${cellMatch[2]}</c>`, sharedStrings).trim();
    }
    if (row.some(Boolean)) rows.push(row.map(value => value || ""));
  }
  const headerIndex = rows.findIndex((row, index) => {
    const nonEmpty = row.filter(value => String(value || "").trim()).length;
    const nextNonEmpty = (rows[index + 1] || []).filter(value => String(value || "").trim()).length;
    return nonEmpty >= 2 && nextNonEmpty >= 1;
  });
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map(value => value.trim());
  return rows
    .slice(headerIndex + 1)
    .filter(values => values.some(value => String(value || "").trim()))
    .map(values => Object.fromEntries(headers.map((header, index) => [header || `列${index + 1}`, String(values[index] || "").trim()])));
}

function parseXlsx(buffer) {
  const entries = unzipEntries(buffer);
  const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml")?.toString("utf8"));
  const sheets = getWorkbookSheets(entries).map(sheet => ({
    name: sheet.name,
    rows: parseSheetRows(entries.get(sheet.path)?.toString("utf8"), sharedStrings)
  }));
  return {
    rows: sheets[0]?.rows || [],
    sheets
  };
}

async function handleImportSpreadsheet(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
    const name = String(payload.name || "").toLowerCase();
    const buffer = bufferFromDataUrl(payload.dataUrl);
    let result;
    if (name.endsWith(".xlsx")) {
      result = parseXlsx(buffer);
    } else if (name.endsWith(".tsv")) {
      result = { rows: parseCsv(buffer.toString("utf8"), "\t"), sheets: [] };
    } else if (name.endsWith(".csv")) {
      result = { rows: parseCsv(buffer.toString("utf8"), ","), sheets: [] };
    } else {
      throw new Error("只支持 .csv、.tsv、.xlsx 文件。");
    }
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "导入失败。" });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/import-spreadsheet") {
    handleImportSpreadsheet(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Tennis Scout running on port ${port}.`);
  console.log("Spreadsheet import enabled for CSV, TSV, and XLSX.");
});
