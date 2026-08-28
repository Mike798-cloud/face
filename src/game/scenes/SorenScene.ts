import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import {audio} from '../../core/AudioManager';
import Phaser from 'phaser';
const P=Phaser;
export class SorenScene extends BaseScene{
  scanHits=0;lastKnock=0;wave:any;done=false;
  constructor(){super('Soren')}
  preload(){this.loadSceneImage('soren.webp')}
  create(){const w=this.scale.width,h=this.scale.height;this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0x242723).setAlpha(.2);this.add.rectangle(w/2,h/2,w,h,0x050706,.78);this.add.text(w*.5,h*.13,'不要找亮点。沿墙连续移动手指，听 / 看回声性质在哪里改变。',{fontFamily:'serif',fontSize:'16px',color:'#c7c2b7',backgroundColor:'#090b09aa',padding:{x:12,y:7}}).setOrigin(.5);bus.emit('hint','画面近乎全黑。滑动位置就是扫描点；轻点就是敲击。视觉声纹完整替代听觉信息。');
    this.wave=this.add.graphics().setDepth(10);const wall=this.add.zone(w*.08,h*.22,w*.84,h*.58).setOrigin(0).setInteractive();wall.on('pointermove',(p:any)=>{if(!p.isDown)return;this.scan(p.x,p.y,false)});wall.on('pointerdown',(p:any)=>this.scan(p.x,p.y,true));
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
  scan(x:number,y:number,knock:boolean){if(this.done)return;const w=this.scale.width,h=this.scale.height;const nx=x/w;const pan=nx*2-1;const anomaly=nx>.63&&nx<.75;const curtain=nx>.18&&nx<.32;const table=y>h*.62;let freq=table?420:curtain?130:anomaly?190:260;audio.tone(freq,pan,anomaly?.3:.15,anomaly?.11:.06);this.wave.clear();this.wave.lineStyle(anomaly?3:2,anomaly?0xd1b978:0x9aa5a0,.88);const amp=anomaly?35:curtain?18:table?10:24;const pts=[];for(let i=0;i<64;i++){const px=x-90+i*3,py=y+Math.sin(i*(anomaly?.7:1.1))*amp*(1-i/80);pts.push(new P.Math.Vector2(px,py))}this.wave.strokePoints(pts,false,false);if(anomaly){this.scanHits++;if(this.scanHits===8)this.feedback('同一段墙出现两次不同延迟的回声。这里不是空墙。',true);if(this.scanHits>18&&!this.state.completedMasks.includes('soren')){this.done=true;bus.emit('observation','soren_echo');bus.emit('observation','soren_voice');this.feedback('连续扫描把夹层墙的边界画完整了。索伦没有“看见”房间，却比任何人都准确。',true);this.time.delayedCall(900,()=>this.finishMask('soren','res_wen',['soren_echo','soren_voice'],'soren'))}}else if(knock){this.feedback(table?'短而硬的回声：木桌。':curtain?'宽而软的回声：帘布吸掉了高频。':'单一回声：普通墙面。')}}
}
