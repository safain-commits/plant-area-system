import {createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
export const COOKIE_NAME='plant-area-session';
export const SESSION_SECONDS=8*60*60;
function secret(){const key=process.env.APP_SESSION_SECRET;if(!key||key.length<32)throw Error('APP_SESSION_SECRET harus minimal 32 karakter.');return key}
function signature(value:string){return createHmac('sha256',secret()).update(value).digest('base64url')}
export function validPassword(value:string){const expected=process.env.APP_PASSWORD;if(!expected||expected.length<12)throw Error('APP_PASSWORD harus minimal 12 karakter.');return timingSafeEqual(createHash('sha256').update(value).digest(),createHash('sha256').update(expected).digest())}
export function createSession(actor:string){const payload=Buffer.from(JSON.stringify({actor,expires:Date.now()+SESSION_SECONDS*1000})).toString('base64url');return `${payload}.${signature(payload)}`}
export function verifySession(token:string|undefined){
 if(!token)return null;
 try{const [payload,sig,...extra]=token.split('.');if(extra.length||!payload||!sig)return null;const expected=signature(payload);if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return typeof data.actor==='string'&&data.actor===(process.env.APP_USERNAME||'maintenance-tuban')&&Number.isFinite(data.expires)&&data.expires>Date.now()?data.actor:null}catch{return null}
}
export async function getActor(){return verifySession((await cookies()).get(COOKIE_NAME)?.value)}
export function secureCookie(){return process.env.APP_COOKIE_SECURE?process.env.APP_COOKIE_SECURE==='true':process.env.NODE_ENV==='production'}

export function allowedOrigin(request:Request,required=true){
 const origin=request.headers.get('origin');if(!origin)return !required;
 try{const expected=process.env.APP_ORIGIN||`${new URL(request.url).protocol}//${request.headers.get('host')||new URL(request.url).host}`;return new URL(origin).origin===new URL(expected).origin}catch{return false}
}
