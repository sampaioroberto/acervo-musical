// @vitest-environment node
import {it,expect} from 'vitest';
import {PDFDocument} from 'pdf-lib';
import {generateLyricsPdf} from '../../src/pdf/lyrics';
import {makePrintSongs} from './fixtures';
import {fixtureFonts} from './fontFixtures';
import type {FontFamily} from '../../src/pdf/types';
for(const family of ['sans','serif','mono'] as FontFamily[])it('prints four accented lyrics in one A4 page using '+family,async()=>{
 const r=await generateLyricsPdf(makePrintSongs('lyrics','Canção\nVoz e coração\n\nUma nova manhã'),{family,sizing:{mode:'manual',size:16}},fixtureFonts);
 expect(r).toMatchObject({ok:true,pageCount:1,fontSize:16});if(!r.ok)return;
 const pdf=await PDFDocument.load(r.bytes);expect(pdf.getPageCount()).toBe(1);expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.2756,3);expect(pdf.getPage(0).getHeight()).toBeCloseTo(841.8898,3);
});
it('finds a smaller font when sixteen does not fit and rejects overflow at nine',async()=>{
 const songs=makePrintSongs('lyrics',Array(25).fill('Uma linha da canção').join('\n'));
 const r=await generateLyricsPdf(songs,{family:'sans',sizing:{mode:'auto'}},fixtureFonts);expect(r.ok).toBe(true);if(r.ok){expect(r.fontSize).toBeLessThan(16);expect(r.fontSize).toBeGreaterThanOrEqual(9);}
 const manual=await generateLyricsPdf(songs,{family:'sans',sizing:{mode:'manual',size:16}},fixtureFonts);expect(manual.ok).toBe(false);
 const huge=await generateLyricsPdf(makePrintSongs('lyrics','Verso\n'.repeat(200)),{family:'sans',sizing:{mode:'auto'}},fixtureFonts);expect(huge).toMatchObject({ok:false,issues:[expect.objectContaining({code:'overflow',column:0}),expect.objectContaining({code:'overflow',column:1})]});
});
it('rejects invalid sizes, counts, mixed kinds and missing glyphs',async()=>{
 for(const size of [8,17,NaN,9.5])expect((await generateLyricsPdf(makePrintSongs('lyrics','Verso'),{family:'sans',sizing:{mode:'manual',size}},fixtureFonts)).ok).toBe(false);
 expect((await generateLyricsPdf(makePrintSongs('lyrics','Verso').slice(0,3),{family:'sans',sizing:{mode:'auto'}},fixtureFonts)).ok).toBe(false);
 expect((await generateLyricsPdf(makePrintSongs('chords','C'),{family:'sans',sizing:{mode:'auto'}},fixtureFonts)).ok).toBe(false);
 const glyph=await generateLyricsPdf(makePrintSongs('lyrics','Verso 🦄'),{family:'sans',sizing:{mode:'auto'}},fixtureFonts);expect(glyph).toMatchObject({ok:false,issues:[expect.objectContaining({code:'unsupported-character'})]});
});

