export type AppConfig={mode:'demo'}|{mode:'supabase';url:string;publishableKey:string};
export function readConfig(env:Record<string,string|undefined>):AppConfig{
 const url=env.VITE_SUPABASE_URL?.trim(),publishableKey=env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
 if(!url&&!publishableKey)return {mode:'demo'};
 if(!url||!publishableKey)throw new Error('Configure a URL e a chave pública do Supabase para abrir o acervo.');
 let parsed:URL;try{parsed=new URL(url)}catch{throw new Error('A URL do Supabase é inválida.')}
 if(!['https:','http:'].includes(parsed.protocol))throw new Error('A URL do Supabase é inválida.');
 return {mode:'supabase',url,publishableKey};
}

