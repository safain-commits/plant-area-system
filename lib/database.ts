import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

class Prepared {
 constructor(private db:DatabaseSync,private sql:string,private values:SQLInputValue[]=[]){}
 bind(...values:SQLInputValue[]){return new Prepared(this.db,this.sql,values)}
 async all(){return {results:this.db.prepare(this.sql).all(...this.values)}}
 async first<T=Record<string,unknown>>(){return (this.db.prepare(this.sql).get(...this.values) as T|undefined)||null}
 execute(){const result=this.db.prepare(this.sql).run(...this.values);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}}}
 async run(){return this.execute()}
}
export function openDatabase(filename:string){
 mkdirSync(dirname(resolve(filename)),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
 for(const name of readdirSync(resolve('migrations')).filter(n=>n.endsWith('.sql')).sort()){
  if(db.prepare('SELECT name FROM schema_migrations WHERE name=?').get(name))continue;
  db.exec('BEGIN IMMEDIATE');
  try{db.exec(readFileSync(resolve('migrations',name),'utf8'));db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(name,new Date().toISOString());db.exec('COMMIT')}catch(error){db.exec('ROLLBACK');throw error}
 }
 return {prepare:(sql:string)=>new Prepared(db,sql),async batch(statements:Prepared[]){db.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s.execute());db.exec('COMMIT');return results}catch(error){db.exec('ROLLBACK');throw error}},close:()=>db.close()};
}
const state=globalThis as typeof globalThis & {plantDatabase?:ReturnType<typeof openDatabase>};
export function getDatabase(){return state.plantDatabase??=openDatabase(process.env.APP_DATABASE_PATH||'./data/plant-area.sqlite')}
