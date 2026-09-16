import { prepareComposition, generateLeadSheet, generateArrangement } from '../../server/music/composer';

const runGoldenCase = async () => {
  try {
    console.log('--- STARTING GOLDEN CASE #1 ---');
    
    console.log('\\n1. Preparing Composition...');
    const step2 = await prepareComposition("Một bản V-Pop Ballad nhẹ nhàng, kể về một buổi chiều thu nhớ nhung.", "STYLE.VN.VPOP-BALLAD");
    console.log('Meta Plan:', step2.metaPlan.substring(0, 100) + '...');
    
    console.log('\\n2. Generating Lead Sheet...');
    const leadSheetXml = await generateLeadSheet(
      step2.composePrompt, 
      step2.composeDocRefs, 
      step2.metaPlan, 
      step2.songRequest, 
      step2.style.id
    );
    console.log('Lead Sheet XML Length:', leadSheetXml.length);
    const fs = await import('fs');
    fs.writeFileSync('golden-lead-sheet.xml', leadSheetXml);
    
    console.log('\\n3. Generating Arrangement...');
    const arrangedXml = await generateArrangement(
      leadSheetXml,
      step2.arrangePrompt,
      step2.arrangeDocRefs,
      step2.songRequest,
      step2.style.id
    );
    console.log('Arranged XML Length:', arrangedXml.length);
    fs.writeFileSync('golden-arranged.xml', arrangedXml);

    
    console.log('\\n--- DONE ---');
  } catch (err) {
    console.error('Error running Golden Case:', err);
  }
};

runGoldenCase();
