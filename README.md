# 顏面部穴位AR學習平台 v1.4

## 這是什麼
多頁式網站，含首頁與三個子頁面，結合AR臉部辨識與中醫顏面部穴位知識，
提供定位學習、跑考測驗、題庫自測與臨床應用參考。

## 網站結構
```
/index.html              首頁（簡介＋三個子頁面連結）
/pages/ar.html           顏面部穴位AR學習（原v1.3單頁功能）
/pages/quiz.html         顏面部穴位學習測驗（AR跑考／題庫選題測試）
/pages/clinical.html     常見疾病之顏面部穴位針灸技巧與異常狀況
/data/acupoints.json     穴位資料（純資料，供未來擴充使用）
/assets/acupoints-geo.js 穴位定位運算共用邏輯（IDX/ACUPOINTS/calc），
                         由 ar.html 萃取，quiz.html、clinical.html 皆引用
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

### 顏面部穴位學習測驗 pages/quiz.html
- **AR跑考**：隨機出題顯示穴位名稱，使用者對著鏡頭在畫面上點出該穴位位置，
  系統以臉部關鍵點即時計算正確座標，依相對誤差評分（正確／大致正確／偏離）
- **題庫選題測試**：可依經絡範圍、題型（歸經／取穴位置／主治功效）、題數
  自訂測驗，選擇題作答並即時對答案、顯示總分

### 常見疾病之顏面部穴位針灸技巧與異常狀況 pages/clinical.html
- 常見病症選穴與操作技巧：面癱、三叉神經痛、過敏性鼻炎、顳頜關節障礙、
  顏面美容針灸
- 常見異常狀況與處理：暈針、皮下血腫、滯針／彎針、神經損傷風險、感染
- 依穴位解剖描述自動彙整「顏面高風險穴位一覽」表

## 已知限制 / 待改善方向
- 額頭上部（原頭臨泣、本神、神庭、上星）因臉部網格無髮際線關鍵點未收錄
- 各穴位定位公式為比例外推估算，非逐點訓練模型，臉型差異大時仍可能有偏移
- AR跑考誤差評分門檻（正確/大致正確/偏離）為初版估算值，建議實測後於
  `pages/quiz.html` 內 `handleArqTap()` 函式中的 `relDist` 判斷式調整
- clinical.html 內容為衛教彙整初版，可依實際教學需求擴充更多病症與案例

## 程式結構重點（繼續修改時參考）
- `assets/acupoints-geo.js`：`IDX`（關鍵點索引）、`ACUPOINTS`（穴位資料含
  calc定位函式）、`MERIDIANS`（經絡顏色）共用於 quiz.html / clinical.html。
  若於 ar.html 新增或修改穴位，需同步更新此檔案以保持測驗/臨床頁資料一致
- `pages/ar.html`：`computePoints()` → `drawPoints()` 每幀計算座標並疊加繪製；
  `buildPanel()` 依 ACUPOINTS 動態產生下方清單 DOM
- `pages/quiz.html`：`buildQuestion()` 產生題庫選擇題；`handleArqTap()` 處理
  AR跑考點擊評分邏輯
