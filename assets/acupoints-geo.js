/* 共用穴位幾何資料 — 由 pages/ar.html (v2.68) 之 IDX / 幾何helper / ACUPOINTS /
   MUSCLES / VESSELS / STRUCTURES / LANDMARKS 定位邏輯完整萃取同步，
   供 quiz.html（AR跑考測驗）與 clinical.html 使用。
   ★ 唯一權威來源為 pages/ar.html，本檔為其自動同步副本，請勿單獨修改。 */

const IDX = {
  browOuterR: 70,  browMidR: 105, browInnerR: 107,
  browOuterL: 300, browMidL: 334, browInnerL: 336,
  eyeOuterR: 33,   eyeInnerR: 133, eyeTopR: 159, eyeBottomR: 145,
  eyeOuterL: 263,  eyeInnerL: 362, eyeTopL: 386, eyeBottomL: 374,
  noseTip: 4, noseBase: 2, noseAlaR: 129, noseAlaL: 358,
  glabella: 168, foreheadTop: 10, chin: 152,
  cheekR: 234, cheekL: 454,
  jawR: 172, jawL: 397,
  templeR: 127, templeL: 356,
  mouthCornerR: 61, mouthCornerL: 291,
  upperLipTop: 0, lowerLipBottom: 17,
  mouthInnerTop: 13, mouthInnerBottom: 14,
  foreheadCornerR: 21, foreheadCornerL: 251
};

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function mid(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
function off(p, dx, dy) { return { x: p.x + dx, y: p.y + dy }; }
function pupilCenter(kp, s) {
  const outer = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
  const inner = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
  const top = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
  const bottom = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
  return mid(mid(outer, inner, 0.5), mid(top, bottom, 0.5), 0.5);
}
// 口角聯合結節（modiolus）位置：顴大肌／顴小肌等多條表情肌之共同止點參考
function modiolusPoint(kp, s, sc) {
  const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
  const dir = s==='R'?-1:1;
  return off(mouth, dir*sc*0.09, sc*0.07);
}

// 取二次貝茲曲線上的取樣點（不含起點p0，含終點p1），供肌肉外框繪製平滑弧線用
function quadBezierPts(p0, c, p1, steps) {
  steps = steps || 6;
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const it = 1 - t;
    pts.push({
      x: it * it * p0.x + 2 * it * t * c.x + t * t * p1.x,
      y: it * it * p0.y + 2 * it * t * c.y + t * t * p1.y
    });
  }
  return pts;
}

// 通過 p1→p2→p3 三點的正圓弧取樣（用於額肌上緣等需要真正圓弧外形之處）
function arcThrough3Pts(p1, p2, p3, steps) {
  steps = steps || 14;
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (Math.abs(d) < 1e-6) return [p1, p2, p3]; // 三點共線，退回折線
  const s1 = p1.x * p1.x + p1.y * p1.y;
  const s2 = p2.x * p2.x + p2.y * p2.y;
  const s3 = p3.x * p3.x + p3.y * p3.y;
  const ux = (s1 * (p2.y - p3.y) + s2 * (p3.y - p1.y) + s3 * (p1.y - p2.y)) / d;
  const uy = (s1 * (p3.x - p2.x) + s2 * (p1.x - p3.x) + s3 * (p2.x - p1.x)) / d;
  const r = Math.hypot(p1.x - ux, p1.y - uy);
  const norm = a => { while (a < -Math.PI) a += 2 * Math.PI; while (a > Math.PI) a -= 2 * Math.PI; return a; };
  const a1 = Math.atan2(p1.y - uy, p1.x - ux);
  const rel2 = norm(Math.atan2(p2.y - uy, p2.x - ux) - a1);
  let sweep = norm(Math.atan2(p3.y - uy, p3.x - ux) - a1);
  // 若中間點不落在 a1→a3 的短弧上，改走另一側，確保圓弧真的通過 p2
  if ((sweep >= 0) !== (rel2 >= 0) || Math.abs(rel2) > Math.abs(sweep)) {
    sweep = sweep >= 0 ? sweep - 2 * Math.PI : sweep + 2 * Math.PI;
  }
  const out = [];
  for (let i = 1; i <= steps; i++) {
    const a = a1 + sweep * (i / steps);
    out.push({ x: ux + r * Math.cos(a), y: uy + r * Math.sin(a) });
  }
  return out;
}

// 取橢圓（可上下半徑不同、呈卵形）外框取樣點，供口輪匝肌等環狀肌繪製用
function ovalPoints(center, rx, ryTop, ryBottom, steps) {
  steps = steps || 28;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const ry = Math.sin(a) < 0 ? ryTop : ryBottom;
    pts.push({ x: center.x + rx * Math.cos(a), y: center.y + ry * Math.sin(a) });
  }
  return pts;
}

// 沿中心線取樣、依垂直方向外擴成帶狀（緞帶）多邊形，供條狀肌肉（如皺眉肌、顴肌、降口角肌等）繪製用
// pts：中心線上的點陣列；halfWidths：對應每點的半寬（單一數字＝全段等寬，陣列＝可漸縮變化）
function bandPoints(pts, halfWidths) {
  const n = pts.length;
  const w = Array.isArray(halfWidths) ? halfWidths : pts.map(() => halfWidths);
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = pts[i - 1] || p;
    const next = pts[i + 1] || p;
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    left.push({ x: p.x + nx * w[i], y: p.y + ny * w[i] });
    right.push({ x: p.x - nx * w[i], y: p.y - ny * w[i] });
  }
  return [...left, ...right.reverse()];
}

// 沿中心線取樣、依垂直方向以指定比例（-1~1，0為中心線）外擴，產生多條與 bandPoints 走向一致的平行細線，
// 供條狀肌肉繪製肌纖維走向示意線用（同一色系細線，非填色範圍）
function fiberLines(pts, halfWidths, fractions) {
  fractions = fractions || [-0.55, 0, 0.55];
  const n = pts.length;
  const w = Array.isArray(halfWidths) ? halfWidths : pts.map(() => halfWidths);
  return fractions.map(frac => {
    const line = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const prev = pts[i - 1] || p;
      const next = pts[i + 1] || p;
      const dx = next.x - prev.x, dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      line.push({ x: p.x + nx * w[i] * frac, y: p.y + ny * w[i] * frac });
    }
    return line;
  });
}

// 依比例縮放橢圓，取得同心環狀細線（首尾相接），供環狀肌（口輪匝肌、眼輪匝肌）繪製肌纖維走向示意用
function ringLines(center, rx, ryTop, ryBottom, scales, steps) {
  scales = scales || [0.55, 0.82];
  return scales.map(sc => {
    const line = ovalPoints(center, rx * sc, ryTop * sc, ryBottom * sc, steps || 24);
    return [...line, line[0]];
  });
}

// 沿一串折線（依序連接的端點）依弧長等距取樣 n 個點，供額肌等大範圍肌肉產生大量纖維走向線的起點用
function sampleAlongPolyline(pts, n) {
  const segLens = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = dist(pts[i], pts[i + 1]);
    segLens.push(d);
    total += d;
  }
  const result = [];
  for (let k = 0; k < n; k++) {
    const target = total * (n === 1 ? 0 : k / (n - 1));
    let acc = 0, seg = 0;
    while (seg < segLens.length - 1 && acc + segLens[seg] < target) { acc += segLens[seg]; seg++; }
    const segLen = segLens[seg] || 1;
    const t = Math.min(1, Math.max(0, (target - acc) / segLen));
    result.push(mid(pts[seg], pts[seg + 1], t));
  }
  return result;
}

// 依索引點集合計算凸包（monotone chain 演算法），供以實際 FaceMesh 關鍵點索引群組
// （如鼻肌橫部／翼部）直接描繪外框範圍使用
function convexHull(points) {
  if (points.length < 3) return points;
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

const MERIDIANS = {
  EX:  { name: '經外奇穴', color: '#95a5a6' },
  LI:  { name: '大腸經',   color: '#f5a623' },
  ST:  { name: '胃經',     color: '#e74c3c' },
  SI:  { name: '小腸經',   color: '#9b59b6' },
  BL:  { name: '膀胱經',   color: '#3498db' },
  SJ:  { name: '三焦經',   color: '#1abc9c' },
  GB:  { name: '膽經',     color: '#2ecc71' },
  DU:  { name: '督脈',     color: '#f1c40f' },
  REN: { name: '任脈',     color: '#e91e63' }
};
const MERIDIAN_ORDER = ['EX','LI','ST','SI','BL','SJ','GB','DU','REN'];

const ACUPOINTS = [
  { id:'ex_yintang', name:'印堂', code:'EX-HN3', meridian:'EX', side:'M',
    desc:'兩眉頭連線中點',
    indications:'頭痛、鼻塞、失眠、眩暈、小兒驚風',
    anatomy:'皮下為額肌、降眉間肌，布有滑車上神經',
    technique:'提捏進針，向下平刺0.3–0.5寸，或三稜針點刺出血',
    calc:(kp)=> mid(kp[IDX.browInnerR], kp[IDX.browInnerL], 0.5) },
  { id:'ex_qiuhou', name:'球後', code:'EX-HN7', meridian:'EX', side:'LR',
    desc:'眶下緣，瞳孔直下與外眥垂線之間凹陷處',
    indications:'目赤腫痛、視力減退、眼肌麻痺、近視',
    anatomy:'眶下緣深部為眼球下方組織，布有眶下神經分支',
    technique:'沿眶下緣緩慢直刺0.5–1寸，不宜提插捻轉，出針後按壓片刻',
    calc:(kp,s,sc)=>{
      const b = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const o = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      return off(mid(b,o,0.4), 0, sc*0.05);
    }},
  { id:'ex_yuyao', name:'魚腰', code:'EX-HN4', meridian:'EX', side:'LR',
    desc:'眉毛中點，瞳孔直上',
    indications:'眼瞼下垂、眼瞼瞤動、目赤腫痛、眉稜骨痛',
    anatomy:'皮下為眼輪匝肌，布有眶上神經分支',
    technique:'平刺0.3–0.5寸',
    calc:(kp,s)=> s==='R' ? kp[IDX.browMidR] : kp[IDX.browMidL] },
  { id:'ex_taiyang', name:'太陽穴', code:'EX-HN5', meridian:'EX', side:'LR',
    desc:'眉梢與外眼角連線中點，向後約一橫指凹陷處',
    indications:'偏頭痛、目赤腫痛、口眼歪斜',
    anatomy:'皮下為顳肌，布有顳淺動靜脈及耳顳神經',
    technique:'直刺或斜刺0.3–0.5寸，或三稜針點刺出血',
    calc:(kp,s,sc)=>{
      const brow = s==='R'?kp[IDX.browOuterR]:kp[IDX.browOuterL];
      const eye  = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const dir  = s==='R'?-1:1;
      const m = mid(brow, eye, 0.5);
      return { x: m.x + dir*sc*0.18, y: m.y - sc*0.02 };
    }},

  { id:'li_yingxiang', name:'迎香', code:'LI20', meridian:'LI', side:'LR',
    desc:'鼻翼外緣中點，鼻唇溝凹陷處',
    indications:'鼻塞、鼻淵、口眼歪斜、面癢',
    anatomy:'皮下為提上唇肌，布有眶下神經及面神經頰支',
    technique:'斜刺或平刺0.3–0.5寸',
    calc:(kp,s)=>{
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      return { x: ala.x, y: kp[IDX.noseBase].y };
    }},
  { id:'li_hejiao', name:'口禾髎', code:'LI19', meridian:'LI', side:'LR',
    desc:'鼻孔外緣直下，水溝穴旁約0.5寸',
    indications:'鼻塞、鼻衄、口歪、口噤',
    anatomy:'皮下為口輪匝肌，布有眶下神經分支及面神經頰支',
    technique:'斜刺0.3–0.5寸',
    calc:(kp,s)=>{
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const m = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const y = kp[IDX.noseBase].y + (m.y - kp[IDX.noseBase].y) * 0.3;
      return { x: ala.x, y };
    }},

  { id:'st_chengqi', name:'承泣', code:'ST1', meridian:'ST', side:'LR',
    desc:'瞳孔直下，眼球與眶下緣之間',
    indications:'目赤腫痛、迎風流淚、夜盲、眼瞼瞤動',
    anatomy:'位於眼輪匝肌與眶下緣之間，深部為眼球，布有眶下神經',
    technique:'囑患者閉目，固定眼球，沿眶下緣緩慢直刺0.5–1寸，不宜提插捻轉',
    calc:(kp,s)=>{
      const b = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const t = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      const px = pupilCenter(kp,s).x;
      return { x: px, y: b.y + dist(t,b)*0.25 };
    }},
  { id:'st_sibai', name:'四白', code:'ST2', meridian:'ST', side:'LR',
    desc:'瞳孔直下，眶下孔凹陷處',
    indications:'目赤癢痛、眼瞼瞤動、口眼歪斜、頭面疼痛',
    anatomy:'為眶下孔所在，布有眶下神經、眶下動靜脈',
    technique:'直刺0.2–0.3寸，或沿皮刺，不可深刺以免傷及眶下孔',
    calc:(kp,s)=>{
      const top = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      const bot = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const eyeH = dist(top,bot);
      const px = pupilCenter(kp,s).x;
      return { x: px, y: bot.y + eyeH*1.0 };
    }},
  { id:'st_juliao', name:'巨髎', code:'ST3', meridian:'ST', side:'LR',
    desc:'瞳孔直下，平鼻翼下緣',
    indications:'口眼歪斜、鼻衄、齒痛、唇頰腫',
    anatomy:'皮下為提上唇肌，布有眶下神經、面神經分支',
    technique:'直刺或斜刺0.3–0.5寸',
    calc:(kp,s)=>{
      const px = pupilCenter(kp,s).x;
      return { x: px, y: kp[IDX.noseBase].y };
    }},
  { id:'st_ditsang', name:'地倉', code:'ST4', meridian:'ST', side:'LR',
    desc:'口角外側，瞳孔直下',
    indications:'口眼歪斜、流涎、三叉神經痛',
    anatomy:'皮下為口輪匝肌，深層為頰肌，布有面神經及眶下神經分支',
    technique:'斜刺或平刺0.5–0.8寸，可透刺頰車',
    calc:(kp,s,sc)=>{
      const m = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const px = pupilCenter(kp,s).x;
      return { x: px, y: m.y };
    }},
  { id:'st_daying', name:'大迎', code:'ST5', meridian:'ST', side:'LR',
    desc:'下頜角前方，咬肌附著部前緣，動脈搏動處',
    indications:'口眼歪斜、頰腫、齒痛、面癱',
    anatomy:'布有面動靜脈、面神經下頜緣支',
    technique:'避開動脈，斜刺或平刺0.3–0.5寸',
    calc:(kp,s)=> s==='R' ? mid(kp[IDX.mouthCornerR], kp[IDX.jawR], 0.6)
                          : mid(kp[IDX.mouthCornerL], kp[IDX.jawL], 0.6) },
  { id:'st_jiache', name:'頰車', code:'ST6', meridian:'ST', side:'LR',
    desc:'下頜角前上方一橫指，咀嚼時咬肌隆起處',
    indications:'口眼歪斜、齒痛、頰腫、牙關緊閉',
    anatomy:'皮下為咬肌，布有耳大神經及面神經下頜緣支',
    technique:'直刺0.3–0.5寸，或平刺透地倉',
    calc:(kp,s,sc)=>{
      const j = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      return off(j, 0, -sc*0.05);
    }},
  { id:'st_xiaguan', name:'下關', code:'ST7', meridian:'ST', side:'LR',
    desc:'顴弓下緣，下頜骨髁狀突前方凹陷處',
    indications:'耳聾耳鳴、齒痛、口眼歪斜、顳頜關節炎',
    anatomy:'皮下為腮腺，深層為翼外肌，布有耳顳神經及面神經',
    technique:'直刺0.3–0.5寸，張口取穴，閉口進針',
    calc:(kp,s)=> s==='R' ? mid(kp[IDX.templeR], kp[IDX.jawR], 0.35)
                          : mid(kp[IDX.templeL], kp[IDX.jawL], 0.35) },

  { id:'si_quanliao', name:'顴髎', code:'SI18', meridian:'SI', side:'LR',
    desc:'目外眥直下，顴骨下緣凹陷處',
    indications:'口眼歪斜、眼瞼瞤動、齒痛、面痛',
    anatomy:'皮下為咬肌起始部，布有面神經及眶下神經分支',
    technique:'直刺0.3–0.5寸，或斜刺',
    calc:(kp,s)=>{
      const e = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      return { x: e.x, y: mid(e, ala, 0.55).y };
    }},

  { id:'bl_jingming', name:'睛明', code:'BL1', meridian:'BL', side:'LR',
    desc:'目內眥角上方0.1寸凹陷處',
    indications:'目赤腫痛、迎風流淚、視物不明、近視',
    anatomy:'位於眼眶內側緣，深部為眼球內側，布有滑車上下神經',
    technique:'輕推眼球固定，沿眶內側壁緩慢直刺0.3–0.5寸，不宜提插捻轉',
    calc:(kp,s)=>{
      const p = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const w = s==='R'?dist(kp[IDX.eyeOuterR],kp[IDX.eyeInnerR]):dist(kp[IDX.eyeOuterL],kp[IDX.eyeInnerL]);
      return { x:p.x, y:p.y - w*0.15 };
    }},
  { id:'bl_zanzhu', name:'攢竹', code:'BL2', meridian:'BL', side:'LR',
    desc:'眉頭內側凹陷處，眶上切跡處',
    indications:'頭痛、眉稜骨痛、眼瞼瞤動、目視不明',
    anatomy:'皮下為額肌，布有眶上神經、眶上動靜脈',
    technique:'平刺0.3–0.5寸，或向下透睛明（輕刺）',
    calc:(kp,s)=> s==='R' ? mid(kp[IDX.browInnerR], kp[IDX.eyeInnerR], 0.15)
                          : mid(kp[IDX.browInnerL], kp[IDX.eyeInnerL], 0.15) },

  { id:'sj_sizhukong', name:'絲竹空', code:'SJ23', meridian:'SJ', side:'LR',
    desc:'眉梢外端凹陷處',
    indications:'頭痛、目眩、眼瞼瞤動、齒痛',
    anatomy:'皮下為眼輪匝肌，布有顴顳神經分支',
    technique:'平刺0.3–0.5寸',
    calc:(kp,s)=> s==='R' ? kp[IDX.browOuterR] : kp[IDX.browOuterL] },

  { id:'gb_tongziliao', name:'瞳子髎', code:'GB1', meridian:'GB', side:'LR',
    desc:'目外眥外側0.5寸凹陷處',
    indications:'頭痛、目赤腫痛、目翳、口眼歪斜',
    anatomy:'皮下為眼輪匝肌，布有顴面神經、顴顳神經',
    technique:'平刺0.3–0.5寸，或三稜針點刺出血',
    calc:(kp,s,sc)=>{
      const e = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const dir = s==='R'?-1:1;
      return off(e, dir*sc*0.05, 0);
    }},
  { id:'gb_shangguan', name:'上關', code:'GB3', meridian:'GB', side:'LR',
    desc:'顴弓上緣，下關穴直上凹陷處',
    indications:'耳聾耳鳴、齒痛、口眼歪斜、偏頭痛',
    anatomy:'皮下為顳肌，布有耳顳神經、面神經顴支',
    technique:'直刺0.3–0.5寸，張口取穴',
    calc:(kp,s,sc)=>{
      const m = s==='R'?mid(kp[IDX.templeR],kp[IDX.jawR],0.3):mid(kp[IDX.templeL],kp[IDX.jawL],0.3);
      return off(m, 0, -sc*0.1);
    }},
  { id:'gb_yangbai', name:'陽白', code:'GB14', meridian:'GB', side:'LR',
    desc:'眉毛中點直上1寸',
    indications:'頭痛、眉稜骨痛、眼瞼瞤動、目眩',
    anatomy:'皮下為額肌，布有眶上神經外側支',
    technique:'平刺0.3–0.5寸',
    calc:(kp,s,sc)=>{
      const b = s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL];
      return off(b, 0, -sc*0.22);
    }},

  { id:'du_suliao', name:'素髎', code:'DU25', meridian:'DU', side:'M',
    desc:'鼻尖正中央',
    indications:'鼻塞、鼻衄、昏迷、休克急救',
    anatomy:'皮下為鼻軟骨，布有篩前神經鼻外支',
    technique:'向上斜刺0.3寸，或點刺出血，不灸',
    calc:(kp)=> kp[IDX.noseTip] },
  { id:'du_shuigou', name:'水溝', code:'DU26', meridian:'DU', side:'M',
    desc:'人中溝上1/3與下2/3交界處',
    indications:'昏迷、暈厥、癲癇、急性腰扭傷，常用於急救要穴',
    anatomy:'皮下為口輪匝肌，布有眶下神經分支',
    technique:'向上斜刺0.3–0.5寸，強刺激；急救時可用指甲掐按代替針刺',
    calc:(kp)=> mid(kp[IDX.noseBase], kp[IDX.upperLipTop], 0.4) },
  { id:'du_duiduan', name:'兌端', code:'DU27', meridian:'DU', side:'M',
    desc:'上唇尖端，唇珠上緣',
    indications:'口歪、齒齦腫痛、癲狂',
    anatomy:'皮下為口輪匝肌，布有眶下神經分支',
    technique:'斜刺0.2–0.3寸',
    calc:(kp,_,sc)=> off(kp[IDX.upperLipTop], 0, sc*0.02) },
  { id:'du_yinjiao', name:'齦交', code:'DU28', meridian:'DU', side:'M',
    desc:'上唇繫帶與齒齦交接處（口腔內，體表僅概略標示）',
    indications:'齒齦腫痛、口臭、鼻淵',
    anatomy:'上唇繫帶處，布有上頜神經分支',
    technique:'向上斜刺0.2寸，或點刺出血',
    calc:(kp,_,sc)=> off(kp[IDX.upperLipTop], 0, sc*0.08) },

  { id:'ren_chengjiang', name:'承漿', code:'REN24', meridian:'REN', side:'M',
    desc:'下唇下方，頦唇溝凹陷正中',
    indications:'口眼歪斜、齒齦腫痛、流涎、癲癇',
    anatomy:'皮下為下唇方肌，布有頦神經分支',
    technique:'斜刺0.3–0.5寸',
    calc:(kp,_,sc)=> off(kp[IDX.lowerLipBottom], 0, sc*0.15) }
];

/* ------------------------------------------------------------------
   神經解剖示意
   三叉神經：神經節（示意投影於耳前顳骨區）→三大分支主幹→末梢出顱孔
   顏面神經：莖乳孔→腮腺內神經叢（鵝足叢）→顳顏面/頸顏面二乾→
             五條終末支，並於顳支、頰支加繪細支分岔
   同樣以 FaceMesh 關鍵點比例外推估算，僅供教學示意，非個人化精確定位
------------------------------------------------------------------- */
function trigeminalGanglion(kp, s) {
  // 三叉神經節深藏於顱底，此處以耳前顳骨根部（顳點與下頷角之間偏上）示意其體表投影
  const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
  const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
  return mid(jaw, temple, 0.15);
}
function foramenPoints(kp, s) {
  const brow = s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL];
  const eyeTop = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
  const eyeBot = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
  const eyeH = dist(eyeTop, eyeBot);
  const mc = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
  const ch = kp[IDX.chin];
  return {
    v1: mid(brow, eyeTop, 0.3),
    v2: { x: eyeBot.x, y: eyeBot.y + eyeH*1.0 },
    v3: mid(mc, ch, 0.45)
  };
}
function trigeminalPaths(kp, s, scale) {
  const origin = trigeminalGanglion(kp, s);
  const f = foramenPoints(kp, s);
  const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
  const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
  const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
  // V1 眼神經：沿眶外側緣上行至眶上孔
  const v1Way = off(mid(origin, eyeOuter, 0.65), 0, -scale*0.06);
  // V2 上頷神經：沿顴弓下方、頰部斜向眶下孔
  const v2Way = mid(origin, cheek, 0.55);
  // V3 下頷神經：沿下頷枝下緣前行至頦孔
  const v3Way = mid(origin, jaw, 0.65);
  return {
    ganglion: origin,
    branches: [
      { id:'v1', zh:'眼神經', en:'V1', pts:[origin, v1Way, f.v1] },
      { id:'v2', zh:'上頷神經', en:'V2', pts:[origin, v2Way, f.v2] },
      { id:'v3', zh:'下頷神經', en:'V3', pts:[origin, v3Way, f.v3] }
    ],
    endPoints: [
      { id:'v1', zh:'眶上孔', en:'V1', desc:'額神經（眼神經分支）出顱處，與四白、頦孔約略同一垂直線', pos:f.v1 },
      { id:'v2', zh:'眶下孔', en:'V2', desc:'上頷神經分支出顱處（與四白穴位置重疊）', pos:f.v2 },
      { id:'v3', zh:'頦孔', en:'V3', desc:'下齒槽神經（下頷神經分支）出顱處，約在第二小臼齒下方', pos:f.v3 }
    ]
  };
}

function facialNervePaths(kp, s, scale) {
  const origin = mid(s==='R'?kp[IDX.jawR]:kp[IDX.jawL], s==='R'?kp[IDX.templeR]:kp[IDX.templeL], 0.3);
  const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
  const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
  const chin = kp[IDX.chin];
  const browOuter = s==='R'?kp[IDX.browOuterR]:kp[IDX.browOuterL];
  const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
  const noseAla = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
  const mouthCorner = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];

  const plexus = mid(origin, cheek, 0.4);                 // 腮腺內神經叢（鵝足叢）
  const upperDiv = mid(plexus, browOuter, 0.28);           // 顳顏面乾
  const lowerDiv = mid(plexus, jaw, 0.45);                 // 頸顏面乾

  const branches = [
    // 顳支：上乾發出2條細支，分別走向額肌、眼輪匝肌上部
    { id:'temporal_a', key:'fac_temporal', zh:'顳支', en:'', pts:[origin, plexus, upperDiv, off(browOuter, 0, -scale*0.05)] },
    { id:'temporal_b', key:'fac_temporal', zh:'顳支細支', en:'', pts:[upperDiv, off(mid(upperDiv,browOuter,0.6), scale*0.03, -scale*0.02)] },
    // 顴支：上乾發出，走向眼輪匝肌下部／顴肌
    { id:'zygomatic', key:'fac_zygomatic', zh:'顴支', en:'', pts:[upperDiv, mid(upperDiv, eyeOuter, 0.5), eyeOuter] },
    // 頰支：上下乾均有貢獻，示意為上頰支＋下頰支兩條細支
    { id:'buccal_a', key:'fac_buccal', zh:'頰支(上)', en:'', pts:[plexus, mid(plexus, noseAla, 0.6), noseAla] },
    { id:'buccal_b', key:'fac_buccal', zh:'頰支(下)', en:'', pts:[lowerDiv, mid(lowerDiv, mouthCorner, 0.6), mouthCorner] },
    // 下頷緣支：下乾沿下頷骨下緣走向頦部
    { id:'mandibular', key:'fac_mandibular', zh:'下頷緣支', en:'', pts:[origin, plexus, lowerDiv, mid(jaw, chin, 0.5)] },
    // 頸支：下乾向下走入頸闊肌
    { id:'cervical', key:'fac_cervical', zh:'頸支', en:'', pts:[lowerDiv, off(jaw, 0, scale*0.22)] }
  ];
  return { origin, plexus, branches };
}

/* ------------------------------------------------------------------
   顏面肌肉／血管解剖示意
   參考文獻：Hu et al. (2023) "Face painting as an anatomical learning
   tool based on individual ultrasonographic examination", Clinical
   Anatomy 36(3):426-432（doi:10.1002/ca.23974）中對亞洲人顏面肌肉起訖點、
   血管分支位置的描述，重新以FaceMesh關鍵點比例外推轉換為本頁座標系統，
   非逐點對應原文獻圖表，僅供教學示意，非個人化精確定位
------------------------------------------------------------------- */
// 鼻肌橫部／翼部：直接參考實際 FaceMesh 468 關鍵點索引群組（依使用者提供的
// landmarks_groups.json），以凸包描繪範圍，橫部依中線動態分左右、翼部合併為單一跨鼻弧帶
const NASALIS_TRANSVERSE_R_IDX = [3,48,49,51,64,102,115,131,134,174,195,196,197,198,209,217,219,220,236];
const NASALIS_TRANSVERSE_L_IDX = [248,278,279,281,294,331,344,360,363,399,195,419,197,420,429,437,439,440,456];
const NASALIS_ALAR_R_IDX = [2,94,164,97,98,99,141,60,75,240,242];
const NASALIS_ALAR_L_IDX = [2,94,164,326,327,328,370,290,305,460,462];

const MUSCLES = [
  { id:'m_frontalis', key:'ms_frontalis', zh:'額肌', en:'Frontalis', side:'LR',
    desc:'呈弧形穹頂狀覆蓋前額，左右各一肌腹、於正中線（帽狀腱膜／額肌間之纖維中縫）相鄰但分開描繪，起自帽狀腱膜，止於眉部皮膚，範圍寬闊涵蓋整個半側前額、上緣弧形貼齊額部上緣（髮際線附近），收縮時上提眉毛、產生抬頭紋，為額頭除皺注射常用參考肌肉',
    calc:(kp,s,sc)=>{
      const browOuter = s==='R'?kp[IDX.browOuterR]:kp[IDX.browOuterL];
      const browMid = s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL];
      const browInner = s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL];
      const corner = s==='R'?kp[IDX.foreheadCornerR]:kp[IDX.foreheadCornerL];
      const dir = s==='R'?-1:1;

      // 半側前額最高點（大致位於該側眉毛中段正上方），貼齊髮際線附近
      const peak = off(mid(browMid, corner, 0.4), 0, -sc*0.52);
      // 內側（近眉間）頂緣，略低於peak，讓左右兩半在正中線附近有一道淺淺的分界凹陷
      const innerTop = off(browInner, -dir*sc*0.05, -sc*0.4);

      const sideCtrl = off(mid(browOuter, corner, 0.5), dir*sc*0.08, -sc*0.06);
      const sideArc = quadBezierPts(browOuter, sideCtrl, corner, 5);
      // 上緣改以通過 corner→peak→innerTop 的正圓弧描繪，呈連續圓弧穹頂
      const topArc = arcThrough3Pts(corner, peak, innerTop, 16);

      return [browInner, browMid, browOuter, ...sideArc, ...topArc];
    },
    // 額肌纖維自眉部向上呈放射狀展開（內側近垂直、越往外側越向外上斜），呼應弧形穹頂上緣，
    // 於半側前額中段最長、內外側漸短
    fibers:(kp,s,sc)=>{
      const browOuter = s==='R'?kp[IDX.browOuterR]:kp[IDX.browOuterL];
      const browMid = s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL];
      const browInner = s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL];
      const corner = s==='R'?kp[IDX.foreheadCornerR]:kp[IDX.foreheadCornerL];
      const dir = s==='R'?-1:1;
      const bottomPts = [browInner, browMid, browOuter, corner];
      const anchors = sampleAlongPolyline(bottomPts, 16);
      return anchors.map((p, i) => {
        const t = i / (anchors.length - 1);
        const h = 0.3 + 0.24 * Math.sin(Math.PI * t);
        const spread = dir * sc * 0.3 * t * t;
        const top = { x: p.x + spread, y: p.y - sc*h };
        const midPt = { x: p.x + spread*0.28, y: p.y - sc*h*0.55 };
        return [p, midPt, top];
      });
    }},
  { id:'m_corrugator', key:'ms_corrugator', zh:'皺眉肌', en:'Corrugator supercilii', side:'LR',
    desc:'起於眉頭內側近眉間處，斜向外上止於眉毛中段皮下，肌腹呈短帶狀、內厚外薄，收縮時使兩眉向內下方靠攏、形成眉間直紋，是眉間紋肉毒桿菌注射的主要目標肌',
    calc:(kp,s,sc)=>{
      const dir = s==='R'?1:-1;
      const start = off(s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL], -dir*sc*0.015, sc*0.01);
      const end = off(s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL], 0, -sc*0.01);
      return bandPoints([start, end], [sc*0.05, sc*0.02]);
    },
    fibers:(kp,s,sc)=>{
      const dir = s==='R'?1:-1;
      const start = off(s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL], -dir*sc*0.015, sc*0.01);
      const end = off(s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL], 0, -sc*0.01);
      return fiberLines([start, end], [sc*0.05, sc*0.02], [-0.7, -0.35, 0, 0.35, 0.7]);
    }},
  { id:'m_orbicularis_oculi', key:'ms_ooc', zh:'眼輪匝肌', en:'Orbicularis oculi', side:'LR',
    desc:'環繞眼眶四周的環狀肌，範圍明顯大於瞼裂本身、向外延伸至眶骨緣上下，主司眼瞼閉合，外側部分與顴肌相接',
    calc:(kp,s,sc)=>{
      const outerPt = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const innerPt = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const topPt = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      const bottomPt = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const center = mid(mid(outerPt, innerPt, 0.5), mid(topPt, bottomPt, 0.5), 0.5);
      const halfWidth = dist(outerPt, innerPt) / 2;
      const rx = halfWidth * 1.8;
      const ry = halfWidth * 1.75;
      return ovalPoints(center, rx, ry, ry, 24);
    },
    // 挖空實際睜眼時的瞼裂範圍（隨每幀眼皮開闔即時計算），避免著色蓋住眼球
    calcHole:(kp,s,sc)=>{
      const outerPt = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const innerPt = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const topPt = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      const bottomPt = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const center = mid(mid(outerPt, innerPt, 0.5), mid(topPt, bottomPt, 0.5), 0.5);
      const rx = dist(outerPt, innerPt) / 2 * 1.12;
      const ryTop = dist(center, topPt) * 1.35 + sc*0.012;
      const ryBottom = dist(center, bottomPt) * 1.35 + sc*0.012;
      return ovalPoints(center, rx, ryTop, ryBottom, 24);
    },
    fibers:(kp,s,sc)=>{
      const outerPt = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const innerPt = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const topPt = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      const bottomPt = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const center = mid(mid(outerPt, innerPt, 0.5), mid(topPt, bottomPt, 0.5), 0.5);
      const halfWidth = dist(outerPt, innerPt) / 2;
      const rx = halfWidth * 1.8;
      const ry = halfWidth * 1.75;
      return ringLines(center, rx, ry, ry, [0.15, 0.26, 0.37, 0.48, 0.59, 0.7, 0.81, 0.92, 1.0], 24);
    }},
  { id:'m_zygo_major', key:'ms_zygo_major', zh:'顴大肌', en:'Zygomaticus major', side:'LR',
    desc:'起自顴骨體外側面（顴骨隆起處），斜向內下止於口角聯合結節（modiolus），為主要提口角上笑肌肉，收縮時上提口角向外上方，形成微笑動作，是提眉／蘋果肌相關注射常參考的肌肉',
    calc:(kp,s,sc)=>{
      const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const base = off(mid(eyeOuter, cheek, 0.7), 0, sc*0.16);
      const origin = mid(base, ala, 0.12);
      const insertion = modiolusPoint(kp, s, sc);
      return bandPoints([origin, mid(origin, insertion, 0.5), insertion], [sc*0.035, sc*0.028, sc*0.02]);
    },
    fibers:(kp,s,sc)=>{
      const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const base = off(mid(eyeOuter, cheek, 0.7), 0, sc*0.16);
      const origin = mid(base, ala, 0.12);
      const insertion = modiolusPoint(kp, s, sc);
      return fiberLines([origin, mid(origin, insertion, 0.5), insertion], [sc*0.035, sc*0.028, sc*0.02], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_zygo_minor', key:'ms_zygo_minor', zh:'顴小肌', en:'Zygomaticus minor', side:'LR',
    desc:'起自顴骨體前面（顴大肌起點內側偏上，較接近眶外側緣），斜向內下止於口角聯合結節（modiolus）附近，收縮時上提上唇並加深鼻唇溝，與顴大肌共同構成微笑動作',
    calc:(kp,s,sc)=>{
      const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const base = off(mid(eyeOuter, cheek, 0.45), 0, sc*0.07);
      const origin = mid(base, ala, 0.34);
      const insertion = modiolusPoint(kp, s, sc);
      return bandPoints([origin, mid(origin, insertion, 0.5), insertion], [sc*0.028, sc*0.022, sc*0.016]);
    },
    fibers:(kp,s,sc)=>{
      const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const base = off(mid(eyeOuter, cheek, 0.45), 0, sc*0.07);
      const origin = mid(base, ala, 0.34);
      const insertion = modiolusPoint(kp, s, sc);
      return fiberLines([origin, mid(origin, insertion, 0.5), insertion], [sc*0.028, sc*0.022, sc*0.016], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_llsan', key:'ms_llsan', zh:'提上唇鼻翼肌', en:'Levator labii superioris alaeque nasi (LLSAN)', side:'LR',
    desc:'起自上頷骨額突（近內眥下方），沿鼻側緣垂直下行止於鼻翼軟骨與上唇外側皮膚，走向緊貼鼻側緣、不跨越鼻背，收縮時同時上提上唇與鼻翼，加深鼻唇溝上段，是淚溝、鼻唇溝填充注射需留意的淺層肌',
    calc:(kp,s,sc)=>{
      const eyeInner = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const origin = { x: ala.x + (eyeInner.x - ala.x) * 0.1, y: eyeInner.y + sc*0.04 };
      const way = { x: ala.x + (ala.x - eyeInner.x) * 0.05, y: mid(origin, ala, 0.55).y };
      const end = { x: ala.x + (mouth.x - ala.x) * 0.3, y: kp[IDX.upperLipTop].y - sc*0.02 };
      return bandPoints([origin, way, end], [sc*0.02, sc*0.017, sc*0.013]);
    },
    fibers:(kp,s,sc)=>{
      const eyeInner = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const origin = { x: ala.x + (eyeInner.x - ala.x) * 0.1, y: eyeInner.y + sc*0.04 };
      const way = { x: ala.x + (ala.x - eyeInner.x) * 0.05, y: mid(origin, ala, 0.55).y };
      const end = { x: ala.x + (mouth.x - ala.x) * 0.3, y: kp[IDX.upperLipTop].y - sc*0.02 };
      return fiberLines([origin, way, end], [sc*0.02, sc*0.017, sc*0.013], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_lls', key:'ms_lls', zh:'提上唇肌', en:'Levator labii superioris (LLS)', side:'LR',
    desc:'起自眶下緣下方（LLSAN外側），垂直下行止於上唇外側 1/3 皮膚與黏膜，走向位於LLSAN外側、鼻翼與口角之間，不跨越鼻部，收縮時上提上唇、外露上排牙齒，深部與淚溝、蘋果肌區域相鄰',
    calc:(kp,s,sc)=>{
      const eyeB = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const originX = ala.x + (eyeB.x - ala.x) * 0.7;
      const origin = { x: originX, y: eyeB.y + sc*0.1 };
      const lipX = ala.x + (mouth.x - ala.x) * 0.8;
      const lip = { x: lipX, y: mid(kp[IDX.upperLipTop], mouth, 0.35).y };
      return bandPoints([origin, mid(origin, lip, 0.5), lip], [sc*0.024, sc*0.02, sc*0.014]);
    },
    fibers:(kp,s,sc)=>{
      const eyeB = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const originX = ala.x + (eyeB.x - ala.x) * 0.7;
      const origin = { x: originX, y: eyeB.y + sc*0.1 };
      const lipX = ala.x + (mouth.x - ala.x) * 0.8;
      const lip = { x: lipX, y: mid(kp[IDX.upperLipTop], mouth, 0.35).y };
      return fiberLines([origin, mid(origin, lip, 0.5), lip], [sc*0.024, sc*0.02, sc*0.014], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_risorius', key:'ms_risorius', zh:'笑肌', en:'Risorius', side:'LR',
    desc:'起自咬肌筋膜（近耳垂前下方），近乎水平走向內止於口角（modiolus），收縮時將口角向外側牽引，形成「露齒笑」的橫向拉扯動作，位置表淺、變異度大',
    calc:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const origin = off(mid(jaw, temple, 0.35), 0, sc*0.02);
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      return bandPoints([origin, mid(origin, mouth, 0.5), mouth], [sc*0.022, sc*0.018, sc*0.016]);
    },
    fibers:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const origin = off(mid(jaw, temple, 0.35), 0, sc*0.02);
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      return fiberLines([origin, mid(origin, mouth, 0.5), mouth], [sc*0.022, sc*0.018, sc*0.016], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_oor', key:'ms_oor', zh:'口輪匝肌', en:'Orbicularis oris', side:'M',
    desc:'環繞口裂周圍呈橢圓形的環狀肌，範圍明顯大於唇紅緣本身，上緣達人中／鼻唇溝下段、下緣達頦唇溝上方、左右達口角外側口角聯合結節附近，由上下唇多條肌纖維交織而成，主司口唇閉合與噘嘴動作，是唇部填充、法令紋注射時的重要解剖層次參考',
    calc:(kp,sc)=>{
      const upperLip = kp[IDX.upperLipTop];
      const lowerLip = kp[IDX.lowerLipBottom];
      const cR = kp[IDX.mouthCornerR];
      const cL = kp[IDX.mouthCornerL];
      const center = { x: mid(cR, cL, 0.5).x, y: mid(upperLip, lowerLip, 0.5).y };
      const halfWidth = dist(cR, cL) / 2;
      const rx = halfWidth * 1.32;
      const ryTop = Math.abs(upperLip.y - center.y) + sc*0.05;
      const ryBottom = Math.abs(lowerLip.y - center.y) + sc*0.08;
      return ovalPoints(center, rx, ryTop, ryBottom, 28);
    },
    // 挖空實際張口時的口裂範圍（隨每幀嘴唇開闔即時計算），避免著色蓋住口腔開口
    calcHole:(kp,sc)=>{
      const cR = kp[IDX.mouthCornerR];
      const cL = kp[IDX.mouthCornerL];
      const innerTop = kp[IDX.mouthInnerTop];
      const innerBottom = kp[IDX.mouthInnerBottom];
      const center = { x: mid(cR, cL, 0.5).x, y: mid(innerTop, innerBottom, 0.5).y };
      const rx = dist(cR, cL) / 2 * 0.9;
      const ryTop = Math.abs(innerTop.y - center.y) * 1.25 + sc*0.015;
      const ryBottom = Math.abs(innerBottom.y - center.y) * 1.25 + sc*0.015;
      return ovalPoints(center, rx, ryTop, ryBottom, 24);
    },
    fibers:(kp,sc)=>{
      const upperLip = kp[IDX.upperLipTop];
      const lowerLip = kp[IDX.lowerLipBottom];
      const cR = kp[IDX.mouthCornerR];
      const cL = kp[IDX.mouthCornerL];
      const center = { x: mid(cR, cL, 0.5).x, y: mid(upperLip, lowerLip, 0.5).y };
      const halfWidth = dist(cR, cL) / 2;
      const rx = halfWidth * 1.32;
      const ryTop = Math.abs(upperLip.y - center.y) + sc*0.05;
      const ryBottom = Math.abs(lowerLip.y - center.y) + sc*0.08;
      return ringLines(center, rx, ryTop, ryBottom, [0.14, 0.25, 0.36, 0.47, 0.58, 0.69, 0.8, 0.9, 1.0], 24);
    }},
  { id:'m_dao', key:'ms_dao', zh:'降口角肌', en:'Depressor anguli oris (DAO)', side:'LR',
    desc:'起自下頷骨下緣（較寬闊之基部），肌纖維向上內集中止於口角（與口輪匝肌、笑肌交會於口角聯合結節），收縮時下拉口角，是下半臉、木偶紋肉毒桿菌注射常見目標',
    calc:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const chin = kp[IDX.chin];
      const origin = mid(jaw, chin, 0.35);
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      return bandPoints([origin, mid(origin, mouth, 0.5), mouth], [sc*0.04, sc*0.03, sc*0.018]);
    },
    fibers:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const chin = kp[IDX.chin];
      const origin = mid(jaw, chin, 0.35);
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      return fiberLines([origin, mid(origin, mouth, 0.5), mouth], [sc*0.04, sc*0.03, sc*0.018], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_dli', key:'ms_dli', zh:'降下唇肌', en:'Depressor labii inferioris (DLI)', side:'LR',
    desc:'起自下頷骨下緣（DAO內側、較靠近正中處），肌纖維向上內止於下唇皮膚與黏膜，收縮時下拉並外翻下唇，是下唇不對稱、下唇外翻相關肉毒桿菌注射的目標肌',
    calc:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const chin = kp[IDX.chin];
      const origin = mid(jaw, chin, 0.65);
      const lip = off(kp[IDX.lowerLipBottom], s==='R'?-sc*0.035:sc*0.035, sc*0.01);
      return bandPoints([origin, mid(origin, lip, 0.5), lip], [sc*0.028, sc*0.022, sc*0.016]);
    },
    fibers:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const chin = kp[IDX.chin];
      const origin = mid(jaw, chin, 0.65);
      const lip = off(kp[IDX.lowerLipBottom], s==='R'?-sc*0.035:sc*0.035, sc*0.01);
      return fiberLines([origin, mid(origin, lip, 0.5), lip], [sc*0.028, sc*0.022, sc*0.016], [-0.6, -0.2, 0.2, 0.6]);
    }},
  { id:'m_mentalis', key:'ms_mentalis', zh:'頦肌', en:'Mentalis', side:'M',
    desc:'位於下唇肌群深層，起自下頷骨正中兩側切牙窩，兩側肌纖維向下內交叉止於頦部皮膚，收縮時上提頦部皮膚、形成「梅乾狀」頦部皺褶並輕微上突下唇，是頦部凹陷、頦紋肉毒桿菌注射的目標肌',
    calc:(kp,sc)=>{
      const lowerLip = kp[IDX.lowerLipBottom];
      const chin = kp[IDX.chin];
      const center = mid(lowerLip, chin, 0.55);
      const rx = sc*0.11;
      const ry = dist(lowerLip, chin) * 0.45;
      return ovalPoints(center, rx, ry, ry, 20);
    },
    fibers:(kp,sc)=>{
      const lowerLip = kp[IDX.lowerLipBottom];
      const chin = kp[IDX.chin];
      const center = mid(lowerLip, chin, 0.55);
      const rx = sc*0.11;
      const ry = dist(lowerLip, chin) * 0.45;
      const bottom = off(center, 0, ry*0.85);
      const n = 9;
      const lines = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const xFrac = -0.85 + 1.7 * t;
        const yFrac = -0.35 - 0.5 * (1 - Math.abs(xFrac) / 0.85);
        const top = off(center, rx*xFrac, ry*yFrac);
        lines.push([top, bottom]);
      }
      return lines;
    }},
  { id:'m_buccinator', key:'ms_buccinator', zh:'頰肌', en:'Buccinator', side:'LR',
    desc:'起自上下頷骨臼齒區牙槽突及翼下頷縫，肌纖維向前止於口角（與口輪匝肌交織），位置深於顴大肌與皮下脂肪，收縮時壓迫頰部貼緊牙齒，協助咀嚼吞嚥、吹奏（吹口哨肌）',
    calc:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const risOrigin = off(mid(jaw, temple, 0.35), 0, sc*0.02);
      const origin = mid(risOrigin, mouth, 0.25);
      return bandPoints([origin, mid(origin, mouth, 0.5), mouth], [sc*0.227, sc*0.193, sc*0.133]);
    },
    fibers:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const risOrigin = off(mid(jaw, temple, 0.35), 0, sc*0.02);
      const origin = mid(risOrigin, mouth, 0.25);
      return fiberLines([origin, mid(origin, mouth, 0.5), mouth], [sc*0.227, sc*0.193, sc*0.133], [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]);
    }},
  { id:'m_nasalis_transverse', key:'ms_nasalis', zh:'鼻肌（橫部）', en:'Nasalis, transverse part', side:'LR',
    desc:'起自上頷骨尖牙窩，橫部沿鼻背兩側斜向上行，止於鼻背腱膜，範圍依實際FaceMesh關鍵點群組（鼻背與鼻孔上緣周圍）描繪，收縮時壓縮鼻孔',
    calc:(kp,s,sc)=>{
      const idxList = s==='R' ? NASALIS_TRANSVERSE_R_IDX : NASALIS_TRANSVERSE_L_IDX;
      const pts = idxList.map(i=>kp[i]);
      return convexHull(pts);
    },
    fibers:(kp,s,sc)=>{
      const idxList = s==='R' ? NASALIS_TRANSVERSE_R_IDX : NASALIS_TRANSVERSE_L_IDX;
      const pts = idxList.map(i=>kp[i]);
      let top = pts[0], bottom = pts[0];
      pts.forEach(p => { if (p.y < top.y) top = p; if (p.y > bottom.y) bottom = p; });
      return fiberLines([top, mid(top, bottom, 0.5), bottom], sc*0.012, [-0.4, 0, 0.4]);
    }},
  { id:'m_nasalis_alar', key:'ms_nasalis', zh:'鼻肌（翼部）', en:'Nasalis, alar part', side:'LR',
    desc:'起自上頷骨尖牙窩，翼部呈弧帶狀環繞鼻孔下緣、越過鼻中隔基部連接左右鼻翼，止於鼻翼軟骨，範圍依實際FaceMesh關鍵點群組（鼻孔下緣周圍）描繪，收縮時擴張鼻孔',
    calc:(kp,s,sc)=>{
      const pts = (s==='R' ? NASALIS_ALAR_R_IDX : NASALIS_ALAR_L_IDX).map(i=>kp[i]);
      return convexHull(pts);
    },
    fibers:(kp,s,sc)=>{
      const pts = (s==='R' ? NASALIS_ALAR_R_IDX : NASALIS_ALAR_L_IDX).map(i=>kp[i]);
      let left = pts[0], right = pts[0];
      pts.forEach(p => { if (p.x < left.x) left = p; if (p.x > right.x) right = p; });
      return fiberLines([left, mid(left, right, 0.5), right], sc*0.014, [-0.4, 0, 0.4]);
    }},
  { id:'m_procerus', key:'ms_procerus', zh:'降眉間肌', en:'Procerus', side:'M',
    desc:'起自鼻骨下部與外側鼻軟骨筋膜，向上止於眉間皮膚，與額肌內側緣纖維交織，收縮時下拉眉間皮膚，形成鼻根處橫紋',
    calc:(kp,sc)=>{
      const glab = kp[IDX.glabella];
      const base = kp[IDX.noseBase];
      const top = off(glab, 0, sc*0.005);
      const bottom = mid(glab, base, 0.22);
      return bandPoints([top, mid(top, bottom, 0.5), bottom], [sc*0.07, sc*0.066, sc*0.06]);
    },
    fibers:(kp,sc)=>{
      const glab = kp[IDX.glabella];
      const base = kp[IDX.noseBase];
      const top = off(glab, 0, sc*0.005);
      const bottom = mid(glab, base, 0.22);
      return fiberLines([top, mid(top, bottom, 0.5), bottom], [sc*0.07, sc*0.066, sc*0.06], [-0.55, -0.18, 0.18, 0.55]);
    }},
  { id:'m_depressor_supercilii', key:'ms_depressor_supercilii', zh:'降眉肌', en:'Depressor supercilii', side:'LR',
    desc:'起自上頷骨額突（近淚溝內側），止於眉頭皮下，與皺眉肌、眼輪匝肌內側部纖維交織，收縮時下拉眉頭，與皺眉肌協同產生眉間紋',
    calc:(kp,s,sc)=>{
      const dir = s==='R'?1:-1;
      const browInner = s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL];
      const glab = kp[IDX.glabella];
      const origin = mid(glab, browInner, 0.3);
      const insertion = off(browInner, dir*sc*0.01, sc*0.02);
      return bandPoints([origin, insertion], [sc*0.02, sc*0.015]);
    },
    fibers:(kp,s,sc)=>{
      const dir = s==='R'?1:-1;
      const browInner = s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL];
      const glab = kp[IDX.glabella];
      const origin = mid(glab, browInner, 0.3);
      const insertion = off(browInner, dir*sc*0.01, sc*0.02);
      return fiberLines([origin, insertion], [sc*0.02, sc*0.015], [-0.5, 0, 0.5]);
    }},
  { id:'m_pterygoid_lateral', key:'ms_pterygoid_lateral', zh:'翼外肌', en:'Lateral pterygoid', side:'LR',
    desc:'起自蝶骨大翼顳下面與翼外板外側面，止於下頷骨髁突頸部與顳頜關節盤，位置深藏於顴弓與下頷支之間，收縮時使張口、下頷前伸／側移，體表無法直接觸及',
    calc:(kp,s,sc)=>{
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const center = mid(temple, jaw, 0.55);
      return ovalPoints(center, sc*0.025, sc*0.02, sc*0.02, 12);
    },
    fibers:(kp,s,sc)=>{
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const center = mid(temple, jaw, 0.55);
      return ringLines(center, sc*0.025, sc*0.02, sc*0.02, [0.55], 12);
    }},
  { id:'m_pterygoid_medial', key:'ms_pterygoid_medial', zh:'翼內肌', en:'Medial pterygoid', side:'LR',
    desc:'起自翼外板內側面（部分自上頷結節），止於下頷角內側面翼肌粗隆，與咬肌形成「肌吊帶」夾住下頷角，收縮時提下頷、協助咀嚼側方運動；因位置深藏且被顴骨、下頷支擋住，臨床上多由外關穴方向進針',
    calc:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const chin = kp[IDX.chin];
      const center = mid(jaw, chin, 0.25);
      return ovalPoints(center, sc*0.028, sc*0.024, sc*0.024, 12);
    },
    fibers:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const chin = kp[IDX.chin];
      const center = mid(jaw, chin, 0.25);
      return ringLines(center, sc*0.028, sc*0.024, sc*0.024, [0.55], 12);
    }},
  { id:'m_masseter', key:'ms_masseter', zh:'咬肌', en:'Masseter', side:'LR',
    desc:'咀嚼主要肌肉，分淺層（外層）與深層（內層）：淺層起自顴弓前2/3下緣，肌纖維斜向後下止於下頷角外側面；深層起自顴弓後1/3及其內側面，止於下頷支上部與冠突。此處以內外兩層合併之整體範圍呈現，體表可觸及咀嚼時的隆起，收縮時提下頷（閉口），深層另協助下頷輕微後退',
    calc:(kp,s,sc)=>{
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      // 上端向中線靠攏，約與顴大肌起點同高（顴弓下緣），下端至下頷角
      const zygoOrigin = mid(off(mid(eyeOuter, cheek, 0.7), 0, sc*0.16), ala, 0.12);
      const top = mid(off(mid(temple, cheek, 0.3), 0, sc*0.06), zygoOrigin, 0.5);
      const bottom = off(mid(jaw, cheek, 0.16), 0, -sc*0.01);
      return bandPoints([top, mid(top, bottom, 0.5), bottom], [sc*0.107, sc*0.1, sc*0.073]);
    },
    fibers:(kp,s,sc)=>{
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const eyeOuter = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const zygoOrigin = mid(off(mid(eyeOuter, cheek, 0.7), 0, sc*0.16), ala, 0.12);
      const top = mid(off(mid(temple, cheek, 0.3), 0, sc*0.06), zygoOrigin, 0.5);
      const bottom = off(mid(jaw, cheek, 0.16), 0, -sc*0.01);
      return fiberLines([top, mid(top, bottom, 0.5), bottom], [sc*0.107, sc*0.1, sc*0.073], [-0.7, -0.4, -0.12, 0.16, 0.45, 0.72]);
    }}
];

const VESSELS = [
  { id:'v_sta_frontal', key:'vs_sta', zh:'顳淺動脈額支', en:'Superficial temporal artery, frontal branch (STA)', side:'LR',
    desc:'顳淺動脈於耳前上行後分出額支，斜向內上方走行供應額肌區域，與顳肌前緣、髮際線關係密切，為額部填充或提眉手術須避開的重要血管',
    calc:(kp,s,sc)=>{
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const outer = s==='R'?kp[IDX.browOuterR]:kp[IDX.browOuterL];
      const way = mid(temple, outer, 0.55);
      const end = off(outer, 0, -sc*0.18);
      return [temple, way, end];
    }},
  { id:'v_supratrochlear', key:'vs_stroch', zh:'滑車上動脈', en:'Supratrochlear artery', side:'LR',
    desc:'眼動脈分支，自眶上緣內側穿出後垂直上行進入額肌深層，是眉間、額頭中線注射時風險較高的血管之一，走行接近皺眉肌內側緣',
    calc:(kp,s,sc)=>{
      const inner = s==='R'?kp[IDX.browInnerR]:kp[IDX.browInnerL];
      return [inner, off(inner, 0, -sc*0.28)];
    }},
  { id:'v_supraorbital', key:'vs_sorb', zh:'眶上動脈', en:'Supraorbital artery', side:'LR',
    desc:'眼動脈分支，經眶上孔（切跡）穿出後先行於額肌深層，再穿出至淺層與顳淺動脈額支吻合，走行位置略外於滑車上動脈',
    calc:(kp,s,sc)=>{
      const midB = s==='R'?kp[IDX.browMidR]:kp[IDX.browMidL];
      return [midB, off(midB, 0, -sc*0.32)];
    }},
  { id:'v_facial', key:'vs_facial', zh:'顏面動脈', en:'Facial artery', side:'LR',
    desc:'源自頸外動脈，繞下頷骨下緣前行、越過咬肌前緣進入臉部，沿鼻唇溝上行至內眥附近，走行迂曲且緊鄰法令紋，是臉部填充注射最需留意、避免血管栓塞的主幹血管',
    calc:(kp,s,sc)=>{
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const glab = off(kp[IDX.glabella], s==='R'?-sc*0.03:sc*0.03, 0);
      return [jaw, mid(jaw, mouth, 0.6), ala, glab];
    }},
  { id:'v_dorsal_nasal', key:'vs_dna', zh:'鼻背動脈', en:'Dorsal nasal artery', side:'LR',
    desc:'眼動脈終末分支之一，自內眥上方下行至鼻背兩側，左右鼻背動脈間常有交通支，為鼻部填充注射時須格外小心的血管',
    calc:(kp,s,sc)=>{
      const glab = off(kp[IDX.glabella], s==='R'?-sc*0.02:sc*0.02, 0);
      return [glab, kp[IDX.noseBase]];
    }},
  { id:'v_transverse_facial', key:'vs_tfa', zh:'橫顏面動脈', en:'Transverse facial artery', side:'LR',
    desc:'顳淺動脈分支，起於顴弓下方，橫向穿過咬肌表面走向頰部，供應腮腺及鄰近皮膚，為顳頜關節、頰部注射操作時的參考血管',
    calc:(kp,s,sc)=>{
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      return [temple, mid(temple, cheek, 0.6)];
    }}
];

const STRUCTURES = [
  { id:'st_modiolus', key:'st_modiolus', zh:'口角聯合結節', en:'Modiolus', side:'LR', color:'#ba68c8',
    desc:'口角外下方的纖維肌肉匯聚點，為顴大肌、笑肌、降口角肌、頰肌、口輪匝肌等多條表情肌交會處，亞洲人平均約在口角外側偏下方，是除皺／拉提注射時常用的定位基準點',
    calc:(kp,s,sc)=>{
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const dir = s==='R'?-1:1;
      return off(mouth, dir*sc*0.09, sc*0.07);
    }},
  { id:'st_parotid', key:'st_parotid', zh:'腮腺', en:'Parotid gland', side:'LR', color:'#4fc3f7',
    desc:'耳前至下頷角區域的唾液腺，外形略呈倒三角形，淺葉覆蓋於咬肌後緣表面，深部與顏面神經分支交錯，為耳前、下頷角部位注射或手術時須留意的腺體構造',
    calc:(kp,s,sc)=>{
      const temple = s==='R'?kp[IDX.templeR]:kp[IDX.templeL];
      const jaw = s==='R'?kp[IDX.jawR]:kp[IDX.jawL];
      return mid(temple, jaw, 0.4);
    }},
  { id:'st_parotid_duct', key:'st_parotid_duct', zh:'腮腺管開口', en:'Parotid duct papilla', side:'LR', color:'#4fc3f7',
    desc:'腮腺管（Stensen氏管）自腮腺前緣發出，橫越咬肌表面前行，開口於上頷第二大臼齒對應之頰黏膜處，體表投影約略在鼻翼與口角連線中點',
    calc:(kp,s,sc)=>{
      const ala = s==='R'?kp[IDX.noseAlaR]:kp[IDX.noseAlaL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      return mid(mid(ala, mouth, 0.5), cheek, 0.3);
    }},
  { id:'st_buccal_fat', key:'st_buccal_fat', zh:'頰脂墊', en:'Buccal fat pad', side:'LR', color:'#ffb74d',
    desc:'位於顴骨下方、咬肌與頰肌之間的脂肪組織，前緣延伸至上頷骨與顴大肌深部，是臉頰凹陷評估與豐頰／削頰手術規劃時重要的軟組織層次參考',
    calc:(kp,s,sc)=>{
      const cheek = s==='R'?kp[IDX.cheekR]:kp[IDX.cheekL];
      const mouth = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      return mid(cheek, mouth, 0.35);
    }}
];

const LANDMARKS = [
  { id:'lm_lc', key:'lm_lc', zh:'外眥', en:'Lateral canthus (LC)', side:'LR', color:'#9e9e9e',
    calc:(kp,s)=> s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL] },
  { id:'lm_mc', key:'lm_mc', zh:'內眥', en:'Medial canthus (MC)', side:'LR', color:'#9e9e9e',
    calc:(kp,s)=> s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL] },
  { id:'lm_p', key:'lm_p', zh:'瞳孔(約)', en:'Pupil (P)', side:'LR', color:'#9e9e9e',
    calc:(kp,s)=>{
      const outer = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      const inner = s==='R'?kp[IDX.eyeInnerR]:kp[IDX.eyeInnerL];
      const top = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      const bottom = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      return mid(mid(outer, inner, 0.5), mid(top, bottom, 0.5), 0.5);
    }},
  { id:'lm_ch', key:'lm_ch', zh:'口角', en:'Cheilion (Ch)', side:'LR', color:'#9e9e9e',
    calc:(kp,s)=> s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL] },
  { id:'lm_tr', key:'lm_tr', zh:'耳屏(近似)', en:'Tragion (Tr)', side:'LR', color:'#9e9e9e',
    calc:(kp,s)=> s==='R'?kp[IDX.templeR]:kp[IDX.templeL] }
];
