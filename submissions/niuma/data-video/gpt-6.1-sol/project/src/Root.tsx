import React,{useLayoutEffect} from 'react';
import {AbsoluteFill,Composition,staticFile,useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {TransitionSeries,linearTiming} from '@remotion/transitions';
import {wipe} from '@remotion/transitions/wipe';
import {Intro} from './scenes/Intro';
import {Sales} from './scenes/Sales';
import {Growth} from './scenes/Growth';
import {Channel} from './scenes/Channel';
import {Margin} from './scenes/Margin';
import {FONT,C} from './design';

// QA enabled only for separate verification renders via input props.
const Audit:React.FC<{enabled:boolean}>=({enabled})=>{
 const frame=useCurrentFrame();
 useLayoutEffect(()=>{
  if(!enabled)return;
  const nodes=[...document.querySelectorAll<HTMLElement>('[data-safe]')];
  const rootElement=document.querySelector<HTMLElement>('[data-qa-root]')!;
  const root=rootElement.getBoundingClientRect();
  const items=nodes.map(e=>{
   const b=e.getBoundingClientRect();const s=getComputedStyle(e);
   return {type:e.dataset.safe,scene:e.closest('[data-scene]')?.getAttribute('data-scene'),fact:e.dataset.fact,text:e.innerText,x:b.x-root.x,y:b.y-root.y,w:b.width,h:b.height,fontSize:parseFloat(s.fontSize),color:s.color};
  });
  console.log('LAYOUT_QA:'+JSON.stringify({frame,items}));
 },[frame,enabled]);return null;
};
export const NiumaQuarter:React.FC<{audit?:boolean}>=({audit=false})=><AbsoluteFill data-qa-root="true" style={{fontFamily:FONT,backgroundColor:C.navy}}>
 <TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={124} name="开场 · 品牌"><Intro/></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={wipe({direction:'from-left'})} timing={linearTiming({durationInFrames:4})}/>
  <TransitionSeries.Sequence durationInFrames={184} name="规模 · 销售增长"><Sales/></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={wipe({direction:'from-left'})} timing={linearTiming({durationInFrames:4})}/>
  <TransitionSeries.Sequence durationInFrames={184} name="引擎 · 轻食领跑"><Growth/></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={wipe({direction:'from-left'})} timing={linearTiming({durationInFrames:4})}/>
  <TransitionSeries.Sequence durationInFrames={184} name="渠道 · 外卖过半"><Channel/></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={wipe({direction:'from-left'})} timing={linearTiming({durationInFrames:4})}/>
  <TransitionSeries.Sequence durationInFrames={240} name="高潮 · 毛利提醒"><Margin/></TransitionSeries.Sequence>
 </TransitionSeries>
 <Audio src={staticFile('bgm.wav')}/>
 <Audit enabled={audit}/>
</AbsoluteFill>;
export const Root:React.FC=()=> <Composition id="NiumaQuarter" component={NiumaQuarter} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={{audit:false}}/>;
