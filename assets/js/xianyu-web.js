/* 鱻魚學園網頁版（闖關版 quest.html＋360° 導覽 tour.html）共用：進度、通關碼、阿凱老師語音
 * 進度只存在這台裝置的瀏覽器（localStorage），不傳到任何伺服器。
 * 通關碼和遊戲裡的 certCode()（scripts/akai-gm.src.js）同一套編碼；
 * 遊戲的碼編碼前的數字一定小於 112,000,000（所有欄位範圍相乘）；網頁版改用 112,000,000 以上的空間，
 * 只放「景點數×8＋走讀數」，所以 certificate.html 一看就知道是網頁版，不會跟遊戲的碼重複。 */
(function () {
  'use strict';
  var KEY = 'xianyu-web-progress-v1';
  var ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var WEB_BASE = 112000000;                             // = 5×7×8×100×2×5×100×2×2，遊戲碼用不到的起點

  function blank() { return { stations: {}, landmarks: {}, walk: {}, level: 'mid' }; }
  var state = null;
  function load() {
    if (state) return state;
    state = blank();
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && typeof raw === 'object') {
        ['stations', 'landmarks', 'walk'].forEach(function (k) { if (raw[k] && typeof raw[k] === 'object') state[k] = raw[k]; });
        if (raw.level === 'low' || raw.level === 'mid') state.level = raw.level;
      }
    } catch (e) { /* 私密視窗或封鎖儲存空間：只在這次開啟期間記得 */ }
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var P = {
    get: load,
    mark: function (kind, id) { load()[kind][id] = 1; save(); P.emit(); },
    has: function (kind, id) { return !!load()[kind][id]; },
    count: function (kind) { return Object.keys(load()[kind]).length; },
    setLevel: function (lv) { load().level = lv; save(); },
    reset: function () { state = blank(); save(); P.emit(); },
    listeners: [],
    on: function (fn) { P.listeners.push(fn); },
    emit: function () { P.listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); },
    /* 通關碼：4 站闖關都完成才給（跟遊戲一樣）；景點、走讀數也會一起編進去 */
    code: function () {
      if (P.count('stations') < 4) return null;
      var n = WEB_BASE + Math.min(6, P.count('landmarks')) * 8 + Math.min(7, P.count('walk'));
      n = (n * 48271 + 9177) % 134217728;                // < 2^53，整數運算不會失真
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
