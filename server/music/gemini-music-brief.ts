import { ProductionBlueprint } from './types';

function roleLines(blueprint: ProductionBlueprint): string {
  const entries = Object.entries(blueprint.arrangement.roles || {});
  return entries.length ? entries.map(([instrument, role]) => `- ${instrument}: ${role}`).join('\n') : '- Chưa có role map';
}

export function buildGeminiMusicBrief(blueprint: ProductionBlueprint): string {
  const m = blueprint.musical;
  const brief = `Hãy tạo một bản thu dựa trên các thông tin âm nhạc dưới đây, được trích xuất từ bản master MusicXML. Bản thu AI này là một bản interpretation, nhưng ưu tiên cao nhất là giữ nhận diện của bài hát; không sáng tác thành một bài khác.

THÔNG TIN ÂM NHẠC
- Giọng (Key/Mode): ${m.key || 'Không xác định'} ${m.mode || ''}
- BPM: ${m.tempo || 'Không xác định'}
- Nhịp (Meter): ${m.meter || 'Không xác định'}
- Quãng giọng (Vocal Range): ${m.vocalRange || 'Không xác định'}
- Thời lượng dự kiến: ${m.targetDuration ? Math.round(m.targetDuration) + ' giây' : 'Không xác định'}
- Phong cách: ${blueprint.identity.genre}

CẤU TRÚC BÀI HÁT
${blueprint.structure.map(s => `- ${s.name} (Từ ô nhịp ${s.start} - ${s.end})`).join('\n')}

GIAI ĐIỆU CẦN GIỮ
- Motif mở đầu: ${blueprint.melodyIdentity.mainMotif || 'Không có'}
${blueprint.melodyIdentity.chorusHook ? `- Chorus Hook: ${blueprint.melodyIdentity.chorusHook}` : ''}
- Rhythmic fingerprint (nhịp điệu motif): [${blueprint.melodyIdentity.normalizedRhythm?.join(', ') || ''}]
- Hướng phát triển (Contour): ${blueprint.melodyIdentity.contour || 'Không xác định'}
- Yêu cầu đặc biệt: ${blueprint.melodyIdentity.constraints}

HÒA ÂM (Chord Progression)
${blueprint.harmony.map(h => `- ${h.section}: ${h.progression.join(' | ') || 'Không có'}`).join('\n')}

PHỐI KHÍ
- Nhạc cụ: ${blueprint.arrangement.instruments.join(', ') || 'Tự do'}
- Energy curve: ${blueprint.arrangement.energyCurve || 'Theo cấu trúc bài'}
${blueprint.arrangement.productionDirection ? `- Ghi chú phối khí: ${blueprint.arrangement.productionDirection}` : ''}

VAI TRÒ NHẠC CỤ
${roleLines(blueprint)}

LỜI BÀI HÁT EXACT
${blueprint.lyrics.exactLyrics ? blueprint.lyrics.exactLyrics : '(Không có lời bài hát)'}
`;
  return brief;
}

export function buildLyriaPrompt(blueprint: ProductionBlueprint): string {
  const m = blueprint.musical;
  const style = blueprint.identity.genre || 'pop';
  let p = `Strongly preserve the supplied melodic identity, especially the opening motif and chorus hook. Keep the rhythmic contour and phrase cadences as close as possible while allowing natural performance interpretation.\n`;
  p += `Generate a high-fidelity full audio interpretation in the style of ${style}.\n`;
  if (m.tempo) p += `BPM: ${m.tempo}.\n`;
  if (m.key) p += `Key: ${m.key} ${m.mode || ''}.\n`;
  if (m.meter) p += `Meter: ${m.meter}.\n`;
  if (m.vocalRange) p += `Vocal range: ${m.vocalRange}.\n`;
  if (m.targetDuration) p += `Target duration: ~${Math.round(m.targetDuration)}s.\n`;
  if (blueprint.arrangement.instruments?.length > 0) p += `Instrumentation: ${blueprint.arrangement.instruments.join(', ')}.\n`;
  if (blueprint.arrangement.energyCurve) p += `Energy curve: ${blueprint.arrangement.energyCurve}.\n`;
  const roles = Object.entries(blueprint.arrangement.roles || {});
  if (roles.length) p += `Instrument roles:\n${roles.map(([instrument, role]) => `- ${instrument}: ${role}`).join('\n')}\n`;
  if (blueprint.arrangement.productionDirection) p += `Production notes: ${blueprint.arrangement.productionDirection}\n`;
  if (blueprint.structure?.length > 0) p += `Structure: ${blueprint.structure.map(s => s.name).join(' -> ')}.\n`;
  if (blueprint.melodyIdentity.mainMotif) p += `Opening melodic motif: ${blueprint.melodyIdentity.mainMotif}\n`;
  if (blueprint.melodyIdentity.chorusHook) p += `Chorus hook: ${blueprint.melodyIdentity.chorusHook}\n`;
  if (blueprint.melodyIdentity.normalizedRhythm?.length > 0) p += `Rhythmic fingerprint: ${blueprint.melodyIdentity.normalizedRhythm.join(', ')}\n`;
  if (blueprint.melodyIdentity.contour) p += `Melodic contour: ${blueprint.melodyIdentity.contour}\n`;
  if (blueprint.melodyIdentity.cadences) p += `Phrase cadence: ${blueprint.melodyIdentity.cadences}\n`;
  if (blueprint.harmony?.length > 0) p += `Harmonic progression:\n${blueprint.harmony.map(h => `- ${h.section}: ${h.progression.join(' | ')}`).join('\n')}\n`;
  p += `\nLyrics to follow exactly:\n${blueprint.lyrics.exactLyrics || '(Instrumental)'}`;
  return p;
}
