import { productErrorMessage, normalizeProductErrorCode } from '../../src/utils/product-errors.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
assert(normalizeProductErrorCode({code:'PROVIDER_UNAVAILABLE'})==='PROVIDER_UNAVAILABLE','preserve code');
assert(normalizeProductErrorCode({message:'429 too many requests'})==='PROVIDER_RATE_LIMITED','infer 429');
assert(productErrorMessage('SOUNDFONT_UNAVAILABLE').includes('bộ phát dự phòng'),'soundfont fallback guidance');
assert(productErrorMessage('PROVIDER_UNAVAILABLE').includes('Bản nhạc hiện tại vẫn an toàn'),'provider preserves score');
assert(normalizeProductErrorCode({code:'GENERATION_TIMEOUT'})==='GENERATION_TIMEOUT','preserve generation timeout code');
assert(productErrorMessage('GENERATION_TIMEOUT').includes('quá thời gian'),'timeout message must be user-facing Vietnamese');
console.log('PRODUCT ERROR TESTS PASSED');
