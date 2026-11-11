// Applies a confirmed Owner Update plan through the owner API, and undoes it.
// Shared by the owner page ("Update with chat") and the setup chat, so both
// behave the same.
//
//   call(action, data)  → Promise<boolean>: sends one owner action, refreshes the view
//   getView()           → the latest owner view ({ products, info, customBotName, … })

export async function applyPlan({ ops, images = [], call, getView }) {
  const undo = [];
  let undoable = true;
  let done = 0;
  let failed = 0;
  const infoPatch = {};
  const infoBefore = {};
  const created = new Map(); // new item name (lower case) → key

  const findProduct = (key, name) => {
    const products = getView().products || [];
    return products.find((p) => p.name_key === key) || products.find((p) => p.name.toLowerCase() === String(name || '').toLowerCase());
  };
  const fields = (product, patch) => ({
    key: product.name_key, name: product.name, price_text: product.price_text || '', details: product.details || '', stock_status: product.stock_status || 'in_stock', ...patch,
  });

  for (const op of ops) {
    let ok = true;
    const product = findProduct(op.key, op.name);
    if (op.type === 'set_price' && product) {
      undo.push({ action: 'save_product', data: fields(product) });
      ok = await call('save_product', fields(product, { price_text: op.price }));
    } else if (op.type === 'set_stock' && product) {
      undo.push({ action: 'save_product', data: fields(product) });
      ok = await call('save_product', fields(product, { stock_status: op.out_of_stock ? 'out_of_stock' : 'in_stock' }));
    } else if (op.type === 'set_details' && product) {
      undo.push({ action: 'save_product', data: fields(product) });
      ok = await call('save_product', fields(product, { details: op.details }));
    } else if (op.type === 'add_item') {
      ok = await call('save_product', { key: '', name: op.name, price_text: op.price || '', details: op.details || '', stock_status: 'in_stock' });
      const made = ok ? findProduct('', op.name) : null;
      if (made) { created.set(op.name.toLowerCase(), made.name_key); undo.push({ action: 'delete_product', data: { key: made.name_key } }); }
    } else if (op.type === 'delete_item' && product) {
      undoable = false;
      ok = await call('delete_product', { key: product.name_key });
    } else if (op.type === 'set_info') {
      infoBefore[op.field] = getView().info?.[op.field] || '';
      infoPatch[op.field] = op.value;
      continue; // saved together below
    } else if (op.type === 'rename_bot') {
      undo.push({ action: 'set_bot_name', data: { name: getView().customBotName || '' } });
      ok = await call('set_bot_name', { name: op.value });
    } else if (op.type === 'attach_photo') {
      undoable = false;
      const image = images[op.image];
      const key = op.kind === 'product' ? (op.key || created.get(String(op.name || '').toLowerCase()) || findProduct('', op.name)?.name_key || '') : '';
      ok = !image || (op.kind === 'product' && !key) ? false : await call('upload_photo', { kind: op.kind, productKey: key, image });
    } else {
      ok = false;
    }
    if (ok) done += 1; else failed += 1;
  }
  const infoCount = Object.keys(infoPatch).length;
  if (infoCount) {
    const ok = await call('save_info', { info: infoPatch });
    if (ok) { done += infoCount; undo.push({ action: 'save_info', data: { info: infoBefore } }); } else failed += infoCount;
  }
  return { done, failed, undo, undoable: undoable && undo.length > 0 && done > 0 };
}

export async function runUndo(undo, call) {
  for (const step of [...undo].reverse()) await call(step.action, step.data);
}
