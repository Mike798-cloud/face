import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
export class PostmanScene extends BaseScene{
  pos=0;forwardSteps=0;broken=false;moving=false;player:any;mailbox:any;offGesture:any=null;
  constructor(){super('Postman')}
  preload(){this.loadSceneImage('postman.webp')}
  create(){
    const w=this.scale.width,h=this.scale.height;
    this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xc8bcaa);
    bus.emit('hint','真的走这条路。每向前走到第 7 步，环境会重置。关键不是“第七步按什么”，而是在第 6 步之后主动转身并倒退一步。方向键、点击道路两侧和底部方向区都可移动。');
    this.add.rectangle(w/2,h*.79,w*.92,h*.1,0x27251f,.52);
    this.player=this.add.container(w*.12,h*.73);
    this.player.add([this.add.rectangle(0,0,28,52,0x3c352b,.95).setStrokeStyle(1,0xd4c29f),this.add.text(0,0,'阿七',{fontFamily:'serif',fontSize:'11px',color:'#efe4d1'}).setOrigin(.5)]);
    this.mailbox=this.add.container(w*.88,h*.67);this.mailbox.add([this.add.rectangle(0,0,46,70,0x5a4432,.92).setStrokeStyle(2,0x1d1711),this.add.text(0,0,'旧\n邮箱',{fontFamily:'serif',fontSize:'11px',color:'#eadcc4',align:'center'}).setOrigin(.5)]);this.mailbox.setAlpha(.45);
    const left=this.add.zone(0,h*.2,w*.5,h*.7).setOrigin(0).setInteractive();const right=this.add.zone(w*.5,h*.2,w*.5,h*.7).setOrigin(0).setInteractive();
    left.on('pointerdown',()=>this.walk(-1));right.on('pointerdown',()=>this.walk(1));
    this.input.keyboard?.on('keydown-LEFT',()=>this.walk(-1));this.input.keyboard?.on('keydown-RIGHT',()=>this.walk(1));
    this.offGesture=bus.on('gesture',(g:any)=>{if(g==='left')this.walk(-1);if(g==='right')this.walk(1)});this.events.once('shutdown',()=>this.offGesture?.());
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
  walk(dir:number){
    if(this.moving)return;
    this.moving=true;
    const w=this.scale.width;
    if(!this.broken){
      if(dir>0){
        if(this.forwardSteps===6){
          this.feedback('第七步落下。海风、邮箱和脚下裂缝同时回到起点。');
          this.cameras.main.fadeOut(this.state.reduced?0:160,30,30,28);
          this.time.delayedCall(this.state.reduced?20:180,()=>{this.pos=0;this.forwardSteps=0;this.player.x=w*.12;this.cameras.main.fadeIn(this.state.reduced?0:160,30,30,28);this.moving=false});
          return;
        }
        this.forwardSteps++;this.pos++;
        if(this.forwardSteps===6)this.feedback('第六步。风里那一下停顿比前五步更长。下一步未必一定要继续向前。');
      }else{
        if(this.forwardSteps===6){
          this.broken=true;this.pos=Math.max(0,this.pos-1);
          bus.emit('observation','postman_loop');bus.emit('observation','postman_reverse');
          this.feedback('第六步后主动逆行。道路没有重置。海边第一次多出一小段没有走过的石板。',true);
        }else{
          this.forwardSteps=Math.max(0,this.forwardSteps-1);this.pos=Math.max(0,this.pos-1);
          this.feedback('你后退了，但循环规则还没有被逼到第七步之前。');
        }
      }
    }else{
      this.pos=Math.max(0,this.pos+dir);
    }
    const x=Math.min(w*.82,Math.max(w*.1,w*.12+this.pos*w*.065));
    this.tweens.add({targets:this.player,x,duration:this.state.reduced?0:160,onComplete:()=>{this.moving=false;if(this.broken&&this.pos>=10)this.arrive()}})
  }
  arrive(){
    if(this.state.completedMasks.includes('postman'))return;
    this.mailbox.setAlpha(1);this.feedback('第七封信终于能被放进一个不会重置的邮箱。',true);
    this.time.delayedCall(700,()=>this.finishMask('postman','res_xing',['postman_loop','postman_reverse'],'postman'))
  }
}
