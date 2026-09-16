import type { MixState } from '../projects/types';
import type { ScoreTimeline } from '../music/score-timeline';
import { mixFingerprint } from './mix-state';
import { renderTimelineToWavResult, type WavRenderOptions } from './offline-render';

export interface MediaElementLike {
  currentTime: number; readonly duration: number; readonly paused: boolean; readonly ended: boolean;
  src: string; preload: string; muted?: boolean; volume?: number; playsInline?: boolean;
  play(): Promise<void>; pause(): void; load(): void;
}
export type PreviewQuality = 'standard' | 'high';

export interface HtmlMediaPlaybackEngineOptions {
  createMedia?: () => MediaElementLike;
  renderPreview?: (timeline: ScoreTimeline, mix?: MixState, quality?: PreviewQuality) => Promise<Blob | { blob: Blob; renderer: 'soundfont' | 'basic' }>;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
}

export function previewRenderOptions(mix?: MixState, quality: PreviewQuality = 'standard'): WavRenderOptions {
  return {
    sampleRate: quality === 'high' ? 44100 : 32000,
    channels: 2,
    tailSeconds: 0.75,
    quality: 'auto',
    mix,
  };
}

function clampPosition(seconds:number,duration:number):number { if(!Number.isFinite(seconds)||seconds<0)return 0; if(duration<=0)return 0; return Math.min(seconds,duration); }

export class HtmlMediaPlaybackEngine {
  private readonly media:MediaElementLike;
  private readonly renderPreview:(timeline:ScoreTimeline,mix?:MixState,quality?:PreviewQuality)=>Promise<Blob | { blob: Blob; renderer: 'soundfont' | 'basic' }>;
  private activeRenderer: 'soundfont' | 'basic' | 'custom' | null = null;
  private readonly createObjectURL:(blob:Blob)=>string;
  private readonly revokeObjectURL:(url:string)=>void;
  private timeline:ScoreTimeline|null=null;
  private preparedKey:string|null=null;
  private objectUrl:string|null=null;
  private loadGeneration=0;
  constructor(options:HtmlMediaPlaybackEngineOptions={}){
    this.media=options.createMedia?.()??new Audio();
    this.renderPreview=options.renderPreview??((timeline,mix,quality)=>renderTimelineToWavResult(timeline,previewRenderOptions(mix,quality)));
    this.createObjectURL=options.createObjectURL??(blob=>URL.createObjectURL(blob));
    this.revokeObjectURL=options.revokeObjectURL??(url=>URL.revokeObjectURL(url));
    this.media.preload='auto'; if('muted'in this.media)this.media.muted=false; if('volume'in this.media)this.media.volume=1; if('playsInline'in this.media)this.media.playsInline=true;
  }
  async load(timeline:ScoreTimeline,trackId:string,mix?:MixState,quality:PreviewQuality='standard'):Promise<void>{
    const key=`${trackId}::${mixFingerprint(mix,timeline)}::${quality}`;
    if(this.preparedKey===key&&this.objectUrl){this.timeline=timeline;return;}
    const generation=++this.loadGeneration; this.media.pause(); const rendered=await this.renderPreview(timeline,mix,quality); if(generation!==this.loadGeneration)return;
    const blob=rendered instanceof Blob?rendered:rendered.blob; this.activeRenderer=rendered instanceof Blob?'custom':rendered.renderer;
    const nextUrl=this.createObjectURL(blob); const previousUrl=this.objectUrl; this.objectUrl=nextUrl; this.timeline=timeline; this.preparedKey=key; this.media.src=nextUrl; this.media.preload='auto'; this.media.currentTime=0; this.media.load(); if(previousUrl)this.revokeObjectURL(previousUrl);
  }
  get duration():number{return this.timeline?.totalDurationSeconds||0;}
  get renderer():'soundfont'|'basic'|'custom'|null{return this.activeRenderer;}
  get isPlaying():boolean{return Boolean(this.objectUrl)&&!this.media.paused&&!this.media.ended;}
  async play(fromSeconds=this.media.currentTime):Promise<void>{if(!this.objectUrl||!this.timeline)throw new Error('Bản nhạc chưa được chuẩn bị để phát.');const duration=this.duration;const requested=clampPosition(fromSeconds,duration);const next=duration>0&&requested>=duration?0:requested;if(Math.abs(this.media.currentTime-next)>.01)this.media.currentTime=next;await this.media.play();}
  pause():void{this.media.pause();}
  async toggle():Promise<void>{if(this.isPlaying)this.pause();else await this.play();}
  async seek(seconds:number):Promise<void>{if(!this.objectUrl)return;this.media.currentTime=clampPosition(seconds,this.duration);}
  stop():void{this.media.pause();if(this.objectUrl)this.media.currentTime=0;}
  getPosition():number{return this.objectUrl?clampPosition(this.media.currentTime,this.duration):0;}
  dispose():void{this.loadGeneration++;this.media.pause();this.media.currentTime=0;this.media.src='';this.media.load();if(this.objectUrl)this.revokeObjectURL(this.objectUrl);this.objectUrl=null;this.timeline=null;this.preparedKey=null;this.activeRenderer=null;}
}
