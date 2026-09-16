import {
  getCurrentMeasure,
  secondsToQuarter,
  type ScoreNoteEvent,
  type ScoreTimeline,
} from './score-timeline.ts';

export interface ScorePlaybackVisualState {
  seconds: number;
  quarter: number;
  measure?: number;
  measureStartQuarter?: number;
  activeOnsetQuarter?: number;
  activeEvents: ScoreNoteEvent[];
}

export interface ScoreCursorLike {
  reset?: () => void;
  next?: () => void;
  Iterator?: any;
  iterator?: any;
}

export function getPlaybackVisualState(
  timeline: ScoreTimeline,
  seconds: number,
): ScorePlaybackVisualState {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const quarter = secondsToQuarter(safeSeconds, timeline.tempoMap);
  const measure = getCurrentMeasure(timeline, safeSeconds);
  const measureStartQuarter = measure === undefined
    ? undefined
    : timeline.measureStarts.find(entry => entry.measure === measure)?.quarter;
  const activeEvents = timeline.parts.flatMap(part =>
    part.events.filter(event =>
      event.startQuarter <= quarter &&
      quarter < event.startQuarter + event.durationQuarter
    ),
  );
  const activeOnsetQuarter = activeEvents.length > 0
    ? Math.max(...activeEvents.map(event => event.startQuarter))
    : undefined;

  return {
    seconds: safeSeconds,
    quarter,
    measure,
    measureStartQuarter,
    activeOnsetQuarter,
    activeEvents,
  };
}

function readTimestampRealValue(value: any): number | undefined {
  const raw = value?.realValue ?? value?.RealValue;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function getOsmdCursorQuarter(cursor: ScoreCursorLike): number | undefined {
  const iterator = cursor.iterator ?? cursor.Iterator;
  const timestamp =
    iterator?.currentTimeStamp ??
    iterator?.CurrentTimeStamp ??
    iterator?.currentTimestamp ??
    iterator?.CurrentTimestamp;
  const realValue = readTimestampRealValue(timestamp);
  return realValue === undefined ? undefined : realValue * 4;
}

export function syncOsmdCursorToQuarter(
  cursor: ScoreCursorLike,
  targetQuarter: number,
  previousQuarter?: number,
): number | undefined {
  const target = Math.max(0, Number.isFinite(targetQuarter) ? targetQuarter : 0);
  let current = getOsmdCursorQuarter(cursor);

  // Reset not only when the caller remembers a previous later target, but also
  // when the OSMD iterator itself is currently ahead. The latter occurs after a
  // backward seek across a rest/gap: the UI may clear previousQuarter while the
  // hidden OSMD cursor remains physically positioned at the later note.
  if (
    (previousQuarter !== undefined && target < previousQuarter) ||
    (current !== undefined && current > target)
  ) {
    cursor.reset?.();
    current = getOsmdCursorQuarter(cursor);
  }

  let safety = 0;
  while (current !== undefined && current < target && safety < 10000) {
    const iterator = cursor.iterator ?? cursor.Iterator;
    const endReached = iterator?.endReached ?? iterator?.EndReached;
    if (endReached) break;

    cursor.next?.();
    const next = getOsmdCursorQuarter(cursor);
    if (next === undefined || next <= current) break;
    current = next;
    safety += 1;
  }

  return current;
}
