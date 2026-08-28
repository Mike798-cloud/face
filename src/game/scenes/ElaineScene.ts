import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;

type ShardMeta = {
  id: string;
  feature: string;
  age: string;
  solved: boolean;
  inSlot: boolean;
  homeX: number;
  homeY: number;
};

type ShardContainer = Phaser.GameObjects.Container & { meta: ShardMeta };
export class ElaineScene extends BaseScene{
  focused:ShardContainer|null=null;
  constructor(){super('Elaine')}
  preload(){this.loadSceneImage('elaine.webp')}
  create(){
    const w=this.scale.width,h=this.scale.height;
    this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xd0c4b5);
    bus.emit('hint','十二块镜片都能拖、转、拼。不要拼出“最初的脸”；按跨年龄仍稳定的旧耳洞、烧伤和高音前两次吸气，让动作轮廓同步。轻点镜片或按“旋转90°”可旋转。');
    const features=['旧耳洞','烧伤','两次吸气'];
    const ages=['17岁','26岁','34岁','43岁'];
    const slots:any[]=[];
    ages.forEach((age,ri)=>features.forEach((feature,ci)=>{
      const x=w*(.45+ci*.18),y=h*(.27+ri*.14);
      const z=this.add.rectangle(x,y,w*.15,h*.1,0x141618,.35).setStrokeStyle(1,0xa99a86,.65);
      this.add.text(x,y-h*.04,ri===0?feature:'',{fontFamily:'serif',fontSize:'11px',color:'#d7c9b4'}).setOrigin(.5);
      this.add.text(x,y+h*.035,age,{fontFamily:'serif',fontSize:'10px',color:'#9e907c'}).setOrigin(.5);
      slots.push({x,y,feature,age,z});
    }));
    const solved=new Set<string>();
    const shards:ShardContainer[]=[];
    const attempt=(c:ShardContainer)=>{
      const m=c.meta;if(m.solved)return;
      let best:any=null,dist=1e9;
      for(const s of slots){const d=P.Math.Distance.Between(c.x,c.y,s.x,s.y);if(d<dist){dist=d;best=s}}
      if(!best||dist>w*.1||best.feature!==m.feature||best.age!==m.age){return false}
      c.x=best.x;c.y=best.y;m.inSlot=true;
      const norm=Math.abs(P.Math.Angle.WrapDegrees(c.angle));
      if(norm>12){best.z.setStrokeStyle(2,0x9c7b55);this.feedback(`${m.age}的${m.feature}位置对了，但镜片方向仍让动作轮廓错开。继续旋转。`);return false}
      m.solved=true;c.disableInteractive();best.z.setStrokeStyle(2,0x718064);solved.add(m.id);
      this.feedback(`${m.age}的${m.feature}与其它年龄阶段进入同一节律。`,true);
      if(solved.size===12){this.feedback('十二块镜片没有拼成一张原始脸，却让三个跨年龄动作完全同步。',true);this.time.delayedCall(1000,()=>this.finishMask('elaine','res_ting',['elaine_habit','elaine_face'],'elaine'))}
      return true;
    };
    ages.forEach((age,ri)=>features.forEach((feature,ci)=>{
      const i=ri*3+ci;const homeX=w*(.11+(i%3)*.1),homeY=h*(.22+Math.floor(i/3)*.18);
      const poly=this.add.polygon(0,0,[0,-32,38,-18,30,27,-8,35,-36,8],0x9aa6a2,.54).setStrokeStyle(2,0xd8d4c7,.7);
      const text=this.add.text(0,0,`${age}\n${feature}`,{fontFamily:'serif',fontSize:'10px',color:'#f0eadf',align:'center'}).setOrigin(.5);
      const c=this.add.container(homeX,homeY,[poly,text]) as ShardContainer;c.setSize(80,70).setInteractive({draggable:true,useHandCursor:true});this.input.setDraggable(c);
      c.angle=[90,180,270,0][i%4];c.meta={id:`${age}-${feature}`,feature,age,solved:false,inSlot:false,homeX,homeY};
      let moved=0;
      c.on('pointerdown',()=>{this.focused=c;moved=0});
      c.on('drag',(_:any,nx:number,ny:number)=>{moved++;c.x=nx;c.y=ny});
      c.on('pointerup',()=>{if(moved<2&&!c.meta.solved){c.angle=(c.angle+90)%360;attempt(c)}});
      c.on('dragend',()=>{if(!attempt(c)){let best:any=null,dist=1e9;for(const s of slots){const d=P.Math.Distance.Between(c.x,c.y,s.x,s.y);if(d<dist){dist=d;best=s}}if(best&&dist<w*.1&&best.feature===feature&&best.age===age){c.x=best.x;c.y=best.y;c.meta.inSlot=true}else{c.x=homeX;c.y=homeY;c.meta.inSlot=false;this.feedback('镜片靠近了，但动作轮廓没有同步。错误组合会自行错开，不弹红叉。')}}});
      shards.push(c);
    }));
    const rotateFocused=()=>{const c=this.focused||shards.find(x=>!x.meta.solved);if(c&&!c.meta.solved){c.angle=(c.angle+90)%360;attempt(c);this.feedback('镜片旋转了 90°。')}};
    this.input.keyboard?.on('keydown-R',rotateFocused);
    const off=bus.on('gesture',(g:any)=>{if(g==='rotate')rotateFocused()});this.events.once('shutdown',()=>off());
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
}
