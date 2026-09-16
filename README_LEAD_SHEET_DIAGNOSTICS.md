# Music-Pro Lead Sheet Runtime Diagnostics

Diagnostic-only instrumentation for the Step 3 lead-sheet failure.

Behavior changes:
- No composition/generation logic changes.
- On a failed `/api/compose/lead-sheet` request, capture a bounded diagnostic summary from the thrown error.
- In non-production only, expose the last captured failure at `GET /api/compose/diagnostics/lead-sheet`.
- The normal error response also includes `error.diagnostics` in non-production.

Captured fields:
- error code/message and validator summary
- final retry XML character length
- whether `</score-partwise>` exists
- `likelyTruncated` flag
- final 500 characters of the failed XML

This patch is intended to identify whether the fallback output is truncated versus structurally complete but validator-invalid. It does not weaken validation and does not change model routing, token limits, prompts, or retry behavior.
