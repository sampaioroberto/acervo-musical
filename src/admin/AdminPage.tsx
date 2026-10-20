import {useEffect,useState} from 'react';
import type {AdminRepository} from '../catalog/repository';import type {AuthPort,Access} from '../backend/auth';
import {LoginForm} from './LoginForm';import {AdminWorkspace} from './AdminWorkspace';
import './admin.css';
export function AdminPage({repo,auth}:{repo:AdminRepository;auth:AuthPort}){
 const [access,setAccess]=useState<Access|'checking'|'error'>('checking'),[revision,setRevision]=useState(0),[error,setError]=useState('');
 useEffect(()=>{let active=true,version=0;const verify=()=>{const current=++version;auth.current().then(role=>{if(active&&current===version)setAccess(role)}).catch(()=>{if(active&&current===version)setAccess('error')})};verify();const unsubscribe=auth.subscribe(verify);return()=>{active=false;unsubscribe()}},[auth,revision]);
 async function signOut(){setError('');try{await auth.signOut();setAccess('anonymous')}catch{setError('Não foi possível encerrar a sessão. Tente novamente.')}}
 if(access==='admin')return <AdminWorkspace repo={repo} onSignOut={()=>void signOut()} signOutError={error}/>;
 return <main className="page admin-page">{access==='anonymous'?<LoginForm auth={auth} onSignedIn={()=>setRevision(n=>n+1)}/>:access==='checking'?<p className="status" role="status">Verificando acesso…</p>:<div className="access-message"><p className="eyebrow">ADMINISTRAÇÃO</p><h1>{access==='denied'?'Acesso restrito':'Não foi possível verificar o acesso'}</h1><p role="alert">{access==='denied'?'Esta conta não tem acesso à administração.':'Confira a conexão e tente novamente.'}</p><div className="form-actions">{access==='error'&&<button className="button secondary" onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button>}<button className="button secondary" onClick={()=>void signOut()}>Sair desta conta</button><a className="button secondary" href="#/">Voltar ao acervo</a></div>{error&&<p className="error" role="alert">{error}</p>}</div>}</main>
}

