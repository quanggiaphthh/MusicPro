import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  syncOsmdCursorToQuarter,
  type ScorePlaybackVisualState,
} from '../music/score-playback-visuals';

interface MusicXMLViewerProps {
  xmlContent: string;
  playback?: ScorePlaybackVisualState;
  recenterToken?: number;
}

function getCursorSvgElement(cursor: any): Element | null {
  const candidates = [
    cursor?.cursorElement,
    cursor?.CursorElement,
    cursor?.cursorElement?.element,
    cursor?.CursorElement?.element,
  ];
  return candidates.find(candidate => candidate instanceof Element) || null;
}

export const MusicXMLViewer: React.FC<MusicXMLViewerProps> = ({
  xmlContent,
  playback,
  recenterToken = 0,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastMeasureCursorQuarterRef = useRef<number | undefined>(undefined);
  const lastNoteCursorQuarterRef = useRef<number | undefined>(undefined);
  const glowTargetsRef = useRef<Set<Element>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderEpoch, setRenderEpoch] = useState(0);

  const clearGlowTargets = () => {
    for (const element of glowTargetsRef.current) {
      element.classList.remove('musicpro-note-glow');
    }
    glowTargetsRef.current.clear();
  };

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    if (!osmdRef.current) {
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawTitle: true,
        darkMode: true,
        pageBackgroundColor: '#050505',
      });
      osmd.setOptions({
        followCursor: false,
        cursorsOptions: [
          { type: 3, color: '#6366f1', alpha: 0.12, follow: false },
          { type: 0, color: '#a78bfa', alpha: 0.34, follow: false },
        ],
      } as any);
      if ('FollowCursor' in (osmd as any)) (osmd as any).FollowCursor = false;
      osmdRef.current = osmd;
    }

    if (!xmlContent) return;
    setLoading(true);
    setError(null);
    let content = xmlContent.trim();
    if (!content.startsWith('<?xml')) {
      content = `<?xml version="1.0" encoding="UTF-8"?>\n${content}`;
    }

    osmdRef.current
      .load(content)
      .then(() => {
        if (cancelled) return;
        const osmd: any = osmdRef.current;
        osmd?.render?.();
        try {
          if ('FollowCursor' in osmd) osmd.FollowCursor = false;
          osmd?.enableOrDisableCursors?.(true);
          for (const cursor of osmd?.cursors || []) {
            cursor?.reset?.();
            cursor?.hide?.();
            if (cursor?.CursorOptions) cursor.CursorOptions.follow = false;
          }
        } catch (cause) {
          console.warn('Score Theater cursors unavailable:', cause);
        }
        clearGlowTargets();
        lastMeasureCursorQuarterRef.current = undefined;
        lastNoteCursorQuarterRef.current = undefined;
        setRenderEpoch(value => value + 1);
      })
      .catch((cause: any) => {
        if (cancelled) return;
        console.error('OSMD Load Error:', cause);
        setError(cause?.message || 'Không thể hiển thị bản nhạc MusicXML.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [xmlContent]);

  useEffect(() => {
    const osmd: any = osmdRef.current;
    const cursors: any[] = osmd?.cursors || [];
    const measureCursor = cursors[0];
    const noteCursor = cursors[1];

    if (!measureCursor || !noteCursor || playback?.measureStartQuarter === undefined) {
      measureCursor?.hide?.();
      noteCursor?.hide?.();
      clearGlowTargets();
      lastMeasureCursorQuarterRef.current = undefined;
      lastNoteCursorQuarterRef.current = undefined;
      return;
    }

    try {
      if ('FollowCursor' in osmd) osmd.FollowCursor = false;
      if (measureCursor?.CursorOptions) measureCursor.CursorOptions.follow = false;
      if (noteCursor?.CursorOptions) noteCursor.CursorOptions.follow = false;

      const measureTarget = playback.measureStartQuarter;
      syncOsmdCursorToQuarter(
        measureCursor,
        measureTarget,
        lastMeasureCursorQuarterRef.current,
      );
      lastMeasureCursorQuarterRef.current = measureTarget;
      measureCursor.show?.();

      clearGlowTargets();
      const noteTarget = playback.activeOnsetQuarter;
      if (noteTarget === undefined || playback.activeEvents.length === 0) {
        noteCursor.hide?.();
        lastNoteCursorQuarterRef.current = undefined;
        return;
      }

      syncOsmdCursorToQuarter(
        noteCursor,
        noteTarget,
        lastNoteCursorQuarterRef.current,
      );
      lastNoteCursorQuarterRef.current = noteTarget;
      noteCursor.show?.();

      const graphicalNotes = noteCursor.GNotesUnderCursor?.() || [];
      for (const graphicalNote of graphicalNotes) {
        const element = graphicalNote?.getSVGGElement?.();
        if (element instanceof Element) {
          element.classList.add('musicpro-note-glow');
          glowTargetsRef.current.add(element);
        }
      }
    } catch (cause) {
      clearGlowTargets();
      noteCursor?.hide?.();
      console.warn('Score Theater note highlight unavailable:', cause);
    }
  }, [playback?.quarter, playback?.measureStartQuarter, playback?.activeOnsetQuarter, renderEpoch]);

  useEffect(() => {
    if (!recenterToken || !viewportRef.current || playback?.measureStartQuarter === undefined) return;

    const osmd: any = osmdRef.current;
    const noteCursor = osmd?.cursors?.[1];
    const measureCursor = osmd?.cursors?.[0];
    const graphicalNote = playback.activeOnsetQuarter !== undefined
      ? noteCursor?.GNotesUnderCursor?.()?.[0]
      : undefined;
    const noteElement = graphicalNote?.getSVGGElement?.();
    const measureElement = getCursorSvgElement(measureCursor);
    const anchor = noteElement instanceof Element ? noteElement : measureElement;
    if (!anchor) return;

    const viewport = viewportRef.current;
    const viewportRect = viewport.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const delta =
      anchorRect.top -
      viewportRect.top -
      viewport.clientHeight / 2 +
      anchorRect.height / 2;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({
      top: Math.max(0, viewport.scrollTop + delta),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [recenterToken]);

  useEffect(() => {
    return () => {
      clearGlowTargets();
      if (containerRef.current) containerRef.current.innerHTML = '';
      osmdRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full rounded-xl border border-white/10 bg-[#050505]">
      <style>{`
        .musicpro-score-viewport {
          scrollbar-gutter: stable;
        }

        .musicpro-score-viewport::-webkit-scrollbar {
          width: 10px;
        }

        .musicpro-score-viewport::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }

        .musicpro-score-viewport::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.45);
          border-radius: 999px;
          border: 2px solid #050505;
        }

        .musicpro-note-glow {
          filter:
            drop-shadow(0 0 3px rgba(167, 139, 250, 0.95))
            drop-shadow(0 0 8px rgba(99, 102, 241, 0.70));
          transition: filter 90ms linear;
        }

        @media (prefers-reduced-motion: reduce) {
          .musicpro-score-viewport {
          scrollbar-gutter: stable;
        }

        .musicpro-score-viewport::-webkit-scrollbar {
          width: 10px;
        }

        .musicpro-score-viewport::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }

        .musicpro-score-viewport::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.45);
          border-radius: 999px;
          border: 2px solid #050505;
        }

        .musicpro-note-glow {
            transition: none;
            filter: drop-shadow(0 0 3px rgba(167, 139, 250, 0.75));
          }
        }
      `}</style>
      {loading && (
        <div className="absolute right-3 top-3 z-20 rounded-md bg-black/70 px-2 py-1 text-[11px] text-zinc-400">
          Đang dựng bản nhạc…
        </div>
      )}
      {error && (
        <div className="m-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div
        ref={viewportRef}
        tabIndex={0}
        aria-label="Khung bản nhạc cuộn thủ công"
        className="musicpro-score-viewport h-[68vh] min-h-[420px] max-h-[820px] w-full overflow-y-auto overscroll-contain touch-pan-y rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
};
