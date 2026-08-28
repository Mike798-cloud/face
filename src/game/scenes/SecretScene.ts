import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class SecretScene extends BaseScene{
  constructor(){super('Secret')}
  preload(){this.loadSceneImage('secret-room.webp')}
  create(){const w=this.scale.width,h=this.scale.height;this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xc9bba4);bus.emit('hint',this.state.prologue.mask?'师父面具已经完成。去水底记忆里验证那句没有写完的话。':'七只玻璃罐保存的是功能，不是人格。先取得能承担“相貌 / 习惯 / 见证”的三件材料。');
    this.makeZone(w*.18,h*.34,w*.18,h*.28,'七只玻璃罐',()=>{bus.emit('observation','jars');this.feedback('罐中标签只有：见、辨、听、行、言、温与一只空白。',true)});
    this.makeZone(w*.78,h*.24,w*.18,h*.18,'旧工艺笔记',()=>{bus.emit('observation','master_rule');this.feedback('师父反复写着：习惯不能替代相貌，见证也不能替代习惯。',true)});
    this.makeZone(w*.24,h*.72,w*.16,h*.13,'半张旧面具',()=>this.take('halfmask','相貌材料被取下。纸浆表面保留师父长期佩戴后的纹理。'));
    this.makeZone(w*.51,h*.74,w*.16,h*.13,'反复拆开的黑线',()=>this.take('blackthread','黑线没有死结，只有一次次拆开的痕迹。'));
    this.makeZone(w*.77,h*.69,w*.16,h*.13,'童年刻痕木屑',()=>this.take('woodchip','木屑来自阿七小时候的身高刻痕——有人持续照顾过他。'));
    this.makeZone(w*.5,h*.45,w*.19,h*.14,'面具工作台',()=>this.openCraft());
    this.makeZone(w*.06,h*.1,w*.1,h*.08,'返回',()=>bus.emit('scene','shop'));
    if(this.state.prologue.mask)this.makeZone(w*.5,h*.9,w*.22,h*.08,'听见水下钟声',()=>bus.emit('scene','water'));
  }
  take(id:string,text:string){if(!this.state.inventory.includes(id))this.state.inventory.push(id);this.store.save();this.feedback(text,true)}
  openCraft(){if(this.state.prologue.mask){this.feedback('三种职责已经固定在内衬里。');return}
    const have=['halfmask','blackthread','woodchip'].filter(x=>this.state.inventory.includes(x));if(have.length<3){this.feedback('工作台有三个真实凹槽：相貌、习惯、见证。现在材料还不够。');return}
    const w=this.scale.width,h=this.scale.height;const overlay=this.add.container(0,0).setDepth(20);overlay.add(this.add.rectangle(w/2,h/2,w,h,0x090a08,.78));const panel=this.add.rectangle(w/2,h/2,w*.8,h*.62,0x30271c,.96).setStrokeStyle(2,0xa88c60);overlay.add(panel);overlay.add(this.add.text(w*.5,h*.23,'师父面具 · 三个职责凹槽',{fontFamily:'serif',fontSize:'24px',color:'#eadfc8'}).setOrigin(.5));
    const slots=[{id:'appearance',x:.3,label:'相貌',correct:'halfmask'},{id:'habit',x:.5,label:'习惯',correct:'blackthread'},{id:'witness',x:.7,label:'见证',correct:'woodchip'}];const placed:any={};let selectedItem='';const items:any={};const homes:any={};
    const place=(id:string,target:any,c:any)=>{for(const s of slots){if(placed[s.id]===id&&s.id!==target.id){delete placed[s.id];(s as any).zone.setStrokeStyle(2,0x7f6b4f)}}placed[target.id]=id;c.x=w*target.x;c.y=h*.52;if(id===target.correct){target.zone.setStrokeStyle(2,0x82936f);this.feedback(`${target.label}凹槽接受了这件材料。`,true)}else{target.zone.setStrokeStyle(2,0x8e5747);this.worldError(target.id)}selectedItem=''};
    for(const s of slots){const z=this.add.rectangle(w*s.x,h*.5,w*.16,h*.2,0x161612,.7).setStrokeStyle(2,0x7f6b4f).setInteractive();overlay.add(z);overlay.add(this.add.text(w*s.x,h*.39,s.label,{fontFamily:'serif',fontSize:'16px',color:'#d2bea0'}).setOrigin(.5));(s as any).zone=z;z.on('pointerdown',()=>{if(selectedItem){place(selectedItem,s,items[selectedItem])}else this.feedback(`${s.label}凹槽需要一件能承担“${s.label}”职责的材料。`)})}
    const names:any={halfmask:'半张旧面具',blackthread:'黑线',woodchip:'木屑'};have.forEach((id,i)=>{const home={x:w*(.32+i*.18),y:h*.76};homes[id]=home;const c=this.add.container(home.x,home.y);items[id]=c;c.add([this.add.rectangle(0,0,w*.15,h*.08,0x8d7959,.95).setStrokeStyle(1,0xe0c79c),this.add.text(0,0,names[id],{fontFamily:'serif',fontSize:'14px',color:'#17130e'}).setOrigin(.5)]);c.setSize(w*.15,h*.09).setInteractive({draggable:true});(c as any).item=id;this.input.setDraggable(c);c.on('pointerdown',()=>{selectedItem=id;this.feedback(`拿起：${names[id]}。可拖入凹槽，触屏也可再点一个凹槽。`)});c.on('drag',(_:any,x:number,y:number)=>{c.x=x;c.y=y});c.on('dragend',()=>{let target:any=null;for(const s of slots)if(P.Geom.Intersects.RectangleToRectangle(c.getBounds(),(s as any).zone.getBounds()))target=s;if(!target){c.x=home.x;c.y=home.y;return}place(id,target,c)});overlay.add(c)});
    const confirm=this.add.text(w*.5,h*.88,'缝合内衬',{fontFamily:'serif',fontSize:'18px',color:'#efe2c8',backgroundColor:'#3d3326',padding:{x:16,y:9}}).setOrigin(.5).setInteractive({useHandCursor:true});overlay.add(confirm);confirm.on('pointerdown',()=>{const ok=slots.every(s=>placed[s.id]===s.correct);if(!ok){this.state.mistakes++;this.store.save();this.worldError('all');return}this.state.prologue.mask=true;this.state.inventory=this.state.inventory.filter((x:string)=>!['halfmask','blackthread','woodchip'].includes(x));if(!this.state.inventory.includes('mastermask'))this.state.inventory.push('mastermask');this.store.save();this.feedback('纹理、嘴角与内衬依次固定。面具内部传来水下第三声钟。',true);overlay.destroy();this.scene.restart({state:this.state,ui:this.ui,store:this.store})});
    const close=this.add.text(w*.88,h*.19,'×',{fontFamily:'serif',fontSize:'28px',color:'#eadfc8'}).setInteractive();overlay.add(close);close.on('pointerdown',()=>overlay.destroy());
  }
  worldError(slot:string){const map:any={appearance:'面具长出一双陌生眼睛，又慢慢缩回去：这件东西不能承担“相貌”。',habit:'线自行打成死结：这件东西没有记录师父稳定的动作习惯。',witness:'内衬短暂消失：这件东西没有证明“有人持续见证过他”。',all:'面具三个部分彼此排斥。错误材料没有被消耗，但它们告诉你职责发生了混淆。'};this.feedback(map[slot]||map.all)}
}
