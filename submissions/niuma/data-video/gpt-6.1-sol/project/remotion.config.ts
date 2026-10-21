import path from 'node:path';
import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
// Stitch the original 30-second WAV directly, avoiding AAC padding in intermediate segments.
Config.overrideFfmpegCommand(({type,args})=>{
 if(type!=='stitcher')return args;
 const result=[...args];
 const inputs=result.map((arg,i)=>arg==='-i'?i:-1).filter(i=>i>=0);
 if(inputs.length!==2)throw new Error('Expected video and background-music inputs');
 result[inputs[1]+1]=path.resolve(process.cwd(),'public/bgm.wav');
 const audioCodec=result.indexOf('-c:a');
 if(audioCodec>=0)result[audioCodec+1]='aac';
 return [...result.slice(0,-1),'-b:a','192k','-t','30',result[result.length-1]];
});
