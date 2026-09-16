import { GENERAL_MIDI_PROGRAMS, generalMidiProgramName } from '../../src/music/general-midi';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

assert(GENERAL_MIDI_PROGRAMS.length === 128, 'General MIDI list must contain all 128 programs');
assert(GENERAL_MIDI_PROGRAMS[0]?.program === 1 && /Acoustic Grand Piano/i.test(GENERAL_MIDI_PROGRAMS[0]?.name || ''), 'program 1');
assert(GENERAL_MIDI_PROGRAMS[33]?.program === 34 && /Electric Bass.*finger/i.test(GENERAL_MIDI_PROGRAMS[33]?.name || ''), 'program 34');
assert(GENERAL_MIDI_PROGRAMS[48]?.program === 49 && /String Ensemble 1/i.test(GENERAL_MIDI_PROGRAMS[48]?.name || ''), 'program 49');
assert(generalMidiProgramName(128) === 'Gunshot', 'program 128 name');
assert(generalMidiProgramName(0) === 'Acoustic Grand Piano', 'clamp low');
console.log('GENERAL MIDI PROGRAM TESTS PASSED');
