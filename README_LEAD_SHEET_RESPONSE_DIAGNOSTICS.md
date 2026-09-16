# Music-Pro Lead Sheet Response Diagnostics

Purpose: capture the validator/generation diagnostics from the exact failed `/api/compose/lead-sheet` HTTP response, so Cloud Run instance routing cannot hide the evidence.

Changes:
- `server.ts`: always attaches a safe diagnostic object to the failed lead-sheet response.
- `src/utils/lead-sheet-diagnostics.ts`: strict parser/formatter for the response diagnostic object.
- `src/views/ComposeView.tsx`: stores the exact diagnostic object returned by the failed request and displays a copyable JSON panel at Step 3.
- Existing server-side diagnostic endpoint remains available but is no longer required for root-cause capture.

No generation logic, model routing, token limits, validator rules, SongDNA, Lyria, dependencies, or MusicXML acceptance criteria are changed.
