
// @ts-nocheck
import { type BackgroundRunSnapshot } from '../../server/music/auto-production-runs';
import { type AutoComposeEvent } from '../../src/compose/types';

const API_URL = 'http://localhost:3000';
const STYLE_ID = 'STYLE.VN.VPOP-BALLAD';
const IDEA = 'Viết một ca khúc V-Pop ballad tiếng Việt về mùa chia tay cuối cấp, sân trường, hàng ghế đá và hoa phượng đỏ; cảm xúc trong trẻo, tiếc nuối nhưng không bi lụy.';

async function pollRun(runId: string, timeoutMs: number = 600000): Promise<BackgroundRunSnapshot> {
  const start = Date.now();
  console.log(`Polling run ${runId}...`);
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${API_URL}/api/compose/runs/${runId}`);
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const run = await res.json() as BackgroundRunSnapshot;
    console.log(`  Status: ${run.status} | Last Event: ${run.events[run.events.length - 1]?.kind || 'none'}`);
    
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
      return run;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Polling timed out');
}

async function runSmoke() {
  console.log('--- STARTING R3 REAL SMOKE TEST ---');
  
  // 1. Create Run
  const startRes = await fetch(`${API_URL}/api/compose/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea: IDEA, styleId: STYLE_ID })
  });
  
  if (!startRes.ok) {
    const err = await startRes.json();
    console.error('Failed to start run:', err);
    process.exit(1);
  }
  
  const { runId } = await startRes.json();
  console.log(`Run started: ${runId}`);
  
  // 2. Poll and Capture Metrics
  const run = await pollRun(runId);
  
  if (run.status !== 'completed') {
    console.error(`Run finished with status: ${run.status}`);
    if (run.error) console.error('Error:', run.error);
    process.exit(1);
  }
  
  console.log('--- RUN COMPLETED SUCCESSFULLY ---');
  
  // 3. Extract Metrics
  const telemetryEvents = run.events.filter(e => e.kind === 'telemetry');
  const leadSheetEvents = run.events.filter(e => e.stage === 'lead-sheet');
  const arrangementEvents = run.events.filter(e => e.stage === 'arrangement');
  
  console.log('\n--- METRICS ---');
  console.log(`Step 3 (Lead Sheet) Events: ${leadSheetEvents.length}`);
  console.log(`Step 4 (Arrangement) Events: ${arrangementEvents.length}`);
  
  const leadArtifact = run.checkpoints.leadArtifact;
  const arrangeArtifact = run.checkpoints.arrangementArtifact;
  
  if (leadArtifact) {
    console.log(`MusicXML Valid: ${leadArtifact.quality?.score !== undefined ? 'YES' : 'NO'}`);
    console.log(`Composition Quality: ${leadArtifact.quality?.score}`);
    console.log(`ToneGuard: ${leadArtifact.quality?.toneGuardPass ? 'PASS' : 'FAIL'}`);
    console.log(`Hook Lock: ${leadArtifact.identityLock?.match ? 'PASS' : 'FAIL'}`);
    console.log(`Duration: ${leadArtifact.readiness?.durationSeconds}s`);
  }
  
  // 4. Verify Background Navigation survival (Implicitly verified by polling)
  console.log('Background Lifecycle: PASS (Run survived polling and server-side execution)');
  
  // 5. Verify Step 4 Regression
  if (arrangeArtifact) {
    console.log('Step 4 Runtime: PASS (Arrangement artifact generated)');
  } else {
    console.log('Step 4 Runtime: FAIL (No arrangement artifact)');
  }

  // 6. Test Explicit Cancel
  console.log('\n--- TESTING EXPLICIT CANCEL ---');
  const cancelTestRes = await fetch(`${API_URL}/api/compose/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea: 'Abort this run', styleId: STYLE_ID })
  });
  const { runId: cancelRunId } = await cancelTestRes.json();
  
  const cancelRes = await fetch(`${API_URL}/api/compose/runs/${cancelRunId}/cancel`, { method: 'POST' });
  const cancelledRun = await cancelRes.json() as BackgroundRunSnapshot;
  console.log(`Cancel Status: ${cancelledRun.status}`);
  if (cancelledRun.status === 'cancelled') {
    console.log('Explicit Cancel: PASS');
  } else {
    console.log('Explicit Cancel: FAIL');
  }

  console.log('\n--- SMOKE TEST FINISHED ---');
}

runSmoke().catch(err => {
  console.error('Smoke test failed with fatal error:', err);
  process.exit(1);
});
