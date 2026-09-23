/* ============================================================
 * KosHub OS — ai-client.js
 * Kirim prompt bahasa alami -> POST /api/bynara (proxy serverless)
 * model: agnes-2.5-flash
 * Output: JSON murni {type,title,amount,by,qty} + fallback regex offline.
 * ============================================================ */
(function (global) {
  'use strict';

  var MODEL = 'agnes-2.5-flash';
  var ENDPOINT = '/api/bynara';

  var SYSTEM =
    'Kamu parser catatan kos ke JSON. Output HANYA JSON valid tanpa markdown, tanpa penjelasan. ' +
    'Skema: {"type":"expense"|"inventory","title":string,"amount":number,"by":string,"qty":number}. ' +
    'Aturan: "beli X <nominal> ditalangin Y" -> expense(title=X, amount=rupiah, by=Y, qty=1). ' +
    '"sisa 0/habis/kosong" -> inventory(qty=0, amount=0). ' +
    '"rb/ribu/k"=x1000, "jt/juta"=x1000000. "sendiri"->by="Adril". ' +
    'Contoh input "Adril beli telur 1kg 28rb ditalangin sendiri" -> ' +
    '{"type":"expense","title":"Telur 1kg","amount":28000,"by":"Adril","qty":1}.';

  /* ---------- offline fallback ---------- */
  function parseAmountLocal(text) {
    var m = text.match(/(\d+[\.,]?\d*)\s*(jt|juta|rb|ribu|k\b)?/i);
    if (!m) return 0;
    var n = parseFloat(String(m[1]).replace(',', '.'));
    var s = (m[2] || '').toLowerCase();
    if (s === 'jt' || s === 'juta') n *= 1e6;
    else if (s === 'rb' || s === 'ribu' || s === 'k') n *= 1e3;
    else if (n < 1000 && /(rb|ribu|k\b)/i.test(text)) n *= 1e3;
    return Math.round(n);
  }

  function localParse(text) {
    var t = String(text).toLowerCase();
    var isInv = /(sisa|stok|kulkas|dapur|butir|habis|kosong|beli baru)/.test(t);
    var amount = parseAmountLocal(text);
    var by = 'Penghuni';
    var mb = text.match(/ditalangin\s+(\w+)|ditanggung\s+(\w+)|ditalangi\s+(\w+)|oleh\s+(\w+)|nalangin\s+(\w+)/i);
    if (mb) by = (mb[1] || mb[2] || mb[3] || mb[4] || mb[5] || by).replace(/^sendiri$/i, 'Adril');
    if (/sendiri/.test(t) && by === 'Penghuni') by = 'Adril';
    var mq = text.match(/sisa\s+(\d+)|(\d+)\s*(kg|butir|pcs|liter|botol|bungkus|pack|karung)/i);
    var qty = mq ? Number(mq[1] || mq[2]) : ((isInv && /sisa\s*0|habis|kosong/.test(t)) ? 0 : 1);
    var title = text
      .replace(/ditalangin.*$/i, '').replace(/oleh.*$/i, '').replace(/Rp\.?/gi, '')
      .replace(/(\d+[\.,]?\d*)\s*(rb|ribu|k|jt|juta)\b/gi, '')
      .replace(/sisa\s*\d*/gi, '').replace(/beli baru/gi, '')
      .replace(/\s{2,}/g, ' ').trim() || text.slice(0, 60);
    var type = (isInv && amount === 0) ? 'inventory'
      : (isInv && /beli/.test(t) && amount > 0) ? 'expense'
      : isInv ? 'inventory' : 'expense';
    return { type: type, title: title, amount: amount, by: by, qty: qty };
  }

  function stripToJSON(s) {
    var fenced = String(s || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
    var cand = (fenced ? fenced[1] : String(s || '')).trim();
    var a = cand.indexOf('{'), b = cand.lastIndexOf('}');
    if (a >= 0 && b > a) return cand.slice(a, b + 1);
    return cand;
  }

  /* ---------- remote via proxy ---------- */
  async function remoteParse(text, apiKey) {
    var headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    var r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 256,
      }),
    });
    if (!r.ok) throw new Error('Proxy HTTP ' + r.status);
    var j = await r.json();
    var content = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    return JSON.parse(stripToJSON(content));
  }

  /* ---------- API publik ---------- */
  async function parse(text) {
    var t = String(text || '').trim();
    if (!t) throw new Error('Teks kosong');
    var key = (global.KosHub && global.KosHub.getKey()) || '';
    if (key) {
      try {
        var p = await remoteParse(t, key);
        return { parsed: p, via: 'AI' };
      } catch (e) {
        return { parsed: localParse(t), via: 'lokal (AI gagal: ' + e.message + ')' };
      }
    }
    return { parsed: localParse(t), via: 'lokal' };
  }

  /* Terapkan hasil parse ke store; kembalikan ringkasan untuk toast/status. */
  function apply(parsed, rawText) {
    if (!parsed || typeof parsed !== 'object') throw new Error('Hasil parse tidak valid');
    var K = global.KosHub;
    var title = String(parsed.title || rawText.slice(0, 60)).trim();
    var amount = Number(parsed.amount) || 0;
    var by = String(parsed.by || 'Penghuni').trim() || 'Penghuni';
    var qty = Number.isFinite(Number(parsed.qty)) ? Number(parsed.qty) : 1;
    if (parsed.type === 'inventory') {
      var name = title.replace(/^(beli|stok|sisa)\s+/i, '').trim() || title;
      var item = K.addInventory({ name: name, qty: 0, unit: 'pcs' });
      K.setQty(item.id, qty);
      return { kind: 'inventory', text: 'Inventaris: ' + name + ' → stok ' + qty };
    }
    K.addExpense({ title: title, amount: amount, by: by, cat: 'AI' });
    return { kind: 'expense', text: 'Kas: ' + title + ' ' + K.fmtRp(amount) + ' (' + by + ')' };
  }

  async function testConnection(apiKey) {
    var key = apiKey || ((global.KosHub && global.KosHub.getKey()) || '');
    if (!key) throw new Error('Isi BYNARA_API_KEY dulu');
    var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
    var r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'balas: ok' }],
        max_tokens: 8,
      }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return true;
  }

  global.KosAI = {
    MODEL: MODEL,
    parse: parse,
    apply: apply,
    localParse: localParse,
    testConnection: testConnection,
  };
})(window);
