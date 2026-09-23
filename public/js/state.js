/* ============================================================
 * KosHub OS — state.js
 * Modul manajemen data terpusat.
 * - LocalStorage schema : koshub_db_v2 (multi-tenant / multi-kos)
 * - CRUD                : transaksi kas, stok kulkas/dapur, piket
 * - Event               : 'koshub:update' terdispatch tiap persist,
 *                         semua halaman auto-update via listener.
 * ============================================================ */
(function (global) {
  'use strict';

  var DB_KEY = 'koshub_db_v2';

  /* ---------- util ---------- */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function fmtRp(n) {
    return 'Rp' + Number(n || 0).toLocaleString('id-ID');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayID() {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  }
  function nowISO() {
    return new Date().toISOString();
  }

  /* ---------- seed ---------- */
  function seedStore(name) {
    return {
      name: name,
      expenses: [
        { id: uid(), title: 'Telur 1kg', amount: 28000, by: 'Adril', cat: 'Dapur', date: nowISO() },
        { id: uid(), title: 'Iuran sampah', amount: 15000, by: 'Citra', cat: 'Iuran', date: nowISO() },
      ],
      inventory: [
        { id: uid(), name: 'Telur', qty: 1, unit: 'kg' },
        { id: uid(), name: 'Minyak goreng', qty: 0, unit: 'botol' },
        { id: uid(), name: 'Beras', qty: 5, unit: 'kg' },
        { id: uid(), name: 'Mie instan', qty: 8, unit: 'pcs' },
      ],
      chores: [
        { id: uid(), task: 'Senin — Adril: pel lantai + buang sampah', done: false },
        { id: uid(), task: 'Selasa — Budi: cuci piring + lap kompor', done: false },
        { id: uid(), task: 'Rabu — Citra: bersihkan kamar mandi', done: false },
        { id: uid(), task: 'Kamis — Adril: belanja mingguan', done: false },
        { id: uid(), task: 'Jumat — Budi: rapikan area jemur', done: false },
      ],
      activity: [
        { id: uid(), text: 'Workspace dibuat', kind: 'system', at: nowISO() },
      ],
      settings: { bynaraKey: '' },
      createdAt: nowISO(),
    };
  }

  function blankDB() {
    var s = seedStore('Kos Utama');
    return { activeKosId: 'kos-utama', kosList: [{ id: 'kos-utama', name: 'Kos Utama' }], stores: { 'kos-utama': s } };
  }

  function loadRaw() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (!raw) return null;
      var db = JSON.parse(raw);
      if (!db || !db.stores || !db.activeKosId || !db.stores[db.activeKosId]) return null;
      return db;
    } catch (e) {
      return null;
    }
  }

  var db = loadRaw() || blankDB();

  function persist() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) { /* storage penuh / private mode — abaikan */ }
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('koshub:update', { detail: { kosId: db.activeKosId } })
      );
    }
  }

  function saveQuiet() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) { /* abaikan */ }
  }

  /* ---------- tenant ---------- */
  function kosList() {
    return db.kosList.slice();
  }
  function activeKosId() {
    return db.activeKosId;
  }
  function store() {
    return db.stores[db.activeKosId];
  }
  function switchKos(id) {
    if (!db.stores[id]) return false;
    db.activeKosId = id;
    persist();
    return true;
  }
  function createKos(name) {
    var clean = String(name || '').trim() || 'Kos Baru';
    var id = 'kos-' + uid();
    db.kosList.push({ id: id, name: clean });
    db.stores[id] = seedStore(clean);
    db.stores[id].expenses = [];
    db.stores[id].chores = [];
    db.activeKosId = id;
    persist();
    return id;
  }
  function joinKos(id, name) {
    var clean = String(id || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return false;
    if (db.stores[clean]) {
      db.activeKosId = clean;
      persist();
      return true;
    }
    db.kosList.push({ id: clean, name: name || clean });
    db.stores[clean] = seedStore(name || clean);
    db.activeKosId = clean;
    persist();
    return true;
  }

  /* ---------- activity ---------- */
  function log(text, kind) {
    var s = store();
    s.activity.unshift({ id: uid(), text: text, kind: kind || 'info', at: nowISO() });
    if (s.activity.length > 60) s.activity.length = 60;
  }

  /* ---------- expenses ---------- */
  function addExpense(input) {
    var s = store();
    var item = {
      id: uid(),
      title: String(input.title || 'Tanpa judul').trim(),
      amount: Math.max(0, Number(input.amount) || 0),
      by: String(input.by || 'Penghuni').trim() || 'Penghuni',
      cat: String(input.cat || 'Lainnya').trim() || 'Lainnya',
      date: input.date || nowISO(),
    };
    s.expenses.unshift(item);
    log('Kas: ' + item.title + ' ' + fmtRp(item.amount) + ' (' + item.by + ')', 'expense');
    persist();
    return item;
  }
  function delExpense(id) {
    var s = store();
    s.expenses = s.expenses.filter(function (e) { return e.id !== id; });
    persist();
  }
  function monthExpenses() {
    var n = new Date();
    return store().expenses.filter(function (e) {
      var d = new Date(e.date);
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    });
  }
  function monthTotal() {
    return monthExpenses().reduce(function (a, e) { return a + Number(e.amount || 0); }, 0);
  }

  /* Patungan rata: siapa nalangin berapa vs porsi rata-rata. */
  function balances() {
    var paid = {};
    store().expenses.forEach(function (e) {
      paid[e.by] = (paid[e.by] || 0) + Number(e.amount || 0);
    });
    var names = Object.keys(paid);
    if (!names.length) return [];
    var total = names.reduce(function (a, n) { return a + paid[n]; }, 0);
    var share = total / names.length;
    return names
      .map(function (n) { return { name: n, paid: paid[n], share: share, net: paid[n] - share }; })
      .sort(function (a, b) { return a.net - b.net; });
  }

  /* Saran transfer settlement: yang minus bayar ke yang plus (greedy). */
  function settle() {
    var bal = balances();
    var debtors = bal.filter(function (b) { return b.net < -0.5; })
      .map(function (b) { return { name: b.name, amt: -b.net }; });
    var creditors = bal.filter(function (b) { return b.net > 0.5; })
      .map(function (b) { return { name: b.name, amt: b.net }; });
    var out = [], i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      var pay = Math.min(debtors[i].amt, creditors[j].amt);
      out.push({ from: debtors[i].name, to: creditors[j].name, amount: Math.round(pay) });
      debtors[i].amt -= pay;
      creditors[j].amt -= pay;
      if (debtors[i].amt < 0.5) i++;
      if (creditors[j].amt < 0.5) j++;
    }
    return out;
  }

  /* ---------- inventory ---------- */
  function addInventory(input) {
    var s = store();
    var name = String(input.name || '').trim();
    if (!name) return null;
    var qty = Math.max(0, Number(input.qty) || 0);
    var unit = String(input.unit || 'pcs').trim() || 'pcs';
    var found = null;
    s.inventory.forEach(function (it) {
      if (it.name.toLowerCase() === name.toLowerCase()) found = it;
    });
    if (found) {
      found.qty += qty;
      found.unit = unit;
    } else {
      found = { id: uid(), name: name, qty: qty, unit: unit };
      s.inventory.unshift(found);
    }
    log('Stok: ' + found.name + ' → ' + found.qty + ' ' + found.unit, 'inventory');
    persist();
    return found;
  }
  function setQty(id, qty) {
    var s = store();
    var it = null;
    s.inventory.forEach(function (x) { if (x.id === id) it = x; });
    if (!it) return;
    it.qty = Math.max(0, Number(qty) || 0);
    log('Stok: ' + it.name + ' → ' + it.qty + ' ' + it.unit, 'inventory');
    persist();
  }
  function bumpInv(id, d) {
    var s = store();
    var it = null;
    s.inventory.forEach(function (x) { if (x.id === id) it = x; });
    if (!it) return;
    setQty(id, it.qty + d);
  }
  function delInv(id) {
    var s = store();
    s.inventory = s.inventory.filter(function (i) { return i.id !== id; });
    persist();
  }
  function critics() {
    return store().inventory.filter(function (i) { return Number(i.qty) <= 1; });
  }

  /* ---------- chores ---------- */
  function addChore(task) {
    var v = String(task || '').trim();
    if (!v) return null;
    var c = { id: uid(), task: v, done: false };
    store().chores.unshift(c);
    log('Piket: +' + v, 'chore');
    persist();
    return c;
  }
  function toggleChore(id) {
    var hit = null;
    store().chores.forEach(function (c) { if (c.id === id) hit = c; });
    if (hit) {
      hit.done = !hit.done;
      log('Piket: ' + hit.task + (hit.done ? ' ✓' : ' dibuka lagi'), 'chore');
      persist();
    }
  }
  function delChore(id) {
    var s = store();
    s.chores = s.chores.filter(function (c) { return c.id !== id; });
    persist();
  }
  function resetChores() {
    store().chores.forEach(function (c) { c.done = false; });
    log('Siklus piket di-reset', 'chore');
    persist();
  }

  /* ---------- settings / backup ---------- */
  function getKey() {
    return (store().settings && store().settings.bynaraKey) || '';
  }
  function setKey(k) {
    store().settings.bynaraKey = String(k || '').trim();
    saveQuiet();
    persist();
  }
  function exportDB() {
    return JSON.stringify(db, null, 2);
  }
  function importDB(json) {
    var parsed = JSON.parse(json);
    if (!parsed || !parsed.stores || !parsed.activeKosId) throw new Error('Format backup tidak valid');
    db = parsed;
    persist();
  }
  function wipeActive() {
    var id = db.activeKosId;
    var name = db.stores[id].name;
    db.stores[id] = seedStore(name);
    db.stores[id].expenses = [];
    db.stores[id].inventory = [];
    db.stores[id].chores = [];
    db.stores[id].activity = [];
    persist();
  }
  function onChange(fn) {
    if (typeof window !== 'undefined') window.addEventListener('koshub:update', fn);
  }

  global.KosHub = {
    DB_KEY: DB_KEY,
    uid: uid, fmtRp: fmtRp, esc: esc, todayID: todayID, nowISO: nowISO,
    kosList: kosList, activeKosId: activeKosId, activeKos: function () { return db.stores[db.activeKosId]; },
    store: store, switchKos: switchKos, createKos: createKos, joinKos: joinKos,
    persist: persist, onChange: onChange,
    addExpense: addExpense, delExpense: delExpense,
    monthExpenses: monthExpenses, monthTotal: monthTotal,
    balances: balances, settle: settle,
    addInventory: addInventory, setQty: setQty, bumpInv: bumpInv, delInv: delInv, critics: critics,
    addChore: addChore, toggleChore: toggleChore, delChore: delChore, resetChores: resetChores,
    getKey: getKey, setKey: setKey,
    exportDB: exportDB, importDB: importDB, wipeActive: wipeActive,
  };
})(window);
