import type {Metadata} from 'next';
import Link from 'next/link';
import {getActor} from '@/lib/auth';
import './globals.css';
export const metadata:Metadata={title:'Plant Area | Tuban',description:'Monitoring bag filter dan transaksi consumable',icons:{icon:'/favicon.svg'}};
export default async function RootLayout({children}:{children:React.ReactNode}){const actor=await getActor();return <html lang="id"><body><div className="shell"><header className="topbar"><Link className="brand" href="/"><span className="brandmark">P<span>+</span></span><span><strong>PLANT AREA</strong><small>TUBAN · MAINTENANCE</small></span></Link>{actor&&<form action="/api/auth/logout" method="post"><button className="auth-signout" type="submit">Keluar</button></form>}</header>{children}</div></body></html>}
