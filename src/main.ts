import Phaser from 'phaser';
import './styles/v4.css';
import {SaveManager} from './core/SaveManager';
import {GameStore} from './core/GameStore';
import {bus} from './core/EventBus';
import {audio} from './core/AudioManager';
import {UI} from './ui/UI';
import {OBS,MAIN_MASKS,MASKS} from './data/gameData';

const root=document.getElementById('app')!;
const P=Phaser;
const [{ShopScene},{SecretScene},{WaterMemoryScene},{MayorScene},{ButcherScene},{ElaineScene},{MiloScene},{PostmanScene},{SorenScene},{BlankScene},{FinaleScene},{EndingScene}]=await Promise.all([
  import('./game/scenes/ShopScene'),import('./game/scenes/SecretScene'),import('./game/scenes/WaterMemoryScene'),import('./game/scenes/MayorScene'),import('./game/scenes/ButcherScene'),import('./game/scenes/ElaineScene'),import('./game/scenes/MiloScene'),import('./game/scenes/PostmanScene'),import('./game/scenes/SorenScene'),import('./game/scenes/BlankScene'),import('./game/scenes/FinaleScene'),import('./game/scenes/EndingScene')
]);
const saveManager=new SaveManager();
const store=new GameStore(saveManager);
const ui=new UI(root,store.state);
let game:any=null;
let gameBooted=false;
let pendingScene:string|null=null;
let timer=0;

function startTimer(){if(timer)return;timer=window.setInterval(()=>{if(store.state.started&&!store.state.ending){store.state.playSeconds++;if(store.state.playSeconds%10===0)store.save()}},1000)}
function ensureGame(){
  if(game)return;
  ui.renderShell();
  const host=document.getElementById('phaser-host')!;
  gameBooted=false;
  game=new P.Game({type:P.AUTO,parent:host,width:1280,height:720,backgroundColor:'#0c0e0c',scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},input:{activePointers:3},render:{antialias:true,pixelArt:false,roundPixels:false},scene:[]});
  const onReady=()=>{
    if(!game)return;
    const defs:any[]=[['Shop',ShopScene],['Secret',SecretScene],['Water',WaterMemoryScene],['Mayor',MayorScene],['Butcher',ButcherScene],['Elaine',ElaineScene],['Milo',MiloScene],['Postman',PostmanScene],['Soren',SorenScene],['Blank',BlankScene],['Finale',FinaleScene],['Ending',EndingScene]];
    for(const [key,Cls] of defs)game.scene.add(key,Cls,false);
    gameBooted=true;
    if(pendingScene){const id=pendingScene;pendingScene=null;startPhaserScene(id)}
  };
  if(game.isBooted)onReady();else game.events.once((P.Core?.Events?.READY)||'ready',onReady);
  startTimer();window.addEventListener('resize',()=>game?.scale?.refresh());
}
function startPhaserScene(id:string){
  if(!gameBooted||!game){pendingScene=id;return}
  const key=sceneMap[id];if(!key)return;
  for(const k of Object.values(sceneMap)){
    const sc=game.scene.getScene(k as string);if(!sc)continue;
    if(k==='Shop'&&key!=='Shop'&&sc.scene.isActive())sc.scene.sleep();
    else if(k!=='Shop'&&k!==key&&(sc.scene.isActive()||sc.scene.isSleeping?.()))sc.scene.stop();
  }
  const target=game.scene.getScene(key);
  const data={state:store.state,ui,store};
  if(key==='Shop'&&target?.scene?.isSleeping?.())target.scene.wake(data);
  else if(target?.scene?.isActive?.())target.scene.restart(data);
  else game.scene.start(key,data);
}
const sceneMap:any={shop:'Shop',secret:'Secret',water:'Water',mayor:'Mayor',butcher:'Butcher',elaine:'Elaine',milo:'Milo',postman:'Postman',soren:'Soren',blank:'Blank',finale:'Finale',ending:'Ending'};
function go(id:string){
  if(id==='title'){store.save();pendingScene=null;gameBooted=false;if(game){game.destroy(true);game=null}ui.renderTitle();audio.ambience('none');return}
  ensureGame();
  if(id==='shop'){store.state.scene='shop' as any;const main=store.state.completedMasks.filter((x:any)=>(MAIN_MASKS as readonly string[]).includes(x)).length;store.state.finalUnlocked=main===5&&store.state.linkedRelations.length>=3}
  else store.state.scene=(id==='ending'?'finale':id) as any;
  store.save();ui.setState(store.state);startPhaserScene(id);audio.ambience(id==='shop'?'shop':id==='postman'||id==='water'?'sea':'shop')
}
function addObservation(id:string){if(!OBS[id])return;if(!store.state.observations.some(o=>o.id===id)){store.state.observations.push({id,...OBS[id]});store.save();ui.setState(store.state);ui.toast(`观察记录：${OBS[id].title}`,'good')}}
function opening(){ui.modal('序章 · 师父不在了',`<p class="lead">第七日的海雾贴在窗上。师父的椅子空着，工作台中央只放着一个没有五官的木盒。</p><p>没有纸条告诉阿七“点哪里”。屋里的镜子、灯、瓷娃娃、剪刀和椅子，都比说明书更像说明。</p>`,`<button id="opening-enter">走进面具铺</button>`);document.getElementById('opening-enter')?.addEventListener('click',()=>{ui.closeModal();go('shop');ui.scheduleSupportAuto()})}
function chapter2Cinematic(){ui.modal('第一章结束 · 水退回墙里',`<p>第三声钟响之后，水雾把那半句字慢慢吞回去。</p><p>师父的记忆没有解释七只玻璃罐。墙上的订单却多出了五个仍然活在镇上的名字。</p><p>如果他们真的被取走了脸的一部分——他们为什么还在照常生活？</p>`,`<button id="ch2-enter">回到面具铺</button>`);document.getElementById('ch2-enter')?.addEventListener('click',()=>{ui.closeModal();go('shop')})}
function endingEpilogue(b:'A'|'B'|'C'){
  const copy:any={A:['接受','右半脸贴上镜面时，阿七没有补齐左边。','他第一次允许一张脸带着缺失继续生活。'],B:['无面','最后一根缝线落地，残响不再保持单一形状。','没有什么“真正的脸”从下面露出来。'],C:['关闭','门板落下，工作灯熄灭。','铺子第一次不再替任何人保存一张可被归档的脸。']};const hidden=store.state.hiddenSeen.length>=7;store.state.endingFlags.push(hidden?'true_epilogue':'ordinary_epilogue');store.save();ui.modal(`结局 ${b} · ${copy[b][0]}`,`<p class="lead">${copy[b][1]}</p><p>${copy[b][2]}</p>${hidden?'<hr><p><b>隐藏尾声 · 铺子记得师父</b></p><p>死结、刻痕旁的灯、归位的椅子、添满的水壶、面具内侧的新线、门板三声与瓷娃娃旁的木屑同时回到记忆里。铺子没有替师父定型，只记得他做过的事。</p>':''}`,`<button id="ending-title">回到标题</button>`);document.getElementById('ending-title')?.addEventListener('click',()=>{ui.closeModal();store.state.ngp=true;store.state.scene='shop';store.save();go('title')})}

bus.on('title',(act:any)=>{if(act==='new'){if(localStorage.getItem('mianmu-the-face-of-it-save-v4-ts')&&!confirm('开始新游戏会覆盖当前 v4.0 进度。继续吗？'))return;store.reset();store.state.started=true;store.state.scene='shop';store.state.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;store.save();ui.setState(store.state);opening()}else if(act==='continue'){store.state.started=true;ui.setState(store.state);go(store.state.scene==='title'?'shop':store.state.scene);ui.scheduleSupportAuto()}else if(act==='settings')ui.settings()});
bus.on('ui',(act:any)=>{if(act==='notebook')ui.notebook();if(act==='support')ui.support(false);if(act==='settings')ui.settings();if(act==='title')go('title')});
bus.on('hint',(x:any)=>ui.hint(x));
bus.on('toast',(x:any)=>ui.toast(typeof x==='string'?x:x.text,typeof x==='string'?'':x.tone));
bus.on('observation',(id:any)=>addObservation(id));
bus.on('scene',(id:any)=>go(id));
bus.on('maskwall',()=>ui.maskWall());
bus.on('mask',(id:any)=>{if(store.state.completedMasks.includes(id))return;go(id)});
bus.on('chapter2',()=>chapter2Cinematic());
bus.on('link-observation',(p:any)=>{if(!p.ok){store.state.mistakes++;store.save();ui.toast('两张卡暂时没有形成可验证关系。继续观察世界，不要把相似当因果。');return}const key=[...p.pair].sort().join('|');if(!store.state.linkedRelations.includes(key))store.state.linkedRelations.push(key);const main=store.state.completedMasks.filter((x:any)=>(MAIN_MASKS as readonly string[]).includes(x)).length;store.state.finalUnlocked=main===5&&store.state.linkedRelations.length>=3;store.save();ui.setState(store.state);ui.toast('关系成立。观察簿只记录“存在关系”，结论仍由你自己完成。','good')});
bus.on('setting',(p:any)=>{(store.state as any)[p.key]=p.value;if(p.key==='sound')audio.setEnabled(p.value);document.documentElement.classList.toggle('reduce-motion',store.state.reduced);store.save()});
bus.on('endingStart',()=>go('ending'));
bus.on('endingComplete',(b:any)=>endingEpilogue(b));
window.addEventListener('beforeunload',()=>store.save());

ui.renderTitle();
