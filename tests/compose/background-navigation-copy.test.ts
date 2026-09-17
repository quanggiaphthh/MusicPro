import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const source=fs.readFileSync('src/views/ComposeView.tsx','utf8');
assert(source.includes('có thể chuyển menu hoặc refresh'), 'Auto UI must tell users the local server run survives navigation/refresh');
assert(source.includes('chỉ nút “Dừng” mới hủy'), 'Auto UI must explain explicit cancel ownership');
console.log('PASS background-navigation-copy');
