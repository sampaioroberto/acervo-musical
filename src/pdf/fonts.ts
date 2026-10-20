import {PDFDocument,type PDFFont} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {FontFamily,FontSource,PrintSong,PdfIssue} from './types';
const names={sans:'NotoSans',serif:'NotoSerif',mono:'NotoSansMono'};
const cache=new Map<FontFamily,Promise<Uint8Array>>();
export const browserFonts:FontSource=family=>{
 if(!cache.has(family))cache.set(family,fetch(import.meta.env.BASE_URL+'fonts/'+names[family]+'-Regular.ttf').then(r=>{if(!r.ok)throw new Error('Não foi possível carregar a fonte.');return r.arrayBuffer()}).then(b=>new Uint8Array(b)).catch(e=>{cache.delete(family);throw e}));
 return cache.get(family)!;
};
export async function createPdfFont(fonts:FontSource,family:FontFamily){const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(await fonts(family),{subset:true});return {doc,font};}
export function unsupportedGlyphs(songs:readonly PrintSong[],font:PDFFont):PdfIssue[]{
 const chars=new Set(font.getCharacterSet());const affected=songs.filter(s=>[...s.title+s.artist+s.content].some(c=>!['\n','\r','\t'].includes(c)&&!chars.has(c.normalize('NFC').codePointAt(0)!)));
 return affected.length?[{code:'unsupported-character',songIds:affected.map(s=>s.id),message:'Há caracteres que esta fonte não possui. Revise o texto ou escolha outra fonte.'}]:[];
}

