import { HtmlMediaPlaybackEngine, previewRenderOptions, type MediaElementLike } from '../../src/audio/media-playback-engine';
import type { ScoreTimeline } from '../../src/music/score-timeline';
import type { MixState } from '../../src/projects/types';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
class FakeMedia implements MediaElementLike {
 currentTime=0; duration=0; paused=true; ended=false; src=''; preload=''; playCalls=0; pauseCalls=0; loadCalls=0;
 async play(){this.playCalls++;this.paused=false;this.ended=false;} pause(){this.pauseCalls++;this.paused=true;} load(){this.loadCalls++;}
}
const timeline:ScoreTimeline={title:'Demo',tempoMap:[{quarter:0,bpm:120}],timeSignatures:[{quarter:0,beats:4,beatType:4}],measureStarts:[{measure:1,quarter:0}],parts:[{partId:'P1',name:'Piano',events:[]}],totalQuarters:4,totalDurationSeconds:2};
const mix=(volume:number):MixState=>({masterGain:1,reverb:.1,normalizeExport:true,parts:{P1:{partId:'P1',volume,pan:0,mute:false,solo:false}}});

const previewOptions = previewRenderOptions(undefined, 'standard');
assert(previewOptions.sampleRate === 32000, 'standard live preview must use sampled 32 kHz quality');
const highPreviewOptions = previewRenderOptions(undefined, 'high');
assert(highPreviewOptions.sampleRate === 44100, 'high-quality live preview must render at 44.1 kHz');
assert(previewOptions.channels === 2, 'live preview must remain stereo');
assert(previewOptions.tailSeconds === 0.75, 'live preview must preserve SoundFont release tail');
async function main(){
 const media=new FakeMedia(); let renders=0; const revoked:string[]=[]; let nextUrl=1;
 const engine=new HtmlMediaPlaybackEngine({createMedia:()=>media,renderPreview:async()=>{renders++;return { blob: new Blob(['wav']), renderer: 'soundfont' as const };},createObjectURL:()=>`blob:${nextUrl++}`,revokeObjectURL:url=>revoked.push(url)});
 await engine.load(timeline,'score-a',mix(1),'standard'); assert(renders===1,'initial render'); assert(engine.renderer === 'soundfont', 'engine exposes active renderer');
 await engine.load(timeline,'score-a',mix(1),'standard'); assert(renders===1,'same score/mix/quality reuse');
 await engine.load(timeline,'score-a',mix(.5),'standard'); assert(Number(renders)===2,'mix change rerenders');
 await engine.load(timeline,'score-a',mix(.5),'high'); assert(Number(renders)===3,'preview quality change rerenders');
 await engine.play(0); assert(engine.isPlaying,'play');
 await engine.seek(1.25); assert(media.currentTime===1.25,'seek');
 engine.pause(); await engine.play(2); assert(Number(media.currentTime)===0,'restart at end');
 engine.dispose(); assert(revoked.length>=1,'revoke urls');
 console.log('HTML MEDIA PLAYBACK ENGINE TESTS PASSED');
}
void main();
