import type {SongKind} from '../../src/catalog/types';
import type {PrintSong} from '../../src/pdf/types';
export function makePrintSongs(kind:SongKind,content:string):PrintSong[]{return [1,2,3,4].map(n=>({id:String(n),title:'Música '+n,artist:'Acervo Musical',kind,content}));}

