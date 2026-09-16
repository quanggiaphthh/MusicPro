import { buildSectionRevisionContext, classifySectionProviderError, mergeSectionReplacement } from '../../server/music/section-revision';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const source=`<score-partwise><part-list><score-part id="P1"><part-name>Piano</part-name></score-part><score-part id="P2"><part-name>Bass</part-name></score-part></part-list><part id="P1"><measure number="1"><note>A1</note></measure><measure number="2"><note>A2</note></measure><measure number="3"><note>A3</note></measure></part><part id="P2"><measure number="1"><note>B1</note></measure><measure number="2"><note>B2</note></measure><measure number="3"><note>B3</note></measure></part></score-partwise>`;
const replacement=`<section-revision><part id="P1"><measure number="2"><note>NEW-A2</note></measure></part><part id="P2"><measure number="2"><note>NEW-B2</note></measure></part></section-revision>`;
const merged=mergeSectionReplacement(source,replacement,2,2);
assert(merged.includes('A1')&&merged.includes('A3')&&merged.includes('B1')&&merged.includes('B3'),'outside preserved');
assert(merged.includes('NEW-A2')&&merged.includes('NEW-B2')&&!merged.includes('<note>A2</note>'),'range replaced');
assert(source.includes('<note>A2</note>'),'source immutable');
let threw=false;try{mergeSectionReplacement(source,`<section-revision><part id="P1"><measure number="2"/></part></section-revision>`,2,2);}catch(e:any){threw=e?.code==='SECTION_MERGE_FAILED';}assert(threw,'missing required part throws structured code');
threw=false;try{mergeSectionReplacement(source,'<broken>',2,2);}catch{threw=true;}assert(threw,'malformed replacement throws');
const context=buildSectionRevisionContext({musicXml:source,startMeasure:2,endMeasure:2,instruction:'Làm nhẹ hơn',styleId:'STYLE.VN.VPOP-BALLAD'});
assert(context.prompt.includes('Làm nhẹ hơn')&&context.prompt.includes('measure number="1"')&&context.prompt.includes('measure number="3"'),'prompt contains instruction + adjacent context');
assert(classifySectionProviderError({ status: 503 }).code === 'PROVIDER_UNAVAILABLE', '503 must classify provider unavailable');
assert(classifySectionProviderError({ status: 429 }).code === 'PROVIDER_RATE_LIMITED', '429 must classify rate limited');
assert(classifySectionProviderError(new Error('high demand, try again')).code === 'PROVIDER_UNAVAILABLE', 'high demand message must classify provider unavailable');
console.log('SECTION REVISION TESTS PASSED');
