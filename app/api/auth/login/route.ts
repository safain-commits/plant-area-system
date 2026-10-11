import {COOKIE_NAME,SESSION_SECONDS,createSession,validPassword,secureCookie,allowedOrigin} from '@/lib/auth';
import {NextResponse} from 'next/server';
export const runtime='nodejs';
const attempts=new Map<string,{count:number;until:number}>();
export async function POST(request:Request){
 if(!allowedOrigin(request))return Response.json({error:'Origin tidak diizinkan.'},{status:403});
 const key='login';const prior=attempts.get(key);if(prior&&prior.until>Date.now()&&prior.count>=10)return Response.json({error:'Terlalu banyak percobaan. Coba kembali dalam 15 menit.'},{status:429});
 try{
  const body=await request.json() as {username?:string;password?:string};
  if(!validPassword(String(body.password||''))||body.username!==(process.env.APP_USERNAME||'maintenance-tuban')){
   attempts.set(key,{count:prior&&prior.until>Date.now()?prior.count+1:1,until:prior&&prior.until>Date.now()?prior.until:Date.now()+15*60*1000});return Response.json({error:'Username atau password salah.'},{status:401});
  }
  attempts.delete(key);const response=NextResponse.json({ok:true});response.cookies.set(COOKIE_NAME,createSession(body.username),{httpOnly:true,sameSite:'lax',secure:secureCookie(),path:'/',maxAge:SESSION_SECONDS});return response;
 }catch{return Response.json({error:'Periksa konfigurasi login pada server.'},{status:503})}
}
