import {COOKIE_NAME,secureCookie,allowedOrigin} from '@/lib/auth';
import {NextResponse} from 'next/server';
export async function POST(request:Request){
 if(!allowedOrigin(request))return Response.json({error:'Origin tidak diizinkan.'},{status:403});
 const response=NextResponse.redirect(new URL('/login',request.headers.get('origin')!),303);response.cookies.set(COOKIE_NAME,'',{httpOnly:true,sameSite:'lax',secure:secureCookie(),path:'/',maxAge:0});return response;
}
