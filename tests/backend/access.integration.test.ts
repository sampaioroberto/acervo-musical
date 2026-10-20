import {beforeAll,afterAll,it,expect} from 'vitest';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';import {Client} from 'pg';
import {randomUUID} from 'node:crypto';import {createSupabaseRepository} from '../../src/backend/supabaseRepository';
import {createAuth} from '../../src/backend/auth';
let admin:SupabaseClient,other:SupabaseClient,anon:SupabaseClient,service:SupabaseClient,db:Client;let adminId='',otherId='';const songId=randomUUID(),draftId=randomUUID();const ref={id:songId,path:songId+'/original.pdf',name:'Arquivo original.pdf',mime:'application/pdf',size:8};
beforeAll(async()=>{
 const url=process.env.ACERVO_TEST_URL!;if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Local Supabase required');
 const opts={auth:{persistSession:false,autoRefreshToken:false}};service=createClient(url,process.env.ACERVO_TEST_SERVICE!,opts);anon=createClient(url,process.env.ACERVO_TEST_ANON!,opts);admin=createClient(url,process.env.ACERVO_TEST_ANON!,opts);other=createClient(url,process.env.ACERVO_TEST_ANON!,opts);
 const password='Local-Test-Password-'+randomUUID();const adminEmail=randomUUID()+'@example.test',otherEmail=randomUUID()+'@example.test';
 const a=await service.auth.admin.createUser({email:adminEmail,password,email_confirm:true});if(a.error)throw a.error;adminId=a.data.user.id;
 const b=await service.auth.admin.createUser({email:otherEmail,password,email_confirm:true});if(b.error)throw b.error;otherId=b.data.user.id;
 db=new Client({connectionString:process.env.ACERVO_TEST_DB});await db.connect();await db.query('insert into private.app_admin (singleton,user_id) values (true,$1) on conflict (singleton) do update set user_id=excluded.user_id',[adminId]);
 const login=await admin.auth.signInWithPassword({email:adminEmail,password});if(login.error)throw login.error;const second=await other.auth.signInWithPassword({email:otherEmail,password});if(second.error)throw second.error;
});
afterAll(async()=>{if(db){await db.query('delete from public.songs where id=any($1::uuid[])',[[songId,draftId]]).catch(()=>{});await db.query('delete from public.song_originals where id=$1',[songId]).catch(()=>{});await db.query('delete from private.app_admin where user_id=$1',[adminId]).catch(()=>{});await db.end()}if(service){if(adminId)await service.auth.admin.deleteUser(adminId);if(otherId)await service.auth.admin.deleteUser(otherId);await service.storage.from('originals').remove([ref.path])}});
it('enforces public read, administrator writes, private drafts, private originals and RPC authorization',async()=>{
 const repo=createSupabaseRepository(admin);const now=new Date().toISOString();const song={id:songId,title:'Canção de teste',artist:'',kind:'lyrics' as const,content:'Texto',status:'published' as const,createdAt:now,updatedAt:now};
 await repo.uploadOriginal(ref,new File(['%PDF-1.7'],'Arquivo original.pdf',{type:'application/pdf'}));await repo.save(song,ref);await repo.save({...song,id:draftId,status:'draft'},null);
 expect((await createSupabaseRepository(anon).listPublished({kind:'lyrics',search:'teste'})).map(s=>s.id)).toEqual([songId]);
 const changed=await other.from('songs').update({title:'Alterado'}).eq('id',songId).select();expect(changed.data??[]).toHaveLength(0);expect((await repo.getAdmin(songId))?.title).toBe('Canção de teste');
 expect((await anon.from('songs').insert({id:randomUUID(),title:'Inválido',kind:'lyrics',content:'Voz',status:'published'})).error).not.toBeNull();
 expect((await other.rpc('save_song',{p_song:{...song,title:'Ataque'},p_original:null})).error).not.toBeNull();
 expect((await other.rpc('delete_song',{p_id:songId})).error).not.toBeNull();
 expect((await other.from('songs').select('*').eq('id',draftId)).data).toEqual([]);
 expect((await anon.storage.from('originals').download(ref.path)).error).not.toBeNull();
 expect((await other.storage.from('originals').download(ref.path)).error).not.toBeNull();
 expect((await other.storage.from('originals').upload(randomUUID()+'/original.pdf',new Uint8Array([1]),{contentType:'application/pdf'})).error).not.toBeNull();
 await repo.save({...song,title:'Editada'},ref);expect((await repo.getAdmin(songId))?.title).toBe('Editada');
 const deleted=await repo.deleteSong(songId);expect(deleted?.path).toBe(ref.path);expect(await repo.getAdmin(songId)).toBeNull();expect((await repo.listPendingCleanup()).map(r=>r.id)).toContain(songId);await repo.removeOriginal(ref);expect(await repo.listPendingCleanup()).toEqual([]);
});
it('rejects public signup and cannot grant administration through metadata',async()=>{
 expect(await createAuth(admin).current()).toBe('admin');
 expect(await createAuth(other).current()).toBe('denied');
 expect(await createAuth(anon).current()).toBe('anonymous');
 const attempt=await anon.auth.signUp({email:randomUUID()+'@example.test',password:'Another-Test-Password'});expect(attempt.error).not.toBeNull();
 await other.auth.updateUser({data:{role:'admin'}});const result=await other.rpc('is_admin');expect(result.data).toBe(false);
});

