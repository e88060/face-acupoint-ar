# 顏面部穴位AR學習平台 v2.68

## 這是什麼
多頁式網站，含首頁與三個子頁面，結合AR臉部辨識與中醫顏面部穴位知識，
提供定位學習、跑考測驗、題庫自測與臨床應用參考。

## 網站結構
```
/index.html              首頁（簡介＋三個子頁面連結）
/pages/ar.html           顏面部穴位AR學習
/pages/quiz.html         顏面部穴位學習測驗（AR跑考／題庫選題測試）
/pages/clinical.html     常見疾病之顏面部穴位針灸技巧與異常狀況
/data/acupoints.json     穴位資料（純資料，供未來擴充使用）
/assets/sheet-webhook.gs 測驗成績寫入 Google Sheet 的 Apps Script（需另外部署）
/assets/acupoints-geo.js 穴位／肌肉／血管／解剖構造定位運算共用邏輯
                         （IDX / 幾何helper / ACUPOINTS / MUSCLES / VESSELS /
                         STRUCTURES / LANDMARKS / 三叉・顏面神經路徑），
                         **完整同步自 pages/ar.html**，quiz.html、clinical.html 皆引用
```

## 部署方式
- **GitHub Pages**：整個資料夾（含 index.html、pages/、assets/、data/）
  上傳到 repo 根目錄，Settings → Pages → Branch 選 main / (root) → Save，
  即可用 `https://你的帳號.github.io/repo名稱/` 開啟首頁
- 手機相機權限強制要求 HTTPS（localhost 除外）

## 各頁功能

### 首頁 index.html
簡介平台功能，提供三張卡片連結至各子頁面。

### 顏面部穴位AR學習 pages/ar.html
- 上方AR相機區 / 下方經絡分類清單，各經絡可收合展開
- 26 個顏面穴位（經外奇穴、大腸經、胃經、小腸經、膀胱經、三焦經、
  膽經、督脈、任脈），每個穴位含取穴、主治功效、解剖結構、針灸操作、
  可自訂「我的備註」
- 我的備註可存成帶時間戳記的 JSON 檔、可重新載入還原、自動存於瀏覽器 localStorage
- 「重要解剖結構」分類：
  - **神經**：三叉神經、顏面神經分支（虛線示意）
  - **血管**：顳淺動脈額支、滑車上／眶上動脈、顏面動脈、鼻背動脈、
    橫顏面動脈（虛線示意）
  - **肌肉**：額肌、皺眉肌、眼輪匝肌、顴大／顴小肌、提上唇肌群、
    口輪匝肌、降口角肌／頦肌（外框線＋半透明著色呈現大致範圍，
    額肌左右連續、口輪匝肌以弧形範圍呈現）
  - **其他重要構造**：口角聯合結節（Modiolus）、腮腺與腮腺管開口、
    頰脂墊（點位示意）
  - **解剖標記點（輔助定位）**：LC外眥、MC內眥、P瞳孔、Ch口角、
    Tr耳屏等文獻常用體表基準點，開啟「顯示說明」可看縮寫標籤，
    方便對照肌肉／血管範圍的計算基準
  - 上述肌肉／血管／其他構造內容參考 Hu et al. (2023) "Face painting as
    an anatomical learning tool based on individual ultrasonographic
    examination", *Clinical Anatomy* 36(3):426-432（doi:10.1002/ca.23974）
    整理改寫，非逐點對應原文獻圖表，僅供教學示意

### 顏面部穴位學習測驗 pages/quiz.html
- **AR跑考**：隨機出題顯示穴位名稱，使用者對著鏡頭在畫面上點出該穴位位置，
  系統以臉部關鍵點即時計算正確座標，依相對誤差評分（正確／大致正確／偏離）
- **題庫選題測試**：可依經絡範圍、題型（歸經／取穴位置／主治功效）、題數
  自訂測驗，選擇題作答並即時對答案、顯示總分
- **成績記錄**：交卷後自動送出至 Google 試算表
  （https://docs.google.com/spreadsheets/d/1-KL35h7E1uLgnAvQiVU9oxwGnyp2cRpMjF6CTyAecwU/edit ）
  ・畫面下方會顯示上傳狀態（上傳中／已記錄／失敗）
  ・上傳失敗時成績暫存於瀏覽器 localStorage（`quiz_results_pending_v1`），
    下次開啟本頁自動重試，亦可手動「重試上傳」或「下載CSV備份」
  ・送出方式為 JSONP（動態 script 標籤呼叫 Apps Script 的 `doGet`），
    以繞過 Apps Script `/exec` 轉址造成的 CORS 阻擋，並取得真正的寫入確認
  ・每筆成績帶唯一 `rid`，伺服器端據此去重，重試不會產生重複列
  ・webhook 設定與部署方式見 `assets/sheet-webhook.gs` 檔頭說明，
    網址填於 `pages/quiz.html` 的 `SHEET_WEBHOOK_URL`

### 常見疾病之顏面部穴位針灸技巧與異常狀況 pages/clinical.html
- 常見病症選穴與操作技巧（v2.68 依課程共筆與臨床資料大幅擴充）：
  面癱（顏面神經麻痺）、顏面痙攣（半面痙攣）、三叉神經痛、
  顳側頭痛／偏頭痛（少陽頭痛）、過敏性鼻炎、顳頜關節障礙、
  眼部疾患、眩暈、顏面美容針灸（美顏針）
- 各病症含臨床分型與鑑別、理學檢查重點、常用選穴、分區肌肉操作要點、
  中西醫治療參考與衛教重點
- 常見異常狀況與處理：暈針、皮下血腫、滯針／彎針、神經損傷風險、
  誤入腮腺與深部構造、放血操作之安全界線、頸部禁針區與氣胸風險、感染
- 依穴位解剖描述自動彙整「顏面高風險穴位一覽」表
- 文末列出所有參考資料來源

## 已知限制 / 待改善方向
- 額頭上部（原頭臨泣、本神、神庭、上星）因臉部網格無髮際線關鍵點未收錄
- 各穴位定位公式為比例外推估算，非逐點訓練模型，臉型差異大時仍可能有偏移
- 肌肉／血管／其他構造範圍同樣為比例外推估算，非個人化精確定位，
  且FaceMesh無耳朵關鍵點，Tr（耳屏）等耳部相關基準點以顳部／下頷角點近似
- AR跑考誤差評分門檻（正確/大致正確/偏離）為初版估算值，建議實測後於
  `pages/quiz.html` 內 `handleArqTap()` 函式中的 `relDist` 判斷式調整
- clinical.html 內容為課程共筆與臨床資料之彙整改寫（非逐句引用），
  可依實際教學需求持續擴充病症與案例
- clinical.html「顏面高風險穴位一覽」表目前僅取自穴位解剖描述關鍵字，
  尚未串連 ar.html 新增的血管資料，如需標註穴位鄰近血管可再擴充

## 程式結構重點（繼續修改時參考）
- `assets/acupoints-geo.js`：`IDX`（關鍵點索引）、幾何helper（`mid`/`off`/
  `bandPoints`/`arcThrough3Pts`/`convexHull` 等）、`MERIDIANS`、`ACUPOINTS`、
  `trigeminalPaths`/`facialNervePaths`、`MUSCLES`、`VESSELS`、`STRUCTURES`、
  `LANDMARKS`，共用於 quiz.html / clinical.html。
  ★ **唯一權威來源為 `pages/ar.html`**，本檔為其完整萃取副本，請勿單獨修改；
  於 ar.html 新增或修改穴位／肌肉／解剖資料後，須重新同步本檔
  （v2.68 已將兩者的 IDX／MUSCLES／VESSELS／ACUPOINTS 完全對齊）
- `pages/ar.html`：
  - `computePoints()` → `drawPoints()`：每幀計算穴位座標並疊加繪製
  - `buildPanel()`：依 ACUPOINTS 動態產生下方穴位清單 DOM
  - `MUSCLES` / `VESSELS` / `STRUCTURES` / `LANDMARKS`：肌肉、血管、
    其他重要構造、解剖標記點的資料與 calc 定位函式
  - `computeMuscleVesselOverlay()`：彙整上述四類資料為
    `{areas, paths, nodes}`，併入 `computeNerveOverlay()` 回傳
  - `drawNerves(overlayData)`：統一繪製函式，`areas`為面（外框＋半透明填色）、
    `paths`為虛線路徑、`nodes`／`points`為點位標記
- `pages/quiz.html`：`buildQuestion()` 產生題庫選擇題；`handleArqTap()` 處理
  AR跑考點擊評分邏輯

## v2.68 更新摘要
1. **版本號統一**：index.html、pages/clinical.html、pages/quiz.html（新增頁尾）、
   pages/ar.html 註解與 README 全部統一為 v2.68 · 2026年8月13日更新
2. **定位資料以 ar.html 為準完整同步**：重建 `assets/acupoints-geo.js`，
   將 ar.html 的 IDX（新增 mouthInnerTop/mouthInnerBottom）、幾何helper、
   ACUPOINTS、MUSCLES（含新版 `calc(kp, side, scale)` 簽章、`calcHole`
   挖空邏輯、放射狀 fibers）、VESSELS、STRUCTURES、LANDMARKS 全數同步；
   已通過語法檢查與全部 calc 函式執行測試（25穴位／20肌肉／6血管／
   4構造／5標記點）
3. **clinical.html 依參考資料大幅擴充**：新增顏面痙攣、顳側頭痛、眼部疾患、
   眩暈四個病症；擴充面癱（分型鑑別／House-Brackmann／連帶運動／護眼衛教）、
   三叉神經痛（流行病學／扳機點／中西醫治療）、過敏性鼻炎（上迎香透針）、
   顳頜關節障礙（咬肌・翼內外肌針法）、顏面美容針灸（美顏針分區肌肉操作）；
   異常狀況新增誤入腮腺、放血安全界線、頸部禁針區與氣胸風險；文末加註參考資料

## 成績記錄 webhook 疑難排解
- **成績沒有進試算表**：先用瀏覽器直接開啟 `SHEET_WEBHOOK_URL`，
  應回應 `ok: webhook alive`。若被導向 Google 登入頁，代表部署權限
  設成「僅限機構內使用者」，需改為「任何人」後重新部署。
- **網址形如 `https://script.google.com/a/macros/<機構網域>/s/.../exec`**：
  屬機構網域綁定，校外或未登入學員無法寫入；公開部署的網址不含 `/a/macros/<網域>/`。
- **改了 Apps Script 卻沒生效**：Apps Script 需「部署 → 管理部署作業 → 編輯
  → 版本選新版本 → 部署」才會更新線上版本。
- **健康檢查正常但成績寫不進去**：多半是前端送出被 CORS 擋掉。本專案已改用
  JSONP（`doGet` + `callback`），若 Apps Script 端仍是只有 `doPost` 的舊版本，
  成績會全部失敗——請確認已部署含 `doGet` 的新版 `assets/sheet-webhook.gs`。
  可直接在瀏覽器測試：
  `<你的/exec網址>?callback=cb&rid=test1&name=測試&mode=手動測試&score=1&total=1&timeText=0分01秒`
  應回傳 `cb({"ok":true,...});` 並在試算表新增一列。
- **學員端暫存的成績**：存於瀏覽器 localStorage 的 `quiz_results_pending_v1`，
  可請學員在頁面下方狀態列點「下載CSV備份」後回傳。
