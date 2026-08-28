type Handler=(payload?:any)=>void;
export class EventBus{
  private map=new Map<string,Set<Handler>>();
  on(name:string,fn:Handler){if(!this.map.has(name))this.map.set(name,new Set());this.map.get(name)!.add(fn);return()=>this.off(name,fn)}
  off(name:string,fn:Handler){this.map.get(name)?.delete(fn)}
  emit(name:string,payload?:any){for(const fn of this.map.get(name)||[])try{fn(payload)}catch(e){console.error('[EventBus]',name,e)}}
}
export const bus=new EventBus();
