import {useEffect,useRef,useState} from 'react';
import type {PrintSong,LyricOptions,PdfResult} from './types';
import {generateLyricsPdf} from './lyrics';
import {generateChordsPdf} from './chords';
import {browserFonts} from './fonts';
type PreviewState={key:string;status:'loading'|'ready'|'invalid'|'error';result:PdfResult|null};
export function usePdfPreview(songs:readonly PrintSong[],options:LyricOptions){
 const key=JSON.stringify([songs,options]);const [state,setState]=useState<PreviewState>({key:'',status:'loading',result:null});
 const urls=useRef<string[]>([]);
 useEffect(()=>{let active=true;setState({key,status:'loading',result:null});
 const generation=songs[0]?.kind==='chords'?generateChordsPdf(songs,browserFonts):generateLyricsPdf(songs,options,browserFonts);
 generation.then(result=>{if(active)setState({key,status:result.ok?'ready':'invalid',result})}).catch(()=>{if(active)setState({key,status:'error',result:null})});return()=>{active=false};
 },[key]);
 useEffect(()=>()=>{urls.current.forEach(url=>URL.revokeObjectURL(url))},[]);
 const current:PreviewState=state.key===key?state:{key,status:'loading',result:null};
 function download(){if(current.status!=='ready'||!current.result?.ok)return;const url=URL.createObjectURL(new Blob([new Uint8Array(current.result.bytes)],{type:'application/pdf'}));urls.current.push(url);const anchor=document.createElement('a');anchor.href=url;anchor.download=songs[0]?.kind==='chords'?'acervo-cifras.pdf':'acervo-letras.pdf';document.body.append(anchor);anchor.click();anchor.remove();}
 return {...current,download};
}

