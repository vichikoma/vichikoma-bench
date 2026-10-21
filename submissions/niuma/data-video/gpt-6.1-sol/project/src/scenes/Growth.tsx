import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {Backdrop,C,D,Motion,Header,Slash,Text,ChartWrap,Sweep,ease,pct} from '../design';
export const Growth:React.FC=()=>{
 const f=useCurrentFrame();let top=D.categories[0];
 return <AbsoluteFill data-scene="growth"><Backdrop/><Motion duration={184}><Header topic="增长引擎"/>
  <Text x={116} y={187} size={176}>轻食，扛起增量</Text>
  <Text x={126} y={406} size={44} weight={600} color={C.gray}>占全公司同比新增销售额</Text>
  <Text x={109} y={474} size={242} color={C.yellow} fact="light_contribution">{pct(top.contribution)}</Text>
  <Slash x={125} y={789} width={714} height={14} color={C.orange}/>
  <Text x={126} y={842} size={48} weight={700}>增长功臣，轻食领跑</Text>
  <Text x={982} y={408} size={38} weight={500} color={C.gray}>各品类销售额同比增量</Text>
  <ChartWrap x={981} y={486} w={813} h={472}>
   <div style={{position:'absolute',left:265,top:8,width:2,height:448,backgroundColor:C.gray,opacity:.35}}/>
   {D.categories.map((cat,i)=>{
    const w=Math.abs(cat.delta)/top.delta*534*ease(f,5+i*3,40+i*3);const positive=cat.delta>=0;
    return <React.Fragment key={cat.name}>
     <Text x={0} y={i*88+5} size={40} weight={i===0?900:500} color={i===0?C.orange:C.gray}>{cat.name}</Text>
     <div style={{position:'absolute',left:positive?267:267-w,top:i*88+7,width:w,height:47,borderRadius:positive?'0 8px 8px 0':'8px 0 0 8px',backgroundColor:i===0?C.orange:C.blue,opacity:i===0?1:.68}}/>
    </React.Fragment>;
   })}
  </ChartWrap>
  <Sweep x={1248} y={493} w={534} h={47}/>
 </Motion></AbsoluteFill>;
};
