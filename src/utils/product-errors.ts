export type ProductErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_RATE_LIMITED'
  | 'INVALID_MUSICXML'
  | 'SECTION_MERGE_FAILED'
  | 'SOUNDFONT_UNAVAILABLE'
  | 'AUDIO_RENDER_FAILED'
  | 'LOCAL_STORAGE_FAILED'
  | 'CLOUD_SYNC_FAILED'
  | 'UNKNOWN';

export function normalizeProductErrorCode(error: any): ProductErrorCode {
  const code = String(error?.code || error?.error?.code || '').toUpperCase();
  const known: ProductErrorCode[] = [
    'PROVIDER_UNAVAILABLE','PROVIDER_RATE_LIMITED','INVALID_MUSICXML','SECTION_MERGE_FAILED',
    'SOUNDFONT_UNAVAILABLE','AUDIO_RENDER_FAILED','LOCAL_STORAGE_FAILED','CLOUD_SYNC_FAILED',
  ];
  if (known.includes(code as ProductErrorCode)) return code as ProductErrorCode;
  const message = String(error?.message || error?.error?.message || error || '').toLowerCase();
  if (/\b429\b|rate.?limit|too many requests/.test(message)) return 'PROVIDER_RATE_LIMITED';
  if (/\b503\b|unavailable|high demand|overloaded/.test(message)) return 'PROVIDER_UNAVAILABLE';
  if (/musicxml|xml parse|score-partwise/.test(message)) return 'INVALID_MUSICXML';
  if (/soundfont|sf2|sf3/.test(message)) return 'SOUNDFONT_UNAVAILABLE';
  if (/indexeddb|local storage|quota/.test(message)) return 'LOCAL_STORAGE_FAILED';
  return 'UNKNOWN';
}

export function productErrorMessage(code: ProductErrorCode, fallback?: string): string {
  switch (code) {
    case 'PROVIDER_UNAVAILABLE':
      return 'Máy chủ AI đang bận. Bản nhạc hiện tại vẫn an toàn; bạn có thể nghe, chỉnh sửa và xuất file rồi thử lại sau.';
    case 'PROVIDER_RATE_LIMITED':
      return 'Dịch vụ AI đang giới hạn tần suất. Bản nhạc hiện tại vẫn được giữ nguyên; hãy tiếp tục chỉnh sửa/xuất file và thử lại sau.';
    case 'INVALID_MUSICXML':
      return 'MusicXML không hợp lệ. Bản hợp lệ gần nhất vẫn được giữ; hãy hoàn tác hoặc khôi phục một phiên bản trước.';
    case 'SECTION_MERGE_FAILED':
      return 'Không thể ghép phần chỉnh sửa AI vào bản nhạc. MusicXML hiện tại không bị thay đổi.';
    case 'SOUNDFONT_UNAVAILABLE':
      return 'Không tải được bộ nhạc cụ mẫu. Music-Pro sẽ dùng bộ phát dự phòng; bản nhạc và file MusicXML không bị ảnh hưởng.';
    case 'AUDIO_RENDER_FAILED':
      return 'Không thể kết xuất âm thanh. MusicXML vẫn an toàn; bạn vẫn có thể tải MusicXML/MIDI và thử lại playback sau.';
    case 'LOCAL_STORAGE_FAILED':
      return 'Không lưu được dự án trên thiết bị. Bản nhạc đang mở vẫn còn trong phiên này; hãy xuất Project ZIP hoặc MusicXML để sao lưu.';
    case 'CLOUD_SYNC_FAILED':
      return 'Không đồng bộ được lên đám mây. Bản lưu cục bộ vẫn an toàn và có thể tiếp tục sử dụng.';
    default:
      return fallback || 'Có lỗi xảy ra. Bản nhạc hiện tại vẫn được giữ nguyên nếu đã tạo thành công.';
  }
}

export function productErrorText(error: any, fallback?: string): string {
  return productErrorMessage(normalizeProductErrorCode(error), fallback || error?.message);
}
