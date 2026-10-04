import AuthShell from './auth-shell';
import {getViewer} from './supabase-auth';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){let user=null;try{user=await getViewer()}catch{}const platform=await getChatGPTUser();return <AuthShell initialSignedIn={Boolean(user)} platformSignedIn={Boolean(platform)}/>}
