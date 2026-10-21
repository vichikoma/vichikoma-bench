import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {Backdrop,C,D,Motion,Header,Text,ChartWrap,Slash,Sweep,ease,pct} from '../design';
export const Channel:React.FC=()=>{
 const f=useCurrentFrame();const delivery=D.channels[0],store=D.channels[1];
 return <AbsoluteFill data-scene="channel"><Backdrop accent={C.blue}/><Motion duration={184}><Header topic="渠道变化"/>
  <Text x={117} y={190} size={180}>外卖占比过半</Text>
  <Text x={126} y={409} size={46} color={C.gray} weight={600}>本季销售额占比</Text>
  <Text x={107} y={491} size={242} color={C.orange} fact="delivery_share">{pct(delivery.share)}</Text>
  <ChartWrap x={125} y={821} w={722} h={63}>
   <div style={{width:722*ease(f,3,35),height:63,display:'flex',overflow:'hidden',borderRadius:13}}>
    <div style={{width:`${delivery.share}%`,height:'100%',backgroundColor:C.orange}}/>
    <div style={{flex:1,height:'100%',backgroundColor:C.blue}}/>
   </div>
  </ChartWrap>
  <Text x={126} y={928} size={40} color={C.orange} weight={700}>外卖</Text>
  <Text x={696} y={928} size={40} color={C.blue} weight={700}>门店</Text>
  <div style={{position:'absolute',left:935,top:420,width:2,height:565,backgroundColor:C.gray,opacity:.3}}/>
  <Text x={1030} y={418} size={40} weight={500} color={C.gray}>渠道毛利率</Text>
  <Text x={1032} y={530} size={49} weight={700}>外卖</Text>
  <Text x={1440} y={501} size={91} fact="delivery_margin">{pct(delivery.margin)}</Text>
  <ChartWrap x={1032} y={638} w={755} h={45}><div style={{width:755*(delivery.margin/65)*ease(f,9,40),height:45,backgroundColor:C.orange,borderRadius:9}}/></ChartWrap>
  <Text x={1032} y={784} size={49} weight={700}>门店</Text>
  <Text x={1440} y={754} size={91} fact="store_margin">{pct(store.margin)}</Text>
  <ChartWrap x={1032} y={892} w={755} h={45}><div style={{width:755*(store.margin/65)*ease(f,14,45),height:45,backgroundColor:C.blue,borderRadius:9}}/></ChartWrap>
  <Sweep x={1032} y={638} w={560} h={45}/>
 </Motion></AbsoluteFill>;
};
