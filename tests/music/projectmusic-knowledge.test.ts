import { getCatalog, getForAi, getCoreDocsForStep, getDocsByRefs, getStyleCard, getCatalogCandidates } from "../../server/projectmusic/knowledge";

console.log("--- Testing ProjectMusic Knowledge Loader ---");

// Test 1: Load Catalog
const catalog = getCatalog();
if (!catalog || !catalog.pages || catalog.pages.length === 0) {
  throw new Error("Failed to load catalog or catalog is empty");
}
console.log(`✅ Loaded catalog with ${catalog.pages.length} pages`);

// Test 2: Load for-ai.md
const forAi = getForAi();
if (!forAi || !forAi.includes("ProjectMusic00")) {
  throw new Error("for-ai.md content invalid");
}
console.log("✅ Loaded for-ai.md");

// Test 3: getCoreDocsForStep(1)
const step1Docs = getCoreDocsForStep(1);
if (!step1Docs.includes("--- DOCUMENT: PIPE.STEP-01") || !step1Docs.includes("--- DOCUMENT: META.STANDARDS")) {
  throw new Error("Step 1 docs missing required core docs");
}
console.log("✅ Step 1 core docs loaded correctly");

// Test 4: getStyleCard
const styleCard = getStyleCard("STYLE.VN.VPOP-BALLAD");
if (!styleCard || !styleCard.includes("V-Pop Ballad")) {
  throw new Error("Failed to load style card for V-Pop Ballad");
}
console.log("✅ Style card loaded correctly");

// Test 5: getDocsByRefs
const docRefs = ["KNOW.MELODY.CONTOUR", "KNOW.HARMONY.CHORD-SUBSTITUTION"];
const refDocs = getDocsByRefs(docRefs);
if (!refDocs.includes("--- DOCUMENT: KNOW.MELODY.CONTOUR") || !refDocs.includes("--- DOCUMENT: KNOW.HARMONY.CHORD-SUBSTITUTION")) {
  throw new Error("getDocsByRefs failed");
}
console.log("✅ getDocsByRefs working");

// Test 6: getCatalogCandidates
const candidates = getCatalogCandidates(2);
if (candidates.length === 0 || !candidates[0].id) {
  throw new Error("getCatalogCandidates empty or invalid");
}
console.log("✅ getCatalogCandidates working");

console.log("🚀 ALL KNOWLEDGE LOADER TESTS PASSED");
