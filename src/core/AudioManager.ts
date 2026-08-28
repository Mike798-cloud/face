export class AudioManager{
  private ctx:AudioContext|null=null; private amb:HTMLAudioElement|null=null; enabled=true;
  setEnabled(v:boolean){this.enabled=v;if(!v)this.stopAmbience()}
  ambience(name:'sea'|'shop'|'none'){
    if(!this.enabled||name==='none'){this.stopAmbience();return}
    const src=`assets/audio/${name}.wav`;
    if(this.amb?.dataset.src===src)return;
    this.stopAmbience(); const a=new Audio(src);a.loop=true;a.volume=.24;a.dataset.src=src;this.amb=a;a.play().catch(()=>{});
  }
  sfx(name:'clock'|'knock'|'glass'){if(!this.enabled)return;const a=new Audio(`assets/audio/${name}.wav`);a.volume=.42;a.play().catch(()=>{})}
  tone(freq=180,pan=0,duration=.18,gain=.08){if(!this.enabled)return;try{this.ctx??=new AudioContext();const o=this.ctx.createOscillator(),g=this.ctx.createGain();const p=this.ctx.createStereoPanner();o.frequency.value=freq;g.gain.value=gain;p.pan.value=Math.max(-1,Math.min(1,pan));o.connect(g).connect(p).connect(this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.stop(this.ctx.currentTime+duration)}catch{}}
  stopAmbience(){this.amb?.pause();this.amb=null}
}
export const audio=new AudioManager();
