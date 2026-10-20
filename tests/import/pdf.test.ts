// @vitest-environment node
import {it,expect,vi} from 'vitest';import {readFile} from 'node:fs/promises';import {extractPdf} from '../../src/import/pdf';
vi.mock('../../src/pdf/pdfjs',()=>import('pdfjs-dist/legacy/build/pdf.mjs'));
it('rebuilds positioned chord spacing and separate stanzas from a real PDF',async()=>{const bytes=await readFile(new URL('../fixtures/cifra.pdf',import.meta.url));const r=await extractPdf(new Uint8Array(bytes).buffer);expect(r.text).toContain('C   G');expect(r.text).toContain('Voz e coração');expect(r.text).toContain('\n\nNovo verso');expect(r.text).toContain('Canção de teste')});
it('extracts no text from a blank page and rejects corrupt PDF bytes',async()=>{const bytes=await readFile(new URL('../fixtures/vazio.pdf',import.meta.url));expect((await extractPdf(new Uint8Array(bytes).buffer)).text).toBe('');await expect(extractPdf(new TextEncoder().encode('bad').buffer)).rejects.toThrow()});

