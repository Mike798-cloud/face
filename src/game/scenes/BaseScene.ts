import {bus} from '../../core/EventBus';
import Phaser from 'phaser';
const P=Phaser;
export class BaseScene extends P.Scene{
  state:any; ui:any; store:any;
  constructor(key:string){super(key)}
  init(data:any){this.state=data.state;this.ui=data.ui;this.store=data.store}
  bg(file:string){const w=this.scale.width,h=this.scale.height;const img=this.add.image(w/2,h/2,'bg').setDisplaySize(w,h);img.setTint(0xded4c0);return img}
  loadSceneImage(file:string,key='bg'){if(!this.textures.exists(key))this.load.image(key,`assets/images/${file}?v=4-ts`)}
  makeZone(x:number,y:number,w:number,h:number,label:string,onTap:()=>void){const z=this.add.rectangle(x,y,w,h,0x15140f,.38).setStrokeStyle(1,0xc6ad7a,.78).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:'serif',fontSize:'15px',color:'#eadfc9',backgroundColor:'#1a1915aa',padding:{x:8,y:5}}).setOrigin(.5).setDepth(5);z.on('pointerover',()=>z.setFillStyle(0x403726,.58));z.on('pointerout',()=>z.setFillStyle(0x15140f,.38));z.on('pointerdown',onTap);return {z,t}}
  finishMask(id:string,residue:string,obs:string[],change:string){const fresh=!this.state.completedMasks.includes(id);if(fresh)this.state.completedMasks.push(id);if(fresh)this.state.visitedShopCount=Math.min(7,(this.state.visitedShopCount||0)+1);if(residue&&!this.state.residues.includes(residue))this.state.residues.push(residue);for(const o of obs)bus.emit('observation',o);if(change&&!this.state.shopChanges.includes(change))this.state.shopChanges.push(change);this.store.save();bus.emit('mask-finished',{id,fresh})}
  feedback(text:string,good=false){bus.emit('toast',{text,tone:good?'good':''})}
}
