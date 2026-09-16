import { prepareComposition, generateLeadSheet, generateArrangement } from '../../server/music/composer';
import { extractSongDNA } from '../../server/music/song-dna';

const idea = `Một ca khúc V-Pop Ballad bằng tiếng Việt về nỗi nhớ nhà của một người đi xa.

Không khí sâu lắng, ấm áp và giàu cảm xúc, không bi lụy. Hình ảnh chính gồm con đường nhỏ về nhà, hàng cau, vườn cây, cơn mưa và dáng người cha đã hao gầy theo năm tháng nhưng vẫn lặng lẽ chăm sóc khu vườn cho con cháu.

Bài hát cần có lời tiếng Việt tự nhiên, dễ hát, giàu hình ảnh nhưng không sáo rỗng. Điệp khúc phải dễ nhớ, có một câu hook rõ ràng về cảm giác “bình yên là được trở về nhà”.

Giai điệu trữ tình, có cao trào rõ ở điệp khúc. Hòa âm hiện đại theo phong cách V-Pop Ballad. Phối khí tinh tế, ưu tiên piano, strings, acoustic guitar và rhythm section nhẹ.`;

const run = async () => {
  try {
    console.log("1. Prepare");
    const step2 = await prepareComposition(idea, "STYLE.VN.VPOP-BALLAD");
    
    const fs = await import('fs');
    fs.writeFileSync('golden-01-vpop-step1-2.json', JSON.stringify({
      songRequest: step2.songRequest,
      metaPlan: step2.metaPlan,
      planSummary: step2.planSummary,
      composePrompt: step2.composePrompt,
      arrangePrompt: step2.arrangePrompt,
      composeDocRefs: step2.composeDocRefs,
      arrangeDocRefs: step2.arrangeDocRefs,
    }, null, 2));

    console.log("2. Lead Sheet");
    const lead = await generateLeadSheet(step2.composePrompt, step2.composeDocRefs, step2.metaPlan, step2.songRequest, step2.style.id);
    fs.writeFileSync('golden-01-vpop-lead.musicxml', lead);
    const leadDna = extractSongDNA(lead);
    console.log(`Lead Sheet measures (master part): ${leadDna.melody.length > 0 ? leadDna.melody[leadDna.melody.length - 1].measure : 0}`);
    console.log(`Lead Sheet duration (estimated): ${Math.round(leadDna.musical.approximateDuration || 0)} seconds`);

    console.log("3. Arrangement");
    const arranged = await generateArrangement(lead, step2.arrangePrompt, step2.arrangeDocRefs, step2.songRequest, step2.style.id);
    fs.writeFileSync('golden-01-vpop-arranged.musicxml', arranged);
    const arrDna = extractSongDNA(arranged);
    console.log(`Arrangement measures (master part): ${arrDna.melody.length > 0 ? arrDna.melody[arrDna.melody.length - 1].measure : 0}`);
    console.log(`Arrangement duration (estimated): ${Math.round(arrDna.musical.approximateDuration || 0)} seconds`);

    console.log("Done");
  } catch(e: any) {
    console.error(e);
    if (e.xml) {
      const fs = await import('fs');
      if (e.message.includes('Lead Sheet')) {
        fs.writeFileSync('golden-01-vpop-lead.musicxml', e.xml);
        console.log("Wrote failed Lead Sheet to golden-01-vpop-lead.musicxml");
      } else {
        fs.writeFileSync('golden-01-vpop-arranged.musicxml', e.xml);
        console.log("Wrote failed Arrangement to golden-01-vpop-arranged.musicxml");
      }
    }
  }
};

run();
