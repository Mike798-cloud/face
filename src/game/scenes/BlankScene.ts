import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class BlankScene extends BaseScene{
  held='';objects:any[]=[];directionBuilt=false;
  constructor(){super('Blank')}
  preload(){this.loadSceneImage('blank.webp')}
  create(){const w=this.scale.width,h=this.scale.height;this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xc7c1b3);this.add.rectangle(w/2,h/2,w,h,0xe8dfcf,.18);bus.emit('hint','这里第一次没有正确答案。走近或拿起一件物品，另外两件会远离。你可以反悔，直到真正带走一件。');
    const defs=[{id:'needle',label:'师父针线',desc:'继承工艺',x:.27},{id:'cloth',label:'母亲手帕',desc:'保留关系',x:.5},{id:'apron',label:'阿七围裙',desc:'承认自己的生活',x:.73}];defs.forEach((d,i)=>{const c=this.add.container(w*d.x,h*.48);c.add([this.add.rectangle(0,0,w*.16,h*.17,0xd6c5a8,.95).setStrokeStyle(1,0x554838),this.add.text(0,0,`${d.label}\n${d.desc}`,{fontFamily:'serif',fontSize:'13px',color:'#261f17',align:'center'}).setOrigin(.5)]);c.setSize(w*.16,h*.17).setInteractive({draggable:true,useHandCursor:true});this.input.setDraggable(c);(c as any).bid=d.id;(c as any).home=w*d.x;c.on('drag',(_:any,nx:number,ny:number)=>{c.x=nx;c.y=ny});c.on('dragend',()=>{if(c.y<h*.33){this.chooseObject(c)}else{c.x=(c as any).home;c.y=h*.48}});this.objects.push(c)});
    this.add.text(w*.5,h*.27,'把想带走的一件拖向自己。',{fontFamily:'serif',fontSize:'17px',color:'#3a3026'}).setOrigin(.5);
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
  chooseObject(c:any){this.held=c.bid;const w=this.scale.width,h=this.scale.height;c.x=w*.5;c.y=h*.28;for(const o of this.objects)if(o!==c){this.tweens.add({targets:o,x:o.x<w*.5?w*.05:w*.95,alpha:.42,duration:this.state.reduced?0:420})}this.feedback('空间稳定了一半。你仍然可以把它放回去；真正的选择发生在接下来要走的方向。',true);this.directionPhase()}
  directionPhase(){if(this.directionBuilt)return;this.directionBuilt=true;const w=this.scale.width,h=this.scale.height;const dirs=[{id:'shop',label:'回铺子',x:.18},{id:'sea',label:'走向海',x:.5},{id:'stay',label:'留在原地',x:.82}];dirs.forEach(d=>{const z=this.add.rectangle(w*d.x,h*.78,w*.22,h*.14,0x423729,.7).setStrokeStyle(1,0x8f7956).setInteractive();this.add.text(w*d.x,h*.78,d.label,{fontFamily:'serif',fontSize:'16px',color:'#eadfc8'}).setOrigin(.5);z.on('pointerdown',()=>{if(!this.held){this.feedback('先真正拿起一件东西。');return}this.state.blankChoice={object:this.held,direction:d.id};this.store.save();bus.emit('observation','blank_choice');bus.emit('observation','six_functions');this.feedback('没有判定音。这个选择只改变阿七之后说话的方式。',true);this.time.delayedCall(900,()=>this.finishMask('blank','res_blank',['blank_choice','six_functions'],'blank'))})})}
}
