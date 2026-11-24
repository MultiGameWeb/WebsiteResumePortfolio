// Opens the files a person attaches to a chat, in the browser, as far as possible:
//   PDF                      → sent to the AI as it is (the AI reads PDFs itself)
//   TXT CSV MD JSON HTML ... → the text
//   DOCX (Word), XLSX (Excel), PPTX (slides) → the text inside, read from the zip
// Anything else (old .doc / .xls / .ppt, ZIP, videos ...) cannot be opened here: the caller tells the
// person to type the details in the chat or send a photo instead.
//
// This file is identical in chatbot-builder/ and salesbot/ (the hosted shop pages cannot import across folders).
// A test checks that they match.

export const FILE_ACCEPT = '.pdf,.txt,.csv,.tsv,.md,.json,.html,.htm,.xml,.rtf,.docx,.xlsx,.pptx,application/pdf,text/*';

const TEXT_EXTENSIONS = new Set(['txt', 'csv', 'tsv', 'md', 'json', 'html', 'htm', 'xml', 'log']);
const MAX_PDF_BYTES = 2 * 1024 * 1024;
const MAX_ZIP_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
export const MAX_FILE_TEXT = 12000;

const extensionOf = (name) => (String(name).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

function tidy(text) {
  return text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---- A small zip reader (DOCX, XLSX and PPTX are zip files) ----

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function unzip(buffer, wanted) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let end = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 70000); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error('not a zip file');
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const found = new Map();
  const decoder = new TextDecoder();
  for (let n = 0; n < count && at + 46 <= buffer.byteLength; n += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) break;
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;
    if (!wanted(name) || found.size >= 40) continue;
    if (view.getUint32(local, true) !== 0x04034b50) continue;
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const raw = bytes.subarray(start, start + size);
    if (method === 0) found.set(name, decoder.decode(raw));
    else if (method === 8) found.set(name, decoder.decode(await inflate(raw)));
  }
  return found;
}

// ---- Office files ----

const numberedPart = (name, folder, prefix) => {
  const match = name.match(new RegExp(`^${folder}/${prefix}(\\d+)\\.xml$`));
  return match ? Number(match[1]) : null;
};

export async function docxText(buffer) {
  const parts = await unzip(buffer, (name) => name === 'word/document.xml');
  const xml = parts.get('word/document.xml');
  if (!xml) return '';
  return tidy(decodeEntities(xml
    .replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<\/w:tc>/g, ' | ')
    .replace(/<[^>]+>/g, '')));
}

export async function pptxText(buffer) {
  const parts = await unzip(buffer, (name) => numberedPart(name, 'ppt/slides', 'slide') !== null);
  const slides = [...parts.keys()].sort((a, b) => numberedPart(a, 'ppt/slides', 'slide') - numberedPart(b, 'ppt/slides', 'slide'));
  return tidy(slides.map((name, index) => `Slide ${index + 1}\n${decodeEntities(parts.get(name).replace(/<\/a:p>/g, '\n').replace(/<[^>]+>/g, ''))}`).join('\n\n'));
}

export async function xlsxText(buffer) {
  const parts = await unzip(buffer, (name) => name === 'xl/sharedStrings.xml' || name === 'xl/workbook.xml' || numberedPart(name, 'xl/worksheets', 'sheet') !== null);
  const shared = [];
  for (const match of (parts.get('xl/sharedStrings.xml') || '').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    shared.push(decodeEntities([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  }
  const sheets = [...parts.keys()].filter((name) => numberedPart(name, 'xl/worksheets', 'sheet') !== null)
    .sort((a, b) => numberedPart(a, 'xl/worksheets', 'sheet') - numberedPart(b, 'xl/worksheets', 'sheet')).slice(0, 3);
  const out = [];
  for (const name of sheets) {
    const rows = [];
    for (const row of parts.get(name).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const cell of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const type = (cell[1].match(/\bt="([^"]*)"/) || [])[1];
        const inner = cell[2] || '';
        const value = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        const inline = type === 'inlineStr' ? [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('') : '';
        const text = type === 's' ? shared[Number(value)] ?? '' : inline ? decodeEntities(inline) : value !== undefined ? decodeEntities(value) : '';
        cells.push(text);
      }
      while (cells.length && !cells[cells.length - 1]) cells.pop();
      if (cells.length) rows.push(cells.join(' | '));
      if (rows.length >= 400) break;
    }
    if (rows.length) out.push(`${sheets.length > 1 ? `Sheet ${out.length + 1}\n` : ''}${rows.join('\n')}`);
  }
  return tidy(out.join('\n\n'));
}

function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Reads one file. Returns
//   { ok: true, kind: 'pdf',  name, mimeType: 'application/pdf', data }  (data is base64)
//   { ok: true, kind: 'text', name, text }
//   { ok: false, name, reason }   (reason is a short sentence a person can read)
export async function readFile(file) {
  const name = String(file?.name || 'file');
  const extension = extensionOf(name);
  const type = String(file?.type || '').toLowerCase();
  try {
    if (type === 'application/pdf' || extension === 'pdf') {
      if (file.size > MAX_PDF_BYTES) return { ok: false, name, reason: 'this PDF is too big (more than 2 MB)' };
      return { ok: true, kind: 'pdf', name, mimeType: 'application/pdf', data: toBase64(new Uint8Array(await file.arrayBuffer())) };
    }
    if (extension === 'docx' || extension === 'xlsx' || extension === 'pptx') {
      if (file.size > MAX_ZIP_BYTES) return { ok: false, name, reason: 'this file is too big' };
      const buffer = await file.arrayBuffer();
      const text = extension === 'docx' ? await docxText(buffer) : extension === 'xlsx' ? await xlsxText(buffer) : await pptxText(buffer);
      return text ? { ok: true, kind: 'text', name, text: text.slice(0, MAX_FILE_TEXT) } : { ok: false, name, reason: 'there is no readable text in it' };
    }
    if (TEXT_EXTENSIONS.has(extension) || type.startsWith('text/') || type === 'application/json') {
      if (file.size > MAX_TEXT_BYTES) return { ok: false, name, reason: 'this file is too big' };
      let text = await file.text();
      if (extension === 'html' || extension === 'htm' || extension === 'xml') text = decodeEntities(text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '));
      text = tidy(text);
      return text ? { ok: true, kind: 'text', name, text: text.slice(0, MAX_FILE_TEXT) } : { ok: false, name, reason: 'it is empty' };
    }
  } catch {
    return { ok: false, name, reason: 'it could not be opened (it may be damaged or locked with a password)' };
  }
  return { ok: false, name, reason: `${extension ? `.${extension}` : 'this'} files cannot be opened here` };
}

// What to tell the person when some files could not be opened.
export function unreadableMessage(failed) {
  const list = failed.map((item) => `“${item.name}” (${item.reason})`).join(', ');
  return `I could not open ${list}. Please type what is in it here in the chat, or send a photo (image) of it, and I will help.`;
}
