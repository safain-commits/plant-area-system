import {getActor} from '@/lib/auth';
import {redirect} from 'next/navigation';
export default async function ProtectedLayout({children}:{children:React.ReactNode}){if(!await getActor())redirect('/login');return children}
