"""原创配乐：120 BPM，十五小节，三十秒；完整终止式，不做循环折尾。
用 music-gen 的 MIDI API 和内置音源。执行前设置 LIBDIR 到 music-gen/scripts。
python scripts/compose_bgm.py
"""
import os,sys,json,shutil
from pathlib import Path
import numpy as np
sys.path.insert(0,os.environ['LIBDIR'])
import musiclib as mg
P=Path(__file__).resolve().parents[1];O=P/'out';O.mkdir(exist_ok=True)
p=mg.Piece(bpm=120,bars=15)
dr=p.track('Pulse / drums',0,drums=True,volume=105)
bass=p.track('Drive / synth bass',mg.GM['synth_bass'],pan=64,volume=104)
left=p.track('Stabs / left',mg.GM['synth_brass'],pan=12,volume=63)
right=p.track('Stabs / right',mg.GM['clean_guitar'],pan=115,volume=71)
lead=p.track('Hook / square',mg.GM['square_lead'],pan=76,volume=60)
bell=p.track('Spark / marimba',mg.GM['marimba'],pan=18,volume=78)
pad=p.track('Landing / warm pad',mg.GM['warm_pad'],pan=100,volume=53)
# A minor -> F major -> C major -> G major; climax E major -> A minor resolution.
roots=[45,45,45,41,48,43,45,41,48,43,45,41,40,45,45]
chords={45:[57,60,64],41:[53,57,60],48:[55,60,64],43:[55,59,62],40:[52,56,59]}
hooks=[[76,79,81,79,76,72,74,76],[72,76,77,76,72,69,72,76],[76,79,84,79,76,74,72,76],[74,79,83,79,74,71,74,76]]
for bar in range(15):
 b=bar*4;root=roots[bar];ch=chords[root]
 if bar==14:
  # Final tonic struck exactly at 28 s, releases completely before 30 s.
  dr.note(b,36,.18,105);dr.note(b,49,.18,63)
  bass.note(b,45,1.15,100);left.chord(b,[57,60,64,69],1.1,62)
  right.chord(b,[60,64,69],1.15,65);lead.note(b,81,1.0,69)
  bell.chord(b,[69,76,81],1.2,75);pad.chord(b,[57,60,64],1.6,45)
  continue
 density=0.76 if bar<2 else 1.0
 for k in range(4):
  if bar!=13 or k<3:
   dr.note(b+k,36,.12,int((107 if k%2==0 else 94)*density))
  if k in (1,3):dr.note(b+k,38,.12,int(96*density));dr.note(b+k,39,.1,50)
 for k in range(8):
  dr.note(b+k*.5,42,.09,int((58 if k%2==0 else 39)*density))
  if bar>=5 and k%2==1:dr.note(b+k*.5+.25,82,.06,28)
 if bar in [0,2,5,8,11]:dr.note(b,49,.2,62)
 if bar in [4,7,10,12]:
  for j in range(4):dr.note(b+3+j*.25, [38,47,45,41][j],.1,64+7*j)
 for k,pitch in [(0,root),(.75,root),(1.5,root+12),(2,root),(2.75,root+7),(3.5,root+12)]:
  bass.note(b+k,pitch,.34,98 if k in [0,2] else 82)
 for k in [0,1.5,2.5]:
  left.chord(b+k,ch,.24,64 if k==0 else 51)
  right.chord(b+k+.04,[n+12 for n in ch],.27,53)
 if bar<2:
  for j,k in enumerate([0,1,2.5,3.5]):bell.note(b+k,[76,81,79,76][j],.25,70)
 else:
  melody=hooks[(bar-2)%4]
  if root==40:melody=[76,80,83,80,76,74,71,80]
  for j,n in enumerate(melody):
   if bar==13 and j>=5:continue
   lead.note(b+j*.5,n,.28,70 if j%2==0 else 58)
   if bar>=8:bell.note(b+j*.5,n+12,.2,38)
 if bar>=11:pad.chord(b,ch,3.3,43)
p.save(str(O/'bgm.mid'))
raw=O/'bgm-raw.wav'
mg.render(str(O/'bgm.mid'),str(raw),gain=.52,rate=48000,reverb=(.42,.45,.23))
rate,audio=mg._read_wav(str(raw))
# Preserve initial downbeat; retain final cadence and its release, pad/trim silence to exact film duration.
N=rate*30
if len(audio)<N:audio=np.pad(audio,((0,N-len(audio)),(0,0)))
audio=audio[:N].astype(np.float64)
mid=(audio[:,0]+audio[:,1])*.5;side=(audio[:,0]-audio[:,1])*.5*1.6
audio=np.column_stack((mid+side,mid-side))
peak=float(np.abs(audio).max());audio*=.82/peak
# A gentle tail gate only affects the resolved tonic's release during the last 0.75 seconds.
fade=int(.75*rate);audio[-fade:]*=np.linspace(1,0,fade)[:,None]
mg.export(str(O/'bgm'),rate,audio,formats=('wav',))
raw.unlink()
beats={'bpm':120,'time_signature':[4,4],'duration_seconds':30,'beat_unit':'quarter_note','origin_seconds':0,'beats':[{'index':i,'time_seconds':i*.5,'bar':i//4+1,'beat_in_bar':i%4+1,'is_downbeat':i%4==0,'frame':i*15} for i in range(60)],'end_boundary':{'time_seconds':30,'frame':900,'next_bar':16},'scene_boundaries_seconds':[0,4,10,16,22,30],'cadence':{'dominant_start_seconds':24,'tonic_preparation_seconds':26,'final_tonic_seconds':28,'release_end_seconds':30},'note':'最后一小节在28秒落主和弦，30秒余音归零；无口播。'}
(O/'beats.json').write_text(json.dumps(beats,ensure_ascii=False,indent=2),encoding='utf-8')
(P/'project/public').mkdir(exist_ok=True)
shutil.copy2(O/'bgm.wav',P/'project/public/bgm.wav')
report={'duration_seconds':len(audio)/rate,'sample_rate':rate,'peak_dbfs':20*np.log10(float(np.abs(audio).max())),'rms_dbfs':20*np.log10(float(np.sqrt(np.mean(audio**2)))),'stereo_correlation':float(np.corrcoef(audio.T)[0,1]),'last_sample_peak':float(np.abs(audio[-1]).max()),'composition':'原创A小调电子放克；120 BPM；十五小节；终止式E→Am；内置GeneralUser音源。'}
(O/'music-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
mg.qa(str(O/'bgm.wav'))
