import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {Backdrop,C,D,Motion,Header,Text,Slash,Sweep,pulse,pct} from '../design';
export const Margin:React.FC=()=>{
 const f=useCurrentFrame();const p=pulse(f);
 return <AbsoluteFill data-scene="margin"><Backdrop intensity={1.3}/><Motion duration={240}><Header topic="经营提醒"/>
  <Text x={117} y={186} size={176}>毛利，也得跟上</Text>
  <Text x={127} y={407} size={46} color={C.gray} weight={600}>综合毛利率同比变化</Text>
  <svg width="1920" height="1080" style={{position:'absolute',opacity:.8}}>
   <path d="M130 540 L190 510 M135 591 L195 579 M144 639 L202 647 M1525 480 L1631 457 M1555 534 L1734 510 M1578 596 L1791 584 M1555 682 L1760 706 M1532 742 L1678 798" stroke={C.orange} strokeWidth={8+p*3} strokeLinecap="round"/>
  </svg>
  <Text x={275} y={466} size={400} color={C.yellow} fact="margin_change" style={{lineHeight:1,textShadow:`0 0 ${8+p*9}px ${C.yellow}30`,transform:`scale(${1+p*.005})`,transformOrigin:'left center'}}>{D.margin_change_pp.toFixed(1)}</Text>
  <Text x={1120} y={717} size={85} color={C.yellow}>个百分点</Text>
  <Slash x={126} y={872} width={1660} height={5} color={C.blue}/>
  <Text x={403} y={900} size={36} color={C.gray} weight={500}>本季</Text>
  <Text x={517} y={883} size={52} fact="margin_current">{pct(D.current.margin)}</Text>
  <Text x={1002} y={900} size={36} color={C.gray} weight={500}>去年同期</Text>
  <Text x={1230} y={883} size={52} fact="margin_prior">{pct(D.prior.margin)}</Text>
  <Text x={589} y={947} size={44} color={C.orange}>销售跑起来，毛利要跟上</Text>
  <Sweep x={126} y={872} w={1660} h={5}/>
 </Motion></AbsoluteFill>;
};
