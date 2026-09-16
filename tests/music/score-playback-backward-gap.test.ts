import { syncOsmdCursorToQuarter } from '../../src/music/score-playback-visuals.ts';

const quarters=[0,1,2,4,6];
let index=4;
let resetCount=0;
const iterator:any={};
Object.defineProperty(iterator,'currentTimeStamp',{get(){return {realValue:quarters[index]/4}}});
Object.defineProperty(iterator,'endReached',{get(){return index>=quarters.length-1}});
const cursor:any={
  iterator,
  reset(){resetCount++;index=0;},
  next(){if(index<quarters.length-1)index++;},
};

// Simulate a backward seek across a rest: UI lost previousQuarter, OSMD cursor did not.
const synced=syncOsmdCursorToQuarter(cursor,1,undefined);
if(resetCount!==1)throw new Error(`cursor ahead of target must reset even without previousQuarter; resets=${resetCount}`);
if(synced!==1)throw new Error(`expected cursor quarter 1 after backward seek, got ${synced}`);
console.log('PASS score-playback-backward-gap');
