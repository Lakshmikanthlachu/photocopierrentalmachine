/* ==========================================================================
   Copixa — dashboard.js  (client portal + admin)
   Requires assets/vendor/chart.umd.min.js and assets/js/main.js
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;

  /* ---------- Charts (lazy, theme-aware) ---------- */
  var charts = {};
  function palette() {
    var dark = root.classList.contains('dark');
    return { dark: dark, grid: dark ? 'rgba(255,255,255,.06)' : 'rgba(14,20,36,.06)', text: dark ? '#8590ab' : '#646f8c', brand: '#3659ff', cyan: '#06b6d4', magenta: '#ec4899', yellow: '#facc15', ink: dark ? '#eceef5' : '#0e1424', card: dark ? '#0e1424' : '#ffffff' };
  }
  var months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  function base(p) {
    return {
      responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: p.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { family: 'Manrope', weight: 600 } } },
        tooltip: { backgroundColor: p.dark ? '#1b2133' : '#0e1424', titleFont: { family: 'Sora' }, bodyFont: { family: 'Manrope' }, padding: 12, cornerRadius: 12, rtl: root.dir === 'rtl' } },
      scales: { x: { reverse: root.dir === 'rtl', grid: { display: false }, ticks: { color: p.text, font: { family: 'Manrope' } }, border: { display: false } },
        y: { position: root.dir === 'rtl' ? 'right' : 'left', grid: { color: p.grid }, ticks: { color: p.text, font: { family: 'Manrope' } }, border: { display: false } } }
    };
  }
  function grad(ctx, c) { var g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 300); g.addColorStop(0, c + '55'); g.addColorStop(1, c + '00'); return g; }
  var builders = {
    usage: function (ctx, p) {
      return { type: 'line', data: { labels: months, datasets: [
        { label: 'Mono pages', data: [12.1, 9.8, 13.4, 14.2, 15.0, 13.8, 14.6, 12.9, 11.8, 15.4, 16.1, 15.2], borderColor: p.brand, backgroundColor: grad(ctx, p.brand), fill: true, tension: .4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6 },
        { label: 'Colour pages', data: [2.2, 1.9, 2.6, 2.8, 3.1, 2.7, 3.0, 2.4, 2.2, 3.3, 3.5, 3.2], borderColor: p.magenta, backgroundColor: grad(ctx, p.magenta), fill: true, tension: .4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6 }] },
        options: Object.assign(base(p), {}) };
    },
    spend: function (ctx, p) {
      return { type: 'bar', data: { labels: months, datasets: [{ label: 'Monthly spend ($)', data: [1120, 980, 1240, 1310, 1290, 1205, 1260, 1150, 1080, 1320, 1345, 1284], backgroundColor: months.map(function (m, i) { return i === 11 ? p.brand : (p.dark ? 'rgba(91,127,255,.35)' : '#dae4ff'); }), borderRadius: 10, borderSkipped: false, maxBarThickness: 34 }] },
        options: Object.assign(base(p), { plugins: Object.assign(base(p).plugins, { legend: { display: false } }) }) };
    },
    revenue: function (ctx, p) {
      return { type: 'bar', data: { labels: months, datasets: [
        { type: 'line', label: 'Active contracts', data: [1980, 2010, 2060, 2100, 2150, 2190, 2230, 2260, 2300, 2350, 2390, 2418], borderColor: p.magenta, borderWidth: 3, tension: .4, pointRadius: 0, yAxisID: 'y1' },
        { label: 'Revenue ($k)', data: [212, 205, 224, 231, 238, 241, 249, 252, 258, 266, 271, 285], backgroundColor: p.brand, borderRadius: 10, borderSkipped: false, maxBarThickness: 30 }] },
        options: (function () { var o = base(p); o.scales.y1 = { position: root.dir === 'rtl' ? 'left' : 'right', grid: { display: false }, ticks: { color: p.text }, border: { display: false } }; return o; })() };
    },
    categories: function (ctx, p) {
      return { type: 'doughnut', data: { labels: ['A3 MFP', 'A4 desktop', 'Production', 'Wide-format', 'Scanners'], datasets: [{ data: [46, 28, 9, 11, 6], backgroundColor: [p.brand, p.cyan, p.magenta, p.yellow, p.dark ? '#646f8c' : '#0e1424'], borderColor: p.card, borderWidth: 4, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%', animation: { animateRotate: true, duration: 1400 }, plugins: { legend: { position: 'bottom', rtl: root.dir === 'rtl', labels: { color: p.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 14, font: { family: 'Manrope', weight: 600 } } } } } };
    },
    sla: function (ctx, p) {
      return { type: 'line', data: { labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'], datasets: [{ label: 'SLA met (%)', data: [96.2, 97.1, 96.8, 98.0, 97.4, 98.3, 97.9, 98.6], borderColor: p.cyan, backgroundColor: grad(ctx, p.cyan), fill: true, tension: .4, borderWidth: 3, pointBackgroundColor: p.cyan, pointRadius: 3 }] },
        options: (function () { var o = base(p); o.plugins.legend = { display: false }; o.scales.y.suggestedMin = 94; o.scales.y.suggestedMax = 100; return o; })() };
    }
  };
  function buildVisible() {
    if (!window.Chart) return;
    $$('canvas[data-chart]').forEach(function (c) {
      if (charts[c.id] || !c.offsetParent) return;
      var p = palette(), ctx = c.getContext('2d');
      var cfg = builders[c.dataset.chart](ctx, p);
      if (c.id === 'c-revenue' && range < 12) { cfg.data.labels = cfg.data.labels.slice(-range); cfg.data.datasets.forEach(function (ds) { ds.data = ds.data.slice(-range); }); }
      charts[c.id] = new Chart(ctx, cfg);
    });
  }
  var range = 12;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-range]'); if (!b) return;
    range = +b.dataset.range;
    $$('[data-range]').forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', x === b); });
    var c = charts['c-revenue']; if (!c) return;
    var full = builders.revenue(c.ctx, palette()).data;
    c.data.labels = full.labels.slice(-range); c.data.datasets.forEach(function (ds, i) { ds.data = full.datasets[i].data.slice(-range); });
    c.update();
  });
  function rebuildAll() { Object.keys(charts).forEach(function (k) { charts[k].destroy(); delete charts[k]; }); buildVisible(); }
  document.addEventListener('tabchange', function () { setTimeout(buildVisible, 30); });
  document.addEventListener('themechange', rebuildAll);
  document.addEventListener('dirchange', rebuildAll);
  window.addEventListener('load', buildVisible);
  buildVisible();

  /* ---------- Table filters + pagination ---------- */
  $$('[data-table-scope]').forEach(function (scope) {
    var search = $('[data-table-search]', scope), status = $('[data-table-status]', scope), chips = $$('[data-table-chip]', scope), empty = $('[data-table-empty]', scope), count = $('[data-table-count]', scope);
    var per = parseInt(scope.dataset.paginate, 10), pager = per && window.copixaPaginator ? window.copixaPaginator(scope, per) : null;
    var chipVal = 'all';
    function apply(keep) {
      var q = search ? search.value.trim().toLowerCase() : '', st = status ? status.value : 'all', matched = [];
      $$('[data-row]', scope).forEach(function (r) {
        var s = r.dataset.status || '';
        var ok = (!q || r.textContent.toLowerCase().indexOf(q) > -1) && (st === 'all' || s === st) && (chipVal === 'all' || s === chipVal);
        r.hidden = !ok; if (ok) matched.push(r);
      });
      if (empty) empty.hidden = matched.length !== 0;
      if (count) count.textContent = matched.length;
      if (pager) pager.render(matched, keep);
    }
    scope.__apply = apply;
    search && search.addEventListener('input', function () { apply(); });
    status && status.addEventListener('change', function () { apply(); });
    chips.forEach(function (c) { c.addEventListener('click', function () { chipVal = c.dataset.tableChip; chips.forEach(function (x) { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', x === c); }); apply(); }); });
    apply();
  });

  /* ---------- Remove a row (with undo) ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove-row]'); if (!b) return;
    var row = b.closest('tr'), scope = b.closest('[data-table-scope]'), parent = row.parentNode, next = row.nextSibling;
    row.remove(); scope && scope.__apply && scope.__apply(true);
    window.copixaToast && window.copixaToast(b.dataset.removeRow + ' removed');
    var undo = document.createElement('button'); undo.type = 'button'; undo.textContent = 'Undo'; undo.className = 'pointer-events-auto ms-2 font-bold text-brand-300 underline dark:text-brand-700';
    var last = document.querySelector('#toast-wrap .toast:last-child span:last-child'); if (last) { last.appendChild(undo); undo.addEventListener('click', function () { parent.insertBefore(row, next); scope && scope.__apply && scope.__apply(true); undo.remove(); }); }
  });
  /* ---------- Edit user: open the sheet pre-filled ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-edit-user]'); if (!b) return;
    var v = b.dataset.editUser.split('|'), sh = $('#invite-sheet'); if (!sh) return;
    $('#inv-title', sh).textContent = 'Edit ' + v[0]; $('#iv-name', sh).value = v[0]; $('#iv-email', sh).value = v[1];
    var co = $('#iv-co', sh); [].forEach.call(co.options, function (o) { if (o.text === v[2]) co.value = o.value; });
    $$('input[name="role"]', sh).forEach(function (r) { r.checked = r.parentElement.textContent.indexOf(v[3]) === 0; });
    window.copixaSheet.open('invite-sheet');
  });
  document.addEventListener('sheetopen', function (e) { if (e.detail.id === 'invite-sheet') { var sh = $('#invite-sheet'); $('#inv-title', sh).textContent = 'Invite a user'; } });

  /* ---------- CSV export of a table ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-export-csv]'); if (!b) return;
    var t = document.getElementById(b.dataset.exportCsv); if (!t) return;
    var rows = [].map.call(t.querySelectorAll('tr'), function (tr) { return [].map.call(tr.querySelectorAll('th,td'), function (c) { return '"' + c.innerText.replace(/\s+/g, ' ').trim().replace(/"/g, '""') + '"'; }).slice(0, -1).join(','); });
    download(new Blob([rows.join('\n')], { type: 'text/csv' }), 'copixa-orders-report.csv');
    window.copixaToast && window.copixaToast('Report downloaded (CSV)');
  });
  function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  /* ---------- Invoice PDF (tiny dependency-free PDF writer) ---------- */
  function makePdf(lines) {
    var esc = function (t) { return String(t).replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '-'); };
    var ops = ['0.21 0.35 1 rg 0 792 612 -90 re f', 'BT 1 1 1 rg /F2 26 Tf 50 742 Td (Copixa.) Tj ET'], y = 650;
    lines.forEach(function (l) { ops.push('BT 0.1 0.12 0.2 rg /' + (l[0] === 'h' ? 'F2 18' : 'F1 11') + ' Tf 50 ' + y + ' Td (' + esc(l[1]) + ') Tj ET'); y -= l[0] === 'h' ? 30 : 20; });
    var stream = ops.join('\n'), objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'];
    var out = '%PDF-1.4\n', offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var x = out.length; out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (o) { return ('000000000' + o).slice(-10) + ' 00000 n \n'; }).join('');
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
    return new Blob([out], { type: 'application/pdf' });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-invoice-pdf]'); if (!b) return;
    var v = b.dataset.invoicePdf.split('|');
    download(makePdf([['h', 'Invoice ' + v[0]], ['p', 'Billed to: Northwind Legal LLP - Account NW-20418'], ['p', '210 Harbour Street, Floors 2-4, San Francisco, CA 94107'], ['p', 'Issued: ' + v[1] + '    Due: ' + v[2]], ['h', 'Summary'],
      ['p', 'Base rental - 6 devices'], ['p', 'Mono and colour pages above allowance'], ['p', 'Service, parts and toner - included'], ['h', 'Total: ' + v[3] + '   (' + v[4] + ')'], ['p', 'Thank you for renting with Copixa. Questions? billing@copixa.example.com']]), v[0] + '.pdf');
    window.copixaToast && window.copixaToast(v[0] + '.pdf downloaded');
  });

  /* ---------- Toggle switches ---------- */
  $$('[role="switch"]').forEach(function (s) {
    s.addEventListener('click', function () {
      var on = s.getAttribute('aria-checked') !== 'true';
      s.setAttribute('aria-checked', on);
      if (s.dataset.toast) window.copixaToast && window.copixaToast(s.dataset.toast.replace('{state}', on ? 'enabled' : 'disabled'));
    });
  });

  /* ---------- Action buttons that only toast ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-toast]:not([role="switch"])');
    if (b) { e.preventDefault(); window.copixaToast && window.copixaToast(b.dataset.toast); }
  });

  /* ---------- Quantity stepper ---------- */
  $$('[data-stepper]').forEach(function (s) {
    var input = $('input', s);
    $$('[data-step]', s).forEach(function (b) { b.addEventListener('click', function () { var v = Math.min(Math.max((+input.value || 1) + +b.dataset.step, +input.min || 1), +input.max || 99); input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); }); });
  });

  /* ---------- Request-a-machine builder ---------- */
  $$('[data-request]').forEach(function (f) {
    function calc() {
      var m = $('input[name="machine"]:checked', f), t = $('input[name="term"]:checked', f), q = +($('input[name="qty"]', f).value || 1);
      if (!m || !t) return;
      var price = +m.dataset.price * +t.dataset.factor, total = price * q;
      $('[data-sum-machine]', f).textContent = m.dataset.name;
      $('[data-sum-img]', f).src = m.dataset.img;
      $('[data-sum-term]', f).textContent = t.value + ' months';
      $('[data-sum-qty]', f).textContent = q;
      $('[data-sum-unit]', f).textContent = '$' + price.toFixed(0);
      $('[data-sum-total]', f).textContent = '$' + total.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    f.addEventListener('input', calc); f.addEventListener('change', calc); calc();
  });

  /* ---------- Service-call ticket rows open the timeline sheet ---------- */
  $$('[data-ticket]').forEach(function (r) {
    r.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      var d = JSON.parse(r.dataset.ticket), s = $('#ticket-sheet');
      Object.keys(d).forEach(function (k) { $$('[data-t-' + k + ']', s).forEach(function (el) { if (el.tagName === 'IMG') { el.src = d[k]; el.alt = d.engineer; } else el.textContent = d[k]; }); });
      window.copixaSheet.open('ticket-sheet');
    });
    r.setAttribute('tabindex', '0');
    r.addEventListener('keydown', function (e) { if (e.key === 'Enter') r.click(); });
  });

  /* ---------- Order rows open the order sheet ---------- */
  $$('[data-order]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = JSON.parse(b.dataset.order), s = $('#order-sheet');
      Object.keys(d).forEach(function (k) { $$('[data-o-' + k + ']', s).forEach(function (el) { if (el.tagName === 'IMG') { el.src = d[k]; el.alt = d.contact; } else el.textContent = d[k]; }); });
      window.copixaSheet.open('order-sheet');
    });
  });

  /* ---------- Inbox ---------- */
  $$('[data-inbox]').forEach(function (box) {
    var pane = $('[data-pane]', box), list = $('[data-thread-list]', box), body = $('[data-pane-body]', box);
    $$('[data-thread]', box).forEach(function (t) {
      t.addEventListener('click', function () {
        var d = JSON.parse(t.dataset.thread);
        $$('[data-thread]', box).forEach(function (x) { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', x === t); });
        t.classList.remove('is-unread'); var dot = $('[data-unread]', t); if (dot) dot.remove();
        $('[data-pane-name]', box).textContent = d.name; $('[data-pane-company]', box).textContent = d.company; $('[data-pane-subject]', box).textContent = d.subject;
        $('[data-pane-avatar]', box).src = d.avatar;
        body.innerHTML = '';
        d.msgs.forEach(function (m) { body.appendChild(bubble(m[0], m[1], m[2])); });
        box.classList.add('is-reading');
        body.scrollTop = body.scrollHeight;
      });
    });
    var back = $('[data-pane-back]', box); back && back.addEventListener('click', function () { box.classList.remove('is-reading'); });
    var form = $('[data-reply]', box);
    form && form.addEventListener('submit', function (e) {
      e.preventDefault(); var i = $('textarea', form); if (!i.value.trim()) return;
      body.appendChild(bubble(true, i.value.trim(), 'Just now')); i.value = ''; body.scrollTop = body.scrollHeight;
      window.copixaToast && window.copixaToast('Reply sent');
    });
    function bubble(mine, text, time) {
      var w = document.createElement('div'); w.className = 'flex ' + (mine ? 'justify-end' : 'justify-start');
      var b = document.createElement('div'); b.className = 'max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ' + (mine ? 'rounded-ee-md bg-brand-600 text-white' : 'rounded-es-md bg-ink-100 text-ink-800 dark:bg-white/5 dark:text-ink-200');
      b.textContent = text; var t = document.createElement('span'); t.className = 'mt-1 block text-[11px] ' + (mine ? 'text-white/70' : 'text-ink-400'); t.textContent = time; b.appendChild(t); w.appendChild(b); return w;
    }
    var ts = $('[data-thread-search]', box);
    ts && ts.addEventListener('input', function () { var q = ts.value.trim().toLowerCase(); $$('[data-thread]', box).forEach(function (t) { t.parentElement.hidden = q && t.textContent.toLowerCase().indexOf(q) === -1; }); });
    var first = $('[data-thread]', box); if (first && window.innerWidth >= 1024) { first.click(); }
  });
})();
