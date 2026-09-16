export interface StoreZipEntry { name: string; data: Uint8Array; }
const textEncoder = new TextEncoder();
function u16(value:number):number[]{ return [value&255,(value>>>8)&255]; }
function u32(value:number):number[]{ return [value&255,(value>>>8)&255,(value>>>16)&255,(value>>>24)&255]; }
function crc32(bytes:Uint8Array):number { let crc=0xffffffff; for(const byte of bytes){ crc^=byte; for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0); } return (crc^0xffffffff)>>>0; }
function concat(chunks:Uint8Array[]):Uint8Array { const total=chunks.reduce((sum,c)=>sum+c.length,0); const out=new Uint8Array(total); let offset=0; for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length;} return out; }
export function createStoreZip(entries:StoreZipEntry[]):Uint8Array {
  const ordered=[...entries].sort((a,b)=>a.name.localeCompare(b.name)); const locals:Uint8Array[]=[]; const centrals:Uint8Array[]=[]; let offset=0;
  for(const entry of ordered){
    const name=textEncoder.encode(entry.name.replace(/^\/+/,'')); const crc=crc32(entry.data); const flags=0x0800;
    const local=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(entry.data.length),...u32(entry.data.length),...u16(name.length),...u16(0),...name]);
    locals.push(local,entry.data);
    const central=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(entry.data.length),...u32(entry.data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
    centrals.push(central); offset+=local.length+entry.data.length;
  }
  const centralBytes=concat(centrals); const localBytes=concat(locals); const eocd=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(ordered.length),...u16(ordered.length),...u32(centralBytes.length),...u32(localBytes.length),...u16(0)]);
  return concat([localBytes,centralBytes,eocd]);
}
