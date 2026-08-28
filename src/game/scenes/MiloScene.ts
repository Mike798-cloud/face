import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class MiloScene extends BaseScene{
  monsterMode=false;
  constructor(){super('Milo')}
  preload(){this.load.image('reality','assets/images/mask-shop.webp?v=4-ts');this.load.image('monster','assets/images/milo.webp?v=4-ts')}
  create(){
    const w=this.scale.width,h=this.scale.height;
    const reality=this.add.image(w/2,h/2,'reality').setDisplaySize(w,h);
    const monster=this.add.image(w/2,h/2,'monster').setDisplaySize(w,h).setAlpha(0);
    bus.emit('hint','戴上孩子面具不会把你传送到另一个房间。同一位置会出现兽形解释。切换观察，再把现实物件搬到对应怪物附近。手机可先点物件，再点怪物。');
    const monsterLabels:any[]=[];
    const toggle=this.add.text(w*.5,h*.09,'戴 / 摘孩子面具',{fontFamily:'serif',fontSize:'17px',color:'#eee1c9',backgroundColor:'#31291fdd',padding:{x:15,y:9}}).setOrigin(.5).setInteractive();
    const setMode=()=>{
      this.monsterMode=!this.monsterMode;
      this.tweens.add({targets:monster,alpha:this.monsterMode?1:0,duration:this.state.reduced?0:280});
      this.tweens.add({targets:reality,alpha:this.monsterMode?.2:1,duration:this.state.reduced?0:280});
      monsterLabels.forEach(x=>x.setAlpha(this.monsterMode?1:0));
      this.feedback(this.monsterMode?'家具没有移动，但父亲、母亲与门口的人被解释成兽形。':'兽形退去，现实物件仍在原坐标。');
    };
    toggle.on('pointerdown',setMode);
    const pairs=[
      {id:'medicine',label:'药盒',monster:'喘息兽',tx:.72,ty:.35,desc:'父亲的病弱'},
      {id:'thread',label:'绷紧的线团',monster:'尖耳兽',tx:.56,ty:.6,desc:'母亲的紧张'},
      {id:'tie',label:'旧领带',monster:'换皮兽',tx:.82,ty:.72,desc:'门口不断整理领带的人'}
    ];
    let solved=0;let tapSelected:any=null;
    const items:any={};
    const place=(p:any,c:any,target:any,home:any)=>{
      if((c as any).solved)return;
      if(!this.monsterMode){c.x=home.x;c.y=home.y;this.feedback('现实层看不见怪物的对应关系。先改变观察规则。');return}
      const targetId=(target as any).targetId;
      if(targetId===p.id){
        (c as any).solved=true;c.disableInteractive();c.x=target.x;c.y=target.y;target.setStrokeStyle(2,0x718064);solved++;tapSelected=null;
        this.feedback(`${p.label}与${p.monster}占据同一关系位置：${p.desc}没有消失，只是被孩子重新命名。`,true);
        if(solved===3){bus.emit('observation','milo_monster');bus.emit('observation','milo_fear');this.time.delayedCall(1000,()=>this.finishMask('milo','res_jian',['milo_monster','milo_fear'],'milo'))}
      }else{c.x=home.x;c.y=home.y;this.feedback('这件现实物没有让眼前这只怪物安静下来。它们并不占据同一种关系位置。')}
    };
    pairs.forEach((p,i)=>{
      const x=w*.14,y=h*(.32+i*.18),home={x,y};
      const c=this.add.container(x,y);
      c.add([this.add.rectangle(0,0,w*.16,h*.09,0xd6c7ac,.94).setStrokeStyle(1,0x413426),this.add.text(0,0,p.label,{fontFamily:'serif',fontSize:'13px',color:'#231c14'}).setOrigin(.5)]);
      c.setSize(w*.16,h*.09).setInteractive({draggable:true});this.input.setDraggable(c);items[p.id]=c;
      c.on('pointerdown',()=>{if(!(c as any).solved){tapSelected=p;this.feedback(`拿起：${p.label}。可以拖动，也可以直接点对应怪物。`)}});
      c.on('drag',(_:any,nx:number,ny:number)=>{c.x=nx;c.y=ny});
      const target=this.add.rectangle(w*p.tx,h*p.ty,w*.14,h*.12,0x151613,.18).setStrokeStyle(1,0xd1bd98,.45).setInteractive();(target as any).targetId=p.id;
      const targetLabel=this.add.text(w*p.tx,h*p.ty,p.monster,{fontFamily:'serif',fontSize:'12px',color:'#eadfc9',backgroundColor:'#14151199',padding:{x:6,y:4}}).setOrigin(.5).setAlpha(0);monsterLabels.push(targetLabel);
      target.on('pointerdown',()=>{if(tapSelected){const chosen=items[tapSelected.id];place(tapSelected,chosen,target,{x:w*.14,y:h*(.32+pairs.findIndex(x=>x.id===tapSelected.id)*.18)})}});
      c.on('dragend',()=>{if(P.Geom.Intersects.RectangleToRectangle(c.getBounds(),target.getBounds()))place(p,c,target,home);else{c.x=home.x;c.y=home.y}});
    });
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
}
