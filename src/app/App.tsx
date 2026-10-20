import {useEffect,useMemo,useState} from 'react';
import {Music2,ArrowUpRight} from 'lucide-react';
import {CatalogPage} from '../catalog/CatalogPage';
import {createDemoRepository} from '../catalog/demoRepository';
import type {Song} from '../catalog/types';
import {readConfig} from './config';
export function App(){
 const [route,setRoute]=useState(location.hash),[composition,setComposition]=useState<Song[]|null>(null);
 const repository=useMemo(()=>createDemoRepository(),[]);
 useEffect(()=>{const update=()=>setRoute(location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);
 let config;try{config=readConfig(import.meta.env)}catch(error){return <main className="page"><h1>Configuração incompleta</h1><p role="alert">{(error as Error).message}</p></main>}
 return <><header className="site-header"><a className="brand" href="#/"><span className="brand-icon"><Music2 size={23}/></span><span>acervo<span className="brand-light">musical</span></span></a><nav aria-label="Navegação principal"><a className={!route.includes('admin')?'current':''} href="#/">Acervo</a><a href="#como-funciona">Como funciona</a><a className="admin-link" href="#/admin">Administração<ArrowUpRight size={15}/></a></nav></header>{config.mode==='demo'&&<div className="demo-banner"><span/>Modo de demonstração · Músicas autorais de exemplo. O acervo compartilhado ainda não está conectado.</div>}{route.startsWith('#/admin')?<main className="page admin-page"><p className="eyebrow">ADMINISTRAÇÃO</p><h1>Seu acervo,<br/><em>bem cuidado.</em></h1><p>A administração fica disponível após conectar o Supabase.</p><a className="button secondary" href="#/">Voltar ao acervo</a></main>:<CatalogPage repository={repository} onCompose={setComposition}/ >}{composition&&<div role="dialog" aria-modal="true" aria-label="Gerar PDF" className="modal-backdrop"><div className="modal"><h2>Sua seleção está pronta</h2><button onClick={()=>setComposition(null)} className="button secondary">Voltar</button></div></div>}<footer className="site-footer"><span><Music2 size={15}/> Feito para reunir músicas e pessoas.</span><span>Acervo Musical · 2026</span></footer></>
}

