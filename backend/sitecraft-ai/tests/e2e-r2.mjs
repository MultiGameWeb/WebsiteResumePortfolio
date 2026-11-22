// Second phase: the same database, now with the R2 photo bucket connected.
// Checks that photos already in D1 still show, new photos go to R2, the migration moves the old ones
// without changing a byte, and deleting removes the files.
const API = "http://127.0.0.1:8787", ORIGIN = "http://127.0.0.1:8765", SID = "11111111-2222-4333-8444-555555555555", ADMIN = { Authorization: "Bearer test-admin-token" };
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const PNG2 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
let ipn = 0, pass = 0, fail = 0; const results = [];
const ok = (name, cond, extra = "") => { (cond ? pass++ : fail++); results.push(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + extra}`); };
const call = async (method, path, body, headers = {}) => {
  const response = await fetch(API + path, { method, headers: { "Content-Type": "application/json", Origin: ORIGIN, "CF-Connecting-IP": `10.2.${Math.floor(ipn / 250)}.${(ipn++ % 250) + 1}`, ...headers }, body: body ? JSON.stringify(body) : undefined });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, ...json };
};
const owner = (action, data = {}) => call("POST", "/api/botcraft/owner", { shopId: SID, action, ...data });
const bytesOf = async id => Buffer.from(await (await fetch(`${API}/api/botcraft/photo?id=${id}`)).arrayBuffer()).toString("base64");
const stats = () => call("GET", "/api/admin/photos", null, ADMIN);

let before = await stats();
ok("bucket connected; old photos still in D1", before.r2Available === true && before.inD1 > 0 && before.inR2 === 0, JSON.stringify(before));
let view = await owner("load");
const oldPhotos = view.photos.filter(p => p.kind === "product");
ok("old D1 photos are still listed", oldPhotos.length > 0);
const oldBytes = {}; for (const p of oldPhotos) oldBytes[p.photo_id] = await bytesOf(p.photo_id);
ok("old D1 photos are still served", Object.values(oldBytes).every(b => b === PNG), "bytes differ");

// new photo goes to R2
let r = await owner("upload_photo", { kind: "gallery", image: { mimeType: "image/png", data: PNG2 } });
let after = await stats();
ok("new photo is stored in R2", r.ok && after.inR2 === 1 && after.inD1 === before.inD1, JSON.stringify(after));
view = await owner("load"); const gallery = view.photos.filter(p => p.kind === "gallery");
ok("new R2 photo is served with the same bytes", gallery.length === 1 && (await bytesOf(gallery[0].photo_id)) === PNG2);
const served = await fetch(`${API}/api/botcraft/photo?id=${gallery[0].photo_id}`); ok("R2 photo has the right content type", /image\/png/.test(served.headers.get("content-type") || ""));

// main photo replaces the old one and its file
await owner("upload_photo", { kind: "main", image: { mimeType: "image/png", data: PNG } });
await owner("upload_photo", { kind: "main", image: { mimeType: "image/png", data: PNG2 } });
view = await owner("load");
ok("main photo: one row after two uploads", view.photos.filter(p => p.kind === "main").length === 1);
after = await stats(); ok("main photo: the old file was removed from R2", after.inR2 === 2, JSON.stringify(after));

// replace + delete remove files
const target = view.photos.find(p => p.kind === "product");
r = await owner("replace_photo", { photoId: target.photo_id, image: { mimeType: "image/png", data: PNG2 } });
after = await stats(); ok("replace: new photo in R2, no leftover", r.ok && after.inR2 === 3 && after.inD1 === before.inD1 - 1, JSON.stringify(after));
const gid = gallery[0].photo_id; await owner("delete_photo", { photoId: gid });
after = await stats(); ok("delete: the file is removed from R2", after.inR2 === 2, JSON.stringify(after));
ok("deleted photo is not served", (await fetch(`${API}/api/botcraft/photo?id=${gid}`)).status === 404);

// migration moves the rest without changing bytes
const stillD1 = (await owner("load")).photos.filter(p => p.kind === "product");
const idsBefore = {}; for (const p of stillD1) idsBefore[p.photo_id] = await bytesOf(p.photo_id);
let moved = 0, guard = 0, last;
do { last = await call("POST", "/api/admin/photos", { action: "migrate", limit: 2 }, ADMIN); moved += last.moved || 0; guard++; } while (last.ok && last.remaining > 0 && guard < 30);
ok("migration finishes with nothing left in D1", last.ok && last.remaining === 0 && last.inD1 === 0, JSON.stringify(last));
ok("migration moved the old photos", moved === before.inD1 - 1, `moved ${moved}`);
let same = true; for (const [id, b] of Object.entries(idsBefore)) if ((await bytesOf(id)) !== b) same = false;
ok("migrated photos are served byte for byte the same", same);
const again = await call("POST", "/api/admin/photos", { action: "migrate" }, ADMIN); ok("migration can be repeated safely", again.ok && again.moved === 0);

// deleting an item removes its photos' files
view = await owner("load"); const item = view.products.find(p => view.photos.some(ph => ph.kind === "product" && ph.product_key === p.name_key));
const itemPhotos = view.photos.filter(ph => ph.kind === "product" && ph.product_key === item.name_key).length;
const r2Before = (await stats()).inR2;
await owner("delete_product", { key: item.name_key });
const r2After = (await stats()).inR2;
ok("deleting an item removes its photo files", r2Before - r2After === itemPhotos && itemPhotos > 0, `${r2Before} -> ${r2After}, had ${itemPhotos}`);
ok("admin photo stats need the admin key", (await call("GET", "/api/admin/photos", null, { Authorization: "Bearer wrong" })).status === 401);

console.log(results.join("\n")); console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
