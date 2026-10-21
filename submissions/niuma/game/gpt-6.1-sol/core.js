/* Pure deterministic simulation. Browser and Node share this exact implementation. */
(function(root){
'use strict';
const UNITS={
 coffee:{name:'咖啡机',cost:50,cd:5,hp:100,interval:10,desc:'每 10 秒自动产出 25 咖啡因。先投资，再加班。',color:'#b78151'},
 cannon:{name:'DDL 加农炮',cost:100,cd:5,hp:180,damage:24,interval:1.5,desc:'每 1.5 秒发射 24 伤害的交付物，攻击本行最靠左的工作。',color:'#4b9b91'},
 tank:{name:'背锅侠',cost:50,cd:10,hp:1800,desc:'1800 血量，不攻击。请来的实习同事，替全组扛住十倍的锅。',color:'#dfab4d'},
 fish:{name:'摸鱼鱼缸',cost:160,cd:5,hp:180,damage:24,interval:1.5,desc:'每 1.5 秒泼水造成 24 伤害，减速 50%，持续 5 秒。',color:'#52a9cb'},
 letter:{name:'辞职信',cost:150,cd:30,hp:180,interval:1,desc:'1 秒后清空全场；有 15% 概率被批准辞职，直接失败。',color:'#df7059'},
 busy:{name:'假装在忙',cost:25,cd:20,hp:100,interval:15,desc:'15 秒布置现场；就绪后被踩中，自爆秒杀一个敌人。',color:'#8e96bb'},
 reply:{name:'已读不回',cost:125,cd:12,hp:160,interval:8,desc:'每 8 秒将本行最近工作向右退回约 1.5 格；老板改为眩晕 1.5 秒。不造成伤害。',color:'#d695b0'},
 mute:{name:'会议静音器',cost:100,cd:12,hp:180,desc:'保护相邻行、左右 1.6 格：啃咬伤害 -45%，暂停范围内例会生成需求。无攻击。',color:'#9883bd'}
};
const ENEMIES={normal:{name:'普通需求',hp:120,speed:.46,bite:24,desc:'120 血量。每天都说是个小需求。'},urgent:{name:'加急需求',hp:240,speed:.54,bite:28,desc:'240 血量。冒着火的文档，今晚就要。'},boss:{name:'老板',hp:480,speed:.25,bite:48,desc:'480 血量，最慢。全场最多一个；到工位立即失败，年假无效。'},meeting:{name:'临时会议',hp:120,speed:.54,bite:24,desc:'跳过遇到的第一个单位一次，然后继续推进。'},recurring:{name:'例会',hp:240,speed:.38,bite:26,desc:'第 6 波起出现。每 10 秒在本行空格生成普通需求。'}};
const WAVES=[{count:4,gap:4},{count:6,gap:3.7},{count:8,gap:3.4},{count:10,gap:3.2},{count:12,gap:2.9},{count:19,gap:1.9},{count:16,gap:2.5},{count:18,gap:2.3},{count:20,gap:2.1},{count:24,gap:1.7},{count:28,gap:1.4},{count:38,gap:.9}];
const X=col=>(col-4)*1.5;
class Game{
 constructor(emit=()=>{},random=Math.random){this.emit=emit;this.random=random;this.reset();}
 reset(){this.time=0;this.money=200;this.kills=0;this.spent=0;this.wave=0;this.spawned=0;this.totalSpawned=0;this.units=[];this.enemies=[];this.shots=[];this.arrivals=[];this.slots=[0,0,0,0,0];this.leave=[true,true,true,true,true];this.cooldowns={};this.nextDrop=12;this.nextWave=12;this.nextSpawn=0;this.status='ready';this.seq=1;this.reason='';}
 start(){this.reset();this.status='playing';this.emit('start',{});}
 occupied(row,col){return this.units.find(u=>u.row===row&&u.col===col);}
 canPlace(type,row,col){if(this.status!=='playing')return '请先开始值班';if(row<0||row>4||col<0||col>8)return '拖到办公区格子内';if(this.occupied(row,col))return '这里已经有单位';if(!UNITS[type])return '未知单位';if(this.money<UNITS[type].cost)return '咖啡因不足';if((this.cooldowns[type]||0)>this.time)return '这张卡片还在冷却';return '';}
 place(type,row,col){const reason=this.canPlace(type,row,col);if(reason)return false;const d=UNITS[type];const u={id:this.seq++,type,row,col,x:X(col),hp:d.hp,maxHP:d.hp,age:0,timer:type==='coffee'?10:type==='letter'?1:type==='reply'?3:0.45,recoil:0};this.units.push(u);this.money-=d.cost;this.spent+=d.cost;this.cooldowns[type]=this.time+d.cd;this.emit('plant',{unit:u});return u;}
 shovel(row,col){const u=this.occupied(row,col);if(!u||this.status!=='playing')return false;this.units=this.units.filter(v=>v!==u);this.emit('shovel',{unit:u});return true;}
 spawn(type,row,x=7.7){if(type==='boss'&&this.enemies.some(e=>e.type==='boss'))return null;const d=ENEMIES[type];const e={id:this.seq++,type,row,x,hp:d.hp,maxHP:d.hp,age:0,slow:0,stun:0,jumped:false,jump:0,meetingClock:10,hit:0,retreat:0,retreatStart:0,retreatEnd:0};this.enemies.push(e);this.totalSpawned++;this.emit('spawn',{enemy:e});return e;}
 kill(e,credit=true){if(!this.enemies.includes(e))return;this.enemies=this.enemies.filter(v=>v!==e);if(credit)this.kills++;this.emit('kill',{enemy:e});}
 end(win,reason){if(this.status!=='playing')return;this.status=win?'won':'lost';this.reason=reason;this.emit('end',{win,reason,kills:this.kills,money:this.money,leave:this.leave.filter(Boolean).length});}
 waveType(i){const w=this.wave;if((w===6||w===9||w===12)&&i===(w===12?12:5))return 'boss';if(w>=6&&i%(w>=10?4:6)===2)return 'recurring';if(w>=3&&i%5===3)return 'meeting';if(w>=2&&i%(w>=8?2:4)===1)return 'urgent';return 'normal';}
 beginWave(){this.wave++;this.spawned=0;this.nextSpawn=this.time;this.nextWave=Infinity;this.emit('wave',{wave:this.wave,big:this.wave===6||this.wave===12});}
 protectedAt(row,x){return this.units.some(u=>u.type==='mute'&&Math.abs(u.row-row)<=1&&Math.abs(u.x-x)<=2.4);}
 step(dt){if(this.status!=='playing')return;dt=Math.min(dt,.1);this.time+=dt;
 if(this.time>=this.nextDrop){this.nextDrop+=12;const row=Math.floor(this.random()*5),col=Math.floor(this.random()*9);this.money+=25;this.emit('income',{amount:25,row,col,sky:true});}
 if(this.time>=this.nextWave&&this.wave<12)this.beginWave();
 if(this.wave>0&&this.spawned<WAVES[this.wave-1].count&&this.time>=this.nextSpawn){const type=this.waveType(this.spawned);if(type!=='boss'||!this.enemies.some(e=>e.type==='boss')){const row=this.wave===1?this.spawned%2:this.wave===2?this.spawned%3:(this.spawned+this.wave*2)%5;this.spawn(type,row);this.spawned++;this.nextSpawn=this.time+WAVES[this.wave-1].gap;}}
 for(const u of [...this.units]){if(!this.units.includes(u))continue;u.age+=dt;u.timer-=dt;u.recoil=Math.max(0,u.recoil-dt*3);
  if(u.type==='coffee'&&u.timer<=0){u.timer+=10;this.money+=25;this.emit('income',{amount:25,row:u.row,col:u.col,sky:false});}
  if(u.type==='letter'&&u.age>=1){this.units=this.units.filter(v=>v!==u);this.emit('resign',{unit:u});for(const e of [...this.enemies])this.kill(e);if(this.random()<.15){this.end(false,'老板回复：同意。请办理离职手续。');return;}}
  if(u.type==='busy'&&u.age>=15&&!u.armed){u.armed=true;this.emit('armed',{unit:u});}
  if((u.type==='cannon'||u.type==='fish'||u.type==='reply')&&u.timer<=0){const target=this.enemies.filter(e=>e.row===u.row&&e.x>=u.x-.25&&e.jump<=0).sort((a,b)=>a.x-b.x)[0];if(target){u.timer=UNITS[u.type].interval;u.recoil=1;if(u.type==='reply'){if(target.type==='boss')target.stun=Math.max(target.stun,1.5);else{target.retreat=.38;target.retreatStart=target.x;target.retreatEnd=Math.min(8.2,target.x+2.2);}this.emit('return',{unit:u,enemy:target});}else{const s={id:this.seq++,row:u.row,x:u.x+.45,type:u.type,damage:24,slow:u.type==='fish',life:3};this.shots.push(s);this.emit('fire',{unit:u,shot:s});}}}
 }
 for(const s of [...this.shots]){const before=s.x;s.x+=dt*8.5;s.life-=dt;const e=this.enemies.filter(e=>e.row===s.row&&e.jump<=0&&e.x>=before-.36&&e.x<=s.x+.36).sort((a,b)=>a.x-b.x)[0];if(e){e.hp-=s.damage;e.hit=.15;if(s.slow)e.slow=5;this.emit('hit',{enemy:e,shot:s});if(e.hp<=0)this.kill(e);s.life=0;}if(s.life<=0||s.x>9)this.shots=this.shots.filter(v=>v!==s);}
 for(const e of [...this.enemies]){if(!this.enemies.includes(e))continue;e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);e.stun=Math.max(0,e.stun-dt);
  if(e.type==='recurring'&&!this.protectedAt(e.row,e.x)){e.meetingClock-=dt;if(e.meetingClock<=0){e.meetingClock+=10;const empty=[];for(let col=0;col<9;col++)if(!this.occupied(e.row,col))empty.push(col);if(empty.length){const col=empty[Math.floor(this.random()*empty.length)];const child=this.spawn('normal',e.row,X(col));this.emit('meetingSpawn',{enemy:e,child});}}}
  if(e.retreat>0){e.retreat=Math.max(0,e.retreat-dt);e.x=e.retreatEnd+(e.retreatStart-e.retreatEnd)*(e.retreat/.38);continue;}
  if(e.jump>0){e.jump-=dt;e.x=e.jumpEnd+(e.jumpStart-e.jumpEnd)*Math.max(0,e.jump/.75);continue;}
  if(e.stun>0)continue;
  const blocker=this.units.filter(u=>u.row===e.row&&e.x>=u.x-.58&&e.x<=u.x+.77).sort((a,b)=>b.x-a.x)[0];
  if(blocker){if(blocker.type==='busy'&&blocker.armed){this.units=this.units.filter(u=>u!==blocker);this.emit('mine',{unit:blocker,enemy:e});this.kill(e);continue;}if(e.type==='meeting'&&!e.jumped){e.jumped=true;e.jump=.75;e.jumpStart=e.x;e.jumpEnd=blocker.x-1.05;this.emit('jump',{enemy:e});continue;}blocker.hp-=ENEMIES[e.type].bite*dt*(this.protectedAt(blocker.row,blocker.x)?.55:1);if(blocker.hp<=0){this.units=this.units.filter(u=>u!==blocker);this.emit('eaten',{unit:blocker});}}
  else e.x-=ENEMIES[e.type].speed*dt*(e.slow>0?.5:1);
  if(e.x< -7.05){if(e.type==='boss'){this.end(false,'老板亲自到了工位。年假也救不了这次。');return;}if(!this.leave[e.row]){this.end(false,`第 ${e.row+1} 个工位年假已用，工作终于堆爆了。`);return;}this.enemies=this.enemies.filter(v=>v!==e);this.arrivals.push({enemy:e,time:.65});this.emit('arrive',{enemy:e,slot:this.slots[e.row]+this.arrivals.filter(a=>a.enemy.row===e.row).length-1});}
 }
 for(const a of [...this.arrivals]){a.time-=dt;if(a.time<=0){this.arrivals=this.arrivals.filter(v=>v!==a);const row=a.enemy.row;if(!this.leave[row]){this.end(false,`第 ${row+1} 个工位年假用完，工作堆爆了。`);return;}this.slots[row]++;this.emit('slot',{row,count:this.slots[row]});if(this.slots[row]===4){this.leave[row]=false;this.emit('leave',{row});for(const e of [...this.enemies])if(e.row===row&&e.type!=='boss')this.kill(e);}}}
 if(this.wave>0&&this.spawned===WAVES[this.wave-1].count&&this.enemies.length===0&&this.arrivals.length===0&&this.nextWave===Infinity){if(this.wave===12){this.end(true,'所有工作已交付。现在，准点下班。');return;}this.nextWave=this.time+7;this.emit('break',{next:this.wave+1});}
 }
}
const api={Game,UNITS,ENEMIES,WAVES,X};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorkGame=api;
})(typeof window!=='undefined'?window:globalThis);
