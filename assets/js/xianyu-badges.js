/* 鱻魚學園網頁版：「關卡地圖」與「徽章牆」共用元件（2026-11-23）
 *   <div data-levels></div>  → 4 種關卡的卡片與進度（闖關、360° 導覽、生活減碳、魔王關）
 *   <div data-badges></div>  → 8 枚徽章（拿到的彩色、沒拿到的灰色＋怎麼拿）
 * 需要先載入 xianyu-web.js。 */
(function () {
  'use strict';
  var P = window.XianyuProgress;
  var css = '.lv-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}' +
    '.lv-card{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-top:6px solid var(--c);border-radius:var(--radius);padding:14px 16px;transition:transform .15s,box-shadow .15s}' +
    '.lv-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(29,36,51,.1)}.lv-card[aria-current="page"]{background:#f4f9fd;border-color:var(--water)}' +
    '.lv-card .ic{font-size:1.8rem;line-height:1.1}.lv-card strong{font-size:var(--fs-md)}.lv-card small{color:var(--ink-soft);font-size:var(--fs-sm)}' +
    '.lv-card .st{margin-top:auto;padding-top:6px;font-weight:900;color:var(--c);font-size:var(--fs-sm)}.lv-card.locked{opacity:.75}' +
    '.badge-wall{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}' +
    '.bdg{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:10px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}' +
    '.bdg .ic{font-size:2rem;line-height:1.2;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#fff7df;border:3px solid #f0c94a}' +
    '.bdg strong{font-size:var(--fs-sm);line-height:1.3}.bdg small{font-size:.78rem;color:var(--ink-soft);line-height:1.35}' +
    '.bdg.no .ic{filter:grayscale(1);opacity:.35;background:#f1eee6;border-color:#d8d1c0}.bdg.no strong{color:var(--ink-soft)}' +
    '.bdg-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 10px}.bdg-head h2{margin:0;font-size:clamp(1.3rem,2.2vw,1.8rem)}' +
    '@media (max-width:1100px){.lv-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.badge-wall{grid-template-columns:repeat(4,minmax(0,1fr))}}' +
    '@media (max-width:640px){.lv-cards{grid-template-columns:minmax(0,1fr)}.badge-wall{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
    '@media (prefers-reduced-motion:reduce){.lv-card{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function levels() {
    var here = document.body.dataset.page;
    var lf = P.lifeDone(), unlocked = P.bossUnlocked(), boss = P.get().boss;
    var L = [
      { page: 'quest', href: 'quest.html', c: 'var(--fish)', ic: '🎯', name: '闖關版', desc: '4 站問答（低／中／高年級）', st: P.count('stations') + ' / 4 站' + (P.count('stations') >= 4 ? ' ✔' : '') },
      { page: 'tour', href: 'tour.html', c: 'var(--water)', ic: '🧭', name: '360° 虛擬導覽', desc: '景點故事＋7 個走讀挑戰', st: '景點 ' + P.count('landmarks') + '/6・走讀 ' + P.count('walk') + '/7' },
      { page: 'life', href: 'life.html', c: 'var(--leaf)', ic: '♻️', name: '生活減碳任務', desc: '垃圾分類、關燈、太陽能、冷氣', st: lf + ' / 4 項' + (lf >= 4 ? ' ✔' : '') },
      { page: 'boss', href: 'boss.html', c: '#8a3fb0', ic: '🛡️', name: '魔王關', desc: '10 題混合題型，3 顆愛心', st: boss ? '已通過 ✔' : unlocked ? '可以挑戰了！' : '🔒 闖關 4 站＋走讀 7 題後解鎖', locked: !unlocked && !boss },
    ];
    return '<div class="lv-cards">' + L.map(function (l) {
      return '<a class="lv-card' + (l.locked ? ' locked' : '') + '" href="' + l.href + '" style="--c:' + l.c + '"' + (l.page === here ? ' aria-current="page"' : '') + '>' +
        '<span class="ic" aria-hidden="true">' + l.ic + '</span><strong>' + l.name + '</strong><small>' + l.desc + '</small><span class="st">' + l.st + '</span></a>';
    }).join('') + '</div>';
  }
  function badges() {
    var b = P.badges(), n = b.filter(function (x) { return x.got; }).length;
    return '<div class="bdg-head"><h2>🏆 我的徽章牆</h2><span>' + n + ' / 8 枚</span></div><div class="badge-wall">' + b.map(function (x) {
      return '<div class="bdg' + (x.got ? '' : ' no') + '"><span class="ic" aria-hidden="true">' + x.icon + '</span><strong>' + x.name + '</strong><small>' + (x.got ? '已獲得！' : x.how) + '</small></div>';
    }).join('') + '</div>';
  }
  function render() {
    document.querySelectorAll('[data-levels]').forEach(function (el) { el.innerHTML = levels(); });
    document.querySelectorAll('[data-badges]').forEach(function (el) { el.innerHTML = badges(); });
  }
  P.on(render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  window.XianyuBadges = { render: render };
})();
