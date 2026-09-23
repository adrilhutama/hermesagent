/* ============================================================
 * KosHub OS — components.js
 * Me-render elemen bersama di semua halaman:
 *  1. Sidebar navigasi (desktop) + drawer (mobile), auto-active.
 *  2. Topbar: status AI, Kos ID aktif, tombol settings.
 *  3. Universal Spotlight Command Bar (Ctrl+K / Cmd+K).
 *  4. Toast helper global.
 * Dependensi: state.js (KosHub), ai-client.js (KosAI), lucide.
 * ============================================================ */
(function (global) {
  'use strict';

  var NAV = [
    { href: '/app', page: 'app', icon: 'layout-dashboard', label: 'Overview' },
    { href: '/finance', page: 'finance', icon: 'wallet', label: 'Kas & Split Bill' },
    { href: '/inventory', page: 'inventory', icon: 'refrigerator', label: 'Kulkas & Dapur' },
    { href: '/schedule', page: 'schedule', icon: 'calendar-check', label: 'Piket' },
    { href: '/settings', page: 'settings', icon: 'settings-2', label: 'Pengaturan' },
  ];

  function currentPage() {
    return (document.body && document.body.dataset && document.body.dataset.page) || 'app';
  }

  function navHTML() {
    var page = currentPage();
    return NAV.map(function (n) {
      var on = n.page === page ? ' active' : '';
      return (
        '<a href="' + n.href + '" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm font-semibold text-zinc-300' + on + '">' +
        '<i data-lucide="' + n.icon + '" class="w-4.5 h-4.5 w-5 h-5"></i>' + n.label + '</a>'
      );
    }).join('');
  }

  function mountChrome() {
    var page = currentPage();
    var K = global.KosHub;
    var hasAI = !!(K && K.getKey());
    var kos = K ? K.activeKos() : { name: '-' };
    var kosId = K ? K.activeKosId() : '-';

    /* ---- sidebar desktop ---- */
    var side = document.getElementById('kh-sidebar');
    if (side) {
      side.innerHTML =
        '<a href="/" class="flex items-center gap-3 px-2 py-1">' +
        '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-400 flex items-center justify-center font-extrabold text-slate-950 text-lg">K</div>' +
        '<div><p class="font-extrabold leading-tight">KosHub <span class="text-sky-400">OS</span></p>' +
        '<p class="text-[11px] text-zinc-500">v2 · multi-page</p></div></a>' +
        '<nav class="mt-5 space-y-1.5">' + navHTML() + '</nav>' +
        '<div class="mt-6 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60">' +
        '<p class="text-[11px] uppercase tracking-wide text-zinc-500 font-bold">Kos aktif</p>' +
        '<p class="font-bold text-sm mt-1 truncate">' + K.esc(kos.name) + '</p>' +
        '<p class="text-[11px] text-zinc-500 font-mono truncate">' + K.esc(kosId) + '</p>' +
        '<a href="/settings" class="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300"><i data-lucide="repeat" class="w-3.5 h-3.5"></i>Ganti / Join</a></div>' +
        '<button onclick="KosUI.openSpotlight()" class="mt-4 w-full px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2">' +
        '<i data-lucide="sparkles" class="w-4 h-4"></i>AI Command <kbd class="text-[10px] bg-slate-950/20 rounded px-1.5 py-0.5 font-mono">Ctrl K</kbd></button>';
    }

    /* ---- mobile drawer ---- */
    var drawer = document.getElementById('kh-drawer');
    if (drawer) drawer.querySelector('nav').innerHTML = navHTML();

    /* ---- topbar ---- */
    var top = document.getElementById('kh-topbar');
    if (top) {
      top.innerHTML =
        '<button onclick="KosUI.toggleDrawer(true)" class="lg:hidden p-2 rounded-lg border border-zinc-800 bg-zinc-900"><i data-lucide="menu" class="w-5 h-5"></i></button>' +
        '<div class="flex-1 min-w-0"><p class="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">' + K.esc(page) + '</p>' +
        '<h1 id="kh-title" class="font-extrabold text-lg leading-tight truncate"></h1></div>' +
        '<span class="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ' +
        (hasAI ? 'border-sky-800 bg-sky-950 text-sky-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400') + '">' +
        '<span class="w-1.5 h-1.5 rounded-full ' + (hasAI ? 'bg-sky-400' : 'bg-zinc-600') + '"></span>' + (hasAI ? 'AI on' : 'AI lokal') + '</span>' +
        '<button onclick="KosUI.openSpotlight()" class="sm:hidden p-2 rounded-lg border border-zinc-800 bg-zinc-900"><i data-lucide="sparkles" class="w-5 h-5 text-sky-400"></i></button>' +
        '<a href="/settings" class="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-sky-500"><i data-lucide="settings-2" class="w-5 h-5"></i></a>';
    }

    /* ---- spotlight overlay ---- */
    if (!document.getElementById('kh-spot')) {
      var ov = document.createElement('div');
      ov.id = 'kh-spot';
      ov.className = 'hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm p-4';
      ov.innerHTML =
        '<div class="max-w-xl mx-auto mt-16 sm:mt-24 rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden fade-in">' +
        '<div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 spot-glow">' +
        '<i data-lucide="sparkles" class="w-4 h-4 text-sky-400 shrink-0"></i>' +
        '<input id="kh-spot-input" placeholder=\'Ketik bebas… cth: "Adril beli telur 1kg 28rb ditalangin sendiri"\' ' +
        'class="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-600" />' +
        '<kbd class="text-[10px] text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.5 font-mono">ESC</kbd></div>' +
        '<div class="px-4 py-2.5 flex flex-wrap gap-2 border-b border-zinc-800">' +
        ['Adril beli telur 1kg 28rb ditalangin sendiri', 'Minyak goreng sisa 0, beli baru 32rb oleh Budi', 'Bayar iuran sampah 15rb ditalangin Citra']
          .map(function (x) { return '<button onclick="KosUI.spotExample(this)" class="text-[11px] px-2.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 hover:border-sky-500 text-zinc-300">' + K.esc(x) + '</button>'; })
          .join('') + '</div>' +
        '<p id="kh-spot-status" class="px-4 py-3 text-xs text-zinc-500">Enter untuk proses · tanpa API key tetap jalan (parser lokal).</p></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) KosUI.openSpotlight(false); });
      ov.querySelector('#kh-spot-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') KosUI.spotRun();
      });
    }

    /* ---- toast ---- */
    if (!document.getElementById('kh-toast')) {
      var t = document.createElement('div');
      t.id = 'kh-toast';
      t.className = 'hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold shadow-xl max-w-[90vw] text-center';
      document.body.appendChild(t);
    }

    if (global.lucide) global.lucide.createIcons();
  }

  var toastT;
  function toast(msg) {
    var el = document.getElementById('kh-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.add('hidden'); }, 2600);
  }

  function setTitle(t) {
    var el = document.getElementById('kh-title');
    if (el) el.textContent = t;
  }

  function toggleDrawer(open) {
    var d = document.getElementById('kh-drawer');
    if (!d) return;
    d.classList.toggle('hidden', !open);
    if (global.lucide) global.lucide.createIcons();
  }

  function openSpotlight(open) {
    var ov = document.getElementById('kh-spot');
    if (!ov) return;
    var show = typeof open === 'boolean' ? open : ov.classList.contains('hidden');
    ov.classList.toggle('hidden', !show);
    if (show) {
      setTimeout(function () {
        var i = document.getElementById('kh-spot-input');
        if (i) i.focus();
      }, 30);
    }
    if (global.lucide) global.lucide.createIcons();
  }

  function spotExample(btn) {
    var i = document.getElementById('kh-spot-input');
    if (i) { i.value = btn.textContent.trim(); i.focus(); }
  }

  async function spotRun() {
    var input = document.getElementById('kh-spot-input');
    var status = document.getElementById('kh-spot-status');
    var text = (input.value || '').trim();
    if (!text) { toast('Ketik dulu catatannya'); return; }
    status.textContent = '⏳ Memproses…';
    try {
      var r = await global.KosAI.parse(text);
      var done = global.KosAI.apply(r.parsed, text);
      status.textContent = '✓ [' + r.via + '] ' + done.text;
      toast(done.text);
      input.value = '';
      setTimeout(function () { openSpotlight(false); }, 900);
    } catch (e) {
      status.textContent = '✗ ' + e.message;
    }
  }

  function icons() {
    if (global.lucide) global.lucide.createIcons();
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSpotlight();
    }
    if (e.key === 'Escape') {
      openSpotlight(false);
      toggleDrawer(false);
    }
  });

  document.addEventListener('DOMContentLoaded', mountChrome);
  if (global.KosHub) global.KosHub.onChange(function () { mountChrome(); });

  global.KosUI = {
    mountChrome: mountChrome,
    toast: toast,
    setTitle: setTitle,
    toggleDrawer: toggleDrawer,
    openSpotlight: openSpotlight,
    spotExample: spotExample,
    spotRun: spotRun,
    icons: icons,
  };
})(window);
