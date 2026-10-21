import React, {CSSProperties} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import data from './data.json';
export const C={orange:'#FF7A1A',blue:'#2E9BFF',yellow:'#FFD23D',navy:'#0B1026',white:'#F4F6FF',gray:'#B9C0DE'};
export const D=data;
export const FONT='"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
export const BOUNDS={left:96,right:1824,top:54,bottom:1026};
export const ease=(f:number,start:number,end:number)=>interpolate(f,[start,end],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)});
export const pulse=(f:number)=>Math.exp(-(f%15)/3.4);
export const cn=(n:number)=>Math.round(n).toLocaleString('en-US');
export const pct=(n:number)=>n.toFixed(1)+'%';
export const Text:React.FC<{children:React.ReactNode;x:number;y:number;size:number;color?:string;weight?:number;style?:CSSProperties;fact?:string;label?:string}> =({children,x,y,size,color=C.white,weight=900,style,fact,label})=><div data-safe="text" data-fact={fact} data-label={label} style={{position:'absolute',left:x,top:y,fontFamily:FONT,fontSize:size,fontWeight:weight,lineHeight:1.16,letterSpacing:-size*.045,whiteSpace:'nowrap',color,...style}}>{children}</div>;
export const Motion:React.FC<{children:React.ReactNode;start?:number;duration?:number}>=({children,start=0,duration=180})=>{
 const f=useCurrentFrame();const enter=spring({fps:30,frame:Math.max(0,f-start),config:{mass:.7,damping:18,stiffness:165}});
 return <AbsoluteFill style={{transform:`translate(${(1-enter)*22}px,${(1-enter)*22}px) scale(${1+(Math.min(f/duration,1))*.008})`,transformOrigin:'960px 540px'}}>{children}</AbsoluteFill>;
};
export const Header:React.FC<{topic:string}>=({topic})=><><Text x={124} y={75} size={36} color={C.gray} weight={700}>牛马咖啡</Text><Text x={1460} y={75} size={36} color={C.gray} weight={500}>{topic}</Text><div style={{position:'absolute',left:124,top:136,width:1672,height:3,backgroundColor:C.gray,opacity:.25}}/></>;
export const Backdrop:React.FC<{accent?:string;intensity?:number}>=({accent=C.orange,intensity=1})=>{
 const f=useCurrentFrame();const p=pulse(f);
 return <AbsoluteFill style={{backgroundColor:C.navy,overflow:'hidden'}}>
  <svg width="1920" height="1080" style={{position:'absolute',left:-14+Math.sin(f/85)*12,top:Math.cos(f/95)*9,opacity:.19}}>
   <defs><pattern id="dot" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill={C.gray}/></pattern></defs>
   <rect width="1920" height="1080" fill="url(#dot)"/>
  </svg>
  <svg width="1920" height="1080" style={{position:'absolute',transform:`translate(${Math.sin(f/65)*18}px,${Math.cos(f/70)*15}px)`}}>
   <path d="M1630 -100 L2020 150 L1580 560 L1480 440 L1750 115 Z" fill={C.blue} opacity={.075*intensity}/>
   <path d="M-100 870 L165 740 L300 1230 L-40 1240Z" fill={accent} opacity={.105*intensity}/>
   <circle cx="1540" cy="760" r={275+p*9} fill="none" stroke={C.blue} strokeWidth="2" opacity={.11}/>
   <circle cx="1540" cy="760" r={315+p*13} fill="none" stroke={accent} strokeWidth="1.5" opacity={.12}/>
  </svg>
  {Array.from({length:16},(_,i)=>{const x=70+(i*157)%1780;const y=50+(i*131)%980;return <div key={i} style={{position:'absolute',left:x+Math.sin((f+i*10)/38)*10,top:y+Math.cos((f+i*7)/43)*10,width:4+(i%3)*2,height:4+(i%3)*2,borderRadius:'50%',backgroundColor:i%2?C.blue:C.orange,opacity:.18+p*.13}}/>})}
 </AbsoluteFill>;
};
export const Slash:React.FC<{x:number;y:number;width:number;height?:number;color?:string;delay?:number}>=({x,y,width,height=18,color=C.orange,delay=0})=>{
 const f=useCurrentFrame();return <div style={{position:'absolute',left:x,top:y,width:width*ease(f,delay,delay+22),height,backgroundColor:color,clipPath:'polygon(1% 0,100% 0,99% 100%,0 100%)'}}/>;
};
export const Burst:React.FC<{x:number;y:number;r:number;color:string;opacity?:number}>=({x,y,r,color,opacity=1})=>{
 const f=useCurrentFrame();const pts=Array.from({length:32},(_,i)=>{let a=i/32*Math.PI*2;let rad=r*(i%2?.83:1);return `${x+Math.cos(a)*rad},${y+Math.sin(a)*rad}`}).join(' ');
 return <svg width="1920" height="1080" style={{position:'absolute',left:0,top:0,opacity,transform:`rotate(${Math.sin(f/85)*1.2}deg)`,transformOrigin:`${x}px ${y}px`}}><polygon points={pts} fill={color}/></svg>;
};
export const Sweep:React.FC<{x:number;y:number;w:number;h:number;color?:string}>=({x,y,w,h,color=C.yellow})=>{
 const f=useCurrentFrame();let t=(f%60)/60;
 return <div style={{position:'absolute',left:x,top:y,width:w,height:h,overflow:'hidden',pointerEvents:'none'}}><div style={{position:'absolute',left:-120+t*(w+180),top:0,width:22,height:h,backgroundColor:color,opacity:.2,transform:'skewX(-28deg)'}}/></div>;
};
export const ChartWrap:React.FC<{x:number;y:number;w:number;h:number;children:React.ReactNode}>=({x,y,w,h,children})=><div data-safe="chart" style={{position:'absolute',left:x,top:y,width:w,height:h}}>{children}</div>;
