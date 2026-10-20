export type SongKind = 'lyrics' | 'chords';
export type SongStatus = 'draft' | 'published';
export type SongDraft = {title:string;artist:string;kind:SongKind;content:string};
export type Song = SongDraft & {id:string;status:SongStatus;createdAt:string;updatedAt:string};
export type CatalogQuery={kind:SongKind;search:string};
export type OriginalRef={id:string;path:string;name:string;mime:string;size:number};
export type AdminSong=Song & {original:OriginalRef|null};

