(function(){
'use strict';
class OfficeAudio{
 constructor(){this.ctx=null;this.muted=false;this.running=false;this.next=0;this.beat=0;this.lastHit=0;this.lastFire=0;this.loop=setInterval(()=>this.schedule(),80);}
 activate(){if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.24;this.master.connect(this.ctx.destination);this.music=this.ctx.createGain();this.music.gain.value=.46;this.music.connect(this.master);}this.ctx.resume();}
 setRunning(v){this.running=v;if(this.ctx){this.music.gain.setTargetAtTime(v?.46:0,this.ctx.currentTime,.035);if(v)this.next=this.ctx.currentTime+.04;}}
 toggle(){this.muted=!this.muted;if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.24,this.ctx.currentTime,.025);return this.muted;}
 note(freq,time,duration=.12,type='triangle',volume=.3,dest=this.master,slide=0){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),time+duration);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.001,time+duration);o.connect(g);g.connect(dest);o.start(time);o.stop(time+duration+.025);o.onended=()=>{o.disconnect();g.disconnect();};}
 noise(time,duration,volume,dest=this.master,filter=1700){if(!this.ctx)return;const buf=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*duration),this.ctx.sampleRate);const a=buf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1);const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();s.buffer=buf;f.type='lowpass';f.frequency.value=filter;g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.001,time+duration);s.connect(f);f.connect(g);g.connect(dest);s.start(time);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
 play(event){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;switch(event){
 case 'plant':this.note(330,t,.1,'triangle',.5);this.note(660,t+.07,.18,'sine',.4);break;
 case 'shovel':this.noise(t,.16,.3,this.master,1100);this.note(160,t,.14,'triangle',.35,undefined,80);break;
 case 'fire':if(t-this.lastFire<.065)return;this.lastFire=t;this.note(160,t,.09,'square',.1,undefined,75);break;
 case 'hit':if(t-this.lastHit<.055)return;this.lastHit=t;this.noise(t,.045,.13,this.master,1800);break;
 case 'explosion':this.noise(t,.55,.65,this.master,850);this.note(110,t,.5,'triangle',.7,undefined,30);break;
 case 'warning':[220,220,293,293,330].forEach((f,i)=>this.note(f,t+i*.13,.18,'square',.15));break;
 case 'income':this.note(659,t,.1,'sine',.35);this.note(880,t+.07,.2,'sine',.3);break;
 case 'leave':[392,523,659,784].forEach((f,i)=>this.note(f,t+i*.1,.3,'triangle',.45));break;
 case 'return':this.note(740,t,.2,'sine',.3,undefined,220);break;
 case 'armed':this.note(880,t,.1,'sine',.2);break;
 case 'win':[523,659,784,1047,784,1047].forEach((f,i)=>this.note(f,t+i*.15,.3,'triangle',.5));break;
 case 'lose':[392,349,294,196].forEach((f,i)=>this.note(f,t+i*.2,.4,'triangle',.5));break;
 case 'reject':this.note(130,t,.15,'triangle',.4);break;
 }}
 schedule(){if(!this.ctx||!this.running||this.ctx.state!=='running')return;const now=this.ctx.currentTime;if(this.next<now)this.next=now+.03;const beatDuration=60/96;
 // Original eight-bar pentatonic tune, 32 beats. Notes and envelope tails overlap the loop seam.
 const melody=[64,67,69,67,64,62,60,62,64,67,72,69,67,64,62,60,60,64,67,69,72,69,67,64,62,64,67,62,60,62,64,67];
 const bass=[48,48,53,53,45,45,55,55];const hz=n=>440*Math.pow(2,(n-69)/12);
 while(this.next<now+.25){const t=this.next,b=this.beat%32;this.note(hz(melody[b]),t,.42,'triangle',b%4===0?.16:.12,this.music);if(b%2===0)this.note(hz(bass[Math.floor(b/4)]),t,.48,'sine',.3,this.music);if(b%4===0||b%4===2)this.note(105,t,.16,'sine',.3,this.music,38);if(b%4===1||b%4===3)this.noise(t,.07,.06,this.music,3200);this.noise(t+.3125,.035,.025,this.music,6800);this.next+=beatDuration;this.beat++;}
 }
}
window.OfficeAudio=OfficeAudio;
})();
