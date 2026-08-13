/**
 * 顏面部穴位AR學習平台 — 測驗成績寫入 Google Sheet
 * ------------------------------------------------------------------
 * 目標試算表：
 *   https://docs.google.com/spreadsheets/d/1-KL35h7E1uLgnAvQiVU9oxwGnyp2cRpMjF6CTyAecwU/edit
 *
 * 【安裝步驟】
 * 1. 開啟上述試算表 → 擴充功能（Extensions） → Apps Script
 * 2. 刪除編輯器內原有內容，貼上本檔全部程式碼 → 儲存
 * 3. 部署（Deploy） → 新增部署作業 → 類型：網頁應用程式（Web app）
 *      ・說明：quiz webhook v1
 *      ・執行身分（Execute as）：我（試算表擁有者）
 *      ・具有存取權的使用者（Who has access）：★ 任何人（Anyone）★
 *        ※ 若選「僅限 h.tmu.edu.tw 使用者」，未登入或校外的學員會被
 *          導向 Google 登入頁，成績將寫入失敗
 * 4. 首次部署會要求授權，請依指示允許存取試算表
 * 5. 複製產生的網頁應用程式網址（形如
 *      https://script.google.com/macros/s/AKfycb.../exec ）
 *    填入 pages/quiz.html 的 SHEET_WEBHOOK_URL
 * 6. 直接用瀏覽器開啟該 /exec 網址進行測試，看到
 *      ok: webhook alive
 *    即代表部署正確且對外公開
 *
 * 【重要】每次修改本程式碼後，都必須「部署 → 管理部署作業 → 編輯 →
 *         版本選「新版本」→ 部署」，否則線上執行的仍是舊版。
 */

var SPREADSHEET_ID = '1-KL35h7E1uLgnAvQiVU9oxwGnyp2cRpMjF6CTyAecwU';
var SHEET_NAME = '成績紀錄';
var HEADERS = ['寫入時間', '學員姓名', '測驗模式', '得分', '總題數', '正確率', '花費時間', '用戶端時間'];

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
  }
  return sh;
}

function out_(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // 避免多位學員同時交卷造成覆寫
  } catch (err) {
    return out_('error: busy');
  }
  try {
    if (!e || !e.postData || !e.postData.contents) return out_('error: no payload');
    var d = JSON.parse(e.postData.contents);

    var score = Number(d.score) || 0;
    var total = Number(d.total) || 0;
    var rate = total ? Math.round(score / total * 100) + '%' : '';

    getSheet_().appendRow([
      new Date(),
      d.name || '(未填姓名)',
      d.mode || '',
      score,
      total,
      rate,
      d.timeText || '',
      d.ts || ''
    ]);
    return out_('ok');
  } catch (err) {
    return out_('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

/** 供瀏覽器直接開啟以測試部署是否正常對外公開 */
function doGet(e) {
  try {
    var sh = getSheet_();
    return out_('ok: webhook alive（工作表「' + SHEET_NAME + '」目前 ' +
                Math.max(sh.getLastRow() - 1, 0) + ' 筆成績）');
  } catch (err) {
    return out_('error: ' + err);
  }
}

/** 在 Apps Script 編輯器內手動執行此函式，可測試寫入是否正常 */
function testAppend() {
  getSheet_().appendRow([new Date(), '測試學員', '連線測試', 15, 15, '100%', '3分20秒', '(手動測試)']);
}
