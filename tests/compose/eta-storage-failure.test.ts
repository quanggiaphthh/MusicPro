import { recordEtaSample } from '../../src/compose/eta-history.ts';
const storage={getItem(){return null},setItem(){throw new Error('quota')}};
const value=recordEtaSample(180,storage);
if(value!==180)throw new Error(`ETA write failure must not affect run result: ${value}`);
console.log('PASS eta-storage-failure');
