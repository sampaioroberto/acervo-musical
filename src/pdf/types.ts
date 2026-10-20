import type {SongDraft} from '../catalog/types';
export type PrintSong=SongDraft & {id:string};
export type FontFamily='sans'|'serif'|'mono';
export type LyricOptions={family:FontFamily;sizing:{mode:'auto'}|{mode:'manual';size:number}};
export type FontSource=(family:FontFamily)=>Promise<Uint8Array>;
export type PdfIssue={code:'selection'|'font-size'|'overflow'|'unsupported-character'|'font-load';songIds:string[];message:string;column?:0|1};
export type PdfResult={ok:true;bytes:Uint8Array;pageCount:number;fontSize:number}|{ok:false;issues:PdfIssue[]};

