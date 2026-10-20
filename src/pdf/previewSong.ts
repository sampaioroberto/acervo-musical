import type {SongDraft} from '../catalog/types';import type {LyricOptions,FontSource,PdfResult} from './types';import {composeLyrics} from './lyrics';import {composeChords} from './chords';
export async function previewSongPdf(song:SongDraft,options:LyricOptions,fonts:FontSource):Promise<PdfResult>{
 if(!song.title.trim()||!song.content.trim())return {ok:false,issues:[{code:'selection',songIds:[],message:'Preencha o título e o conteúdo para ver a prévia.'}]};
 const printable={...song,id:'admin-preview'};return song.kind==='lyrics'?composeLyrics([printable],options,fonts):composeChords([printable],fonts);
}

