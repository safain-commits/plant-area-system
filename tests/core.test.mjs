import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import ts from 'typescript';
const load=async(source)=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));

test('migrations, pack transactions and rollback persist across reopen',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'plant-area-test-'));const filename=join(temp,'test.sqlite');const {openDatabase}=await load(readFileSync('lib/database.ts','utf8'));let db=openDatabase(filename);
 try{
 await db.prepare('INSERT INTO materials (sap_code,name,unit,pack_size,area,created_at) VALUES (?,?,?,?,?,?)').bind('TEST','Electrode','pcs',50,'Workshop',new Date().toISOString()).run();
 await db.prepare("INSERT INTO stock_moves (material_id,type,quantity,packs,reference,area,actor,created_at) VALUES (1,'receive',100,2,'GR','Workshop','test',?)").bind(new Date().toISOString()).run();
 assert.equal((await db.prepare('SELECT SUM(quantity) AS stock FROM stock_moves').first()).stock,100);
 await assert.rejects(db.batch([db.prepare('UPDATE materials SET name=? WHERE id=1').bind('changed'),db.prepare('INSERT INTO missing_table VALUES (1)')]));
 assert.equal((await db.prepare('SELECT name FROM materials WHERE id=1').first()).name,'Electrode');
 db.close();db=openDatabase(filename);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').first()).n,4);assert.equal((await db.prepare('SELECT SUM(quantity) AS stock FROM stock_moves').first()).stock,100);
 }finally{db.close();rmSync(temp,{recursive:true,force:true})}
});

test('signed sessions reject tampering and incorrect password',async()=>{
 process.env.APP_USERNAME='test-operator';process.env.APP_PASSWORD='test-password-long';process.env.APP_SESSION_SECRET='test-signing-secret-for-unit-tests-32';
 const auth=await load(readFileSync('lib/auth.ts','utf8').replace("import {cookies} from 'next/headers';",'const cookies=async()=>new Map();'));
 assert.equal(auth.validPassword('test-password-long'),true);assert.equal(auth.validPassword('wrong'),false);const token=auth.createSession('test-operator');assert.equal(auth.verifySession(token),'test-operator');assert.equal(auth.verifySession(token+'x'),null);assert.equal(auth.verifySession(undefined),null);
});

test('demo has all bag coordinates and 19 work orders per equipment',async()=>{
 const {BAG_FILTERS}=await load(readFileSync('app/(protected)/equipment-process/bag-filter/equipment-config.ts','utf8'));const {createDemoBags}=await load(readFileSync('app/(protected)/equipment-process/bag-filter/561-bf1/demo-data.ts','utf8'));
 for(const config of BAG_FILTERS){const result=createDemoBags(config);assert.equal(new Set(result.all.map(p=>`${p.side}-${p.compartment}-${p.column}-${p.row}`)).size,config.compartments*136);assert.equal(new Set(result.changes.map(p=>p.wo)).size,19);assert.ok(result.all.every(p=>p.compartment<=config.perSide));}
});
