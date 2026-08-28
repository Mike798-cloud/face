import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class ButcherScene extends BaseScene{
  constructor(){super('Butcher')}
  preload(){this.loadSceneImage('butcher.webp')}
  create(){
    const w=this.scale.width,h=this.scale.height;
    this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xc6b69e);
    bus.emit('hint','六份档案，七把椅子。把每只动物拖到符合食物、恐惧与座位习惯的位置；错误时它会用行为拒绝。触屏可先点档案，再点座位。');
    const pigs=[
      {id:'p1',name:'17号 · 奥拉',log:'怕铃声；只吃苹果；出生最早',seat:'s4'},
      {id:'p2',name:'22号 · 埃姆',log:'不碰苹果；喜欢黑面包；怕风',seat:'s1'},
      {id:'p3',name:'31号 · 鲁卡',log:'只在靠墙位置吃饭；喜欢胡萝卜',seat:'s6'},
      {id:'p4',name:'36号 · 诺德',log:'怕烛火；喜欢牛奶',seat:'s2'},
      {id:'p5',name:'41号 · 费恩',log:'喜欢盐煮土豆；必须面对门',seat:'s5'},
      {id:'p6',name:'52号 · 克拉',log:'只吃燕麦；总坐在17号旁边',seat:'s3'}
    ];
    const seatDefs=[['s1','黑面包 · 靠窗'],['s2','牛奶 · 远离烛台'],['s3','燕麦 · 17号右侧'],['s4','苹果 · 最旧名牌'],['s5','盐土豆 · 面向门'],['s6','胡萝卜 · 靠墙']];
    const zones:any={},assigned:any={},items:any={},homes:any={};let selected:any=null;
    const reason=(target:string,pid:string)=>target==='s4'&&pid==='p2'?'它闻到苹果就后退。':target==='s2'?'它不断回头躲避烛光。':'它把盘子向外推开，座位习惯至少有一项不符。';
    const place=(p:any,c:any,target:string)=>{
      for(const [pid,seat] of Object.entries(assigned))if(pid===p.id&&seat!==target)delete assigned[pid];
      assigned[p.id]=target;c.x=zones[target].x;c.y=zones[target].y;selected=null;
      if(target===p.seat){zones[target].setStrokeStyle(2,0x718064);this.feedback(`${p.name}低头开始进食。`,true)}
      else{zones[target].setStrokeStyle(2,0x8c5f4d);this.feedback(reason(target,p.id))}
    };
    seatDefs.forEach((s:any,i)=>{
      const x=w*(.42+(i%3)*.2),y=h*(.34+Math.floor(i/3)*.25);
      const z=this.add.rectangle(x,y,w*.17,h*.16,0x2b241c,.7).setStrokeStyle(1,0xb89b69).setInteractive();zones[s[0]]=z;
      this.add.text(x,y-h*.065,s[1],{fontFamily:'serif',fontSize:'12px',color:'#dfceb2',align:'center'}).setOrigin(.5);this.add.text(x,y+h*.035,'空位',{fontFamily:'serif',fontSize:'11px',color:'#8f806b'}).setOrigin(.5);
      z.on('pointerdown',()=>{if(selected)place(selected,items[selected.id],s[0]);else this.feedback('先拿起一份动物档案，再观察它是否接受这个位置。')});
    });
    pigs.forEach((p:any,i)=>{
      const home={x:w*.15,y:h*(.2+i*.105)};homes[p.id]=home;
      const c=this.add.container(home.x,home.y);items[p.id]=c;
      c.add([this.add.rectangle(0,0,w*.24,h*.078,0xd1bea0,.96).setStrokeStyle(1,0x4a3827),this.add.text(0,0,`${p.name}\n${p.log}`,{fontFamily:'serif',fontSize:'11px',color:'#211a13',align:'center',wordWrap:{width:w*.22}}).setOrigin(.5)]);
      c.setSize(w*.24,h*.08).setInteractive({draggable:true});this.input.setDraggable(c);
      c.on('pointerdown',()=>{selected=p;this.feedback(`拿起 ${p.name} 的档案。可以拖动，也可以直接点一个座位。`)});
      c.on('drag',(_:any,nx:number,ny:number)=>{c.x=nx;c.y=ny});
      c.on('dragend',()=>{let target='';for(const [id,z] of Object.entries(zones))if(P.Geom.Intersects.RectangleToRectangle(c.getBounds(),(z as any).getBounds()))target=id;if(!target){const old=assigned[p.id];if(old){c.x=zones[old].x;c.y=zones[old].y}else{c.x=home.x;c.y=home.y}return}place(p,c,target)});
    });
    const seventh=this.add.container(w*.73,h*.79);seventh.add([this.add.rectangle(0,0,w*.17,h*.12,0x4b3728,.9).setStrokeStyle(2,0x7e6a4e),this.add.text(0,0,'第七把椅子',{fontFamily:'serif',fontSize:'14px',color:'#eadbc1'}).setOrigin(.5)]);seventh.setSize(w*.17,h*.12).setInteractive({draggable:true});this.input.setDraggable(seventh);let sx=seventh.x;
    const finishChair=()=>{const all=pigs.every((p:any)=>assigned[p.id]===p.seat);if(!all){seventh.x=sx;this.feedback('第七把椅子纹丝不动。还有动物没有真正接受自己的位置。');return}this.feedback('椅子被亲手拉出。格伦脱下围裙，第一次坐在自己安排的告别里。',true);this.time.delayedCall(900,()=>this.finishMask('butcher','res_yan',['butcher_six','butcher_sender'],'butcher'))};
    seventh.on('drag',(_:any,nx:number)=>{seventh.x=P.Math.Clamp(nx,sx-160,sx+20)});seventh.on('dragend',()=>{if(sx-seventh.x>80)finishChair();else{seventh.x=sx;this.feedback('椅子动了一点，但你还没有真正替送行者留出位置。')}});
    const off=bus.on('gesture',(g:any)=>{if(g==='use'){const all=pigs.every((p:any)=>assigned[p.id]===p.seat);if(all){seventh.x=sx-100;finishChair()}}});this.events.once('shutdown',()=>off());
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
}
