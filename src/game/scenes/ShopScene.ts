import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class ShopScene extends BaseScene{
  box:any;mirror:any;lamp:any;doll:any;scissors:any;chair:any; features=new Set<string>();
  constructor(){super('Shop')}
  preload(){this.loadSceneImage('mask-shop.webp')}
  create(){
    this.events.once('wake',()=>this.scene.restart({state:this.state,ui:this.ui,store:this.store}));
    const w=this.scale.width,h=this.scale.height;this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(this.state.completedMasks.length>=3?0xb9aa97:0xd9cdb7);
    this.features=new Set(this.state.prologue.features||[]);
    bus.emit('hint',this.state.prologue.aligned?'检查铺子：面具墙、账簿与旧镜会随着完成的面具发生变化。':'这间屋子会回应动作：拖木盒、关灯、旋转瓷娃娃、移动剪刀、拉出椅子。');
    if(!this.state.prologue.aligned){if(this.features.size===5)this.alignPhase(w,h);else this.prologue(w,h)}else this.hub(w,h);
  }
  prologue(w:number,h:number){
    this.mirror=this.add.rectangle(w*.73,h*.36,w*.17,h*.43,0x201d18,.12).setStrokeStyle(2,0xb59b6c,.55).setInteractive();
    this.add.text(w*.73,h*.12,'旧镜',{fontFamily:'serif',fontSize:'14px',color:'#d3c3a6'}).setOrigin(.5);
    this.box=this.add.container(w*.35,h*.58);const b=this.add.rectangle(0,0,w*.14,h*.13,0x6c543a,.88).setStrokeStyle(2,0x21180e);const bt=this.add.text(0,0,'空白木盒',{fontFamily:'serif',fontSize:'16px',color:'#efe2c7'}).setOrigin(.5);this.box.add([b,bt]);this.box.setSize(w*.14,h*.13).setInteractive({draggable:true,useHandCursor:true});this.input.setDraggable(this.box);
    this.box.on('drag',(_:any,x:number,y:number)=>{this.box.x=x;this.box.y=y});this.box.on('dragend',()=>{if(P.Geom.Intersects.RectangleToRectangle(this.box.getBounds(),this.mirror.getBounds())){this.mark('eye','镜中木盒先长出眼睛；现实木盒仍空白。');this.box.x=w*.35;this.box.y=h*.58}});
    this.lamp=this.makeZone(w*.16,h*.25,w*.11,h*.12,'工作灯',()=>{this.cameras.main.flash(100,20,20,18,false);this.mark('mouth','灯熄灭时盒面浮出嘴，镜中的阿七却没有嘴。')});
    this.doll=this.add.container(w*.55,h*.29);const d=this.add.rectangle(0,0,w*.09,h*.17,0x9c8b70,.76).setStrokeStyle(1,0x34291d);this.doll.add([d,this.add.text(0,0,'无脸\n瓷娃娃',{fontFamily:'serif',fontSize:'13px',align:'center',color:'#201b14'}).setOrigin(.5)]);this.doll.setSize(w*.09,h*.17).setInteractive({draggable:true});this.input.setDraggable(this.doll);let last=0,total=0;this.doll.on('dragstart',(p:any)=>{last=P.Math.RadToDeg(P.Math.Angle.Between(this.doll.x,this.doll.y,p.x,p.y));total=0});this.doll.on('drag',(p:any)=>{const a=P.Math.RadToDeg(P.Math.Angle.Between(this.doll.x,this.doll.y,p.x,p.y));let delta=P.Math.Angle.WrapDegrees(a-last);this.doll.angle+=delta;total+=Math.abs(delta);last=a;if(total>85)this.mark('ear','娃娃真正背对木盒后，耳朵才固定下来。')});
    this.scissors=this.add.container(w*.22,h*.72);const s=this.add.rectangle(0,0,w*.12,h*.045,0xb6aa94,.9).setStrokeStyle(1,0x4b4235);this.scissors.add([s,this.add.text(0,0,'裁布剪',{fontFamily:'serif',fontSize:'12px',color:'#241f19'}).setOrigin(.5)]);this.scissors.setSize(w*.12,h*.06).setInteractive({draggable:true});this.input.setDraggable(this.scissors);this.scissors.on('drag',(_:any,x:number,y:number)=>{this.scissors.x=x;this.scissors.y=y});this.scissors.on('dragend',()=>{if(P.Geom.Intersects.RectangleToRectangle(this.scissors.getBounds(),this.box.getBounds()))this.mark('nose','剪刀反光扫过盒面，鼻梁只在镜里成立。')});
    this.chair=this.add.container(w*.82,h*.73);const c=this.add.rectangle(0,0,w*.13,h*.12,0x4f3e2c,.83).setStrokeStyle(1,0x1b140d);this.chair.add([c,this.add.text(0,0,'师父椅子',{fontFamily:'serif',fontSize:'12px',color:'#e4d4b8'}).setOrigin(.5)]);this.chair.setSize(w*.13,h*.12).setInteractive({draggable:true});this.input.setDraggable(this.chair);let y0=this.chair.y;this.chair.on('drag',(_:any,x:number,y:number)=>{this.chair.y=P.Math.Clamp(y,y0-5,y0+100)});this.chair.on('dragend',()=>{if(this.chair.y-y0>55)this.mark('brow','椅子拉出后视线下降，盒沿与镜框重成一道眉线。');this.chair.y=y0});
    const offGesture=bus.on('gesture',(g:any)=>{if(g==='rotate'&&!this.features.has('ear')){this.doll.angle+=90;this.mark('ear','旋转替代：瓷娃娃背对木盒。')}if(g==='use'&&!this.features.has('nose'))this.mark('nose','点击替代：选中裁布剪后，确认让窄反光扫过木盒。')});this.events.once('shutdown',()=>offGesture());
    this.input.keyboard?.on('keydown-R',()=>{if(!this.features.has('ear')){this.doll.angle+=90;this.mark('ear','旋转替代：瓷娃娃背对木盒。')}});
  }
  mark(id:string,text:string){if(this.features.has(id))return;this.features.add(id);this.state.prologue.features=[...this.features];bus.emit('observation','box_eye');if(this.features.size>=3)bus.emit('observation','box_missing');this.store.save();this.feedback(text,true);if(this.features.size===5)this.scene.restart({state:this.state,ui:this.ui,store:this.store})}
  alignPhase(w:number,h:number){const target=this.add.rectangle(w*.79,h*.48,w*.16,h*.32,0x000000,0).setStrokeStyle(2,0xe2c98e,.5);this.add.text(w*.79,h*.28,'镜中右半脸',{fontFamily:'serif',fontSize:'13px',color:'#d7c6a6'}).setOrigin(.5);this.box?.destroy();const box=this.add.container(w*.31,h*.6);box.add([this.add.rectangle(0,0,w*.14,h*.13,0x6c543a,.9).setStrokeStyle(2,0xe5d0a4),this.add.text(0,0,'五官木盒',{fontFamily:'serif',fontSize:'14px',color:'#f2e5cd'}).setOrigin(.5)]);box.setSize(w*.14,h*.13).setInteractive({draggable:true});this.input.setDraggable(box);box.on('drag',(_:any,x:number,y:number)=>{box.x=x;box.y=y});box.on('dragend',()=>{if(P.Geom.Intersects.RectangleToRectangle(box.getBounds(),target.getBounds())){this.state.prologue.aligned=true;if(!this.state.inventory.includes('key'))this.state.inventory.push('key');this.store.save();this.feedback('木盒与镜中右半脸重合。锁舌在木头里面退开。',true);bus.emit('scene','secret')}});bus.emit('hint','五官已经出现。把完整木盒拖到镜中右半脸，让位置关系本身成为钥匙。')}
  hub(w:number,h:number){
    this.makeZone(w*.2,h*.45,w*.22,h*.34,'面具墙',()=>bus.emit('maskwall'));
    this.makeZone(w*.77,h*.35,w*.18,h*.28,'旧镜',()=>{if(this.state.shopChanges.includes('elaine')){bus.emit('observation','six_functions');this.feedback('镜像慢半拍。伊莲留下的同步规则现在能重新检查旧物。',true)}else this.feedback('镜面暂时只照出熟悉的铺子。')});
    const mainCount=this.state.completedMasks.filter((x:string)=>['mayor','butcher','elaine','milo','postman'].includes(x)).length;
    if(mainCount>=3)this.makeZone(w*.51,h*.18,w*.14,h*.1,'暗处铃绳',()=>bus.emit('mask','soren'));
    if(mainCount>=4)this.makeZone(w*.52,h*.68,w*.17,h*.12,'空白面具',()=>bus.emit('mask','blank'));
    if(this.state.finalUnlocked)this.makeZone(w*.48,h*.84,w*.22,h*.12,'工作台下的旧地板',()=>bus.emit('scene','finale'));
    if(this.state.shopChanges.includes('mayor'))this.makeZone(w*.12,h*.76,w*.16,h*.11,'盖章账簿',()=>{bus.emit('observation','mayor_father');this.feedback('账簿多了一层盖章版本，公开与私人叙事再次产生关系。',true)});
    this.hiddenChange(w,h);
  }
  hiddenChange(w:number,h:number){const seq=[['knot','拆开的死结',.32,.17],['mark','刻痕旁的小灯',.18,.58],['chair','归位的椅子',.83,.67],['kettle','添满的水壶',.68,.76],['lining','面具内侧的新线',.42,.42],['door','门板三声轻响',.9,.42],['sawdust','瓷娃娃旁的木屑',.58,.25]] as any[];const idx=Math.min(Math.max((this.state.visitedShopCount||0)-1,0),6);const [id,label,x,y]=seq[idx];if(!this.state.hiddenSeen.includes(id))this.makeZone(w*x,h*y,w*.12,h*.08,label,()=>{this.state.hiddenSeen.push(id);this.store.save();this.feedback('你记住了这个位置的变化。没有任何进度数字出现。',true)})}
}
