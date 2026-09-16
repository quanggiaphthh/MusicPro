import type { ScoreNoteEvent, ScorePartTimeline, ScoreTimeline } from '../music/score-timeline';
import { quarterToSeconds } from '../music/score-timeline';
import { scheduleSynthNote } from './synth';

interface TimedPlaybackEvent {
  note: ScoreNoteEvent;
  part: ScorePartTimeline;
  startSeconds: number;
  endSeconds: number;
}

const LOOKAHEAD_SECONDS = 6;

export function normalizePlaybackStart(fromSeconds: number, duration: number): number {
  const safeDuration = Math.max(0, duration);
  if (!Number.isFinite(fromSeconds) || fromSeconds < 0) return 0;
  if (safeDuration > 0 && fromSeconds >= safeDuration) return 0;
  return Math.min(fromSeconds, safeDuration);
}

export class ScorePlaybackEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timeline: ScoreTimeline | null = null;
  private playbackEvents: TimedPlaybackEvent[] = [];
  private scheduledSources = new Set<OscillatorNode>();
  private startedAtContextTime = 0;
  private offsetSeconds = 0;
  private nextEventIndex = 0;
  private playing = false;

  load(timeline: ScoreTimeline): void {
    this.stopScheduledSources();
    this.timeline = timeline;
    this.playbackEvents = timeline.parts
      .flatMap(part => part.events.map(note => ({
        note,
        part,
        startSeconds: quarterToSeconds(note.startQuarter, timeline.tempoMap),
        endSeconds: quarterToSeconds(note.startQuarter + note.durationQuarter, timeline.tempoMap),
      })))
      .sort((a, b) => a.startSeconds - b.startSeconds || a.note.midi - b.note.midi);
    this.offsetSeconds = 0;
    this.nextEventIndex = 0;
    this.playing = false;
  }

  get duration(): number {
    return this.timeline?.totalDurationSeconds || 0;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  async play(fromSeconds = this.offsetSeconds): Promise<void> {
    if (!this.timeline || this.timeline.totalDurationSeconds <= 0) return;
    const context = await this.ensureContext();
    this.stopScheduledSources();

    const offset = normalizePlaybackStart(fromSeconds, this.timeline.totalDurationSeconds);
    this.offsetSeconds = offset;
    this.startedAtContextTime = context.currentTime;
    this.playing = true;
    this.nextEventIndex = this.findFirstAudibleEventIndex(offset);
    this.scheduleWindow(offset, Math.min(this.duration, offset + LOOKAHEAD_SECONDS));
  }

  pause(): void {
    if (!this.playing) return;
    const position = this.getPosition();
    this.offsetSeconds = position;
    this.playing = false;
    this.stopScheduledSources();
  }

  async toggle(): Promise<void> {
    if (this.playing) this.pause();
    else await this.play();
  }

  async seek(seconds: number): Promise<void> {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    const next = Math.max(0, Math.min(safe, this.duration));
    const wasPlaying = this.playing;
    this.offsetSeconds = next;
    this.stopScheduledSources();
    this.playing = false;
    if (wasPlaying && next < this.duration) await this.play(next);
  }

  stop(): void {
    this.stopScheduledSources();
    this.offsetSeconds = 0;
    this.nextEventIndex = 0;
    this.playing = false;
  }

  getPosition(): number {
    if (!this.playing || !this.context) return Math.min(this.offsetSeconds, this.duration);
    const elapsed = this.context.currentTime - this.startedAtContextTime;
    const position = Math.max(0, this.offsetSeconds + elapsed);
    if (position >= this.duration) {
      this.offsetSeconds = this.duration;
      this.playing = false;
      this.stopScheduledSources();
      return this.duration;
    }

    this.scheduleWindow(position, Math.min(this.duration, position + LOOKAHEAD_SECONDS));
    return position;
  }

  dispose(): void {
    this.stop();
    if (this.context && this.context.state !== 'closed') {
      void this.context.close();
    }
    this.context = null;
    this.masterGain = null;
    this.timeline = null;
    this.playbackEvents = [];
  }

  private findFirstAudibleEventIndex(offset: number): number {
    for (let index = 0; index < this.playbackEvents.length; index++) {
      if (this.playbackEvents[index].endSeconds > offset) return index;
    }
    return this.playbackEvents.length;
  }

  private scheduleWindow(scoreNow: number, scoreUntil: number): void {
    if (!this.context || !this.timeline) return;
    const destination = this.masterGain || this.context.destination;
    const partScale = 1 / Math.max(1, Math.sqrt(this.timeline.parts.length));

    while (this.nextEventIndex < this.playbackEvents.length) {
      const event = this.playbackEvents[this.nextEventIndex];
      if (event.startSeconds > scoreUntil) break;
      this.nextEventIndex += 1;
      if (event.endSeconds <= scoreNow) continue;

      const audibleStart = Math.max(event.startSeconds, scoreNow);
      const anchoredStart = this.startedAtContextTime + Math.max(0, event.startSeconds - this.offsetSeconds);
      const startTime = event.startSeconds < scoreNow
        ? this.context.currentTime + 0.005
        : Math.max(this.context.currentTime + 0.005, anchoredStart);
      const duration = Math.max(0.03, event.endSeconds - audibleStart);
      const source = scheduleSynthNote(
        this.context,
        destination,
        event.note,
        event.part,
        startTime,
        duration,
        partScale,
      );
      this.scheduledSources.add(source);
      source.addEventListener('ended', () => this.scheduledSources.delete(source), { once: true });
    }
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) throw new Error('Trình duyệt này không hỗ trợ Web Audio.');
      this.context = new AudioContextCtor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.82;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }

  private stopScheduledSources(): void {
    for (const source of this.scheduledSources) {
      try {
        source.stop();
      } catch {
        // Source may already have ended.
      }
      try {
        source.disconnect();
      } catch {
        // Ignore disconnect failures on already-collected nodes.
      }
    }
    this.scheduledSources.clear();
  }
}
