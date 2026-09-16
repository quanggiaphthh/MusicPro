export function buildInstrumentRoles(instruments:string[]):Record<string,string>{
  const roles:Record<string,string>={};
  for(const raw of instruments){
    const name=String(raw||'Unknown');
    const lower=name.toLowerCase();
    let role='supporting texture; preserve section contrast and avoid masking the lead melody';
    if(/vocal|voice|singer|melody/.test(lower)) role='lead vocal / primary melodic identity; keep lyrics, phrasing and hook foregrounded';
    else if(/piano|keys|keyboard/.test(lower)) role='harmonic engine; rhythmic comp/pulse in sung sections, wider voicing and density in choruses';
    else if(/bass/.test(lower)) role='low-end foundation; outline harmony and lock with kick/groove without excessive fills';
    else if(/drum|percussion|trống|bộ gõ/.test(lower)) role='groove and dynamic lift; sparse in verses, fuller in choruses, controlled fills at transitions';
    else if(/guitar/.test(lower)) role='rhythmic/harmonic color; section-specific strum, picking or counter-texture';
    else if(/string|violin|viola|cello/.test(lower)) role='sustained/counter-melodic support; enter selectively and expand emotional lift in chorus/final chorus';
    else if(/pad|synth/.test(lower)) role='atmosphere and width; support rather than replace harmonic motion or rhythmic accompaniment';
    roles[name]=role;
  }
  return roles;
}

export function buildEnergyCurve(structure:Array<{name:string;start:number;end:number}>):string{
  const labels=structure.map(section=>{
    const n=section.name.toLowerCase();
    let energy='medium';
    if(/intro|mở đầu/.test(n))energy='low';
    else if(/verse|phiên khúc/.test(n))energy='low-medium';
    else if(/pre/.test(n))energy='rising';
    else if(/final.*chorus|chorus.*final/.test(n))energy='peak';
    else if(/chorus|điệp khúc/.test(n))energy='high';
    else if(/bridge|chuyển/.test(n))energy='contrast';
    else if(/outro|coda|ending|kết/.test(n))energy='release';
    return `${section.name}: ${energy}`;
  });
  return labels.join(' -> ');
}
