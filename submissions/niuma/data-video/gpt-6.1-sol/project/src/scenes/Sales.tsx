import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {Backdrop,C,D,Motion,Header,Slash,Text,ChartWrap,Sweep,ease,cn,pct,pulse} from '../design';
export const Sales:React.FC=()=>{
 const f=useCurrentFrame();const p=pulse(f);const ratio=D.prior.sales/D.current.sales;
 return <AbsoluteFill data-scene="sales"><Backdrop/><Motion duration={184}><Header topic="规模向上"/>
  <Text x={117} y={189} size={180}>销售火力全开</Text>
  <Text x={127} y={409} size={47} color={C.gray} weight={600}>本季销售额</Text>
  <Text x={107} y={474} size={266} color={C.orange} fact="sales_current" style={{fontVariantNumeric:'tabular-nums'}}>{cn(D.current.sales/10000)}</Text>
  <Text x={902} y={654} size={78} color={C.orange}>万元</Text>
  <div style={{position:'absolute',left:1310,top:455,width:482,height:270,backgroundColor:C.yellow,borderRadius:36,transform:`rotate(-4deg) scale(${1+p*.008})`,boxShadow:`8px 8px 0 ${C.blue}`}}>
   <Text x={34} y={32} size={44} color={C.navy} weight={700}>同比增长</Text>
   <Text x={26} y={115} size={100} color={C.navy} fact="sales_yoy">+{pct(D.yoy)}</Text>
  </div>
  <Slash x={125} y={791} width={1662} height={6} delay={10} color={C.blue}/>
  <Text x={125} y={826} size={42} color={C.gray} weight={600}>去年同期</Text>
  <Text x={125} y={918} size={42} color={C.orange} weight={700}>本季</Text>
  <ChartWrap x={372} y={821} w={1414} h={154}>
   <div style={{position:'absolute',left:0,top:5,width:1414*ratio*ease(f,5,38),height:51,borderRadius:'0 13px 13px 0',backgroundColor:C.blue}}/>
   <div style={{position:'absolute',left:0,top:98,width:1414*ease(f,11,44),height:51,borderRadius:'0 13px 13px 0',backgroundColor:C.orange}}/>
  </ChartWrap>
  <Sweep x={372} y={919} w={1414} h={51}/>
 </Motion></AbsoluteFill>;
};
