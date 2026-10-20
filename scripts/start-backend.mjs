import {spawn} from 'node:child_process';
const child=spawn('node_modules/.bin/supabase',['start','-x','studio,realtime,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit'],{stdio:['ignore','pipe','pipe']});
let stdout='',stderr='';child.stdout.on('data',d=>{stdout+=d});child.stderr.on('data',d=>{stderr+=d;process.stderr.write(String(d).replace(/eyJ[A-Za-z0-9_.-]+/g,'[redacted]'))});
child.on('error',e=>{console.error(e.message);process.exitCode=1});child.on('close',code=>{if(code===0)console.log('Supabase local pronto. Credenciais não exibidas.');else console.error('Falha ao iniciar Supabase local.');process.exitCode=code??1});

