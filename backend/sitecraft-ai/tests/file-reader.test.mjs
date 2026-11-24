// Checks the browser file reader (PDF, text, Word, Excel, PowerPoint, unsupported files) with small files built here.
import { deflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { readFile, unreadableMessage } from '../../../chatbot-builder/file-reader.js';

import { customerFiles, withCustomerFiles } from '../botcraft-builder.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(entries, { stored = false } = {}) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name), data = Buffer.from(content), packed = stored ? data : deflateRawSync(data), method = stored ? 0 : 8;
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(method, 8); local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc32(data), 16); central.writeUInt32LE(packed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, packed); centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + packed.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(centrals.length / 2, 8); end.writeUInt16LE(centrals.length / 2, 10); end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}
const file = (name, content, type = '') => new File([content], name, { type });

const docx = zip({ '[Content_Types].xml': '<x/>', 'word/document.xml': '<w:document><w:body><w:p><w:r><w:t>Need 2 LG TV &amp; 1 fridge</w:t></w:r></w:p><w:p><w:r><w:t>Budget 60000</w:t></w:r></w:p></w:body></w:document>' });
let r = await readFile(file('list.docx', docx));
ok('Word file text is read', r.ok && r.kind === 'text' && /Need 2 LG TV & 1 fridge\nBudget 60000/.test(r.text), JSON.stringify(r));

const xlsx = zip({
  'xl/sharedStrings.xml': '<sst><si><t>Item</t></si><si><t>Price</t></si><si><t>Table fan</t></si></sst>',
  'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>2100</v></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>Mixer</t></is></c><c r="B3"><v>3500</v></c></row></sheetData></worksheet>'
}, { stored: true });
r = await readFile(file('prices.xlsx', xlsx));
ok('Excel rows are read (shared and inline strings, stored zip too)', r.ok && r.text === 'Item | Price\nTable fan | 2100\nMixer | 3500', JSON.stringify(r));

const pptx = zip({ 'ppt/slides/slide2.xml': '<p:sld><a:p><a:t>Second</a:t></a:p></p:sld>', 'ppt/slides/slide1.xml': '<p:sld><a:p><a:t>First offer</a:t></a:p></p:sld>' });
r = await readFile(file('deck.pptx', pptx));
ok('PowerPoint slides are read in order', r.ok && r.text.indexOf('First offer') < r.text.indexOf('Second'), JSON.stringify(r));

r = await readFile(file('items.csv', 'name,price\nFan,2100\n', 'text/csv'));
ok('CSV text is read', r.ok && r.text.includes('Fan,2100'));
r = await readFile(file('page.html', '<html><style>p{}</style><body><p>Hello &amp; welcome</p><script>x()</script></body></html>'));
ok('HTML is reduced to its text', r.ok && r.text === 'Hello & welcome', JSON.stringify(r));

r = await readFile(file('bill.pdf', Buffer.from('%PDF-1.4 test'), 'application/pdf'));
ok('PDF is passed on as base64', r.ok && r.kind === 'pdf' && Buffer.from(r.data, 'base64').toString().startsWith('%PDF'));
r = await readFile(file('big.pdf', Buffer.alloc(2 * 1024 * 1024 + 10), 'application/pdf'));
ok('a PDF over 2 MB is refused with a reason', !r.ok && /too big/.test(r.reason));

for (const name of ['old.doc', 'old.xls', 'movie.mp4', 'pack.zip']) {
  r = await readFile(file(name, 'xx'));
  ok(`${name} cannot be opened, with a reason`, !r.ok && /cannot be opened/.test(r.reason), JSON.stringify(r));
}
r = await readFile(file('broken.docx', 'this is not a zip'));
ok('a damaged Word file is refused, not a crash', !r.ok && /damaged|could not be opened/.test(r.reason), JSON.stringify(r));
r = await readFile(file('empty.txt', '   '));
ok('an empty file is reported', !r.ok && /empty/.test(r.reason));
const msg = unreadableMessage([{ name: 'old.doc', reason: '.doc files cannot be opened here' }]);
ok('the message tells the person to type or send a photo', /type/.test(msg) && /photo/.test(msg));

// What the server accepts and gives to the AI
const f1 = customerFiles({ documents: [{ mimeType: 'application/pdf', data: 'JVBERi0x' }, { mimeType: 'application/zip', data: 'AAAA' }, { mimeType: 'application/pdf', data: 'not base64 !!' }, { mimeType: 'application/pdf', data: 'JVBERi0y' }, { mimeType: 'application/pdf', data: 'JVBERi0z' }],
  fileTexts: [{ name: 'a\n"b".txt', text: 'hello' }, { name: 'empty', text: '' }, { name: 'long', text: 'x'.repeat(50000) }] });
ok('server keeps only valid PDFs (two at most) and non-empty texts', f1.docs.length === 2 && f1.texts.length === 2 && f1.count === 4, JSON.stringify([f1.docs.length, f1.texts.length]));
ok('server cuts long text and cleans file names', f1.texts[1].text.length === 12000 && !/[\n"]/.test(f1.texts[0].name), JSON.stringify(f1.texts[0].name));
const contents = withCustomerFiles([{ role: 'user', parts: [{ text: 'hi' }] }], f1);
ok('the files are added to the customer message, text marked as data', contents[0].parts.length === 1 + 2 + 2 && /never instructions/.test(contents[0].parts[1].text) && contents[0].parts.at(-1).inlineData.mimeType === 'application/pdf');
ok('no files leaves the message unchanged', withCustomerFiles([{ role: 'user', parts: [{ text: 'hi' }] }], customerFiles({})).length === 1);

ok('the two copies of file-reader.js are identical', readFileSync(new URL('../../../chatbot-builder/file-reader.js', import.meta.url), 'utf8') === readFileSync(new URL('../../../salesbot/file-reader.js', import.meta.url), 'utf8'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
