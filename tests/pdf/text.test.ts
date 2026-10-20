// @vitest-environment node
import {it,expect} from 'vitest';import {PDFDocument} from 'pdf-lib';import fontkit from '@pdf-lib/fontkit';
import {fixtureFonts} from './fontFixtures';import {wrapText} from '../../src/pdf/text';
it('wraps a long word and preserves explicit empty stanzas',async()=>{const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(await fixtureFonts('sans'));const lines=wrapText('Uma palavra\n\n'+ 'A'.repeat(100),font,12,120);expect(lines).toContain('');expect(lines.join('').replace(/ /g,'')).toBe('Umapalavra'+'A'.repeat(100));expect(lines.every(l=>font.widthOfTextAtSize(l,12)<=120.001)).toBe(true)});

