const {bundle}=require('@remotion/bundler');
const {openBrowser,selectComposition,renderStill}=require('@remotion/renderer');
const fs=require('fs');const path=require('path');
(async()=>{
 const out=path.resolve('../out');fs.mkdirSync(path.join(out,'stills'),{recursive:true});
 const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('.render-bundle')});
 const browser=await openBrowser('chrome');const inputProps={audit:true};
 const composition=await selectComposition({serveUrl,id:'NiumaQuarter',inputProps,puppeteerInstance:browser});
 const frames=[...new Set([...Array.from({length:60},(_,i)=>i*15),...[0,120,300,480,660].flatMap(s=>[0,1,2,3,4,8,12,16,20].map(d=>s+d)),119,299,479,659,899])].sort((a,b)=>a-b);
 const names={60:'opening',180:'sales',375:'middle',555:'channel',735:'climax',122:'transition-sales',302:'transition-growth',482:'transition-channel',662:'transition-margin'};const records=[];
 for(const frame of frames){
  let latest=null;
  await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame,imageFormat:'png',scale:1,output:names[frame]?path.join(out,'stills',names[frame]+'.png'):null,onBrowserLog:l=>{if(l.text.startsWith('LAYOUT_QA:')){const obj=JSON.parse(l.text.slice(10));if(obj.frame===frame)latest=obj;}}});
  if(!latest)throw Error('No audit on frame '+frame);records.push(latest);console.log('Verified frame '+frame);
 }
 await browser.close({silent:true});
 fs.writeFileSync(path.join(out,'layout-raw.json'),JSON.stringify(records,null,2));
 const issues=[];
 // Different scenes occupy complementary halves of the official wipe mask.
 const intersects=(a,b)=>a.scene===b.scene&&Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2;
 for(const {frame,items} of records){
  for(const a of items){
   if(a.x<96-.1||a.y<54-.1||a.x+a.w>1824+.1||a.y+a.h>1026+.1)issues.push({frame,type:'safe-area',item:a});
   if(a.type==='text'&&a.fontSize<28)issues.push({frame,type:'font-size',item:a});
  }
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j];
   if(a.type==='text'&&b.type==='text'&&intersects(a,b))issues.push({frame,type:'text-overlap',a:a.text,b:b.text});
   if(a.type!==b.type&&intersects(a,b)){
    const chart=a.type==='chart'?a:b,text=a.type==='text'?a:b;
    const contained=text.x>=chart.x-1&&text.y>=chart.y-1&&text.x+text.w<=chart.x+chart.w+1&&text.y+text.h<=chart.y+chart.h+1;
    if(!contained)issues.push({frame,type:'text-chart-overlap',text:text.text,chart});
   }
  }
 }
 fs.writeFileSync(path.join(out,'layout-issues.json'),JSON.stringify(issues,null,2));console.log('ISSUES '+issues.length);for(const x of issues)console.log(JSON.stringify(x));
})().catch(e=>{console.error(e);process.exit(1)});
