import {DEFAULT_STATE,GameState,normalizeState} from './GameState';
import {OBS} from '../data/gameData';
const KEY='mianmu-the-face-of-it-save-v4-ts';
const LEGACY=['mianmu-the-face-of-it-save-v6','mianmu-the-face-of-it-save-v5','mianmu-the-face-of-it-save-v4','mianmu-the-face-of-it-save-v3'];
export class SaveManager{
  load():GameState{
    try{
      const own=localStorage.getItem(KEY); if(own)return normalizeState(JSON.parse(own));
      for(const k of LEGACY){const v=localStorage.getItem(k);if(v){return this.migrate(JSON.parse(v))}}
    }catch(e){console.warn('[SaveManager] load fallback',e)}
    return structuredClone(DEFAULT_STATE);
  }
  save(s:GameState){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){console.warn('[SaveManager] save failed',e)}}
  reset(){const s=structuredClone(DEFAULT_STATE);this.save(s);return s}
  private migrate(old:any):GameState{
    const s=normalizeState(null);
    s.started=!!old.started;
    s.playSeconds=Number(old.playSeconds)||0;s.mistakes=Number(old.mistakes)||0;
    const p=old.prologue||{};s.prologue.features=Array.isArray(p.features)?p.features:[];s.prologue.aligned=!!p.aligned;s.prologue.secret=!!p.secret;s.prologue.mask=!!p.mask;s.prologue.water=!!p.water;
    const mapScene=(x:string)=>['shop','secret','water','mayor','butcher','elaine','milo','postman','soren','blank','finale'].includes(x)?x:'shop';
    s.scene=(s.started?mapScene(old.scene):'title') as any;
    const inv=Array.isArray(old.inventory)?old.inventory:Array.isArray(old.items)?old.items:[];
    s.inventory=inv.map((x:any)=>typeof x==='string'?x:x?.id).filter(Boolean);if(!s.inventory.includes('scissors'))s.inventory.push('scissors');
    const masks=[...(Array.isArray(old.masksDone)?old.masksDone:[]),...(Array.isArray(old.hiddenDone)?old.hiddenDone:[]),...(Array.isArray(old.completedMasks)?old.completedMasks:[])];
    s.completedMasks=[...new Set(masks)].filter((x:any)=>['mayor','butcher','elaine','milo','postman','soren','blank'].includes(x)) as any;
    s.residues=(Array.isArray(old.residues)?old.residues:[]).map((x:any)=>typeof x==='string'?x:x?.id).filter(Boolean);
    const obsIds=Array.isArray(old.observations)?old.observations.map((x:any)=>typeof x==='string'?x:x?.id).filter(Boolean):[];
    s.observations=obsIds.filter((id:string)=>OBS[id]).map((id:string)=>({id,...OBS[id]}));
    const links=Array.isArray(old.links)?old.links:[];s.linkedRelations=links.map((x:any)=>Array.isArray(x)?[x[0],x[1]].filter(Boolean).sort().join('|'):String(x)).filter((x:string)=>x.includes('|'));
    s.hints=(old.hints&&typeof old.hints==='object'&&!Array.isArray(old.hints))?{...old.hints}:{};
    s.finalStations=Array.isArray(old.finalStations)?old.finalStations:[];s.centerSolved=!!old.centerSolved;s.finalUnlocked=!!old.finalUnlocked||s.completedMasks.filter(x=>['mayor','butcher','elaine','milo','postman'].includes(x)).length===5;
    s.blankChoice=old.blankItem||old.blankDirection?{object:old.blankItem||'',direction:old.blankDirection||''}:undefined;
    s.reduced=!!old.reduced;s.sound=old.audio!==false;s.ending=old.ending||undefined;s.ngp=!!old.ngp;
    const hiddenMap:any={thread:'knot',lamp:'mark',chair:'chair',kettle:'kettle',stitch:'lining',door:'door',dollchip:'sawdust'};s.hiddenSeen=Array.isArray(old.shopChangesSeen)?old.shopChangesSeen.map((x:string)=>hiddenMap[x]||x):[];s.visitedShopCount=Math.min(7,Number(old.shopChangesAvailable)||0);
    this.save(s);return s;
  }
}
