---
id: CRAFT.PRINCIPLES
type: meta
status: active
version: "1.0"
tags: [prompt-craft]
serves-steps: [1]
last-updated: "2026-09-07"
---

# Principles — Prompt craft

## Preserve user intent

Giữ nguyên yêu cầu tường minh. Mơ hồ → ghi cần hỏi / `REQUIRES_CONFIRMATION`, không tự bịa thành yêu cầu user.

## Tách vai trò

| Artifact | Trả lời |
|----------|---------|
| Meta-prompt (Bước 1) | AI Bước 2 phải làm gì với kho? |
| Compose / arrange prompt (Bước 2) | AI Bước 3/4 sáng tác / phối thế nào + đọc trang nào? |
| Yêu cầu bài hát (Bước 3) | Bài này về gì? |

## DOC_REFS, không dump

Meta-prompt phải **bắt buộc** AI Bước 2 lấy trang từ catalog (id/path/url), không copy cả kho vào prompt.

## Hai prompt, hai đầu ra

Compose: lời + nhạc lead sheet. Arrange: phối trên MusicXML Bước 3. Không gộp thành một Composer “làm hết”.

## Schema dùng chung

Nhắc AI Bước 2 nhúng / tôn trọng [song-request-schema](../meta/song-request-schema.md) trong hai prompt — đặc biệt `REFERENCE_STYLE`, `CONSTRAINTS`, `OUTPUT`.
