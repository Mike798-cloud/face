import {BaseScene} from './BaseScene';
import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class FinaleScene extends BaseScene{
  selected:string[]=[]; station='';
  constructor(){super('Finale')}
  preload(){this.loadSceneImage('finale.webp')}
  create(){const w=this.scale.width,h=this.scale.height;this.add.image(w/2,h/2,'bg').setDisplaySize(w,h).setTint(0xc2b59d);bus.emit('hint',this.state.finalStations.length===3&&!this.state.centerSolved?'三站已经“完成”，但透明残响拒绝进入任何验证台。场景中央有一个没有标签的黑色空位。':'三座验证台可任意顺序。把残响亲手拖进验证台；错误配对只产生单一反应，不扣分。');
    const stationDefs=[{id:'mirror',label:'复写镜',pair:['res_jian','res_bian'],x:.25,desc:'见 + 辨'},{id:'rhythm',label:'节律槽',pair:['res_ting','res_xing'],x:.5,desc:'听 + 行'},{id:'warm',label:'温声台',pair:['res_yan','res_wen'],x:.75,desc:'言 + 温'}];const zones:any={};const residueNodes:any={};let tapResidue='';
    const addResidue=(target:string,rid:string)=>{if(this.state.finalStations.includes(target)){this.feedback('这座验证台已经稳定，不需要再次归类。');return}if(this.station!==target)this.selected=[];this.station=target;if(!this.selected.includes(rid)){if(this.selected.length>=2)this.selected.shift();this.selected.push(rid)}const c=residueNodes[rid];if(c){c.x=(zones[target] as any).x+(this.selected.length===1?-38:38);c.y=(zones[target] as any).y+55}tapResidue='';this.feedback(`已放入 ${this.selected.length}/2 份残响。`);if(this.selected.length===2)this.tryStation(stationDefs.find(s=>s.id===target)!,zones[target])};
    stationDefs.forEach(s=>{const done=this.state.finalStations.includes(s.id);const z=this.add.rectangle(w*s.x,h*.36,w*.2,h*.28,done?0x40513c:0x2b251e,.83).setStrokeStyle(2,done?0x879b79:0xb09466).setInteractive();zones[s.id]=z;this.add.text(w*s.x,h*.28,`${s.label}\n${s.desc}`,{fontFamily:'serif',fontSize:'17px',color:'#eadfc9',align:'center'}).setOrigin(.5);z.on('pointerdown',()=>{if(tapResidue){addResidue(s.id,tapResidue)}else{this.station=s.id;this.selected=[];this.feedback(`${s.label}已准备。选择或拖入两份残响。`)}})});
    const residues=this.availableResidues();residues.forEach((r:any,i)=>{const x=w*(.15+(i%3)*.35),y=h*(.66+Math.floor(i/3)*.13);const c=this.add.container(x,y);residueNodes[r.id]=c;c.add([this.add.rectangle(0,0,w*.24,h*.08,0xd7c5a6,.94).setStrokeStyle(1,0x493929),this.add.text(0,0,r.label,{fontFamily:'serif',fontSize:'12px',color:'#221a12'}).setOrigin(.5)]);c.setSize(w*.24,h*.08).setInteractive({draggable:true});this.input.setDraggable(c);(c as any).rid=r.id;(c as any).home={x,y};c.on('pointerdown',()=>{tapResidue=r.id;this.feedback(`拿起：${r.label}。可以拖入验证台，触屏也可以再点验证台。`)});c.on('drag',(_:any,nx:number,ny:number)=>{c.x=nx;c.y=ny});c.on('dragend',()=>{let target='';for(const [id,z] of Object.entries(zones))if(P.Geom.Intersects.RectangleToRectangle(c.getBounds(),(z as any).getBounds()))target=id;if(!target){c.x=x;c.y=y;return}addResidue(target,r.id)})});
    if(this.state.finalStations.length===3&&!this.state.centerSolved)this.wrongCompletion(w,h,zones);
    this.makeZone(w*.07,h*.08,w*.1,h*.07,'返回',()=>bus.emit('scene','shop'));
  }
  availableResidues(){const labels:any={res_jian:'见 · 眼睛',res_bian:'辨 · 鼻子',res_ting:'听 · 耳朵',res_xing:'行 · 眉毛',res_yan:'言 · 嘴唇',res_wen:'温 · 脸颊',res_blank:'未定形 · 透明残响'};const list=['res_jian','res_bian','res_ting','res_xing','res_yan'];list.push(this.state.residues.includes('res_wen')?'res_wen':'res_wen_proxy');return list.map(id=>({id,label:id==='res_wen_proxy'?'温 · 师父面具内衬':labels[id]}))}
  tryStation(def:any,zone:any){if(this.state.finalStations.includes(def.id)){this.feedback('这座验证台已经稳定，不需要再次归类。');return}const normalized=this.selected.map(x=>x==='res_wen_proxy'?'res_wen':x).sort();const ok=[...def.pair].sort().every((x,i)=>x===normalized[i]);if(!ok){this.state.mistakes++;this.store.save();const partial=this.selected.some(x=>def.pair.includes(x==='res_wen_proxy'?'res_wen':x));this.feedback(partial?'验证台只产生了一半反应：有轮廓却没有第二层墨迹 / 有节奏却仍重置 / 有声音却没有接收者。':'两份残响彼此没有形成同一类物理关系。');this.selected=[];return}
    if(def.id==='rhythm'){this.rhythmMini(def,zone);return}if(def.id==='mirror'){this.mirrorMini(def,zone);return}if(def.id==='warm'){this.warmMini(def,zone);return}}
  mirrorMini(def:any,zone:any){this.feedback('复写镜已经出现稳定轮廓。现在亲手移动镜面，让被遮住的第二层墨迹显出来。');let moved=0;zone.on('pointermove',(p:any)=>{if(p.isDown){moved++;zone.setAngle(P.Math.Clamp((p.x-zone.x)/8,-8,8));if(moved>12)this.stationDone(def.id)}})}
  rhythmMini(def:any,zone:any){this.feedback('节律槽开始重复。需要六次正向后，主动逆转一次。');let count=0;let reverse=false;const on=(p:any)=>{if(p.rightButtonDown?.()){if(count>=6)reverse=true}else count++;this.feedback(`节律：${count} 正${reverse?' + 1 逆':''}`);if(count>=6&&reverse){zone.off('pointerdown',on);this.stationDone(def.id)}};zone.on('pointerdown',on);bus.emit('hint','节律槽：点击验证台六次形成正向节拍，再用“旋转90°”替代按钮触发一次逆转。');const off=bus.on('gesture',(g:any)=>{if(g==='rotate'&&count>=6){reverse=true;off();this.stationDone(def.id)}});this.events.once('shutdown',()=>off())}
  warmMini(def:any,zone:any){this.feedback('嘴唇残响正在循环同一句话。按住验证台让它停止，再松手让“温”靠近。');let held=0;zone.on('pointerdown',()=>{held=performance.now()});zone.on('pointerup',()=>{if(performance.now()-held>500)this.stationDone(def.id);else this.feedback('话语还没结束。需要让循环真正停下来。')})}
  stationDone(id:string){if(this.state.finalStations.includes(id))return;this.state.finalStations.push(id);this.store.save();this.feedback('这座验证台形成了完整的双重反应。',true);this.time.delayedCall(700,()=>this.scene.restart({state:this.state,ui:this.ui,store:this.store}))}
  solveCenter(mother:any,blank:any){if(this.state.centerSolved)return;this.state.centerSolved=true;blank.disableInteractive?.();this.store.save();mother.setText('完整的脸从中间裂开。\n镜后只剩一句：不要替他定型。');this.feedback('反转不是一段解释，而是你亲手拒绝把“未定形”塞进任何类别。',true);this.time.delayedCall(1600,()=>bus.emit('endingStart'))}
  wrongCompletion(w:number,h:number,zones:any){
    const mother=this.add.text(w*.5,h*.17,'三层投影叠成一张完整的母亲面孔。\n它看上去“完成”得过分。',{fontFamily:'serif',fontSize:'18px',color:'#e9deca',align:'center',backgroundColor:'#14130fbb',padding:{x:14,y:9}}).setOrigin(.5).setDepth(12);
    const center=this.add.rectangle(w*.5,h*.46,w*.15,h*.16,0x050505,.96).setStrokeStyle(0).setAlpha(.48).setInteractive();let blankTap=false;
    bus.emit('hint','三站都成功了。先观察这张“过分完整”的脸。不要急着把任何东西继续塞进验证台。');
    this.time.delayedCall(15000,()=>{
      if(this.state.centerSolved)return;
      const blank=this.add.container(w*.5,h*.63).setDepth(15);
      blank.add([this.add.rectangle(0,0,w*.23,h*.09,0xe5e0d3,.62).setStrokeStyle(1,0xffffff,.7),this.add.text(0,0,'未定形 · 透明残响',{fontFamily:'serif',fontSize:'13px',color:'#312b23'}).setOrigin(.5)]);
      blank.setSize(w*.23,h*.09).setInteractive({draggable:true});this.input.setDraggable(blank);blank.on('pointerdown',()=>{blankTap=true;this.feedback('拿起透明残响。它不属于任何有标签的验证台。')});center.on('pointerdown',()=>{if(blankTap)this.solveCenter(mother,blank)});
      this.feedback('十五秒后，透明残响开始躁动。它似乎没有自己的验证台。');
      blank.on('drag',(_:any,nx:number,ny:number)=>{blank.x=nx;blank.y=ny});
      blank.on('dragend',()=>{
        for(const z of Object.values(zones))if(P.Geom.Intersects.RectangleToRectangle(blank.getBounds(),(z as any).getBounds())){blank.x=w*.5;blank.y=h*.63;blank.setAlpha(.25);this.time.delayedCall(180,()=>blank.setAlpha(1));this.feedback('透明残响一碰验证台就变黑，然后弹回手中。它拒绝被归类。');return}
        if(P.Geom.Intersects.RectangleToRectangle(blank.getBounds(),center.getBounds())){this.solveCenter(mother,blank)}else{blank.x=w*.5;blank.y=h*.63}
      });
      bus.emit('hint','透明残响拒绝所有有标签的验证台。场景中央那个没有标签的黑色空位也许不是“第四座台”。');
    });
  }
}
