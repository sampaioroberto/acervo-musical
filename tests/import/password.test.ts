// @vitest-environment node
import {it,expect,vi} from 'vitest';import {extractPdf} from '../../src/import/pdf';
vi.mock('../../src/pdf/pdfjs',()=>({getDocument:()=>({promise:Promise.reject(Object.assign(new Error('Password required'),{name:'PasswordException'})),destroy:async()=>{}})}));
it('reports encrypted input separately so the review can offer manual text',async()=>{await expect(extractPdf(new TextEncoder().encode('%PDF-').buffer)).rejects.toMatchObject({code:'encrypted'})});

