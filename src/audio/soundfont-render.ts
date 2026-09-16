import type { MixState } from '../projects/types';
import type { ScoreTimeline } from '../music/score-timeline';
import { timelineToMidiBytes } from '../music/midi-export';
import { sanitizeMix } from './mix-state';
import { applyMasterMix } from './mix-render';
import { loadSoundFontBuffer } from './soundfont-cache';
export interface SoundFontRenderOptions { sampleRate?:number; tailSeconds?:number; soundFontUrl?:string; mix?:MixState; }
function exactArrayBuffer(bytes:Uint8Array):ArrayBuffer{return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;}
function nextTask():Promise<void>{return new Promise(resolve=>setTimeout(resolve,0));}
export async function renderTimelineWithSoundFont(timeline:ScoreTimeline,options:SoundFontRenderOptions={}):Promise<Blob>{
  const sampleRate=Math.max(24000,Math.min(44100,Math.round(options.sampleRate||32000))); const tailSeconds=Math.max(.25,Math.min(3,options.tailSeconds??1)); if(timeline.totalDurationSeconds>600)throw new Error('Bản nhạc quá dài để kết xuất SoundFont trên trình duyệt.');
  const [{audioToWav,BasicMIDI,SoundBankLoader,SpessaSynthProcessor,SpessaSynthSequencer},soundFontBuffer]=await Promise.all([import('spessasynth_core'),loadSoundFontBuffer(options.soundFontUrl)]);
  const cleanMix=options.mix?sanitizeMix(options.mix,timeline):undefined; const midiBytes=timelineToMidiBytes(timeline,480,cleanMix); const midi=BasicMIDI.fromArrayBuffer(exactArrayBuffer(midiBytes)); const soundBank=SoundBankLoader.fromArrayBuffer(soundFontBuffer.slice(0));
  const synth=new SpessaSynthProcessor(sampleRate,{eventsEnabled:false}); synth.soundBankManager.addSoundBank(soundBank,'music-pro-main'); await synth.processorInitialized; synth.setSystemParameter('autoAllocateVoices',true);
  const sequencer=new SpessaSynthSequencer(synth); sequencer.loadNewSongList([midi]); sequencer.play();
  const duration=Math.max(.25,midi.duration+tailSeconds); const sampleCount=Math.ceil(sampleRate*duration); const left=new Float32Array(sampleCount); const right=new Float32Array(sampleCount); let offset=0,blocks=0;
  while(offset<sampleCount){sequencer.processTick();const size=Math.min(128,sampleCount-offset);synth.process(left,right,offset,size);offset+=size;blocks++;if(blocks%4096===0)await nextTask();}
  if(cleanMix)applyMasterMix(left,right,sampleRate,cleanMix);
  const wav=audioToWav([left,right],sampleRate,{normalizeAudio:false}); return new Blob([wav],{type:'audio/wav'});
}
