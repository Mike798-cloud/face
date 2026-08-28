import {GameState} from '../core/GameState';
import {bus} from '../core/EventBus';
import {MAIN_MASKS,MASKS,VALID_RELATIONS} from '../data/gameData';

export class UI{
  root:HTMLElement; state:GameState; selectedObs:string[]=[];
  constructor(root:HTMLElement,state:GameState){this.root=root;this.state=state}
  setState(s:GameState){this.state=s;if(document.getElementById('phaser-host'))this.updateHud();else this.renderTitle()}
  renderTitle(){
    this.root.innerHTML=`<main class="title-screen"><div class="title-bg"></div><section class="title-copy"><div class="eyebrow">海湾第七码头 · 第七日</div><h1>面目</h1><div class="title-en">THE FACE OF IT</div><p>不是解一道关于异常世界的题。<br>亲手让那个世界承认你的动作。</p><div class="title-actions"><button data-title="new">新游戏</button><button data-title="continue" ${this.state.started?'':'disabled'}>继续游戏</button><button data-title="settings">设置</button></div><small>v4.0 · Phaser + TypeScript 交互重构</small></section></main>`;
    this.root.querySelectorAll('[data-title]').forEach(el=>el.addEventListener('click',()=>{if((el as HTMLButtonElement).disabled)return;bus.emit('title',(el as HTMLElement).dataset.title)}));
  }
  renderShell(){
    if(!this.state.started){this.renderTitle();return}
    const mainCount=this.mainCount();
    this.root.innerHTML=`<main class="game-shell"><header class="topbar"><div><b>面目</b><span id="chapter-label">${this.chapterLabel(mainCount)}</span></div><nav><button data-ui="notebook" aria-label="观察簿">观察簿</button><button data-ui="hint" aria-label="提示">提示</button><button data-ui="support" aria-label="支持作者">支持</button><button data-ui="sound" aria-label="声音${this.state.sound?'开启':'关闭'}">${this.state.sound?'声音':'静音'}</button><button data-ui="menu" aria-label="菜单">菜单</button></nav></header><section class="game-area"><div id="phaser-host" aria-label="游戏场景"></div><aside class="journal"><div class="journal-head"><b>随身物</b><span>亲手取得的物件</span></div><div id="inventory-list" class="inventory">${this.state.inventory.map(x=>`<div class="inv-chip">${this.itemName(x)}</div>`).join('')||'<em>空</em>'}</div><div class="journal-head"><b>残响</b><span>${this.state.residues.length}份</span></div><div id="residue-list" class="residues">${this.state.residues.map(x=>`<div class="res-chip">${this.resName(x)}</div>`).join('')||'<em>尚未取得</em>'}</div><div class="journal-head"><b>当前动作</b></div><div id="action-hint" class="action-hint">观察场景，先试着动手。</div></aside></section><footer class="gesture-bar"><button data-gesture="left">←</button><button data-gesture="rotate">旋转 90°</button><button data-gesture="use">确认 / 使用</button><button data-gesture="right">→</button></footer></main><div id="overlay-root"></div>`;
    this.root.querySelectorAll('[data-ui]').forEach(el=>el.addEventListener('click',()=>bus.emit('ui',(el as HTMLElement).dataset.ui)));
    this.root.querySelectorAll('[data-gesture]').forEach(el=>el.addEventListener('click',()=>bus.emit('gesture',(el as HTMLElement).dataset.gesture)));
  }
  updateHud(){
    const ch=document.getElementById('chapter-label');if(ch)ch.textContent=this.chapterLabel(this.mainCount());
    const inv=document.getElementById('inventory-list');if(inv)inv.innerHTML=this.state.inventory.map(x=>`<div class="inv-chip">${this.itemName(x)}</div>`).join('')||'<em>空</em>';
    const res=document.getElementById('residue-list');if(res)res.innerHTML=this.state.residues.map(x=>`<div class="res-chip">${this.resName(x)}</div>`).join('')||'<em>尚未取得</em>';
    const sound=document.querySelector('[data-ui="sound"]') as HTMLButtonElement|null;if(sound){sound.textContent=this.state.sound?'声音':'静音';sound.setAttribute('aria-label',`声音${this.state.sound?'开启':'关闭'}`)}
  }
  hint(text:string){const el=document.getElementById('action-hint');if(el)el.textContent=text}
  toast(text:string,tone=''){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el)}el.className=`toast ${tone}`;el.textContent=text;requestAnimationFrame(()=>el!.classList.add('show'));clearTimeout((el as any)._t);(el as any)._t=setTimeout(()=>el!.classList.remove('show'),2300)}
  modal(title:string,body:string,actions=''){let root=document.getElementById('overlay-root') as HTMLElement|null;if(!root){root=document.createElement('div');root.id='overlay-root';document.body.appendChild(root)}root.innerHTML=`<div class="overlay"><article class="paper-modal"><button class="modal-x" aria-label="关闭">×</button><h2>${title}</h2><div class="modal-body">${body}</div>${actions?`<div class="modal-actions">${actions}</div>`:''}</article></div>`;root.querySelector('.modal-x')?.addEventListener('click',()=>this.closeModal());return root}
  closeModal(){const root=document.getElementById('overlay-root');if(root)root.innerHTML=''}
  cinematic(image:string,kicker:string,lines:string[],onDone:()=>void){
    let root=document.getElementById('overlay-root') as HTMLElement|null;if(!root){root=document.createElement('div');root.id='overlay-root';document.body.appendChild(root)}
    root.innerHTML=`<div class="cinematic-layer"><div class="cinematic-image" style="background-image:url('assets/images/${image}')"></div><div class="cinematic-shade"></div><section class="cinematic-copy"><div class="cinematic-kicker">${kicker}</div><div class="cinematic-lines">${lines.map((x,i)=>`<p class="cinematic-line ${i===0?'visible':''}">${x}</p>`).join('')}</div><button class="cinematic-next">继续</button></section></div>`;
    const els=[...root.querySelectorAll('.cinematic-line')] as HTMLElement[];let i=0;const next=root.querySelector('.cinematic-next') as HTMLButtonElement;next.addEventListener('click',()=>{if(i<els.length-1){i++;els[i].classList.add('visible');els[i].scrollIntoView({block:'nearest',behavior:this.state.reduced?'auto':'smooth'});return}this.closeModal();onDone()});
  }
  notebook(){
    const cards=this.state.observations.map(o=>`<button class="obs ${this.selectedObs.includes(o.id)?'selected':''}" data-obs="${o.id}"><b>${o.title}</b><span>${o.text}</span><i>${o.group}</i></button>`).join('')||'<p>观察卡不会由剧情自动发放。先完成动作。</p>';
    const root=this.modal('阿七的观察簿',`<p class="lead">选两张观察卡，确认它们之间是否存在物理、时间、行为、空间或身份关系。系统只确认“关系存在”，不会替你写结论。</p><div class="obs-grid">${cards}</div><div id="relation-feedback" class="feedback">已确认关系：${this.state.linkedRelations.length}</div>`,`<button id="link-obs">连接所选观察</button>`);
    root.querySelectorAll('[data-obs]').forEach(el=>el.addEventListener('click',()=>{const id=(el as HTMLElement).dataset.obs!;if(this.selectedObs.includes(id))this.selectedObs=this.selectedObs.filter(x=>x!==id);else{if(this.selectedObs.length>=2)this.selectedObs.shift();this.selectedObs.push(id)}this.notebook()}));
    root.querySelector('#link-obs')?.addEventListener('click',()=>{if(this.selectedObs.length!==2){this.toast('先选两张观察卡。');return}const key=[...this.selectedObs].sort().join('|');const ok=VALID_RELATIONS.some(p=>[...p].sort().join('|')===key);bus.emit('link-observation',{pair:[...this.selectedObs],ok});this.selectedObs=[];this.notebook()});
  }
  hintDialog(){
    const key=`${this.state.scene}|${this.chapterLabel(this.mainCount())}`;const level=this.state.hints[key]||0;const hints=this.getHints();const shown=hints[Math.min(level,hints.length-1)];
    const root=this.modal(`渐进帮助 · ${Math.min(level+1,3)}/3`,`<p class="lead">${shown}</p><p class="muted">第一层只重述异常规则；第二层指出仍需核对的关系；第三层才给一个可尝试动作，不直接替你完成谜题。</p>`,`<button id="hint-next" ${level>=2?'disabled':''}>再具体一点</button>`);
    root.querySelector('#hint-next')?.addEventListener('click',()=>bus.emit('hint-progress',{key,level:Math.min(2,level+1)}));
  }
  gameMenu(){
    const t=this.formatTime(this.state.playSeconds);const root=this.modal('案卷管理',`<div class="menu-stats"><div><b>章节</b><span>${this.chapterLabel(this.mainCount())}</span></div><div><b>游玩时间</b><span>${t}</span></div><div><b>观察关系</b><span>${this.state.linkedRelations.length} 组</span></div><div><b>错误尝试</b><span>${this.state.mistakes} 次</span></div></div>`,`<button data-menu="save">保存一次</button><button data-menu="settings">设置</button><button data-menu="title">保存并返回标题</button><button data-menu="restart">重新开始</button>`);
    root.querySelectorAll('[data-menu]').forEach(el=>el.addEventListener('click',()=>bus.emit('menu-action',(el as HTMLElement).dataset.menu)));
  }
  support(auto=false){
    const paid=()=>{try{return !!(localStorage.getItem('_mianmu_face_support')||sessionStorage.getItem('_mianmu_face_session')||document.cookie.split(';').some(x=>x.trim().startsWith('_mianmu_pay_flag=')))}catch{return false}};
    if(paid()){if(!auto)this.toast('已经记录过你的支持，谢谢你。','good');return}
    let root=document.getElementById('support-overlay');if(root)root.remove();
    root=document.createElement('div');root.id='support-overlay';root.className='support-overlay';root.innerHTML=`<article class="support-card"><button class="support-x" data-close>×</button><h2>支持《面目》</h2><p class="support-sub">1元 自愿打赏 · 完整内容始终免费</p><img src="https://mike798-cloud.github.io/songtao-grainstation/paycode.png" alt="收款码" class="support-qr"><p>《面目》里每一张脸、每一段记忆和每一个异常动作，都经过反复拆掉再重做。</p><p>1块钱买不到一张真正的脸，但可以给面具铺多留一盏灯。无论是否支持，主线、提示、隐藏内容与全部结局都不会被锁住。</p><div class="support-actions"><button data-done>已完成支持 ♡</button><button data-close>下次一定</button></div><small>abc studio</small></article>`;document.body.appendChild(root);
    root.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',()=>root?.remove()));
    root.querySelector('[data-done]')?.addEventListener('click',()=>{try{const token=btoa(`${Date.now()}_${Math.random().toString(36).slice(2,10)}_abc_studio`);localStorage.setItem('_mianmu_face_support',token);sessionStorage.setItem('_mianmu_face_session',token);const d=new Date(Date.now()+365*86400000);document.cookie=`_mianmu_pay_flag=${token};expires=${d.toUTCString()};path=/`}catch{}root?.remove();this.toast('谢谢。面具铺的灯会再亮一会儿。','good')});
  }
  scheduleSupportAuto(){try{if(localStorage.getItem('_mianmu_support_auto_seen'))return;localStorage.setItem('_mianmu_support_auto_seen','1')}catch{}setTimeout(()=>this.support(true),900)}
  settings(){const root=this.modal('设置',`<label class="setting-row"><span>声音</span><input id="set-sound" type="checkbox" ${this.state.sound?'checked':''}></label><label class="setting-row"><span>减少动态</span><input id="set-reduced" type="checkbox" ${this.state.reduced?'checked':''}></label><p class="muted">所有声音核心线索都有视觉声纹；精确拖拽都有点击或按钮替代。</p>`);root.querySelector('#set-sound')?.addEventListener('change',e=>bus.emit('setting',{key:'sound',value:(e.target as HTMLInputElement).checked}));root.querySelector('#set-reduced')?.addEventListener('change',e=>bus.emit('setting',{key:'reduced',value:(e.target as HTMLInputElement).checked}))}
  maskWall(){const main=this.state.completedMasks;const mainCount=this.mainCount();const buttons=(MAIN_MASKS as readonly string[]).map(id=>`<button data-mask="${id}" class="mask-choice ${main.includes(id as any)?'done':''}" ${main.includes(id as any)?'disabled':''}><img src="assets/images/${MASKS[id].image}" alt=""><span><b>${MASKS[id].name}</b><small>${MASKS[id].verb}</small></span></button>`).join('');const sorenUnlocked=mainCount>=3;const blankUnlocked=mainCount>=4;const extra=`<button data-mask="soren" class="mask-choice ${this.state.completedMasks.includes('soren')?'done':''}" ${!sorenUnlocked||this.state.completedMasks.includes('soren')?'disabled':''}><img src="assets/images/soren.webp" alt=""><span><b>盲眼老人 · 索伦</b><small>${sorenUnlocked?'敲 / 扫描':'第三张主线面具之后'}</small></span></button><button data-mask="blank" class="mask-choice ${this.state.completedMasks.includes('blank')?'done':''}" ${!blankUnlocked||this.state.completedMasks.includes('blank')?'disabled':''}><img src="assets/images/blank.webp" alt=""><span><b>给自己的空白</b><small>${blankUnlocked?'靠近 / 拿起':'第四张主线面具之后'}</small></span></button>`;
    const root=this.modal('面具墙',`<p class="lead">五张主线可以任意顺序完成。连续两次进入不会复用同一种主要动作。</p><div class="mask-wall">${buttons}${extra}</div>`);root.querySelectorAll('[data-mask]').forEach(el=>el.addEventListener('click',()=>{this.closeModal();bus.emit('mask',(el as HTMLElement).dataset.mask)}))
  }
  private getHints(){
    if(!this.state.prologue.aligned)return ['木盒本身没有密码。它只在和房间其他物件形成关系时改变。','检查镜子、光线、朝向和视线高度；这些关系不会被文字自动填写。','让五种关系都出现后，把完整木盒拖到镜中右半脸。'];
    if(this.state.scene==='secret'&&!this.state.prologue.mask)return ['工作台要求三种不同职责，不是三件看起来神秘的材料。','分别找能证明相貌、稳定习惯、长期见证的痕迹。','半张旧面具 → 相貌；反复拆开的黑线 → 习惯；童年刻痕木屑 → 见证。'];
    if(this.state.scene==='water'&&!this.state.prologue.water)return ['先比较房间里每一种运动方向。','水滴、烛泪、玻璃与褶皱都服从倒流，只有墙钟没有。','持续逆时针拨墙钟；第三声之后别找按钮，直接擦镜。'];
    if(this.state.scene==='postman')return ['道路会先重复展示规律，再允许你破坏它。','第七步会重置；真正的岔口在第六步之后。','走到第六步后主动后退一步。'];
    if(this.state.scene==='soren')return ['不同材质会产生不同声纹。','异常墙面不是“热点”，而是第二次反射出现的位置。','沿墙连续扫描，找双重回声区域。'];
    if(this.mainCount()===5&&this.state.linkedRelations.length<3)return ['五张面具已经回来，但观察仍是孤立事实。','先连接至少三组确实存在物理、时间、行为、空间或身份关系的观察。','例如邮差“第七步重置”与“第六步后逆行不重置”是一组时间/行为关系。'];
    if(this.state.scene==='finale'&&this.state.finalStations.length<3)return ['每座验证台都需要两种功能互相证明。','复写镜关心对象与辨认；节律槽关心听见与行动；温声台关心表达与真实在场。','见+辨、听+行、言+温分别对应三座台；节律槽还需要六次正向后主动逆转一次。'];
    return ['重新看当前场景最稳定的异常规则。','如果只能猜作者心思，通常还漏了一次可操作的观察。','打开观察簿，把已经亲手验证过的两张事实卡尝试连接。'];
  }
  private mainCount(){return this.state.completedMasks.filter(x=>(MAIN_MASKS as readonly string[]).includes(x)).length}
  private chapterLabel(main:number){if(!this.state.prologue.aligned)return '序章 · 空白木盒';if(!this.state.prologue.water)return '第一章 · 胎记';if(main<5)return `第二章 · 五张主线面具 ${main}/5`;if(!this.state.centerSolved)return '第三章 · 三站共振';return '终章 · 把选择变成动作'}
  private itemName(id:string){return ({scissors:'裁布剪',key:'木盒里的小钥匙',halfmask:'半张旧面具',blackthread:'反复拆开的黑线',woodchip:'童年刻痕木屑',mastermask:'师父的微笑面具'} as any)[id]||id}
  private resName(id:string){for(const k of Object.keys(MASKS))if(MASKS[k].residue===id)return MASKS[k].label;return id==='res_blank'?'未定形 · 透明残响':id}
  private formatTime(sec:number){const m=Math.floor(sec/60),s=sec%60;return `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`}
}
