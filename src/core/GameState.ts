export type SceneId='title'|'shop'|'secret'|'water'|'mayor'|'butcher'|'elaine'|'milo'|'postman'|'soren'|'blank'|'finale'|'endingA'|'endingB'|'endingC';
export type MaskId='mayor'|'butcher'|'elaine'|'milo'|'postman'|'soren'|'blank';
export interface Observation {id:string; title:string; text:string; group:string; linked?:boolean}
export interface GameState {
  version:4;
  started:boolean;
  scene:SceneId;
  playSeconds:number;
  mistakes:number;
  reduced:boolean;
  sound:boolean;
  prologue:{features:string[]; aligned:boolean; secret:boolean; mask:boolean; water:boolean};
  inventory:string[];
  completedMasks:MaskId[];
  residues:string[];
  observations:Observation[];
  linkedRelations:string[];
  shopChanges:string[];
  visitedShopCount:number;
  finalUnlocked:boolean;
  finalStations:string[];
  centerSolved:boolean;
  blankChoice?:{object:string;direction:string};
  ending?:'A'|'B'|'C';
  endingFlags:string[];
  hiddenSeen:string[];
  ngp:boolean;
  hints:Record<string,number>;
}
export const DEFAULT_STATE:GameState={
  version:4,started:false,scene:'title',playSeconds:0,mistakes:0,reduced:false,sound:true,
  prologue:{features:[],aligned:false,secret:false,mask:false,water:false},
  inventory:['scissors'],completedMasks:[],residues:[],observations:[],linkedRelations:[],shopChanges:[],visitedShopCount:0,
  finalUnlocked:false,finalStations:[],centerSolved:false,endingFlags:[],hiddenSeen:[],ngp:false,hints:{}
};
export function normalizeState(raw:any):GameState{
  const s:GameState=structuredClone(DEFAULT_STATE);
  if(!raw||typeof raw!=='object') return s;
  Object.assign(s,raw);
  s.version=4;
  s.prologue={...DEFAULT_STATE.prologue,...(raw.prologue||{})};
  for(const k of ['inventory','completedMasks','residues','observations','linkedRelations','shopChanges','finalStations','endingFlags','hiddenSeen'] as const){
    if(!Array.isArray((s as any)[k])) (s as any)[k]=[];
  }
  if(!s.hints||typeof s.hints!=='object'||Array.isArray(s.hints))s.hints={};
  return s;
}
