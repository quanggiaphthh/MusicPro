import { lockLeadMelodyPart } from './master-identity-lock.ts';
import {
  buildProductionReadiness,
  buildQualityRetryFeedback,
  evaluateArrangementQuality,
  evaluateCompositionQuality,
} from './production-quality.ts';
import type {
  AutoComposeEvent,
  AutoComposeStepSummary,
  AutoCompositionContext,
  ProductionReadinessReport,
  QualityReport,
} from './types.ts';

export interface AutoComposeInput {
  idea: string;
  styleId: string;
}

export interface AutoComposeOptions {
  fetchImpl?: typeof fetch;
  onEvent?: (event: AutoComposeEvent) => void | Promise<void>;
  maxQualityRetries?: number;
  signal?: AbortSignal;
}

export interface AutoComposeResult {
  leadSheetXml: string;
  finalXml: string;
  context: AutoCompositionContext;
  compositionQuality: QualityReport;
  arrangementQuality: QualityReport;
  readiness: ProductionReadinessReport;
  songDna: unknown;
  blueprint: unknown;
  identityLock: { partId: string; changed: boolean; mode: 'lead-part-and-score-part-exact' };
}

async function readJson(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data?.error?.message || data?.error || `HTTP ${response.status}`);
    error.code = data?.error?.code;
    error.payload = data;
    throw error;
  }
  return data;
}

function request(fetchImpl: typeof fetch, url: string, body: unknown, signal?: AbortSignal): Promise<any> {
  return fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }).then(readJson);
}

function summary(title: string, items: Array<[string, unknown]>, quality?: QualityReport): AutoComposeStepSummary {
  return {
    title,
    items: items
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
      .map(([label, value]) => ({ label, value: String(value) })),
    quality,
  };
}

export async function runAutoComposition(input: AutoComposeInput, options: AutoComposeOptions = {}): Promise<AutoComposeResult> {
  const fetchImpl = options.fetchImpl || fetch;
  const maxQualityRetries = Math.max(0, options.maxQualityRetries ?? 1);
  const emit = async (event: Omit<AutoComposeEvent, 'at'>) => {
    await options.onEvent?.({ ...event, at: Date.now() });
  };
  const requestWithHeartbeat = async (
    step: 1|2|3|4,
    progress: number,
    label: string,
    detail: string,
    url: string,
    body: unknown,
  ) => {
    const started = Date.now();
    await emit({ kind:'progress', step, progress, label, detail:`${detail} · server vẫn đang xử lý`, indeterminate:true });
    const timer = setInterval(() => {
      const seconds = Math.round((Date.now()-started)/1000);
      void emit({ kind:'progress', step, progress, label, detail:`${detail} · server vẫn đang xử lý (${seconds}s)`, indeterminate:true });
    }, 10000);
    try {
      return await request(fetchImpl, url, body, options.signal);
    } finally {
      clearInterval(timer);
    }
  };
  if (!input.idea.trim()) throw new Error('Vui lòng nhập ý tưởng bài hát.');

  await emit({ kind:'progress', step:1, progress:3, label:'Bước 1 · Hiểu ý tưởng', detail:'Đang phân tích chủ đề, cảm xúc, câu chuyện và định hướng bài hát.' });
  const prepared = await requestWithHeartbeat(1, 5, 'Bước 1 · Hiểu ý tưởng', 'Đang phân tích yêu cầu và lập phương án', '/api/compose/prepare', { idea: input.idea, styleId: input.styleId });
  const songRequest = prepared.songRequest || {};
  await emit({
    kind:'step-summary', step:1, progress:14, label:'Bước 1 hoàn tất',
    summary: summary('Đã hiểu ý tưởng', [
      ['Chủ đề', songRequest.concept], ['Cảm xúc', songRequest.emotion], ['Ngôn ngữ', songRequest.language],
      ['Thể loại', songRequest.genre], ['Câu chuyện', songRequest.story], ['Hình thức', songRequest.songForm],
    ]),
  });
  const preparedContext: AutoCompositionContext = {
    metaPlan: prepared.metaPlan || '',
    composePrompt: prepared.composePrompt || '',
    arrangePrompt: prepared.arrangePrompt || '',
    composeDocRefs: prepared.composeDocRefs || [],
    arrangeDocRefs: prepared.arrangeDocRefs || [],
    planSummary: prepared.planSummary || '',
    songRequest,
  };
  await emit({
    kind:'step-summary', step:2, progress:23, label:'Bước 2 hoàn tất', context:preparedContext,
    summary: summary('Phương án sáng tác', [
      ['Tóm tắt', prepared.planSummary],
      ['Tài liệu sáng tác', `${(prepared.composeDocRefs || []).length} tài liệu`],
      ['Tài liệu phối khí', `${(prepared.arrangeDocRefs || []).length} tài liệu`],
      ['Phong cách', prepared.style?.displayName || input.styleId],
    ]),
  });

  const baseComposePrompt = prepared.composePrompt;
  const composePrompt = baseComposePrompt;
  let leadSheetXml = '';
  let leadAnalysis: any = null;
  let compositionQuality!: QualityReport;
  await emit({ kind:'progress', step:3, progress:28, label:'Bước 3 · Bản nhạc', detail:'Đang sáng tác lời, giai điệu, hòa âm và piano reduction.' });
  const lead = await requestWithHeartbeat(3, 32, 'Bước 3 · Bản nhạc', 'Server đang dựng Lead Sheet hoàn chỉnh', '/api/compose/lead-sheet', {
    composePrompt, composeDocRefs: prepared.composeDocRefs || [], metaPlan: prepared.metaPlan || '', songRequest, styleId: input.styleId,
  });
  leadSheetXml = String(lead.xml || '');
  await emit({ kind:'progress', step:3, progress:46, label:'Bước 3 · Kiểm tra', detail:'MusicXML đã sinh xong; đang phân tích SongDNA và quality gate.' });
  leadAnalysis = await requestWithHeartbeat(3, 49, 'Bước 3 · Quality audit', 'Đang trích SongDNA và chấm quality contract', '/api/music/blueprint', { musicXml: leadSheetXml, style: input.styleId, idea: input.idea });
  compositionQuality = evaluateCompositionQuality({ xml:leadSheetXml, songDna:leadAnalysis.songDNA || {}, songRequest });
  await emit({ kind:'quality', step:3, progress:53, label:`Composition Quality Gate · ${compositionQuality.status}`, quality:compositionQuality });
  if (compositionQuality.status !== 'PASS') {
    await emit({
      kind:'artifact', step:3, progress:55, label:'Bước 3 cần rà soát', xml:leadSheetXml, songDna:leadAnalysis?.songDNA, blueprint:leadAnalysis?.blueprint, quality:compositionQuality,
      summary: summary('Lead Sheet tốt nhất hiện có', [
        ['Thời lượng', `${Math.round(Number(leadAnalysis?.songDNA?.musical?.approximateDuration || 0))} giây`],
        ['Quality', `${compositionQuality.status} · ${compositionQuality.score}/100`],
        ['Trạng thái', 'Đã bảo toàn candidate cuối; dừng trước phối khí để không production hóa một composition chưa đạt gate.'],
      ], compositionQuality),
    });
    await emit({ kind:'halted', step:3, progress:56, label:'Dừng tại Bước 3', detail:compositionQuality.summary, quality:compositionQuality });
    throw Object.assign(new Error(compositionQuality.summary), { code:'COMPOSITION_QUALITY_FAILED', quality:compositionQuality, xml:leadSheetXml, songDna:leadAnalysis?.songDNA, blueprint:leadAnalysis?.blueprint });
  }
  await emit({
    kind:'artifact', step:3, progress:56, label:'Bước 3 hoàn tất', xml:leadSheetXml, songDna:leadAnalysis?.songDNA, blueprint:leadAnalysis?.blueprint,
    quality:compositionQuality,
    summary: summary('Bản nhạc / Lead Sheet', [
      ['Thời lượng', `${Math.round(Number(leadAnalysis?.songDNA?.musical?.approximateDuration || 0))} giây`],
      ['BPM', leadAnalysis?.songDNA?.musical?.tempoBpm], ['Giọng', `${leadAnalysis?.songDNA?.musical?.key || ''} ${leadAnalysis?.songDNA?.musical?.mode || ''}`.trim()],
      ['Nhịp', leadAnalysis?.songDNA?.musical?.timeSignature], ['Section', leadAnalysis?.songDNA?.structure?.length || 0],
      ['Quality', `${compositionQuality.status} · ${compositionQuality.score}/100`],
    ], compositionQuality),
  });

  const baseArrangePrompt = prepared.arrangePrompt;
  let arrangePrompt = baseArrangePrompt;
  let finalXml = '';
  let finalAnalysis: any = null;
  let arrangementQuality!: QualityReport;
  let identityLock = { partId:'', changed:false, mode:'lead-part-and-score-part-exact' as const };
  for (let attempt=0; attempt<=maxQualityRetries; attempt++) {
    await emit({ kind:'progress', step:4, progress:attempt?70:62, label:'Bước 4 · Phối khí', detail:attempt?'Đang phối khí lại theo quality feedback.':'Đang tạo full arrangement và giữ khóa melody/lyrics/harmony.' });
    const arranged = await requestWithHeartbeat(4, attempt?72:66, 'Bước 4 · Phối khí', 'Model đang dựng full arrangement', '/api/compose/arrange', {
      leadSheetXml, arrangePrompt, arrangeDocRefs:prepared.arrangeDocRefs || [], songRequest, styleId:input.styleId,
    });
    const rawArrangementXml = String(arranged.xml || '');
    const melodyPartId = String(leadAnalysis?.songDNA?.selectedMelodyPartId || '').trim();
    if (!melodyPartId) {
      throw Object.assign(new Error('SongDNA không xác định được lead melody part để khóa master identity.'), { code:'MASTER_IDENTITY_PART_NOT_FOUND' });
    }
    const locked = lockLeadMelodyPart({ leadXml:leadSheetXml, arrangedXml:rawArrangementXml, melodyPartId });
    finalXml = locked.xml;
    identityLock = { partId:locked.partId, changed:locked.changed, mode:'lead-part-and-score-part-exact' };
    await emit({ kind:'progress', step:4, progress:81, label:'Bước 4 · Master identity lock', detail:locked.changed?`Đã phục hồi nguyên vẹn part ${locked.partId} từ Lead Sheet trước quality audit.`:`Part ${locked.partId} đã giữ nguyên; không cần thay thế.` });
    await emit({ kind:'progress', step:4, progress:84, label:'Bước 4 · Kiểm tra', detail:'Đang đánh giá identity preservation, instrumentation, texture và importer readiness.' });
    finalAnalysis = await requestWithHeartbeat(4, 87, 'Bước 4 · Quality audit', 'Đang trích SongDNA và kiểm tra production readiness', '/api/music/blueprint', { musicXml:finalXml, style:input.styleId, idea:input.idea });
    arrangementQuality = evaluateArrangementQuality({
      xml:finalXml, songDna:finalAnalysis.songDNA || {}, leadDna:leadAnalysis?.songDNA || {}, leadXml:leadSheetXml, songRequest,
    });
    await emit({ kind:'quality', step:4, progress:91, label:`Arrangement Quality Gate · ${arrangementQuality.status}`, quality:arrangementQuality });
    if (arrangementQuality.status === 'PASS') break;
    if (attempt >= maxQualityRetries) {
      const failedReadiness = buildProductionReadiness(compositionQuality, arrangementQuality);
      await emit({
        kind:'artifact', step:4, progress:96, label:'Bước 4 cần rà soát', xml:finalXml, songDna:finalAnalysis?.songDNA, blueprint:finalAnalysis?.blueprint, quality:arrangementQuality, readiness:failedReadiness, identityLock,
        summary: summary('Bản phối tốt nhất hiện có', [
          ['Nhạc cụ / part', finalAnalysis?.songDNA?.instrumentation?.length || 0],
          ['Arrangement Quality', `${arrangementQuality.status} · ${arrangementQuality.score}/100`],
          ['Production readiness', `${failedReadiness.status} · ${failedReadiness.score}/100`],
          ['Trạng thái', 'Đã bảo toàn candidate cuối để nghe/chỉnh; không gắn nhãn READY FOR PRODUCTION.'],
        ], arrangementQuality),
      });
      await emit({ kind:'halted', step:4, progress:97, label:'Dừng tại Bước 4', detail:failedReadiness.summary, quality:arrangementQuality, readiness:failedReadiness });
      throw Object.assign(new Error(arrangementQuality.summary), { code:'ARRANGEMENT_QUALITY_FAILED', quality:arrangementQuality, readiness:failedReadiness, identityLock, xml:finalXml, songDna:finalAnalysis?.songDNA, blueprint:finalAnalysis?.blueprint });
    }
    arrangePrompt = `${baseArrangePrompt}\n\n${buildQualityRetryFeedback(arrangementQuality)}`;
    await emit({ kind:'retry', step:4, progress:68, label:'Bước 4 · Quality retry', detail:'Bản phối chưa đạt production gate; hệ thống tự phối lại một lần.' });
  }

  const readiness = buildProductionReadiness(compositionQuality, arrangementQuality);
  await emit({
    kind:'artifact', step:4, progress:97, label:'Bước 4 hoàn tất', xml:finalXml, songDna:finalAnalysis?.songDNA, blueprint:finalAnalysis?.blueprint,
    quality:arrangementQuality, readiness, identityLock,
    summary: summary('Bản phối hoàn chỉnh', [
      ['Nhạc cụ / part', finalAnalysis?.songDNA?.instrumentation?.length || 0],
      ['Thời lượng', `${Math.round(Number(finalAnalysis?.songDNA?.musical?.approximateDuration || 0))} giây`],
      ['Giữ giai điệu', arrangementQuality.checks.find(item=>item.id==='melody-preservation')?.status.toUpperCase()],
      ['Giữ lời', arrangementQuality.checks.find(item=>item.id==='lyrics-preservation')?.status.toUpperCase()],
      ['Arrangement Quality', `${arrangementQuality.status} · ${arrangementQuality.score}/100`],
      ['Production readiness', `${readiness.status} · ${readiness.score}/100`],
    ], arrangementQuality),
  });
  await emit({ kind:'complete', step:4, progress:100, label:readiness.label, detail:readiness.summary, readiness });

  return {
    leadSheetXml, finalXml,
    context: {
      metaPlan: prepared.metaPlan || '', composePrompt:baseComposePrompt, arrangePrompt:baseArrangePrompt,
      composeDocRefs:prepared.composeDocRefs || [], arrangeDocRefs:prepared.arrangeDocRefs || [], planSummary:prepared.planSummary || '', songRequest,
    },
    compositionQuality, arrangementQuality, readiness,
    songDna:finalAnalysis?.songDNA, blueprint:finalAnalysis?.blueprint, identityLock,
  };
}
