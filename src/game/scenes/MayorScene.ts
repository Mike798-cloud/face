import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class MayorScene extends BaseScene{
  constructor(){super('Mayor')}
  preload(){this.loadSceneImage('mayor.webp')}
  create(){
    const w=this.scale.width,h=this.scale.height;
    this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xd4c6ad);
    this.add.rectangle(w*.25,h*.49,w*.46,h*.68,0x191a17,.28).setStrokeStyle(1,0xb4a176,.6);
    this.add.rectangle(w*.75,h*.49,w*.46,h*.68,0x2a2118,.3).setStrokeStyle(1,0xb4a176,.6);
    this.add.text(w*.25,h*.12,'公开演讲厅',{fontFamily:'serif',fontSize:'20px',color:'#eadfc9'}).setOrigin(.5);
    this.add.text(w*.75,h*.12,'私人办公室',{fontFamily:'serif',fontSize:'20px',color:'#eadfc9'}).setOrigin(.5);
    bus.emit('hint','六张句卡都能翻面。不要判断“好人 / 坏人”；把能同时经得起公开场景和私人痕迹的三张卡翻到可验证的一面，再拖上讲台。');

    const cards=[
      {id:'a',front:'孤儿院预算按季度列支。',back:'拖到下季也不会有人追问。'},
      {id:'b',front:'孤儿院修缮款已按程序拨付。',back:'我让秘书绕过流程，当晚先付了工钱。'},
      {id:'c',front:'父亲从未影响我的公共判断。',back:'他的失业让我厌恶所有临时工。'},
      {id:'d',front:'采购一直交由委员会决定。',back:'我记不住那些商号，只记得盖章顺序。'},
      {id:'e',front:'我从不为亲属企业开例外。',back:'父亲失业后，我签下那份承包单。'},
      {id:'f',front:'审批从不迟于规定时间。',back:'那一次我提前两天，因为屋顶正在漏。'}
    ];
    const slots=[w*.42,w*.5,w*.58].map((x,i)=>{
      const z=this.add.rectangle(x,h*.3,w*.13,h*.1,0x6e5938,.76).setStrokeStyle(1,0xd1b77e);
      this.add.text(x,h*.3,`讲台 ${i+1}`,{fontFamily:'serif',fontSize:'12px',color:'#f2e5cd'}).setOrigin(.5);
      return z;
    });
    const placed=['','',''];
    const cardSlot:Record<string,number>={};
    const cardFace:Record<string,'front'|'back'>={};

    cards.forEach((c,i)=>{
      const homeX=w*(.12+(i%3)*.25),homeY=h*(.55+Math.floor(i/3)*.16);
      const ctr=this.add.container(homeX,homeY);
      const paper=this.add.rectangle(0,0,w*.2,h*.11,0xdbc8a5,.96).setStrokeStyle(1,0x4c3c2c);
      const tx=this.add.text(0,0,c.front,{fontFamily:'serif',fontSize:'12px',color:'#221b13',wordWrap:{width:w*.18},align:'center'}).setOrigin(.5);
      ctr.add([paper,tx]);ctr.setSize(w*.2,h*.11).setInteractive({draggable:true,useHandCursor:true});this.input.setDraggable(ctr);
      cardFace[c.id]='front';let moved=0;
      ctr.on('dragstart',()=>moved=0);
      ctr.on('drag',(_:any,nx:number,ny:number)=>{moved++;ctr.x=nx;ctr.y=ny});
      ctr.on('pointerup',()=>{
        if(moved>=2)return;
        cardFace[c.id]=cardFace[c.id]==='front'?'back':'front';
        tx.setText(cardFace[c.id]==='back'?c.back:c.front);
        paper.setFillStyle(cardFace[c.id]==='back'?0xb9a789:0xdbc8a5);
        this.sceneReaction(c.id,cardFace[c.id]);
      });
      ctr.on('dragend',()=>{
        let hit=-1;slots.forEach((z,si)=>{if(P.Geom.Intersects.RectangleToRectangle(ctr.getBounds(),z.getBounds()))hit=si});
        if(hit<0){const prior=cardSlot[c.id];if(prior!=null){ctr.x=slots[prior].x;ctr.y=slots[prior].y}else{ctr.x=homeX;ctr.y=homeY}return}
        const occupant=placed[hit];
        if(occupant&&occupant!==c.id){this.feedback('讲台这个位置已经有一张卡。先把原卡拖走或换到别处。');const prior=cardSlot[c.id];if(prior!=null){ctr.x=slots[prior].x;ctr.y=slots[prior].y}else{ctr.x=homeX;ctr.y=homeY}return}
        const prior=cardSlot[c.id];if(prior!=null&&prior!==hit)placed[prior]='';
        placed[hit]=c.id;cardSlot[c.id]=hit;ctr.x=slots[hit].x;ctr.y=slots[hit].y;this.sceneReaction(c.id,cardFace[c.id]);
      });
    });

    const check=this.add.text(w*.82,h*.86,'对照两边',{fontFamily:'serif',fontSize:'17px',color:'#efe3ca',backgroundColor:'#3a3024',padding:{x:16,y:10}}).setOrigin(.5).setInteractive();
    check.on('pointerdown',()=>{
      const chosen=placed.filter(Boolean);
      const exact=['b','e','f'].every(x=>chosen.includes(x))&&chosen.length===3;
      const flipped=['b','e','f'].every(x=>cardFace[x]==='back');
      if(exact&&flipped){
        this.feedback('两个半房间第一次不再互相否定。绕开程序、父亲失业与提前审批同时留下了可验证后果。',true);
        this.time.delayedCall(900,()=>this.finishMask('mayor','res_bian',['mayor_public','mayor_father'],'mayor'))
      }else{
        this.state.mistakes++;this.store.save();this.cameras.main.shake(180,.0025);
        this.feedback(exact?'三张卡选对了，但至少一张还停留在公开话术那一面。翻到能被私人痕迹验证的一面。':'讲台左侧与办公室右侧出现了具体矛盾。不是所有“坦白”都能被物证支撑。')
      }
    });
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
  sceneReaction(id:string,face:'front'|'back'){
    const map:any={b:'办公室账簿里一页日期突然与讲台投影重合。',e:'墙上父亲的旧工牌被阴影切成两半。',f:'两边的时钟短暂走到同一分钟。'};
    if(map[id]&&face==='back')this.feedback(map[id],true);else this.feedback('这句话改变了其中一边，但另一个房间没有给出同样强度的回应。')
  }
}
