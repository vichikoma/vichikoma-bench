import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {Backdrop,C,Motion,Slash,Text,ease,pulse} from '../design';
export const Intro:React.FC=()=>{
 const f=useCurrentFrame();const p=pulse(f);
 return <AbsoluteFill data-scene="opening"><Backdrop/><Motion duration={124}>
  <Text x={124} y={95} size={44} weight={700} color={C.yellow}>季度经营速报</Text>
  <Text x={124} y={189} size={58} weight={700} fact="period">2026 年第三季度</Text>
  <Text x={114} y={305} size={218} color={C.orange} style={{textShadow:`7px 7px 0 ${C.navy}`}}>牛马咖啡</Text>
  <Slash x={125} y={564} width={860} height={22}/>
  <Text x={124} y={627} size={130}>这季，火力拉满？</Text>
  <Text x={129} y={841} size={48} weight={500} color={C.gray}>经营开场，直接上强度</Text>
  <svg width="520" height="650" viewBox="0 0 520 650" style={{position:'absolute',left:1250,top:265,transform:`translateY(${Math.sin(f/28)*9}px) rotate(${-7+Math.sin(f/60)*2}deg) scale(${1+p*.016})`}}>
   <path d="M90 80 L190 28 L203 155 L115 191 Z" fill={C.blue}/>
   <path d="M350 10 L392 85 L456 42 L460 160 L397 192 L344 101Z" fill={C.yellow}/>
   <path d="M75 220 L443 220 L402 570 L132 570Z" fill={C.orange} stroke={C.navy} strokeWidth="9"/>
   <path d="M100 165 L422 165 L455 221 L68 221Z" fill={C.white} stroke={C.navy} strokeWidth="9"/>
   <path d="M93 192 L432 192" stroke={C.blue} strokeWidth="18"/>
   <path d="M240 290 L189 408 L247 408 L222 509 L325 377 L266 377 L297 290 Z" fill={C.navy}/>
   <path d="M370 250 L393 250 L367 458" fill="none" stroke={C.yellow} strokeWidth="10"/>
   <path d="M33 350 L12 338 M478 313 L506 298 M83 580 L62 608" stroke={C.blue} strokeWidth="12" strokeLinecap="round"/>
  </svg>
  <div style={{position:'absolute',left:1208,top:931,width:562*ease(f,0,22),height:8,backgroundColor:C.blue,transform:'skewX(-15deg)'}}/>
 </Motion></AbsoluteFill>;
};
