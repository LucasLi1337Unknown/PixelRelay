import MainShell from './main-shell';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <MainShell signedIn={Boolean(user)}/>;}
