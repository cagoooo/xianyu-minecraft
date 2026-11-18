/* 鱻魚學園網頁版：學生登記（年、班、座號）＋把闖關進度送到老師的後台試算表（GAS，2026-11-18）
 * 只送年班座號、哪一站、花幾秒、答錯幾次、目前進度與通關碼；不收姓名。
 * 沒登記（按「先不登記」）的學生不會送出任何資料。
 * 送出用 text/plain 的簡單 POST（no-cors），網路斷掉時先存在這台裝置，下次打開頁面再補送。 */
(function () {
  'use strict';
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxRzUHQMTomog-lT-Gt16jAH2Wxa4ywvGwa4xenD-bmHrM-e4unIw4beAJHjUZ4s2zRjg/exec';
  var SKEY = 'xianyu-web-student', DKEY = 'xianyu-web-device', OKEY = 'xianyu-web-outbox', QKEY = 'xianyu-web-qsec', FKEY = 'xianyu-web-flags';
  var P = window.XianyuProgress;
  var TEST = /[?&]test=1\b/.test(location.search);       // 老師測試：可選「0 年」，資料寫進「測試紀錄」分頁

  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var dev = rd(DKEY, null);
  if (!dev) { dev = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); wr(DKEY, dev); }

  var R = {
    student: function () { return rd(SKEY, null); },               // {grade, cls, seat} 或 {skip:true} 或 null（還沒選）
    registered: function () { var s = R.student(); return !!(s && !s.skip); },
    label: function () { var s = R.student(); return s && !s.skip ? s.grade + ' 年 ' + s.cls + ' 班 ' + s.seat + ' 號' : ''; },
    qsec: function () { return rd(QKEY, 0); },
    addQsec: function (sec) { wr(QKEY, Math.min(86400, R.qsec() + sec)); },
    once: function (flag) { var f = rd(FKEY, {}); if (f[flag]) return false; f[flag] = 1; wr(FKEY, f); return true; },
    log: function (page, ev, extra) {
      if (!R.registered()) return;
      var s = R.student(), x = extra || {};
      send({
        grade: s.grade, cls: s.cls, seat: s.seat, dev: dev, page: page, ev: ev, item: x.item || '',
        level: P.get().level, sec: x.sec, wrong: x.wrong, qsec: R.qsec(), code: P.code() || '',
        counts: { st: P.count('stations'), hi: P.count('hi'), lm: P.count('landmarks'), wk: P.count('walk') }
      });
    }
  };

  function post(body) {
    return fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body });
  }
  function send(payload) {
    var body = JSON.stringify(payload);
    post(body).catch(function () { var q = rd(OKEY, []); if (q.length < 300) q.push(body); wr(OKEY, q); });
  }
  function flush() {
    var q = rd(OKEY, []);
    if (!q.length || !navigator.onLine) return;
    wr(OKEY, []);
    q.forEach(function (body) { post(body).catch(function () { var r = rd(OKEY, []); r.push(body); wr(OKEY, r); }); });
  }
  window.addEventListener('online', flush);
  setTimeout(flush, 1500);

  // ── 登記畫面 ──
  var css = '.who-card{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;background:#fff7df;border:1px solid #f0dd9b;border-radius:12px;padding:10px 14px;font-size:var(--fs-sm)}' +
    '.who-card b{color:#7a5a00}.who-card button{font:inherit;font-weight:700;border:2px solid #e6cf86;background:#fff;border-radius:999px;padding:4px 14px;min-height:36px;cursor:pointer;color:var(--ink)}' +
    'dialog.who-dlg{border:0;border-radius:18px;padding:0;width:min(440px,94vw);background:var(--bg);color:var(--ink);box-shadow:0 30px 80px rgba(0,0,0,.35)}' +
    'dialog.who-dlg::backdrop{background:rgba(20,28,40,.6)}.who-dlg form{padding:22px}.who-dlg h2{margin:0 0 6px;font-size:var(--fs-lg)}' +
    '.who-dlg p{margin:0 0 14px;color:var(--ink-soft);font-size:var(--fs-sm)}.who-row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
    '.who-row3 label{font-weight:700;font-size:var(--fs-sm)}.who-row3 select,.who-row3 input{width:100%;font:inherit;font-size:var(--fs-md);padding:8px 10px;min-height:46px;border:2px solid var(--line);border-radius:10px;background:#fff;margin-top:4px}' +
    '.who-err{color:#b3352a;font-weight:700;min-height:1.4em;margin:8px 0 0;font-size:var(--fs-sm)}.who-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.who-btns .btn{flex:1;justify-content:center}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var dlg = null, after = null;
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'who-dlg';
    var grades = (TEST ? [0] : []).concat([1, 2, 3, 4, 5, 6]);
    dlg.innerHTML = '<form method="dialog" novalidate><h2>📋 先登記你是誰</h2>' +
      '<p>填年、班、座號，你的闖關進度和時間就會傳給老師。不用寫名字。</p>' +
      '<div class="who-row3"><label>年級<select name="g">' + grades.map(function (g) { return '<option value="' + g + '">' + (g === 0 ? '0（測試）' : g + ' 年') + '</option>'; }).join('') + '</select></label>' +
      '<label>班<input name="c" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="例如 3"></label>' +
      '<label>座號<input name="s" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="例如 12"></label></div>' +
      '<p class="who-err" role="alert"></p>' +
      '<div class="who-btns"><button class="btn btn-main" type="submit" value="ok">✔ 登記</button><button class="btn btn-ghost" type="button" data-skip>先不登記</button></div>' +
      '<p style="margin:12px 0 0;font-size:var(--fs-xs)">不登記也可以玩，只是老師看不到你的紀錄。之後隨時可以按「更改」登記。</p></form>';
    document.body.appendChild(dlg);
    var f = dlg.querySelector('form');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = parseInt(f.g.value, 10), c = parseInt(f.c.value, 10), s = parseInt(f.s.value, 10);
      if (!(c >= 1 && c <= 40) || !(s >= 1 && s <= 60)) { dlg.querySelector('.who-err').textContent = '請填班（1～40）和座號（1～60）的數字'; return; }
      wr(SKEY, { grade: g, cls: c, seat: s });
      R.log(document.body.dataset.page || 'quest', 'register');
      close();
    });
    dlg.querySelector('[data-skip]').onclick = function () { wr(SKEY, { skip: true }); close(); };
  }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); R.render(); var cb = after; after = null; if (cb) cb(); }
  R.ask = function (cb) {
    if (!dlg) build();
    after = cb || null;
    var s = R.student();
    if (s && !s.skip) { dlg.querySelector('[name=g]').value = String(s.grade); dlg.querySelector('[name=c]').value = s.cls; dlg.querySelector('[name=s]').value = s.seat; }
    dlg.querySelector('.who-err').textContent = '';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    var c = dlg.querySelector('[name=c]'); if (c) c.focus();
  };
  // 第一次要玩的時候才問；已經選過（登記或不登記）就直接開始
  R.ensure = function (cb) { if (R.student()) cb(); else R.ask(cb); };
  // 頁面上的小卡：顯示目前登記狀態
  R.render = function () {
    document.querySelectorAll('[data-who]').forEach(function (el) {
      var on = R.registered();
      el.innerHTML = '<div class="who-card">' + (on ? '📋 紀錄給老師：<b>' + R.label() + '</b>' : '📋 ' + (R.student() ? '沒有登記，紀錄不會給老師' : '還沒登記年、班、座號')) +
        '<button type="button">' + (on ? '更改' : '登記') + '</button></div>';
      el.querySelector('button').onclick = function () { R.ask(); };
    });
  };
  document.addEventListener('DOMContentLoaded', R.render);
  if (document.readyState !== 'loading') R.render();

  window.XianyuRecord = R;
})();
