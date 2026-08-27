(() => {
  'use strict';

  const VERSION = 5;
  const ASSET_REV = '?v=clean5';
  const SAVE_KEY = 'mianmu-the-face-of-it-save-v5';
  const META_KEY = 'mianmu-the-face-of-it-meta-v5';
  const LEGACY_SAVE_KEYS = ['mianmu-the-face-of-it-save-v4','mianmu-the-face-of-it-save-v3'];
  const LEGACY_META_KEYS = ['mianmu-the-face-of-it-meta-v4','mianmu-the-face-of-it-meta-v3'];
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  const audios = {
    sea: document.getElementById('amb-sea'),
    shop: document.getElementById('amb-shop'),
    clock: document.getElementById('sfx-clock'),
    knock: document.getElementById('sfx-knock'),
    glass: document.getElementById('sfx-glass')
  };

  const MAIN_MASKS = ['mayor','butcher','elaine','milo','postman'];
  const MASK_META = {
    mayor:{name:'镇长 · 奥斯文', residue:'辨 · 鼻子', image:'mayor.webp', desc:'一场演讲必须同时经得起公开说法与私人痕迹。'},
    butcher:{name:'屠夫 · 格伦', residue:'言 · 嘴唇', image:'butcher.webp', desc:'六份牲畜档案，却摆了七副餐具。'},
    elaine:{name:'舞台女郎 · 伊莲', residue:'听 · 耳朵', image:'elaine.webp', desc:'十二张脸里，没有一张能单独证明“我是谁”。'},
    milo:{name:'鞋匠之子 · 米罗', residue:'见 · 眼睛', image:'milo.webp', desc:'孩子把疾病与紧张重新解释成兽形怪物。'},
    postman:{name:'邮差 · 埃利亚斯', residue:'行 · 眉毛', image:'postman.webp', desc:'每走七步都回到起点；第七封信永远寄不到。'},
    soren:{name:'盲眼老人 · 索伦', residue:'温 · 脸颊', image:'soren.webp', desc:'没有画面，只有声音在黑暗中长出体积。'},
    blank:{name:'给自己的空白', residue:'未定形 · 透明残响', image:'blank.webp', desc:'没有正确答案；第一次明确留下自己真正想带走的东西。'}
  };

  const SHOP_CHANGES = [
    {id:'thread', title:'黑线', text:'工作台上原本打死的黑线结，不知什么时候自己松开了。'},
    {id:'lamp', title:'小灯', text:'童年身高刻痕旁多了一盏小灯，灯芯刚好够照到后屋。'},
    {id:'chair', title:'椅子', text:'师父的椅子被推回桌下，像有人做完了工作。'},
    {id:'kettle', title:'水壶', text:'水壶被添满了，却仍是冷的。'},
    {id:'stitch', title:'新线', text:'微笑面具内侧多了一根新线，针脚不是阿七留下的。'},
    {id:'door', title:'门板', text:'夜里门板发出三下敲木料的节奏——师父量木头时总这么敲。'},
    {id:'dollchip', title:'木屑', text:'无脸瓷娃娃旁出现一小片新木屑，与童年刻痕处的材质相同。'}
  ];

  const OBSERVATIONS = {
    box_eye:{title:'木盒只在镜中长出眼睛', text:'阿七看向木盒时，镜面中的盒子先出现双眼。', group:'物理'},
    box_missing:{title:'五官出现时阿七会暂时缺失', text:'盒面多一个五官，镜中的阿七就少一个对应部位。', group:'物理'},
    jars:{title:'玻璃罐组织会模仿表情', text:'罐中组织像五官，却没有血管，更像湿纸纤维。', group:'行为'},
    master_rule:{title:'面具需要三种痕迹', text:'旧订单统一记着：相貌、习惯、见证。', group:'工艺'},
    water_reverse:{title:'记忆房间只有墙钟不倒流', text:'水、烛泪、玻璃都向过去移动，只有时钟仍顺时针。', group:'时间'},
    mother_note:{title:'“不要替他——”', text:'水雾留下半句没有写完的话。', group:'叙事'},
    mayor_public:{title:'演讲与实际付款方式不一致', text:'公开说法强调程序，却有绕开程序的孤儿院付款。', group:'事实'},
    mayor_father:{title:'镇长父亲因一次诚实举报失业', text:'旧报纸解释了他为什么把“好听的话”看得比真话安全。', group:'行为'},
    butcher_six:{title:'六份牲畜档案，却有七套餐具', text:'第七个位置不属于任何一头猪。', group:'空间'},
    butcher_sender:{title:'第七把椅子转向屠夫', text:'真正没有被安排告别的人，是一直负责送别的格伦。', group:'行为'},
    elaine_habit:{title:'不同年龄的伊莲都会吸气两次', text:'脸、年龄和性别呈现改变，唱高音前的动作却持续存在。', group:'行为'},
    elaine_face:{title:'动作连续性比“最初脸”更稳定', text:'三块镜片无法拼成同一张脸，却能拼成同一种动作轮廓。', group:'身份'},
    milo_monster:{title:'怪物动作对应现实生活动作', text:'撞门、舔爪、蜕皮都能在成人的真实习惯中找到对应。', group:'行为'},
    milo_fear:{title:'米罗害怕的是“有一天不再回来”', text:'父亲恢复人形时仍然病弱，怪物并不是问题本身。', group:'身份'},
    postman_loop:{title:'第七步会把道路重置', text:'无论路线景物怎样变化，第七步都会把人送回原点。', group:'时间'},
    postman_reverse:{title:'第六步后反向一次可跳出循环', text:'不是找到新钥匙，而是在重复行为中第一次做相反的事。', group:'行为'},
    soren_echo:{title:'夹层墙产生双重回声', text:'声音在黑暗里暴露了墙后的第二层空间。', group:'空间'},
    soren_voice:{title:'老人记得声音，不记得最后一张脸', text:'对他来说“一个人在这里”来自节拍、距离与体温。', group:'身份'},
    blank_choice:{title:'空白残响记录主动选择', text:'它没有固定五官，只保留阿七第一次明确留下的物件与方向。', group:'身份'},
    six_functions:{title:'六种残响对应六种稳定功能', text:'见、辨、听、行、言、温能够让一张脸稳定，却不能决定一个人应成为谁。', group:'工艺'}
  };

  const VALID_CONNECTIONS = [
    ['box_eye','box_missing','物理关系'],
    ['jars','master_rule','工艺关系'],
    ['water_reverse','mother_note','时间关系'],
    ['mayor_public','mayor_father','行为关系'],
    ['butcher_six','butcher_sender','空间关系'],
    ['elaine_habit','elaine_face','身份关系'],
    ['milo_monster','milo_fear','行为关系'],
    ['postman_loop','postman_reverse','时间关系'],
    ['soren_echo','soren_voice','空间关系'],
    ['blank_choice','six_functions','身份关系']
  ];

  const memoryStore = new Map();
  const storage = {
    getItem(key){ try{return window.localStorage.getItem(key)}catch(_){return memoryStore.has(key)?memoryStore.get(key):null} },
    setItem(key,val){ try{window.localStorage.setItem(key,val)}catch(_){memoryStore.set(key,String(val))} },
    removeItem(key){ try{window.localStorage.removeItem(key)}catch(_){memoryStore.delete(key)} }
  };

  function loadWithLegacy(primary, legacyKeys, fallback){
    const direct=loadJSON(primary,null); if(direct) return direct;
    for(const key of legacyKeys){const value=loadJSON(key,null); if(value){try{storage.setItem(primary,JSON.stringify(value))}catch(_){} return value}}
    return fallback;
  }
  let meta = loadWithLegacy(META_KEY, LEGACY_META_KEYS, {completed:false, endings:[], bestTime:null, ngp:false});
  let state = loadWithLegacy(SAVE_KEY, LEGACY_SAVE_KEYS, defaultState());
  normalizeState();
  let sideTab = 'items';
  let selectedObs = [];
  let heldItemId = null;
  let timerHandle = null;

  function defaultState(){
    return {
      version:VERSION, started:false, startedAt:0, playSeconds:0,
      chapter:0, scene:'shop', audio:true, reduced:false,
      prologue:{features:[], aligned:false, key:false, secret:false, traces:[], mask:false, water:false},
      chapter2Unlocked:false, masksDone:[], hiddenDone:[], currentMask:null,
      inventory:[], observations:[], links:[], habits:[], residues:[],
      shopChangesAvailable:0, shopChangesSeen:[],
      postmanChoice:null, blankItem:null, blankDirection:null,
      finalUnlocked:false, finalStations:[], finalPairing:{}, motherShown:false, centerSolved:false,
      ending:null, hiddenEnding:false, hints:{}, mistakes:0, hotspotAssist:false, ngp:!!meta.completed
    };
  }

  function normalizeState(){
    const d=defaultState();
    if(!state || typeof state!=='object') state=d;
    for(const [k,v] of Object.entries(d)) if(state[k]===undefined) state[k]=v;
    state.version=VERSION;
    state.prologue=Object.assign({},d.prologue,state.prologue||{});
    state.finalPairing=state.finalPairing||{};
    for(const k of ['masksDone','hiddenDone','inventory','observations','links','habits','residues','shopChangesSeen','finalStations']) if(!Array.isArray(state[k])) state[k]=[];
  }

  function loadJSON(key, fallback){ try{const v=storage.getItem(key); return v?JSON.parse(v):fallback}catch(_){return fallback} }
  function save(){ try{storage.setItem(SAVE_KEY,JSON.stringify(state)); storage.setItem(META_KEY,JSON.stringify(meta))}catch(_){} }
  function resetSave(){ state=defaultState(); save(); }

  function addUnique(arr,val){ if(!arr.includes(val)) arr.push(val); }
  function addObs(...ids){ ids.forEach(id=>{if(OBSERVATIONS[id]) addUnique(state.observations,id)}); save(); }
  function addItem(id,label,desc){ if(!state.inventory.find(x=>x.id===id)) state.inventory.push({id,label,desc}); save(); }
  function removeItem(id){ state.inventory=state.inventory.filter(x=>x.id!==id); save(); }
  function addHabit(text){ addUnique(state.habits,text); save(); }
  function addResidue(id,label){ if(!state.residues.find(x=>x.id===id)) state.residues.push({id,label}); save(); }
  function hasMask(id){ return state.masksDone.includes(id) || state.hiddenDone.includes(id); }
  function completedMain(){ return MAIN_MASKS.filter(hasMask).length; }

  function toast(msg,type=''){ const el=document.createElement('div'); el.className='toast '+type; el.textContent=msg; toastRoot.appendChild(el); setTimeout(()=>el.remove(),3600); }
  function playSfx(name){ if(!state.audio) return; const a=audios[name]; if(!a)return; try{a.currentTime=0;a.volume=.32;a.play().catch(()=>{})}catch(_){} }
  function syncAmbience(){
    const useSea=['postman','water','title'].includes(state.scene); const target=useSea?audios.sea:audios.shop; const other=useSea?audios.shop:audios.sea;
    [target,other].forEach(a=>{if(a)a.volume=.14});
    if(!state.audio){Object.values(audios).forEach(a=>{try{a.pause()}catch(_){}});return}
    try{other.pause();target.play().catch(()=>{})}catch(_){}
  }

  function startTimer(){ if(timerHandle)clearInterval(timerHandle); timerHandle=setInterval(()=>{if(state.started && !state.ending){state.playSeconds++; if(state.playSeconds%10===0)save()}},1000) }
  function fmtTime(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':')}


  function currentChapterLabel(){
    if(!state.started)return '尚未开始';
    if(!state.prologue.aligned)return '序章 · 师父不在了';
    if(!state.prologue.water)return '第一章 · 胎记';
    if(completedMain()<5)return `第二章 · 七张面具（${completedMain()}/5）`;
    if(!state.centerSolved)return '第三章 · 拼凑';
    return '终章 · 选择';
  }


  function render(){
    if(!state.started){renderTitle();return}
    renderGame();
    syncAmbience();
    startTimer();
  }

  function renderTitle(){
    state.scene='title';
    app.innerHTML=`<main class="title-screen clean-title screen">
      <div class="title-bg"></div>
      <section class="title-left clean-title-left">
        <div class="title-mark">面目</div>
        <div class="title-en">THE FACE OF IT</div>
        <div class="title-sub">海湾第七码头 · 第七日</div>
        <div class="title-menu clean-title-menu">
          <button class="menu-btn" data-act="new">新游戏</button>
          <button class="menu-btn" data-act="continue" ${storage.getItem(SAVE_KEY)?'':'disabled'}>继续游戏</button>
          <button class="menu-btn" data-act="chapters" ${meta.completed?'':'disabled'}>章节回望</button>
          <button class="menu-btn" data-act="settings">设置</button>
          <button class="menu-btn" data-act="credits">制作说明</button>
        </div>
        <div class="title-version">v5.0 · 场景优先交互 · ${meta.completed?'残响视角已开放':'建议佩戴耳机'}</div>
      </section>
      <div class="title-whisper">师父的灯还亮着。门没有锁。</div>
    </main>`;
    app.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>titleAction(b.dataset.act)));
    syncAmbience();
  }

  function titleAction(act){
    if(act==='new'){
      if(storage.getItem(SAVE_KEY) && !confirm('开始新游戏会覆盖当前进度。继续吗？'))return;
      resetSave(); state.started=true; state.startedAt=Date.now(); state.ngp=!!meta.completed; state.scene='shop'; save();
      playSfx('knock'); render();
      showStory(['海湾的雾从门缝里进来。','师父的工作灯还亮着，椅子却是空的。','订单簿停在第七日，最后一行只写了半句：','“缺一块就空着，不要替别人长脸。”'],()=>{closeModal();render()});
    } else if(act==='continue') {state.started=true; if(state.scene==='title')state.scene='shop'; render();}
    else if(act==='settings') openSettings();
    else if(act==='credits') openInfo('制作说明',`<p>《面目》是一部围绕“脸、面具、接缝、镜子、针线、潮水”构成的超现实网页解谜作品。</p><p>本版本依据 v3.0 制作基准开发：不使用关键词输入，不把主线做成选择题考试；正确方法必须在世界内部拥有可观察依据。</p>`);
    else if(act==='about') openInfo('关于本作',`<p>镇民把面具铺当成裁缝铺、医生和殡仪馆的混合物：敬而远之，却总会有需要它的一天。</p><p>三个异常永远不解释：为什么公共日历没有第八日；窗台无脸瓷娃娃是谁留下的；海里漂来的空白面具属于谁。</p>`);
    else if(act==='chapters') openInfo('章节回望',`<div class="paper-grid">${['序章 · 师父不在了','第一章 · 胎记','第二章 · 七张面具','第三章 · 拼凑','终章 · 选择'].map((x,i)=>`<div class="paper-card"><h4>${x}</h4><p>${i<4?'已经留下过的记忆不会完全恢复原样；二周目可用残响视角重新看店铺。':'结局不是答案，是阿七第一次明确替自己做决定。'}</p></div>`).join('')}</div>`);
  }

  function renderGame(){
    app.innerHTML=`<main class="game-screen clean-game screen ${state.hotspotAssist?'assist-on':''}">
      <section class="stage-shell clean-stage-shell">${sceneHTML()}</section>
      <nav class="clean-toolbar" aria-label="游戏功能">
        <button class="icon-btn" data-top="notes" data-label="观察记录" aria-label="观察记录">◉</button>
        <button class="icon-btn" data-top="hint" data-label="提示" aria-label="提示">?</button>
        <button class="icon-btn" data-top="support" data-label="支持作者" aria-label="支持作者">￥</button>
        <button class="icon-btn ${state.audio?'':'is-off'}" data-top="sound" data-label="声音${state.audio?'开启':'关闭'}" aria-label="声音${state.audio?'开启':'关闭'}">♪</button>
        <button class="icon-btn" data-top="menu" data-label="菜单" aria-label="菜单">☰</button>
      </nav>
      ${inventoryDockHTML()}
      ${heldItemId?`<div class="held-item-pill" aria-live="polite">${esc(itemLabel(heldItemId))}</div>`:''}
    </main>`;
    bindGameEvents();
  }

  function inventoryDockHTML(){
    const items=state.inventory;
    if(!items.length)return '';
    return `<div class="inventory-dock" aria-label="物品栏">${items.map(x=>`<button class="inventory-slot ${heldItemId===x.id?'selected':''}" draggable="true" data-item="${esc(x.id)}" aria-label="${esc(x.label)}" data-label="${esc(x.label)}"><span>${esc(shortItemLabel(x.label))}</span></button>`).join('')}</div>`;
  }
  function shortItemLabel(label){
    const map={'无齿黑铁钥匙':'钥匙','微笑面具半成品':'面具','反复拆开的黑线':'黑线','童年刻痕木屑':'木屑','师父的微笑面具':'面具'};
    return map[label]||String(label||'物').replace(/[·（(].*$/,'').slice(0,2);
  }
  function itemLabel(id){return state.inventory.find(x=>x.id===id)?.label||id}

  function sceneHTML(){
    const scene=state.scene;
    const map={
      shop:{img:'mask-shop.webp',title:'面具铺',caption:shopCaption(),cls:completedMain()>=3?'polluted':''},
      secret:{img:'secret-room.webp',title:'师父的密室',caption:'七只玻璃罐沿石墙排开。里面的东西像脸的一部分，又不像肉。',cls:''},
      water:{img:'water-memory.webp',title:'水底记忆',caption:'潮声从四面八方涌来；这间房正在把自己倒回过去。',cls:'memory-water'},
      mayor:{img:'mayor.webp',title:'奥斯文的两面',caption:'同一句话，在公开场合和私人房间里留下不同的物理后果。',cls:''},
      butcher:{img:'butcher.webp',title:'格伦的告别宴',caption:'六份档案，七套餐具。所有人都认真等待一场过分正式的晚餐。',cls:''},
      elaine:{img:'elaine.webp',title:'伊莲的十二面镜',caption:'年龄与脸不断更换，身体却保留一些不肯消失的习惯。',cls:''},
      milo:{img:'milo.webp',title:'米罗的怪物世界',caption:'面具铺没有消失，只是同一件家具被孩子重新解释成了怪物。',cls:''},
      postman:{img:'postman.webp',title:'埃利亚斯的第七步',caption:'路没有尽头。因为他从来不允许自己走过离别的那一天。',cls:''},
      soren:{img:'soren.webp',title:'索伦听见的房间',caption:'关掉“看见”，空间才开始用回声显出体积。',cls:''},
      blank:{img:'blank.webp',title:'给自己的空白',caption:'这里没有客户，没有模板，也没有一张等着被拼完整的脸。',cls:''},
      finale:{img:'finale.webp',title:'三站共振',caption:'六种稳定功能足以制造一张完整的脸，却不一定足以定义一个人。',cls:''}
    };
    const s=map[scene]||map.shop;
    return `<div class="scene-frame ${s.cls}" data-scene="${scene}" aria-label="${esc(s.title)}"><div class="scene-bg" style="background-image:url('assets/images/${s.img}${ASSET_REV}')"></div><div class="scene-overlays">${sceneHotspots(scene)}</div></div>`;
  }

  function shopCaption(){
    if(!state.prologue.aligned)return '师父不在。木盒正放在工作台上，表面没有任何五官。';
    if(!state.prologue.secret)return '木盒已经打开。抽屉底部有一把从未见过的小钥匙。';
    if(!state.prologue.water)return '密室里的师父面具还没有完成。';
    if(completedMain()<5)return `墙上已经挂回 ${completedMain()} 张主线面具。每次回来，铺子都比之前多记住一点。`;
    if(!state.finalUnlocked)return '五种陌生习惯在阿七身上同时出现。镜子比他先动了一下。';
    return '工作台下方的地板已经打开，三座旧式验证台在下面等着。';
  }

  function hs(id,label,left,top,done=false,subtle=false){return `<button class="hotspot ${done?'done':''} ${subtle?'subtle':''}" style="left:${left}%;top:${top}%" data-hot="${id}" data-label="${esc(label)}" aria-label="${esc(label)}"><span class="dot"></span></button>`}
  function sceneHotspots(scene){
    if(scene==='shop'){
      let a=[];
      if(!state.prologue.aligned){
        a.push(hs('mirror','纵裂旧镜',11,18,state.prologue.features.includes('eye')));
        a.push(hs('lamp','工作灯',43,18,state.prologue.features.includes('mouth')));
        a.push(hs('doll','无脸瓷娃娃',74,19,state.prologue.features.includes('ear')));
        a.push(hs('scissors','裁布剪',38,63,state.prologue.features.includes('nose')));
        a.push(hs('chair','师父的椅子',68,58,state.prologue.features.includes('brow')));
        a.push(hs('box','空白木盒',49,48,state.prologue.features.length===5));
      } else if(!state.prologue.secret){a.push(hs('darkdoor','后屋暗门',52,26,false));}
      else if(state.prologue.water && completedMain()<5){
        a.push(hs('maskwall','面具墙',70,24,false));
        if(completedMain()>=3 && !hasMask('soren'))a.push(hs('bell','门铃留下的名片',18,65,false));
        if(completedMain()>=4 && !hasMask('blank'))a.push(hs('blankmask','没有订单的空白面具',55,58,false));
      }
      const unseen=SHOP_CHANGES.slice(0,state.shopChangesAvailable).find(x=>!state.shopChangesSeen.includes(x.id));
      if(unseen)a.push(hs('shopchange',`似乎变了 · ${unseen.title}`,81,48,false,true));
      if(completedMain()===5){a.push(hs('finalmirror','再照一次镜子',10,24,state.finalUnlocked)); if(state.finalUnlocked)a.push(hs('finaldoor','地板下的验证台',47,73,false));}
      if(state.ngp && state.prologue.water)a.push(hs('ngp','残响视角',83,72,false,true));
      return a.join('');
    }
    if(scene==='secret'){
      return [hs('jars','七只保存罐',18,22,state.observations.includes('jars')),hs('ledger','旧工艺账',58,31,state.observations.includes('master_rule')),hs('halfmask','微笑面具半成品',72,57,state.inventory.some(x=>x.id==='halfmask')),hs('blackthread','反复拆开的黑线',30,65,state.inventory.some(x=>x.id==='blackthread')),hs('heightmark','童年身高刻痕的木屑',44,46,state.inventory.some(x=>x.id==='woodchip')),hs('craft','工作台 · 制作面具',58,67,state.prologue.mask)].join('');
    }
    if(scene==='water')return hs('clockpuzzle','唯一仍向前的墙钟',51,28,state.prologue.water)+hs('waterobs','倒流的房间',22,58,state.observations.includes('water_reverse'));
    if(['mayor','butcher','elaine','milo','postman','soren','blank'].includes(scene))return `<button class="scene-back" data-hot="returnshop" data-label="返回面具铺" aria-label="返回面具铺">←</button>`;
    if(scene==='finale')return hs('stations','三座验证台',41,38,state.finalStations.length===3)+hs('center','中央黑色空位',67,58,state.centerSolved);
    return '';
  }


  function sideTabContent(){
    if(sideTab==='items'){
      const items=[...state.inventory,...state.residues.map(r=>({id:r.id,label:r.label,desc:'脸的残响 · 并非真正的人体组织'}))];
      return `<div class="side-section-title">当前持有</div><div class="inventory-grid">${items.length?items.map(x=>`<div class="inventory-item"><strong>${esc(x.label)}</strong><span>${esc(x.desc||'')}</span></div>`).join(''):'<div class="muted small">抽屉里还是空的。</div>'}</div>`;
    }
    if(sideTab==='obs'){
      const cards=state.observations.map(id=>OBSERVATIONS[id]).filter(Boolean);
      return `<div class="relation-strip"><span class="small">选两张事实卡建立关系</span><button class="ghost-btn small" data-connect ${selectedObs.length===2?'':'disabled'}>连接</button></div><div class="side-section-title">事实，不是结论</div><div>${cards.length?state.observations.map(id=>{const o=OBSERVATIONS[id];const sel=selectedObs.includes(id),linked=state.links.some(l=>l.includes(id));return `<div class="obs-card ${sel?'selected':''} ${linked?'linked':''}" data-obs="${id}"><strong>${esc(o.title)}</strong><span>${esc(o.text)}</span><span>${o.group}</span></div>`}).join(''):'<div class="muted small">先去现场看见一些东西。</div>'}</div><div class="side-section-title" style="margin-top:14px">已建立关系</div>${state.links.length?state.links.map(l=>`<div class="pair-row">${esc(OBSERVATIONS[l[0]]?.title||l[0])}<br>↔ ${esc(OBSERVATIONS[l[1]]?.title||l[1])}<br><span class="muted">${esc(l[2])}</span></div>`).join(''):'<div class="muted small">系统只确认关系是否成立，不替你写完整结论。</div>'}`;
    }
    const list=[...MAIN_MASKS,'soren','blank'];
    return `<div class="mask-list">${list.map(id=>{const m=MASK_META[id];const unlocked=state.chapter2Unlocked && (MAIN_MASKS.includes(id)||(id==='soren'&&completedMain()>=3)||(id==='blank'&&completedMain()>=4));return `<div class="mask-card ${hasMask(id)?'done':''} ${!unlocked?'locked':''}" data-mask="${id}"><div class="mask-seal"></div><div><strong>${m.name}</strong><span>${hasMask(id)?`已获得：${m.residue}`:unlocked?m.desc:'尚未出现'}</span></div></div>`}).join('')}</div>`;
  }

  function bindGameEvents(){
    document.querySelectorAll('[data-top]').forEach(b=>b.onclick=()=>topAction(b.dataset.top));
    document.querySelectorAll('[data-hot]').forEach(b=>b.onclick=()=>handleHotspotInteraction(b.dataset.hot));
    bindInventoryInteractions();
  }

  function bindInventoryInteractions(){
    document.querySelectorAll('[data-item]').forEach(b=>{
      b.onclick=()=>selectHeldItem(b.dataset.item);
      b.addEventListener('dragstart',e=>{heldItemId=b.dataset.item;b.classList.add('selected');e.dataTransfer?.setData('text/plain',heldItemId);if(e.dataTransfer)e.dataTransfer.effectAllowed='copy';document.querySelector('.scene-frame')?.classList.add('drag-active')});
      b.addEventListener('dragend',()=>document.querySelector('.scene-frame')?.classList.remove('drag-active'));
    });
    document.querySelectorAll('[data-hot]').forEach(t=>{
      t.addEventListener('dragover',e=>{e.preventDefault();t.classList.add('drop-hover')});
      t.addEventListener('dragleave',()=>t.classList.remove('drop-hover'));
      t.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();t.classList.remove('drop-hover');const item=e.dataTransfer?.getData('text/plain')||heldItemId;if(item)useItemOnTarget(item,t.dataset.hot)});
    });
    const frame=document.querySelector('.scene-frame');
    if(frame){
      frame.addEventListener('dragover',e=>{e.preventDefault();frame.classList.add('drag-active')});
      frame.addEventListener('dragleave',e=>{if(e.target===frame)frame.classList.remove('drag-active')});
      frame.addEventListener('drop',e=>{e.preventDefault();frame.classList.remove('drag-active');const item=e.dataTransfer?.getData('text/plain')||heldItemId;if(!item)return;const target=nearestHotspot(e.clientX,e.clientY);if(target)useItemOnTarget(item,target.dataset.hot);else toast(`${itemLabel(item)}没有找到可作用的位置。`)});
    }
  }

  function nearestHotspot(x,y){
    const nodes=[...document.querySelectorAll('.scene-frame [data-hot]:not(.scene-back)')];
    let best=null,dist=Infinity;
    for(const el of nodes){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(cx-x,cy-y);if(d<dist){dist=d;best=el}}
    return dist<150?best:null;
  }

  function selectHeldItem(id){
    heldItemId=heldItemId===id?null:id;
    if(heldItemId)toast(`拿起：${itemLabel(heldItemId)}。拖到场景，或先选物品再点目标。`);
    render();
  }

  function handleHotspotInteraction(id){
    if(id==='returnshop'){heldItemId=null;hotAction(id);return}
    if(heldItemId){useItemOnTarget(heldItemId,id);return}
    hotAction(id);
  }

  function clearHeld(){heldItemId=null;render()}

  function useItemOnTarget(item,target){
    const label=itemLabel(item);
    if(item==='key'&&target==='darkdoor'){
      heldItemId=null;removeItem('key');state.prologue.secret=true;state.scene='secret';save();playSfx('knock');render();
      showStory(['黑铁片滑进墙缝，几乎没有阻力。','整块木板向里退开。','潮湿石墙后排列着七只玻璃罐。'],()=>{closeModal();render()});return;
    }
    if(['halfmask','blackthread','woodchip'].includes(item)&&target==='craft'){heldItemId=null;openCraftPuzzle();return}
    const reactions={
      'key:box':'木盒没有钥匙孔。黑铁靠近时，镜中的盒面反而更像阿七。',
      'key:jars':'钥匙贴近玻璃，罐中组织缓慢模仿了一次握钥匙的动作。',
      'blackthread:jars':'黑线靠近玻璃后微微绷紧，像有人从另一端拉了一下。',
      'woodchip:jars':'木屑浮在玻璃外侧；里面的组织没有回应木头，只回应阿七的脸。',
      'halfmask:jars':'半成品靠近保存罐时，罐中几处轮廓短暂朝同一个表情收拢。',
      'mastermask:clockpuzzle':'面具内侧传来的钟声与墙钟错开半拍。'
    };
    const msg=reactions[`${item}:${target}`];
    if(msg){toast(msg);return}
    toast(`${label}放到这里，没有发生能够验证的新变化。`);
  }

  function toggleObs(id){
    if(selectedObs.includes(id))selectedObs=selectedObs.filter(x=>x!==id);else{if(selectedObs.length>=2)selectedObs.shift();selectedObs.push(id)}
    sideTab='obs';
  }

  function connectSelectedObs(){
    if(selectedObs.length!==2)return;
    const [a,b]=selectedObs; const pair=VALID_CONNECTIONS.find(x=>(x[0]===a&&x[1]===b)||(x[0]===b&&x[1]===a));
    if(pair){if(!state.links.some(l=>(l[0]===pair[0]&&l[1]===pair[1])||(l[0]===pair[1]&&l[1]===pair[0])))state.links.push([a,b,pair[2]]);toast(`关系成立：${pair[2]}`,'good');}
    else {state.mistakes++;toast('两张事实可以同时存在，但目前没有形成可验证的物理、时间或行为关系。','warn')}
    selectedObs=[];save();sideTab='obs';
  }

  function topAction(act){
    if(act!=='sound'&&heldItemId){heldItemId=null;render()}
    if(act==='notes')openNotebook('obs');
    else if(act==='hint')openHint();
    else if(act==='support')openSupport();
    else if(act==='sound'){state.audio=!state.audio;save();syncAmbience();render()}
    else if(act==='menu')openGameMenu();
  }

  function hotAction(id){
    if(id==='returnshop'){state.scene='shop';state.currentMask=null;save();render();return}
    if(['mirror','lamp','doll','scissors','chair'].includes(id)){discoverFeature(id);return}
    if(id==='box'){openBoxPuzzle();return}
    if(id==='darkdoor'){toast(state.inventory.some(x=>x.id==='key')?'墙缝里有一道刚好容得下黑铁片的窄槽。试着把钥匙拖过去。':'木板后像有空腔，但这里没有普通锁孔。');return}
    if(id==='jars'){addObs('jars');openInfo('七只保存罐',`<p>液体里的组织会对阿七的表情作出极慢的模仿。它们像眼睛、耳廓、嘴唇，却没有任何正常人体组织应有的连续结构。</p><p>如果师父真的从谁脸上切下这些东西，切口在哪里？</p>`);render();return}
    if(id==='ledger'){addObs('master_rule');openInfo('面具铺旧工艺账',`<p>每张可长期佩戴的面具都需要三类痕迹：</p><div class="paper-grid"><div class="paper-card"><h4>相貌</h4><p>某个人留下的形状，不允许凭想象补齐。</p></div><div class="paper-card"><h4>习惯</h4><p>一个反复做过、足够稳定的动作。</p></div><div class="paper-card"><h4>见证</h4><p>另一件东西证明这段关系确实发生过。</p></div></div>`);render();return}
    if(id==='halfmask'){addItem('halfmask','微笑面具半成品','师父留下的相貌痕迹');toast('取得：微笑面具半成品','good');render();return}
    if(id==='blackthread'){addItem('blackthread','反复拆开的黑线','师父不打死结，这是他留下的习惯痕迹');toast('取得：黑线','good');render();return}
    if(id==='heightmark'){addItem('woodchip','童年刻痕木屑','某个人曾被师父照顾过的见证痕迹');toast('取得：木屑','good');render();return}
    if(id==='craft'){openCraftPuzzle();return}
    if(id==='waterobs'){addObs('water_reverse');openInfo('倒流的房间',`<p>水滴回到天花板，烛泪重新爬上蜡烛，碎玻璃贴回原位，床单褶皱逆向展开。</p><p>所有东西都在服从同一个方向——除了墙钟。</p>`);render();return}
    if(id==='clockpuzzle'){openWaterPuzzle();return}
    if(id==='maskwall'){openMaskWall();return}
    if(id==='bell'){openMask('soren');return}
    if(id==='blankmask'){openMask('blank');return}
    if(id==='shopchange'){noticeShopChange();return}
    if(id==='finalmirror'){openFinalMirror();return}
    if(id==='finaldoor'){state.scene='finale';save();render();return}
    if(id==='ngp'){openNgpView();return}
    if(id==='stations'){openStations();return}
    if(id==='center'){openCenterPuzzle();return}
  }

  function discoverFeature(id){
    const map={mirror:['eye','镜子','木盒只在镜中长出眼睛。'],lamp:['mouth','关灯','灯熄灭时盒面浮出嘴，镜中的阿七却没有嘴。'],doll:['ear','无脸瓷娃娃','瓷娃娃背对玩家时，盒面长出耳朵。'],scissors:['nose','裁布剪','剪刀反光落在盒面上，形成一条不属于任何人的鼻梁。'],chair:['brow','师父的椅子','坐低以后，木盒上沿和镜框重成一道眉线。']};
    const [feat,title,text]=map[id];
    if(!state.prologue.features.includes(feat)){state.prologue.features.push(feat);addObs('box_eye');if(state.prologue.features.length>=3)addObs('box_missing');save();playSfx('glass');toast(`${title}：${text}`,'good')}
    else toast('这个关系已经记录过了。');
    render();
  }

  function openBoxPuzzle(){
    if(state.prologue.features.length<5){openInfo('空白木盒',`<p>盒面仍不完整。不是“找五个密码”，而是让五官在正确关系中自己出现。</p><p class="muted">已经确认 ${state.prologue.features.length}/5 个关系。</p>`);return}
    modal(`<div class="kicker">序章 · 关系谜题</div><h2>让木盒与阿七的右半脸重合</h2><p class="lead">五官已经出现，但锁仍没有钥匙孔。镜框中间有一道比其他地方更亮的竖线。</p><div class="feature-list">${['眼睛','嘴','耳朵','鼻梁','眉线'].map(x=>`<div class="feature-token on">${x}</div>`).join('')}</div><div class="alignment-track"><div class="alignment-mirror"></div><div class="alignment-box" id="align-box" style="left:18%"></div></div><input class="range-wide" id="align-range" type="range" min="0" max="100" value="18" aria-label="移动木盒"><div class="feedback" id="align-feedback">拖动木盒，让它在镜里与阿七的右半脸完全重合。</div>`,{dark:true,narrow:true,close:true});
    const r=document.getElementById('align-range'),box=document.getElementById('align-box'),fb=document.getElementById('align-feedback');
    r.oninput=()=>{box.style.left=r.value+'%';const d=Math.abs(Number(r.value)-50);fb.textContent=d<7?'镜里的两张脸开始共享同一条边。':d<18?'五官的高度接近了，但接缝仍分开。':'木盒仍只是木盒，镜中的脸没有回应。';if(d<3&&!state.prologue.aligned){state.prologue.aligned=true;state.prologue.key=true;addItem('key','无齿黑铁钥匙','木盒内层抽屉里的暗门钥匙');save();fb.className='feedback ok';fb.innerHTML='<b>重合。</b> 木盒上的五官消失，阿七自己的脸重新回来。盒底弹出一片无齿黑铁。';playSfx('glass');toast('获得：暗门钥匙','good');setTimeout(()=>{closeModal();render()},1100)}};
  }

  function openCraftPuzzle(){
    if(state.prologue.mask){openInfo('师父面具',`<p>三种痕迹已经进入面具：相貌、习惯、见证。戴上它，师父的一段记忆仍在水声里。</p>`,()=>{state.scene='water';render()});return}
    const traces=[
      ['halfmask','微笑面具半成品','相貌痕迹'],['blackthread','反复拆开的黑线','习惯痕迹'],['woodchip','童年刻痕木屑','见证痕迹'],
      ['jarfluid','罐中液体','看起来重要，但没有属于师父的稳定关系'],['scissor','裁布剪','工具不是见证'],['key','暗门钥匙','打开空间，不等于见证关系']
    ];
    let chosen=[];
    modal(`<div class="kicker">第一章 · 面具工艺</div><h2>三种痕迹，不多也不少</h2><p class="lead">旧工艺账没有说“需要三个材料”，而是明确区分相貌、习惯与见证。错误材料不会消耗，只会让面具长出短暂的错误五官。</p><div class="trace-grid">${traces.map(x=>`<button class="trace-card" data-trace="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span></button>`).join('')}</div><div class="feedback" id="craft-feedback">选择三项，再检查它们是否分别承担不同职责。</div><div class="modal-actions"><button class="ink-btn" id="craft-check">检查痕迹</button></div>`,{dark:true,close:true});
    document.querySelectorAll('[data-trace]').forEach(b=>b.onclick=()=>{const id=b.dataset.trace;if(chosen.includes(id)){chosen=chosen.filter(x=>x!==id);b.classList.remove('selected')}else{if(chosen.length>=3){toast('只能放入三种痕迹。','warn');return}chosen.push(id);b.classList.add('selected')}});
    document.getElementById('craft-check').onclick=()=>{const fb=document.getElementById('craft-feedback');const ok=['halfmask','blackthread','woodchip'].every(x=>chosen.includes(x));if(ok){state.prologue.mask=true;removeItem('halfmask');removeItem('blackthread');removeItem('woodchip');addItem('mastermask','师父的微笑面具','相貌、习惯、见证都已成立');save();fb.className='feedback ok';fb.innerHTML='<b>三种职责同时成立。</b> 内衬贴合后，微笑只比正常表情高一点。面具内部传来水下的钟声。';playSfx('glass');setTimeout(()=>{closeModal();state.scene='water';save();render()},1200)}else{state.mistakes++;save();fb.className='feedback bad';fb.textContent='面具短暂长出一只不属于师父的眼睛，然后缩回去。至少一项材料只是“看起来相关”，没有承担相貌、习惯或见证中的独立职责。'}};
  }

  function openWaterPuzzle(){
    if(state.prologue.water){openInfo('已经倒回第三声钟响',`<p>雾气上留下半句：“不要替他——”。后面的字被水抹走了。</p>`);return}
    modal(`<div class="kicker">第一章 · 水底记忆</div><h2>让唯一不倒流的东西也倒流</h2><p class="lead">这里没有倒计时。你可以慢慢观察：海水、烛泪、碎玻璃、床单都在回到更早的位置。墙钟没有。</p><div class="puzzle-board"><div class="puzzle-visual" style="background-image:url('assets/images/water-memory.webp${ASSET_REV}')"><div class="clock-wrap"><div class="clock-face"><div class="clock-hand" id="clock-hand" style="--angle:90deg"></div><div class="clock-pin"></div></div></div></div><div class="puzzle-panel"><div class="paper-card"><h4>观察</h4><p>顺时针不会发生任何事。逆时针时，房间的水声会变得更近，像时间被从墙里抽出来。</p></div><label class="paper-card"><h4>逆时针拨钟</h4><input id="reverse-range" class="range-wide" type="range" min="0" max="100" value="0"><p>持续拨回去，直到第三声钟响。</p></label><div id="water-feedback" class="feedback">墙钟仍在向前。</div></div></div>`,{dark:true,wide:true,close:true});
    const r=document.getElementById('reverse-range'),hand=document.getElementById('clock-hand'),fb=document.getElementById('water-feedback');
    r.oninput=()=>{const v=Number(r.value);hand.style.setProperty('--angle',(90-v*4.8)+'deg');if(v>25){playSfx('clock');fb.textContent='第一声：床单褶皱消失，碎玻璃回到镜框。'}if(v>52)fb.textContent='第二声：水线从墙脚退回天花板。';if(v>=83&&!state.prologue.water){state.prologue.water=true;state.chapter2Unlocked=true;state.chapter=2;state.scene='shop';addObs('water_reverse','mother_note');addHabit('触到针线时先检查有没有死结');save();fb.className='feedback ok';fb.innerHTML='<b>第三声。</b> 镜子起雾。女人怀里抱着没有稳定左半脸的婴儿，手指写下：“不要替他——”。后半句没有出现。';setTimeout(()=>{closeModal();render();showStory(['师父的记忆没有解释七只玻璃罐。','墙上的订单却多出了五个仍然活在镇上的名字。','如果他们真的被取走了脸的一部分——','他们为什么还在照常生活？'],()=>{closeModal();render()})},1300)}};
  }

  function openMaskWall(){
    modal(`<div class="kicker">第二章 · 五种进入语法</div><h2>选择下一张脸</h2><p class="lead">五张主线顺序自由。完成顺序只改变铺子的污染与少量过场，不会让任何内容永久错过。</p><div class="paper-grid">${MAIN_MASKS.map(id=>{const m=MASK_META[id];return `<button class="paper-card mask-btn" data-open-mask="${id}" ${hasMask(id)?'disabled':''}><h4>${m.name}</h4><p>${m.desc}</p><p><b>${hasMask(id)?'已完成 · '+m.residue:'尚未进入'}</b></p></button>`}).join('')}</div><div class="sep"></div><p class="small muted">完成三张主线后，门铃会留下索伦的名片；完成四张后，工作台会出现一张没有订单的空白面具。两者都不是普通结局的硬门槛。</p>`,{dark:true,wide:true,close:true});
    document.querySelectorAll('[data-open-mask]').forEach(b=>b.onclick=()=>{closeModal();openMask(b.dataset.openMask)});
  }

  function openMask(id){
    if(hasMask(id)){state.scene=id;state.currentMask=id;save();render();openInfo(MASK_META[id].name,`<p>这段记忆已经发生过。重新戴上面具时，某些环境会被残响视角重新解释。</p>`);return}
    state.currentMask=id;state.scene=id;save();render();
    const fn={mayor:openMayor,butcher:openButcher,elaine:openElaine,milo:openMilo,postman:openPostman,soren:openSoren,blank:openBlank}[id];
    if(fn)setTimeout(fn,180);
  }

  function completeMask(id,residueId,residueLabel,obsIds,habit){
    if(MAIN_MASKS.includes(id))addUnique(state.masksDone,id);else addUnique(state.hiddenDone,id);
    addResidue(residueId,residueLabel); addObs(...obsIds); if(habit)addHabit(habit);
    state.shopChangesAvailable=Math.min(7,state.shopChangesAvailable+1);
    state.scene='shop'; state.currentMask=null; save();
    playSfx('glass'); toast(`获得残响：${residueLabel}`,'good');
    closeModal();render();
    const n=completedMain();
    if(MAIN_MASKS.includes(id) && (n===2||n===4))showShopInterlude(n);
    if(MAIN_MASKS.includes(id) && n===3)toast('门铃响了一次。门外没有人，只留下一张盲眼老人的名片。');
    if(MAIN_MASKS.includes(id) && n===5)addObs('six_functions');
  }

  function showShopInterlude(n){
    const lines=n===2?['第二张面具挂回墙上。','阿七伸手去拿杯子，却先把杯柄转向了右边。','这不是他的习惯。','镜子里的手慢了一拍才跟上。']:['第四张面具以后，铺子没有立刻恢复安静。','墙上的五张旧肖像短暂换成了不同人的脸。','阿七闭眼时，却还能知道门在哪里。','有些习惯已经不需要面具才能出现。'];
    showStory(lines,()=>{closeModal();render()});
  }

  function openMayor(){
    const cards=[
      {id:'a',front:'“所有支出都严格按程序执行。”',back:'他害怕再次因为“说真话”让家人失去一切。'},
      {id:'b',front:'“孤儿院从未得到特殊照顾。”',back:'他确实绕过了两个部门，让付款提前。'},
      {id:'c',front:'“我从不在意别人如何评价我。”',back:'抽屉里保存着全部奖状和剪报。'},
      {id:'d',front:'“任何例外都会破坏公平。”',back:'未寄出的辞职信写着：有些规则让人来不及活。'},
      {id:'e',front:'“我父亲教我永远诚实。”',back:'父亲因一次诚实举报失去工作。'},
      {id:'f',front:'“这笔钱只是正常流程。”',back:'收据时间早于正式审批两天。'}
    ];
    let selected=[];
    modal(`<div class="kicker">镇长 · 奥斯文</div><h2>恢复一场真正发生过的演讲</h2><p class="lead">不是判断镇长“好”或“坏”。把句卡放上讲台时，公开房间按正面变化，私人房间按背面变化。需要找出能同时解释现有物证、又彼此不矛盾的三张。</p><div class="puzzle-board"><div class="puzzle-visual" style="background-image:url('assets/images/mayor.webp${ASSET_REV}')"><div class="split-room"><div class="half"><div class="split-label">公开场合<br>奖状：年度最可信的解释<br>保险箱：空</div></div><div class="half"><div class="split-label">私人房间<br>孤儿院收据：提前两日<br>旧报纸：父亲因举报失业<br>未寄出辞职信</div></div></div></div><div class="puzzle-panel"><div class="option-list">${cards.map(c=>`<button class="statement-card" data-card="${c.id}"><b>${c.front}</b><div class="back">背面：${c.back}</div></button>`).join('')}</div><div id="mayor-feedback" class="feedback">点击句卡可以翻面；再次点击可放入/取出演讲。</div><button class="ink-btn" id="mayor-check">复原演讲</button></div></div>`,{dark:true,wide:true,close:true});
    document.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{b.classList.toggle('flipped');const id=b.dataset.card;if(selected.includes(id)){selected=selected.filter(x=>x!==id);b.classList.remove('selected')}else{if(selected.length>=3){toast('讲台只能复原三句最关键的话。','warn');return}selected.push(id);b.classList.add('selected')}});
    document.getElementById('mayor-check').onclick=()=>{const fb=document.getElementById('mayor-feedback');const ok=['b','e','f'].every(x=>selected.includes(x));if(ok){fb.className='feedback ok';fb.innerHTML='<b>两个半房间第一次重合。</b> 他确实绕开程序给孤儿院付款，也确实享受权力并害怕承认自己破坏规则。';setTimeout(()=>completeMask('mayor','res_bian','辨 · 鼻子',['mayor_public','mayor_father'],'看到账簿时会下意识先翻背面'),900)}else{state.mistakes++;save();fb.className='feedback bad';fb.textContent='左边的公开说法与右边物证出现了具体冲突。试着找同时涉及“孤儿院付款”“父亲失业”与“流程时间”的三句，而不是给镇长做道德评价。'}};
  }

  function openButcher(){
    const pigs=[
      {id:'p1',name:'17号 · 奥拉',log:'怕铃声；只吃苹果；出生最早',seat:'s4'},
      {id:'p2',name:'22号 · 埃姆',log:'不碰苹果；喜欢黑面包；怕风',seat:'s1'},
      {id:'p3',name:'31号 · 鲁卡',log:'只在靠墙位置吃饭；喜欢胡萝卜',seat:'s6'},
      {id:'p4',name:'36号 · 诺德',log:'怕烛火；喜欢牛奶',seat:'s2'},
      {id:'p5',name:'41号 · 费恩',log:'喜欢盐煮土豆；必须面对门',seat:'s5'},
      {id:'p6',name:'52号 · 克拉',log:'只吃燕麦；总坐在17号旁边',seat:'s3'}
    ];
    const seats=[['s1','黑面包 · 靠窗'],['s2','牛奶 · 远离烛台'],['s3','燕麦 · 17号右侧'],['s4','苹果 · 最旧名牌'],['s5','盐土豆 · 面向门'],['s6','胡萝卜 · 靠墙']];
    let chosen=null,assign={};
    modal(`<div class="kicker">屠夫 · 格伦</div><h2>七个位子，只有六份档案</h2><p class="lead">格伦把每次屠宰都办成正式送别。档案不是密码，它们记录真实习惯：食物、声音恐惧、座位偏好。</p><div class="puzzle-board"><div class="puzzle-visual" style="background-image:url('assets/images/butcher.webp${ASSET_REV}')"></div><div class="puzzle-panel"><div class="pig-roster">${pigs.map(p=>`<button class="pig-card" data-pig="${p.id}"><b>${p.name}</b><br>${p.log}</button>`).join('')}</div><div class="seat-grid">${seats.map(s=>`<button class="seat" data-seat="${s[0]}"><b>${s[1]}</b><span>空位</span></button>`).join('')}</div><div id="butcher-feedback" class="feedback">先选一份档案，再点一个座位。错误座位上的猪会拒绝进食，并保留提示。</div><button class="ink-btn" id="butcher-check">核对送别宴</button></div></div>`,{dark:true,wide:true,close:true});
    const refresh=()=>{document.querySelectorAll('[data-pig]').forEach(b=>{b.classList.toggle('selected',b.dataset.pig===chosen);b.classList.toggle('used',Object.values(assign).includes(b.dataset.pig))});document.querySelectorAll('[data-seat]').forEach(b=>{const p=assign[b.dataset.seat];b.classList.toggle('filled',!!p);b.querySelector('span').textContent=p?pigs.find(x=>x.id===p).name:'空位'})};
    document.querySelectorAll('[data-pig]').forEach(b=>b.onclick=()=>{if(Object.values(assign).includes(b.dataset.pig))return;chosen=b.dataset.pig;refresh()});
    document.querySelectorAll('[data-seat]').forEach(b=>b.onclick=()=>{if(!chosen){const old=assign[b.dataset.seat];if(old){delete assign[b.dataset.seat];refresh()}return}assign[b.dataset.seat]=chosen;chosen=null;refresh()});
    document.getElementById('butcher-check').onclick=()=>{const fb=document.getElementById('butcher-feedback');let wrong=[];for(const p of pigs)if(assign[p.seat]!==p.id)wrong.push(p);if(!wrong.length){fb.className='feedback ok';fb.innerHTML='<b>六头猪都开始进食。</b> 第七把一直没有编号的椅子缓慢转向格伦。他脱下围裙坐下，菜单翻面：送行者。';setTimeout(()=>completeMask('butcher','res_yan','言 · 嘴唇',['butcher_six','butcher_sender'],'说完一句话以后会等对方真正回应'),1000)}else{state.mistakes++;save();fb.className='feedback bad';const p=wrong[0];fb.textContent=`${p.name}拒绝了面前的食物。档案里的“${p.log}”至少有一项和这个座位不符。`}};
  }

  function openElaine(){
    const pieces=[
      {id:'a',name:'17岁 · 男孩装束',feat:'右食指烧伤；唱高音前吸气两次'},
      {id:'b',name:'21岁 · 黑发女郎',feat:'左耳旧耳洞；进门先摸袖口'},
      {id:'c',name:'29岁 · 红发歌者',feat:'左耳旧耳洞；唱高音前吸气两次'},
      {id:'d',name:'34岁 · 中年绅士',feat:'右食指烧伤；唱高音前吸气两次'},
      {id:'e',name:'41岁 · 寡妇',feat:'左耳旧耳洞；从不碰镜子'},
      {id:'f',name:'48岁 · 银发女人',feat:'右食指烧伤；唱高音前吸气两次'}
    ];
    let selected=[];
    modal(`<div class="kicker">舞台女郎 · 伊莲</div><h2>没有一张脸能单独证明“我是谁”</h2><p class="lead">旧演出单显示这些镜片跨越三十多年。找三块年龄与呈现不同，却能用同一种稳定身体习惯互相证明的镜片。</p><div class="puzzle-board"><div class="puzzle-visual" style="background-image:url('assets/images/elaine.webp${ASSET_REV}')"></div><div class="puzzle-panel"><div class="mirror-grid">${pieces.map(p=>`<button class="mirror-piece" data-piece="${p.id}"><b>${p.name}</b><span>${p.feat}</span></button>`).join('')}</div><div id="elaine-feedback" class="feedback">脸不是关系证据。动作可以跨年龄、服装与性别呈现重复。</div><button class="ink-btn" id="elaine-check">拼出动作轮廓</button></div></div>`,{dark:true,wide:true,close:true});
    document.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{const id=b.dataset.piece;if(selected.includes(id)){selected=selected.filter(x=>x!==id);b.classList.remove('selected')}else{if(selected.length>=3){toast('只需要三块来自不同阶段的镜片。','warn');return}selected.push(id);b.classList.add('selected')}});
    document.getElementById('elaine-check').onclick=()=>{const fb=document.getElementById('elaine-feedback');const ok=['a','d','f'].every(x=>selected.includes(x));if(ok){fb.className='feedback ok';fb.innerHTML='<b>镜片没有形成同一张脸。</b> 三个身影只在唱高音前同时吸气两次。伊莲在镜后说：“原来我一直在这里。”';playSfx('glass');setTimeout(()=>completeMask('elaine','res_ting','听 · 耳朵',['elaine_habit','elaine_face'],'说重要的话以前会短促吸气两次'),1000)}else{state.mistakes++;save();fb.className='feedback bad';fb.textContent='镜面拼出了某一时期的相似外貌，却没有形成跨年代重复的动作。比较“烧伤 + 吸气”是否在不同阶段同时出现。'}};
  }

  function openMilo(){
    const monsters=[['bull','牛头父亲','反复撞门'],['cat','猫首母亲','不停舔爪'],['snake','蛇身镇长','进门前不断蜕皮']];
    const objects=[['cane','门框旁的旧手杖','父亲腿疼，起身会扶门框'],['cloth','湿布','母亲紧张时反复擦手'],['badge','备用徽章与领带','镇长每次进门前更换身份标记']];
    const correct={bull:'cane',cat:'cloth',snake:'badge'}; let left=null,right=null,pairs={};
    modal(`<div class="kicker">鞋匠之子 · 米罗</div><h2>让怪物短暂变回人</h2><p class="lead">这些怪物不是昵称谜语。孩子把成人重复行为重新解释成兽形；现实物件仍留在原来的面具铺位置。</p><div class="puzzle-board"><div class="puzzle-visual" style="background-image:url('assets/images/milo.webp${ASSET_REV}')"></div><div class="puzzle-panel"><div class="match-grid"><div class="match-col">${monsters.map(x=>`<button class="match-btn" data-mon="${x[0]}"><b>${x[1]}</b><br><span class="muted">${x[2]}</span></button>`).join('')}</div><div class="match-arrow">↔</div><div class="match-col">${objects.map(x=>`<button class="match-btn" data-obj="${x[0]}"><b>${x[1]}</b><br><span class="muted">${x[2]}</span></button>`).join('')}</div></div><div class="pair-log" id="milo-pairs"></div><div id="milo-feedback" class="feedback">点一个怪物，再点一个现实物件。</div><button class="ink-btn" id="milo-check">检查三组对应</button></div></div>`,{dark:true,wide:true,close:true});
    const refresh=()=>{document.querySelectorAll('[data-mon]').forEach(b=>b.classList.toggle('selected',b.dataset.mon===left));document.querySelectorAll('[data-obj]').forEach(b=>b.classList.toggle('selected',b.dataset.obj===right));document.getElementById('milo-pairs').innerHTML=Object.entries(pairs).map(([m,o])=>`<div class="pair-row">${monsters.find(x=>x[0]===m)[1]} ↔ ${objects.find(x=>x[0]===o)[1]}</div>`).join('')};
    const maybe=()=>{if(left&&right){pairs[left]=right;left=right=null;refresh()}};
    document.querySelectorAll('[data-mon]').forEach(b=>b.onclick=()=>{left=b.dataset.mon;refresh();maybe()});document.querySelectorAll('[data-obj]').forEach(b=>b.onclick=()=>{right=b.dataset.obj;refresh();maybe()});
    document.getElementById('milo-check').onclick=()=>{const fb=document.getElementById('milo-feedback');const ok=Object.entries(correct).every(([m,o])=>pairs[m]===o);if(ok){fb.className='feedback ok';fb.innerHTML='<b>三只怪物短暂变回成人。</b> 父亲没有康复，只是坐下来喘气。米罗真正害怕的，是有一天这头“怪物”再也不会回来。';setTimeout(()=>completeMask('milo','res_jian','见 · 眼睛',['milo_monster','milo_fear'],'重新看同一个物件时会确认它有没有变成别的东西'),1000)}else{state.mistakes++;save();const wrong=Object.keys(correct).find(m=>pairs[m]&&pairs[m]!==correct[m]);fb.className='feedback bad';fb.textContent=wrong?`${monsters.find(x=>x[0]===wrong)[1]}没有恢复人形。它的动作与所选现实物件不是同一种重复行为。`:'还有怪物没有找到现实动作来源。'}};
  }

  function openPostman(){
    let step=0,escaped=false;
    modal(`<div class="kicker">邮差 · 埃利亚斯</div><h2>第七步以前，一切都像昨天</h2><p class="lead">六个邮箱都只说“昨天也这样”。没有隐藏密码；真正的规则是你的脚步。</p><div class="puzzle-visual" style="min-height:520px;background-image:url('assets/images/postman.webp${ASSET_REV}')"><div class="route-ui"><button class="route-btn" id="route-back">向后一步</button><div><div class="route-progress" id="route-progress">${Array.from({length:7},()=>'<div class="step"></div>').join('')}</div><div class="route-status" id="route-status">起点。海边的第七封信不在地图上。</div></div><button class="route-btn" id="route-forward">向前一步</button></div></div><div id="post-feedback" class="feedback" style="margin-top:10px">规则会先重复给你看，而不是只出现一次就要求猜答案。</div>`,{dark:true,wide:true,close:true});
    const paint=()=>{document.querySelectorAll('#route-progress .step').forEach((e,i)=>{e.classList.toggle('on',i<step);e.classList.toggle('reverse',escaped&&i===5)});document.getElementById('route-status').textContent=escaped?'道路没有重置。雾后出现了一条通向海边的新路。':`已经走了 ${step} 步。`};
    document.getElementById('route-forward').onclick=()=>{if(escaped)return;step++;if(step>=7){step=0;document.getElementById('post-feedback').className='feedback bad';document.getElementById('post-feedback').textContent='第七步落下时，邮箱、脚印和风全部回到起点。你没有受罚，只是亲眼确认了规则。'}paint()};
    document.getElementById('route-back').onclick=()=>{if(escaped)return;if(step===6){escaped=true;addObs('postman_loop','postman_reverse');document.getElementById('post-feedback').className='feedback ok';document.getElementById('post-feedback').innerHTML='<b>第一次没有重置。</b> 不是找到新路线，而是在重复了三十年的行为里做了一次相反的动作。';paint();setTimeout(()=>openPostmanChoice(),900)}else{step=Math.max(0,step-1);document.getElementById('post-feedback').textContent='只是普通后退。道路没有改变。';paint()}};
  }

  function openPostmanChoice(){
    modal(`<div class="kicker">海边 · 三十年前的信</div><h2>信终于到了，但不需要一个“正确情感选择”</h2><p class="lead">信里没有谜语。妻子只是说，她已经离开，并且希望埃利亚斯不要再把每天活成她离开的前一天。</p><div class="paper-grid"><button class="paper-card mask-btn" data-post-choice="bag"><h4>放回邮包</h4><p>继续带着它走，但承认它已经到达。</p></button><button class="paper-card mask-btn" data-post-choice="box"><h4>投入海边邮箱</h4><p>让一封迟到三十年的信完成邮政意义上的投递。</p></button><button class="paper-card mask-btn" data-post-choice="shore"><h4>留在原地</h4><p>不替收信人决定如何告别。</p></button></div>`,{dark:true,narrow:true,close:false});
    document.querySelectorAll('[data-post-choice]').forEach(b=>b.onclick=()=>{state.postmanChoice=b.dataset.postChoice;save();completeMask('postman','res_xing','行 · 眉毛',['postman_loop','postman_reverse'],'走路时会在第七步以前下意识停顿')});
  }

  function openSoren(){
    let value=18,found=false;
    modal(`<div class="kicker">隐藏面具 · 盲眼老人</div><h2>用回声画出房间</h2><p class="lead">索伦没有给你一段“声音谜语”。他把灯灭掉，只说：墙不会因为你看不见就失去厚度。</p><div class="puzzle-board"><div class="puzzle-visual" style="background-image:url('assets/images/soren.webp${ASSET_REV}')"><div class="sound-room"><div class="wave-layer" id="wave-layer"></div><div class="scan-bar"><input id="scan" type="range" min="0" max="100" value="18"><div class="scan-readout"><span>墙左端</span><b id="scan-value">单次回声</b><span>墙右端</span></div></div></div></div><div class="puzzle-panel"><div class="paper-card"><h4>声纹规则</h4><p>桌面：短、硬。帘布：宽、软。空墙：单回声。墙后有夹层：前后两次反射。</p></div><button class="ink-btn" id="knock-wall">敲击当前位置</button><div id="soren-feedback" class="feedback">拖动敲击点扫描墙面。声纹固定片刻，不需要依靠瞬时听觉。</div></div></div>`,{dark:true,wide:true,close:true});
    const scan=document.getElementById('scan'),read=document.getElementById('scan-value'),layer=document.getElementById('wave-layer');
    scan.oninput=()=>{value=Number(scan.value);read.textContent=(value>63&&value<75)?'似乎有第二层':'单次回声'};
    document.getElementById('knock-wall').onclick=()=>{playSfx('knock');const x=value;const ring=document.createElement('div');ring.className='wave-ring';ring.style.left=x+'%';ring.style.top='46%';layer.appendChild(ring);setTimeout(()=>ring.remove(),1600);const fb=document.getElementById('soren-feedback');if(x>63&&x<75){found=true;fb.className='feedback ok';fb.innerHTML='<b>双重回声。</b> 第一层在眼前，第二层晚约半拍。夹层距离可以用墙钟滴答作尺度。';setTimeout(()=>{fb.innerHTML='<b>夹层打开。</b> 怀表里不是照片，而是一小片磨损镜面。老人说：“我记得她的声音，不记得她最后一张脸。”';setTimeout(()=>completeMask('soren','res_wen','温 · 脸颊',['soren_echo','soren_voice'],'进房间时会先判断声音离自己有多远'),1000)},700)}else{fb.className='feedback bad';fb.textContent='只有一次干净反射。这个位置后面是实墙；信息保留下来，不需要重新开始。'}};
  }

  function openBlank(){
    let item=null,dir=null;
    modal(`<div class="kicker">隐藏面具 · 给自己的空白</div><h2>三件东西，只带走一件</h2><p class="lead">这不是知识谜题。没有任何文本告诉你它们象征什么；主线也不会因为选择不同而卡住。</p><div class="choice-triptych"><button class="choice-object" data-blank-item="needle"><b>师父的针线</b><p>别人教给你的手艺与边界。</p></button><button class="choice-object" data-blank-item="cloth"><b>母亲的旧手帕</b><p>一个没有机会真正认识的人留下的东西。</p></button><button class="choice-object" data-blank-item="apron"><b>阿七自己的工作围裙</b><p>每天使用，却从未把它当成“自己的象征”。</p></button></div><h3>拿起以后，要往哪里走？</h3><div class="direction-row"><button class="option-btn" data-blank-dir="shop">回面具铺</button><button class="option-btn" data-blank-dir="sea">走向海</button><button class="option-btn" data-blank-dir="stay">停在原地</button></div><div id="blank-feedback" class="feedback">选择不会被系统评价为善恶或正确错误。</div><div class="modal-actions"><button class="ink-btn" id="blank-confirm" disabled>留下这次选择</button></div>`,{dark:true,wide:true,close:true});
    const update=()=>{document.querySelectorAll('[data-blank-item]').forEach(b=>b.classList.toggle('selected',b.dataset.blankItem===item));document.querySelectorAll('[data-blank-dir]').forEach(b=>b.classList.toggle('selected',b.dataset.blankDir===dir));document.getElementById('blank-confirm').disabled=!(item&&dir)};
    document.querySelectorAll('[data-blank-item]').forEach(b=>b.onclick=()=>{item=b.dataset.blankItem;update()});document.querySelectorAll('[data-blank-dir]').forEach(b=>b.onclick=()=>{dir=b.dataset.blankDir;update()});
    document.getElementById('blank-confirm').onclick=()=>{state.blankItem=item;state.blankDirection=dir;addObs('blank_choice');save();completeMask('blank','res_blank','未定形 · 透明残响',['blank_choice'],'第一次选择会在做决定后停一下，确认这确实是自己的')};
  }

  function noticeShopChange(){
    const unseen=SHOP_CHANGES.slice(0,state.shopChangesAvailable).find(x=>!state.shopChangesSeen.includes(x.id));if(!unseen)return;
    addUnique(state.shopChangesSeen,unseen.id);save();playSfx(unseen.id==='door'?'knock':'glass');openInfo(`铺子变化 · ${unseen.title}`,`<p>${unseen.text}</p><p class="muted">阿七没有给它下结论，只在卷宗边页记了一笔。</p>`,()=>{closeModal();render()});
  }

  function openFinalMirror(){
    if(completedMain()<5)return;
    if(state.links.length<3){openInfo('镜子没有继续变化',`<p>五张面具都已经回来，但阿七仍把观察当成孤立的片段。</p><p>先在“观察”页亲手连接至少三组确实能发生物理、时间、空间或行为关系的事实。系统不会要求你输入结论。</p>`);return}
    modal(`<div class="kicker">第三章前 · 镜像复核</div><h2>这次，镜子先动了</h2><p class="lead">阿七还没有抬手，镜里的人已经做了五个极小的动作：翻账簿背面、等一句话结束、吸气两次、确认物件没有改变、在第七步以前停下。</p><div class="paper-grid">${state.habits.map(h=>`<div class="paper-card"><h4>残留习惯</h4><p>${esc(h)}</p></div>`).join('')}</div><p>它们没有让阿七变成五个人，却正在把“自己”的边界变得难以判断。</p><div class="modal-actions"><button class="ink-btn" id="mirror-accept">记录六类工艺并下楼</button></div>`,{dark:true,wide:true,close:true});
    document.getElementById('mirror-accept').onclick=()=>{state.finalUnlocked=true;addObs('six_functions');save();closeModal();render();toast('地板下传来三台旧机器同时上弦的声音。','good')};
  }

  function openNgpView(){
    openInfo('二周目 · 残响视角',`<p>你已经知道“完整脸”不是故事的答案。重新佩戴旧面具时，主店铺会出现第一周目无法理解的关系。</p><div class="paper-grid"><div class="paper-card"><h4>镇长面具</h4><p>订单簿上的金额多出一层盖章版本。</p></div><div class="paper-card"><h4>邮差面具</h4><p>门、抽屉与台阶之间出现七步路线。</p></div><div class="paper-card"><h4>老人面具</h4><p>关掉灯以后，墙内出现另一间“声音房”。</p></div><div class="paper-card"><h4>伊莲面具</h4><p>镜子不再显示脸，只显示动作延迟。</p></div></div>`);
  }

  function openStations(){
    if(state.finalStations.length===3){openInfo('三站已经锁定',`<p>三组独立事实同时成立。机器已经开始叠加一张“稳定完成态”。</p>`);return}
    modal(`<div class="kicker">第三章 · 三站共振</div><h2>没有唯一操作顺序</h2><p class="lead">三座验证台可任意处理。先选一座，再从残响中放入两类功能；错误组合不会扣分，只展示各自的单独反应。</p><div class="station-grid">${stationCard('mirror','复写镜','见 + 辨','稳定对象轮廓，同时让被遮住的第二层墨迹显出')}${stationCard('rhythm','节律槽','听 + 行','六次重复后主动反向一次，打破重置')}${stationCard('warm','温声台','言 + 温','一次表达结束，需要真正存在的接收者')}</div><div class="residue-row">${availableResidues().map(r=>`<button class="residue" data-res="${r.id}">${esc(r.label)}</button>`).join('')}</div><div id="station-feedback" class="feedback">选择验证台和两份残响。</div><div class="modal-actions"><button class="ink-btn" id="station-check">尝试验证</button></div>`,{dark:true,wide:true,close:true});
    let station=null,chosen=[];
    document.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>{station=b.dataset.station;document.querySelectorAll('[data-station]').forEach(x=>x.classList.toggle('done',x.dataset.station===station||state.finalStations.includes(x.dataset.station)))});
    document.querySelectorAll('[data-res]').forEach(b=>b.onclick=()=>{const id=b.dataset.res;if(chosen.includes(id)){chosen=chosen.filter(x=>x!==id);b.classList.remove('selected')}else{if(chosen.length>=2)chosen.shift();chosen.push(id);document.querySelectorAll('[data-res]').forEach(x=>x.classList.toggle('selected',chosen.includes(x.dataset.res)))}});
    document.getElementById('station-check').onclick=()=>checkStation(station,chosen,document.getElementById('station-feedback'));
  }

  function stationCard(id,title,pair,desc){return `<button class="station ${state.finalStations.includes(id)?'done':''}" data-station="${id}" ${state.finalStations.includes(id)?'disabled':''}><h4>${title}</h4><p>${pair}</p><div class="station-machine"><div class="machine-ring"></div></div><p>${desc}</p></button>`}
  function availableResidues(){
    const base=[{id:'res_jian',label:'见 · 眼睛'},{id:'res_bian',label:'辨 · 鼻子'},{id:'res_ting',label:'听 · 耳朵'},{id:'res_xing',label:'行 · 眉毛'},{id:'res_yan',label:'言 · 嘴唇'}];
    // Soren is optional; if skipped, the master mask provides a weaker proxy, keeping ordinary endings reachable.
    base.push(hasMask('soren')?{id:'res_wen',label:'温 · 脸颊'}:{id:'res_wen_proxy',label:'温 · 师父面具内衬'});
    return base;
  }
  function checkStation(station,chosen,fb){
    if(!station||chosen.length!==2){fb.className='feedback bad';fb.textContent='先选一座验证台，再放入两种残响。';return}
    const rules={mirror:['res_jian','res_bian'],rhythm:['res_ting','res_xing'],warm:['res_yan',hasMask('soren')?'res_wen':'res_wen_proxy']};
    const ok=rules[station].every(x=>chosen.includes(x));
    if(!ok){state.mistakes++;save();fb.className='feedback bad';const names=chosen.map(id=>availableResidues().find(x=>x.id===id)?.label||id).join(' + ');fb.textContent=`${names} 都有反应，但没有互相证明这座台要验证的关系。机器保留了单独反应，没有清零。`;return}
    if(station==='rhythm'){
      fb.className='feedback';fb.innerHTML='<b>两种残响已经互相识别。</b> 还差一个动作：节律会在第七次重置。';openRhythmMini(()=>finishStation(station));return;
    }
    if(station==='mirror'){
      fb.className='feedback ok';fb.innerHTML='<b>镜面稳定。</b> 眼睛让对象保持同一个轮廓，鼻子让轮廓下被遮住的第二层墨迹渗出来。';setTimeout(()=>finishStation(station),800);return;
    }
    fb.className='feedback ok';fb.innerHTML='<b>声音停下。</b> 嘴唇不再重复最后一句，台面留下一个有距离与温度的凹痕。';setTimeout(()=>finishStation(station),800);
  }
  function openRhythmMini(done){
    let seq=[];
    modal(`<div class="kicker">节律槽 · 连续操作</div><h2>六次重复，然后主动改路</h2><p>邮差的规律不是“第七次按反向键”，而是前六次先真实建立稳定节拍；伊莲的耳朵只认长期重复。</p><div class="route-progress" style="margin:20px 0">${Array.from({length:7},(_,i)=>`<div class="step" data-rstep="${i}"></div>`).join('')}</div><div class="modal-actions"><button class="option-btn" id="r-forward">顺向</button><button class="option-btn" id="r-back">反向</button></div><div id="rhythm-feedback" class="feedback">先让同一个动作重复到足够稳定。</div>`,{dark:true,narrow:true,close:false});
    const paint=()=>document.querySelectorAll('[data-rstep]').forEach((e,i)=>{e.classList.toggle('on',i<seq.length);e.classList.toggle('reverse',i===6&&seq[6]==='B')});
    const press=v=>{if(seq.length>=7)return;seq.push(v);paint();const fb=document.getElementById('rhythm-feedback');const idx=seq.length-1;if(idx<6&&v!=='F'){seq=[];paint();fb.className='feedback bad';fb.textContent='反向得太早，节律还没有稳定。槽轮回到起点，但没有扣除任何东西。';return}if(idx===6){if(v==='B'){fb.className='feedback ok';fb.innerHTML='<b>六次重复 + 一次逆向。</b> 第七次没有重置。';setTimeout(()=>{closeModal();done()},700)}else{seq=[];paint();fb.className='feedback bad';fb.textContent='第七次仍然顺向，槽轮按旧习惯完整重置。'}}};
    document.getElementById('r-forward').onclick=()=>press('F');document.getElementById('r-back').onclick=()=>press('B');
  }
  function finishStation(id){addUnique(state.finalStations,id);save();closeModal();render();toast(`验证台锁定：${id==='mirror'?'复写镜':id==='rhythm'?'节律槽':'温声台'}`,'good');if(state.finalStations.length===3)setTimeout(showWrongCompletion,500)}
  function showWrongCompletion(){
    state.motherShown=true;save();modal(`<div class="kicker">错误完成态</div><h2>机器成功了。</h2><p class="lead">三层半透明投影叠成一张稳定、完整、近似母亲的脸。它没有任何机械故障：能看、能辨、能听、能行动、能表达，也拥有身体在场感。</p><div class="mother-face shown"></div><p>问题恰恰在这里——师父把“稳定”当成了“完整”。中央装置仍在寻找第七类。</p><div class="modal-actions"><button class="ink-btn" id="wrong-next">看看它还缺什么</button></div>`,{dark:true,narrow:true,close:false});document.getElementById('wrong-next').onclick=()=>{closeModal();render();openCenterPuzzle()}}

  function openCenterPuzzle(){
    if(state.finalStations.length<3){openInfo('中央槽仍未启动',`<p>三座验证台尚未全部形成独立事实。</p>`);return}
    if(state.centerSolved){openEndChoice();return}
    const undetermined=hasMask('blank')?'透明残响':'阿七左脸的黑色胎记';
    modal(`<div class="kicker">中央空位</div><h2>机器想要第七类，但第七类不存在</h2><p class="lead">${undetermined}会记录主动选择，却拒绝任何既定形状。它不是“自由”这种第七个属性，而是允许前六种功能继续改变的空白。</p><div class="paper-grid"><button class="paper-card mask-btn" data-slot="mirror"><h4>塞进复写镜</h4><p>让它归入“看见/辨别”。</p></button><button class="paper-card mask-btn" data-slot="rhythm"><h4>塞进节律槽</h4><p>让它归入“听见/行动”。</p></button><button class="paper-card mask-btn" data-slot="warm"><h4>塞进温声台</h4><p>让它归入“表达/在场”。</p></button><button class="paper-card mask-btn" data-slot="center"><h4>放进没有标签的黑色空位</h4><p>不替它决定属于哪一类。</p></button></div><div id="center-feedback" class="feedback">机器没有写“正确答案”，只是一遍遍要求透明部分归类。</div>`,{dark:true,wide:true,close:false});
    document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const slot=b.dataset.slot,fb=document.getElementById('center-feedback');if(slot!=='center'){playSfx('glass');fb.className='feedback bad';fb.textContent='透明部分变黑，立刻从验证台弹回掌心。机器没有报错——它只是无法被这套稳定分类描述。';return}state.centerSolved=true;state.scene='finale';save();fb.className='feedback ok';fb.innerHTML='<b>没有标签的空位第一次被承认。</b> 母亲脸从中线裂开，墙后旧订单露出完整一句：“不要替他定型。”';setTimeout(()=>{closeModal();render();showFinalTruth()},1200)});
  }

  function showFinalTruth(){
    showStory(['师父没有算错。','六种残响确实能让阿七成为一个非常稳定的人。','他错的是另一件事：把“能替你完成”，误当成“有权替你完成”。','左半脸的黑色区域并不是别人脸之间的缝。','那是出生时唯一没有被任何人固定的皮肤。'],()=>{closeModal();openEndChoice()});
  }

  function openEndChoice(){
    modal(`<div class="kicker">终章 · 选择</div><h2>没有一张“正确结局脸”</h2><p class="lead">三种选择都要付出代价。空白面具中曾留下的行动，只会改变一句属于阿七自己的话。</p><div class="ending-grid"><button class="ending-card" data-ending="accept"><h3>A · 接受</h3><p>保留师父给的右半脸，允许空白左半脸继续变化；继承面具铺，但改写第一条行规。</p></button><button class="ending-card" data-ending="faceless"><h3>B · 无面</h3><p>主动卸下借来的稳定组织。别人将更难辨认阿七，但声音、习惯和名字仍然存在。</p></button><button class="ending-card" data-ending="close"><h3>C · 关闭</h3><p>停止制作新面具。镇民不会立刻学会接受自己；有人愤怒、有人离开，也有人偷偷保留旧面具。</p></button></div>`,{dark:true,wide:true,close:false});
    document.querySelectorAll('[data-ending]').forEach(b=>b.onclick=()=>finishEnding(b.dataset.ending));
  }

  function finishEnding(type){
    state.ending=type;save();addUnique(meta.endings,type);meta.completed=true;meta.ngp=true;meta.bestTime=meta.bestTime==null?state.playSeconds:Math.min(meta.bestTime,state.playSeconds);save();closeModal();
    const text={
      accept:['接受','阿七把师父的右半脸留了下来。左边没有继续补齐，只在海雾里缓慢改变。','新订单簿第一条被他划掉，重新写成：不得替客户决定想留下什么。'],
      faceless:['无面','阿七把能卸下的稳定组织一块块放回玻璃罐。镇上的人开始认不出他。','但有人在门外听到针线声，仍会说：“阿七今天在。”'],
      close:['关闭','面具铺的招牌被拆下来。第一个月有人骂他，第二个月有人偷偷来问旧面具还能不能修。','改变没有像结局动画一样发生。它只是终于允许发生。']
    }[type];
    app.innerHTML=`<section class="ending-screen"><div class="ending-inner"><div class="subtitle">ENDING</div><h1>${text[0]}</h1><div class="ending-prose"><p>${text[1]}</p><p>${text[2]}</p><p>${personalLine()}</p><p>海湾的公共日历翻了一页。上面仍然写着：第七日。</p></div><div class="ending-actions"><button class="ink-btn" data-end-act="title">返回标题</button><button class="ghost-btn" data-end-act="ngp">以残响视角开始二周目</button>${hiddenEligible()?'<button class="ghost-btn" data-end-act="hidden">回头听铺子</button>':''}</div></div></section>`;
    document.querySelectorAll('[data-end-act]').forEach(b=>b.onclick=()=>{if(b.dataset.endAct==='title'){state.started=false;state.scene='title';save();render()}else if(b.dataset.endAct==='ngp'){resetSave();state.started=true;state.ngp=true;state.scene='shop';save();render();toast('二周目：残响视角已开启。','good')}else openHiddenEnding()});
  }

  function personalLine(){
    const item={needle:'针线',cloth:'旧手帕',apron:'自己的工作围裙'}[state.blankItem]||'没有预先写好的东西';
    const dir={shop:'回铺子',sea:'走向海',stay:'停在原地'}[state.blankDirection]||'先站在原地';
    return hasMask('blank')?`空白房间里，他曾选择带走${item}，然后${dir}。那不是谜题答案，只是第一次不回答“都可以”。`:'他没有做那张空白面具。最后这一刻，他仍然得自己决定下一步，而没有任何系统替他打分。';
  }

  function hiddenEligible(){return state.shopChangesSeen.length>=5 && hasMask('soren') && hasMask('blank')}
  function openHiddenEnding(){
    state.hiddenEnding=true;save();app.innerHTML=`<section class="ending-screen"><div class="ending-inner"><div class="subtitle">HIDDEN EPILOGUE</div><h1>木头记得</h1><div class="ending-prose"><p>阿七回头时，门没有立刻打开。</p><p>工作台的黑线自己松开；小灯亮了一下；椅子向桌下退回半寸；水壶里传来很轻的水声。</p><p>门板敲了三下。不是敲门，是师父量木头时的节奏。</p><p>阿七问：“你还在吗？”</p><p>房间里七个不同的位置依次发出熟悉的响声。</p><p>很久以后，一句话从木头里传出来：“这双手不在了，但有些木头记得。”</p><p>它没有说明师父是否真的变成了铺子。海里仍有一张没有主人的空白面具漂向岸边。</p></div><div class="ending-actions"><button class="ink-btn" data-hidden-title>返回标题</button></div></div></section>`;document.querySelector('[data-hidden-title]').onclick=()=>{state.started=false;state.scene='title';save();render()};
  }

  function openNotebook(tab='obs'){
    sideTab=tab;
    const tabNames={items:'物件',obs:'观察',masks:'面具'};
    modal(`<div class="notebook-head"><div class="kicker">阿七的观察簿</div><h2>${tabNames[sideTab]}</h2></div><div class="notebook-tabs"><button class="tab-btn ${sideTab==='obs'?'active':''}" data-book-tab="obs">观察</button><button class="tab-btn ${sideTab==='items'?'active':''}" data-book-tab="items">物件</button><button class="tab-btn ${sideTab==='masks'?'active':''}" data-book-tab="masks">面具</button></div><div class="notebook-body">${sideTabContent()}</div>`,{dark:false,wide:true,close:true,classes:'notebook-modal'});
    document.querySelectorAll('[data-book-tab]').forEach(b=>b.onclick=()=>openNotebook(b.dataset.bookTab));
    document.querySelectorAll('[data-obs]').forEach(c=>c.onclick=()=>{toggleObs(c.dataset.obs);openNotebook('obs')});
    document.querySelector('[data-connect]')?.addEventListener('click',()=>{connectSelectedObs();openNotebook('obs')});
    document.querySelectorAll('[data-mask]').forEach(c=>c.onclick=()=>{const id=c.dataset.mask;if(c.classList.contains('locked'))return;closeModal();openMask(id)});
  }

  function openSupport(){
    modal(`<div class="support-panel"><div class="support-mark">￥</div><h2>支持作者</h2><p>完整游戏、提示与全部结局始终免费。这个入口只用于自愿支持，不参与章节解锁，也不会改变任何谜题结果。</p><p class="muted small">当前仓库没有绑定支付二维码或第三方支付接口，因此本版本只保留统一的支持入口与界面位置，避免伪造收款信息。</p></div>`,{dark:false,narrow:true,close:true,classes:'support-modal'});
  }

  function openHint(){
    const key=state.scene+'-'+currentChapterLabel();const level=(state.hints[key]||0);const hints=getHints();const shown=hints[Math.min(level,hints.length-1)];
    modal(`<div class="kicker">渐进帮助 · ${Math.min(level+1,3)}/3</div><h2>只把你带回规则</h2><p class="lead">${esc(shown)}</p><p class="muted small">第一层重述异常规则；第二层指出还没核对的证据类别；第三层只显示一个可尝试的动作，不直接告诉结果。</p><div class="modal-actions"><button class="ghost-btn" id="hint-next" ${level>=2?'disabled':''}>再具体一点</button></div>`,{dark:true,narrow:true,close:true});
    document.getElementById('hint-next')?.addEventListener('click',()=>{state.hints[key]=Math.min(2,level+1);save();closeModal();openHint()});
  }
  function getHints(){
    if(!state.prologue.aligned)return ['木盒本身没有可输入的密码；它只在和房间其他物件形成关系时改变。','还有没有检查过镜子、光线、视角或反射？','把五种关系都触发后，再移动木盒与镜中右半脸对齐。'];
    if(state.scene==='secret'&&!state.prologue.mask)return ['工艺账要求三种不同职责，而不是三个“神秘材料”。','相貌、习惯、见证各自需要一项能独立证明的痕迹。','半成品对应相貌；反复拆结的黑线对应习惯；童年刻痕木屑对应见证。'];
    if(state.scene==='water'&&!state.prologue.water)return ['先找房间里重复出现的运动方向。','水、烛泪、玻璃、床单都一致；墙钟没有。','试着持续把墙钟逆时针拨回去。'];
    if(state.scene==='postman')return ['道路先重复展示规律，再要求打破。','第七步会重置；问题不在前五步。','走到第六步以后，做一次和平时相反的动作。'];
    if(state.scene==='soren')return ['不同材质会产生不同回声形状。','夹层墙不是单次反射。','扫描墙面，寻找会出现第二次反射的位置。'];
    if(completedMain()===5&&state.links.length<3)return ['观察卡只记录事实，终章需要你自己先建立一些关系。','优先尝试同一人物关卡里“异常规则”和“结果”两张卡。','例如邮差的“第七步重置”与“第六步后反向一次”存在时间/行为关系。'];
    if(state.scene==='finale'&&state.finalStations.length<3)return ['每座验证台都需要两种功能互相证明。','复写镜关心对象与遮掩；节律槽关心重复与主动改路；温声台关心表达与真实在场。','见+辨、听+行、言+温分别对应三座台；节律槽还需要亲手完成六次顺向+一次逆向。'];
    return ['重新看当前场景里最稳定的异常规则。','如果某一步只能靠猜作者心思，那通常说明你还漏了一个可观察依据。','打开观察记录，尝试连接已经见过的两张事实卡。'];
  }

  function openGameMenu(){
    modal(`<div class="kicker">案卷管理</div><h2>当前存档</h2><div class="paper-grid"><div class="paper-card"><h4>章节</h4><p>${currentChapterLabel()}</p></div><div class="paper-card"><h4>游玩时间</h4><p>${fmtTime(state.playSeconds)}</p></div><div class="paper-card"><h4>观察关系</h4><p>${state.links.length} 组</p></div><div class="paper-card"><h4>错误尝试</h4><p>${state.mistakes} 次（不影响结局）</p></div></div><div class="modal-actions"><button class="ink-btn" id="manual-save">保存一次</button><button class="ghost-btn" id="to-title">保存并返回标题</button><button class="ghost-btn" id="settings-game">设置</button><button class="ghost-btn danger-btn" id="restart-game">重新开始</button></div>`,{dark:true,narrow:true,close:true});
    document.getElementById('manual-save').onclick=()=>{save();toast('案卷已保存。','good')};document.getElementById('to-title').onclick=()=>{save();closeModal();state.started=false;state.scene='title';save();render()};document.getElementById('settings-game').onclick=()=>{closeModal();openSettings()};document.getElementById('restart-game').onclick=()=>{if(confirm('确定清除当前进度并重新开始？')){resetSave();state.started=true;state.scene='shop';save();closeModal();render()}};
  }

  function openSettings(){
    modal(`<div class="kicker">设置</div><h2>阅读与操作</h2><div class="paper-grid"><button class="paper-card mask-btn" id="set-audio"><h4>声音</h4><p>${state.audio?'当前开启':'当前关闭'}。声音谜题始终保留视觉声纹模式。</p></button><button class="paper-card mask-btn" id="set-motion"><h4>减少动态</h4><p>${state.reduced?'当前开启':'当前跟随系统偏好'}。关闭大幅镜面与呼吸动效。</p></button><button class="paper-card mask-btn" id="set-hotspots"><h4>辅助热点</h4><p>${state.hotspotAssist?'当前显示':'默认隐藏'}。开启后常驻显示可检查物件名称，适合触屏或无障碍使用。</p></button></div><p class="muted small">PC可直接拖动物品；平板和手机既可拖拽，也可先点物品再点场景。颜色不是唯一线索。</p>`,{dark:false,narrow:true,close:true});
    document.getElementById('set-audio').onclick=()=>{state.audio=!state.audio;save();syncAmbience();closeModal();openSettings()};
    document.getElementById('set-motion').onclick=()=>{state.reduced=!state.reduced;save();document.documentElement.classList.toggle('reduce-motion',state.reduced);closeModal();openSettings()};
    document.getElementById('set-hotspots').onclick=()=>{state.hotspotAssist=!state.hotspotAssist;save();closeModal();openSettings()};
  }

  function openInfo(title,html,onClose){modal(`<div class="kicker">卷宗边页</div><h2>${title}</h2>${html}`,{dark:true,wide:false,close:true,onClose})}
  function showStory(lines,done){
    modal(`<div class="kicker">过场 · 点击即可继续阅读</div>${lines.map((x,i)=>`<p class="story-line ${i===0?'shown':''}" data-story-line>${esc(x)}</p>`).join('')}<button class="ink-btn story-next" id="story-next">继续</button>`,{classes:'story-card',close:false});
    const els=[...document.querySelectorAll('[data-story-line]')];let idx=1;document.getElementById('story-next').onclick=()=>{if(idx<els.length){els[idx++].classList.add('shown');playSfx('knock')}else done?.()};
  }

  function modal(content,opts={}){
    closeModal(false);
    const dark=opts.dark!==false; const cls=`modal-card ${dark?'dark':''} ${opts.wide?'wide':''} ${opts.narrow?'narrow':''} ${opts.classes||''}`;
    modalRoot.innerHTML=`<div class="modal-backdrop" id="modal-backdrop"><section class="${cls}" role="dialog" aria-modal="true">${opts.close?'<button class="modal-close" aria-label="关闭">×</button>':''}${content}</section></div>`;
    const bg=document.getElementById('modal-backdrop');
    if(opts.close){bg.querySelector('.modal-close').onclick=()=>{closeModal();opts.onClose?.()};bg.addEventListener('click',e=>{if(e.target===bg){closeModal();opts.onClose?.()}})}
  }
  function closeModal(clear=true){if(clear)modalRoot.innerHTML='';else modalRoot.innerHTML=''}
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}

  // Keyboard comfort: Escape closes a modal or puts down the held item; N opens the observation notebook.
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      const c=modalRoot.querySelector('.modal-close');
      if(c){c.click();return}
      if(heldItemId){heldItemId=null;render();return}
    }
    if(!state.started)return;
    if(e.key.toLowerCase()==='n')openNotebook('obs');
  });
  window.addEventListener('beforeunload',save);
  window.addEventListener('pageshow',()=>{normalizeState();render()});
  document.documentElement.classList.toggle('reduce-motion',state.reduced);
  render();
})();
