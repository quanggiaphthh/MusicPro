import { buildInstrumentRoles, buildEnergyCurve } from '../../server/music/production-role-map.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const roles=buildInstrumentRoles(['Vocal','Piano','Electric Bass','Strings','Acoustic Guitar','Drums']);
assert(/lead vocal/i.test(roles.Vocal),'vocal role');
assert(/harmonic/i.test(roles.Piano),'piano harmonic role');
assert(/low-end/i.test(roles['Electric Bass']),'bass low-end role');
assert(/groove/i.test(roles.Drums),'drum groove role');
const energy=buildEnergyCurve([{name:'Verse 1',start:1,end:8},{name:'Pre-Chorus',start:9,end:12},{name:'Chorus',start:13,end:20},{name:'Bridge',start:21,end:28},{name:'Final Chorus',start:29,end:36},{name:'Outro',start:37,end:40}]);
assert(energy.includes('Verse 1: low-medium'),'verse energy');
assert(energy.includes('Final Chorus: peak'),'final chorus peak');
console.log('PASS production-role-map');
