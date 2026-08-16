/**
 * 顏面部穴位AR學習平台 — 測驗成績寫入 Google Sheet
 * ------------------------------------------------------------------
 * 目標試算表：
 *   https://docs.google.com/spreadsheets/d/1-KL35h7E1uLgnAvQiVU9oxwGnyp2cRpMjF6CTyAecwU/edit
 *
 * 【為什麼用 JSONP（doGet）而不是 doPost】
 *   Apps Script 的 /exec 在收到跨網域請求後會 302 轉址到
 *   script.googleusercontent.com，瀏覽器端用 fetch 讀取回應時常被 CORS 擋下。
 *   傳統解法是 fetch + mode:'no-cors'，但那樣完全讀不到回應，
 *   寫入失敗時前端毫無所覺（成績靜默消失）。
 *   改用 JSONP（以 <script> 標籤載入 doGet，回傳 callback 包住的 JSON）
 *   可完全繞過 CORS，且前端能拿到真正的成功／失敗確認。
 *   doPost 仍保留以相容舊版與其他呼叫方式。
 *
 * 【安裝步驟】
 * 1. 開啟上述試算表 → 擴充功能（Extensions） → Apps Script
 * 2. 刪除編輯器內原有內容，貼上本檔全部程式碼 → 儲存
 * 3. 部署（Deploy） → 管理部署作業 → 編輯（鉛筆）→ 版本選「新版本」→ 部署
 *      ※ 首次部署請選：新增部署作業 → 網頁應用程式
 *      ・執行身分（Execute as）：我（試算表擁有者）
 *      ・具有存取權的使用者（Who has access）：★ 任何人（Anyone）★
 * 4. /exec 網址填入 pages/quiz.html 的 SHEET_WEBHOOK_URL
 * 5. 用瀏覽器（建議無痕視窗）開啟 /exec，看到 ok: webhook alive 即正常
 *
 * 【重要】每次修改本程式碼後都必須重新部署「新版本」，否則線上仍是舊版。
 */

var SPREADSHEET_ID = '1-KL35h7E1uLgnAvQiVU9oxwGnyp2cRpMjF6CTyAecwU';
var SHEET_NAME = '成績紀錄';
var HEADERS = ['寫入時間', '學員姓名', '測驗模式', '得分', '總題數', '正確率', '花費時間', '用戶端時間', '紀錄ID'];
var RID_COL = 9; // 紀錄ID 所在欄，用於避免重複寫入

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(3, 140);
  } else if (sh.getLastColumn() < HEADERS.length) {
    // 舊版只有 8 欄，補上新增的「紀錄ID」欄
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  }
  return sh;
}

function out_(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}

function jsonp_(callback, obj) {
  if (!callback) return out_(JSON.stringify(obj));
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/** 依紀錄ID判斷是否已寫入過（前端重試時避免產生重複列） */
function alreadyLogged_(sh, rid) {
  if (!rid) return false;
  var last = sh.getLastRow();
  if (last < 2) return false;
  var vals = sh.getRange(2, RID_COL, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(rid)) return true;
  }
  return false;
}

function writeRow_(d) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 避免多位學員同時交卷造成覆寫
    // v2.76：原為 20000，比前端逾時（舊版12秒）還長，會出現「伺服器仍在等鎖、
    // 前端已判定失敗」的情況。現縮短為 10 秒，並將前端逾時放寬至 30 秒。
  } catch (err) {
    return { ok: false, error: 'busy' };
  }
  try {
    var sh = getSheet_();
    if (alreadyLogged_(sh, d.rid)) return { ok: true, duplicate: true };

    var score = Number(d.score) || 0;
    var total = Number(d.total) || 0;
    var rate = total ? Math.round(score / total * 100) + '%' : '';

    sh.appendRow([
      new Date(),
      d.name || '(未填姓名)',
      d.mode || '',
      score,
      total,
      rate,
      d.timeText || '',
      d.ts || '',
      d.rid || ''
    ]);
    return { ok: true, row: sh.getLastRow() };
  } catch (err) {
    return { ok: false, error: String(err) };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 無參數時 → 健康檢查
 * 帶 name/mode/score/total 等參數時 → 寫入一筆成績
 * 帶 callback 參數時 → 以 JSONP 格式回傳結果
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (!p.name && !p.mode && !p.score && !p.total) {
      var sh = getSheet_();
      var n = Math.max(sh.getLastRow() - 1, 0);
      var info = { ok: true, alive: true, count: n };
      if (p.callback) return jsonp_(p.callback, info);
      return out_('ok: webhook alive（工作表「' + SHEET_NAME + '」目前 ' + n + ' 筆成績）');
    }
    var r = writeRow_(p);
    if (p.callback) return jsonp_(p.callback, r);
    return out_(r.ok ? 'ok' : 'error: ' + r.error);
  } catch (err) {
    var e2 = { ok: false, error: String(err) };
    if (p.callback) return jsonp_(p.callback, e2);
    return out_('error: ' + err);
  }
}

/** 保留 POST 介面以相容其他呼叫方式 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return out_('error: no payload');
    var r = writeRow_(JSON.parse(e.postData.contents));
    return out_(r.ok ? 'ok' : 'error: ' + r.error);
  } catch (err) {
    return out_('error: ' + err);
  }
}

/** 在 Apps Script 編輯器內手動執行此函式，可測試寫入是否正常 */
function testAppend() {
  Logger.log(writeRow_({
    name: '測試學員', mode: '連線測試', score: 15, total: 15,
    timeText: '3分20秒', ts: '(手動測試)', rid: 'manual-' + Date.now()
  }));
}
