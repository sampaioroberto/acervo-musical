import type {SongKind} from '../catalog/types';
import {DocumentImportError,type ImportResult} from './types';
import {validateFiles,fileKind,MAX_FILE_SIZE} from './validate';
export async function importFile(file:File,kind:SongKind):Promise<ImportResult>{
 const validation=validateFiles([file]);if(validation.rejected.length)return {ok:false,code:file.size>MAX_FILE_SIZE?'size':fileKind(file)?'invalid':'unsupported',message:validation.rejected[0].message};
 try{
  const data=await file.arrayBuffer(),bytes=new Uint8Array(data),format=fileKind(file);
  if(format==='pdf'&&!new TextDecoder().decode(bytes.subarray(0,1024)).includes('%PDF-'))throw new DocumentImportError('invalid','O arquivo não contém um PDF válido.');
  if(format==='docx'&&(bytes[0]!==80||bytes[1]!==75))throw new DocumentImportError('invalid','O arquivo não contém um DOCX válido.');
  const result=format==='docx'?await(await import('./docx')).extractDocx(data):await(await import('./pdf')).extractPdf(data);
  if(!result.text.trim())return {ok:false,code:'empty',message:'Não encontrei texto neste arquivo. Você pode colar o conteúdo na revisão.'};
  return {ok:true,draft:{title:file.name.replace(/\.[^.]+$/,'').trim(),artist:'',kind,content:result.text},warnings:result.warnings};
 }catch(error){return error instanceof DocumentImportError?{ok:false,code:error.code,message:error.message}:{ok:false,code:'invalid',message:'Não foi possível importar este arquivo. Tente novamente ou cole o texto na revisão.'}}
}

