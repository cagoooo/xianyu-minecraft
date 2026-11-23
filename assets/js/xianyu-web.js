/* 鱻魚學園網頁版共用（闖關版 quest、360° 導覽 tour、生活減碳 life、魔王關 boss）：進度、通關碼、徽章、阿凱老師語音
 * 進度存在這台裝置的瀏覽器（localStorage）；登記年班座號後，xianyu-record.js 才會把進度送給老師。
 * 通關碼和遊戲裡的 certCode()（scripts/akai-gm.src.js）同一套編碼；遊戲碼編碼前的數字一定小於 112,000,000。
 *   112,000,000～112,000,055：網頁版第 1 版（景點×8＋走讀），舊碼仍可解
 *   112,100,000 起：網頁版第 2 版（2026-11-23），多了垃圾分類、關燈、太陽能、冷氣、魔王關、高年級站數
 * certificate.html 的解碼要跟這裡一起改。 */
(function () {
  'use strict';
  var KEY = 'xianyu-web-progress-v1';
  var ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var WEB2_BASE = 112100000;

  function blank() { return { stations: {}, landmarks: {}, walk: {}, hi: {}, life: { recycle: 0, power: 0, solar: 0, ac: 0 }, boss: 0, level: 'mid' }; }
  var state = null;
  function load() {
    if (state) return state;
    state = blank();
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && typeof raw === 'object') {
        ['stations', 'landmarks', 'walk', 'hi'].forEach(function (k) { if (raw[k] && typeof raw[k] === 'object') state[k] = raw[k]; });
        if (raw.life && typeof raw.life === 'object') ['recycle', 'power', 'solar', 'ac'].forEach(function (k) { state.life[k] = Number(raw.life[k]) || 0; });
        state.boss = raw.boss ? 1 : 0;
        if (raw.level === 'low' || raw.level === 'mid' || raw.level === 'high') state.level = raw.level;
      }
    } catch (e) { /* 私密視窗或封鎖儲存空間：只在這次開啟期間記得 */ }
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // 徽章：只看能放進通關碼的數字，證書頁才能用同一套規則畫出來（certificate.html 的 BADGES 要一起改）
  var BADGES = [
    { id: 'water', icon: '🏅', name: '愛水小尖兵', how: '闖關版 4 站全部過關', ok: function (v) { return v.st >= 4; } },
    { id: 'high', icon: '🎓', name: '高年級挑戰者', how: '用高年級題目過關 4 站', ok: function (v) { return v.hi >= 4; } },
    { id: 'guide', icon: '🧭', name: '石門小導遊', how: '360° 導覽聽完 6 個景點故事', ok: function (v) { return v.lm >= 6; } },
    { id: 'walk', icon: '🌊', name: '走讀達人', how: '7 個走讀挑戰全部答對', ok: function (v) { return v.wk >= 7; } },
    { id: 'sort', icon: '♻️', name: '分類高手', how: '垃圾分類正確 10 件以上', ok: function (v) { return v.rec >= 10; } },
    { id: 'power', icon: '💡', name: '節電小尖兵', how: '隨手關燈＋冷氣調到 26～28 度', ok: function (v) { return v.power && v.ac; } },
    { id: 'solar', icon: '☀️', name: '綠能小博士', how: '幫太陽能板找到最好的位置', ok: function (v) { return !!v.solar; } },
    { id: 'boss', icon: '🛡️', name: '水庫守護者', how: '通過魔王關', ok: function (v) { return !!v.boss; } }
  ];

  var P = {
    get: load,
    mark: function (kind, id) { load()[kind][id] = 1; save(); P.emit(); },
    has: function (kind, id) { return !!load()[kind][id]; },
    count: function (kind) { return Object.keys(load()[kind]).length; },
    setLevel: function (lv) { load().level = lv; save(); },
    life: function () { return load().life; },
    setLife: function (k, v) { load().life[k] = v; save(); P.emit(); },
    addRecycle: function (n) { var l = load().life; l.recycle = Math.min(99, l.recycle + n); save(); P.emit(); },
    lifeDone: function () { var l = load().life; return (l.recycle >= 10 ? 1 : 0) + (l.power ? 1 : 0) + (l.solar ? 1 : 0) + (l.ac ? 1 : 0); },
    setBoss: function () { load().boss = 1; save(); P.emit(); },
    bossUnlocked: function () { return P.count('stations') >= 4 && P.count('walk') >= 7; },
    reset: function () { state = blank(); save(); P.emit(); },
    listeners: [],
    on: function (fn) { P.listeners.push(fn); },
    emit: function () { P.listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); },
    numbers: function () {
      var l = load().life;
      return { st: P.count('stations'), hi: Math.min(4, P.count('hi')), lm: Math.min(6, P.count('landmarks')), wk: Math.min(7, P.count('walk')),
        rec: Math.min(99, l.recycle), power: l.power ? 1 : 0, solar: l.solar ? 1 : 0, ac: l.ac ? 1 : 0, boss: load().boss ? 1 : 0 };
    },
    badges: function () { var v = P.numbers(); return BADGES.map(function (b) { return { id: b.id, icon: b.icon, name: b.name, how: b.how, got: !!b.ok(v) }; }); },
    badgeCount: function () { return P.badges().filter(function (b) { return b.got; }).length; },
    /* 通關碼：4 站闖關都完成才給（跟遊戲一樣）；其他關卡的成績一起編進去 */
    code: function () {
      if (P.count('stations') < 4) return null;
      var v = P.numbers();
      var r = v.lm * 8 + v.wk;
      r = r * 100 + v.rec; r = r * 2 + v.power; r = r * 2 + v.solar; r = r * 2 + v.ac; r = r * 2 + v.boss; r = r * 5 + v.hi;
      var n = WEB2_BASE + r;                               // 最大 112,547,999，小於 2^27
      n = (n * 48271 + 9177) % 134217728;                  // < 2^53，整數運算不會失真
      var d = [];
      for (var j = 0; j < 6; j++) { d.unshift(n % 32); n = Math.floor(n / 32); }
      var check = d.reduce(function (s, x, k) { return s + x * (k + 1); }, 0) % 32;
      var s = d.concat([check]).map(function (x) { return ABC[x]; }).join('');
      return s.slice(0, 3) + '-' + s.slice(3);
    }
  };

  /* 阿凱老師語音：同一時間只播一段，換段就停掉上一段 */
  var audio = null, muted = false;
  try { muted = localStorage.getItem('xianyu-web-muted') === '1'; } catch (e) {}
  var V = {
    play: function (id) {
      V.stop();
      if (muted || !id) return;
      audio = new Audio('assets/voice/' + id + '.mp3');
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});        // 瀏覽器擋自動播放時，靜靜略過（畫面上還有文字）
    },
    stop: function () { if (audio) { audio.pause(); audio = null; } },
    muted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('xianyu-web-muted', muted ? '1' : '0'); } catch (e) {}
      if (muted) V.stop();
      return muted;
    }
  };

  window.XianyuProgress = P;
  window.XianyuVoice = V;
})();
