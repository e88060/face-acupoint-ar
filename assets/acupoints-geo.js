/* 共用穴位幾何資料 — 由 pages/ar.html 之 ACUPOINTS 定位邏輯萃取，供AR跑考測驗使用 */

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
  foreheadCornerR: 21, foreheadCornerL: 251
};

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function mid(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
function off(p, dx, dy) { return { x: p.x + dx, y: p.y + dy }; }


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
      const yx = { x: ala.x, y: kp[IDX.noseBase].y };
      const m = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      return mid(yx, m, 0.3);
    }},

  { id:'st_chengqi', name:'承泣', code:'ST1', meridian:'ST', side:'LR',
    desc:'瞳孔直下，眼球與眶下緣之間',
    indications:'目赤腫痛、迎風流淚、夜盲、眼瞼瞤動',
    anatomy:'位於眼輪匝肌與眶下緣之間，深部為眼球，布有眶下神經',
    technique:'囑患者閉目，固定眼球，沿眶下緣緩慢直刺0.5–1寸，不宜提插捻轉',
    calc:(kp,s)=>{
      const b = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      const t = s==='R'?kp[IDX.eyeTopR]:kp[IDX.eyeTopL];
      return off(b, 0, dist(t,b)*0.25);
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
      return { x: bot.x, y: bot.y + eyeH*1.0 };
    }},
  { id:'st_juliao', name:'巨髎', code:'ST3', meridian:'ST', side:'LR',
    desc:'瞳孔直下，平鼻翼下緣',
    indications:'口眼歪斜、鼻衄、齒痛、唇頰腫',
    anatomy:'皮下為提上唇肌，布有眶下神經、面神經分支',
    technique:'直刺或斜刺0.3–0.5寸',
    calc:(kp,s)=>{
      const b = s==='R'?kp[IDX.eyeBottomR]:kp[IDX.eyeBottomL];
      return { x:b.x, y: kp[IDX.noseBase].y };
    }},
  { id:'st_ditsang', name:'地倉', code:'ST4', meridian:'ST', side:'LR',
    desc:'口角外側，瞳孔直下',
    indications:'口眼歪斜、流涎、三叉神經痛',
    anatomy:'皮下為口輪匝肌，深層為頰肌，布有面神經及眶下神經分支',
    technique:'斜刺或平刺0.5–0.8寸，可透刺頰車',
    calc:(kp,s,sc)=>{
      const m = s==='R'?kp[IDX.mouthCornerR]:kp[IDX.mouthCornerL];
      const dir = s==='R'?-1:1;
      return off(m, dir*sc*0.03, 0);
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
    calc:(kp,s,sc)=>{
      const e = s==='R'?kp[IDX.eyeOuterR]:kp[IDX.eyeOuterL];
      return off(e, 0, sc*0.30);
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
    calc:(kp,_,sc)=> off(kp[IDX.lowerLipBottom], 0, sc*0.15) },
  { id:'ren_lianquan', name:'廉泉', code:'REN23', meridian:'REN', side:'M',
    desc:'喉結上方，舌骨上緣凹陷處',
    indications:'舌強不語、吞嚥困難、失音、流涎',
    anatomy:'深部為會厭，布有舌下神經分支',
    technique:'針尖向舌根方向斜刺0.5–0.8寸，不宜深刺',
    calc:(kp,_,sc)=> off(kp[IDX.chin], 0, sc*0.55) }
];
