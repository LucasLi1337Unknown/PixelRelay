import {createClient,type Session} from '@supabase/supabase-js';
import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from './chatgpt-auth';
export const accessCookie='__Host-relay-beta-access';
export const refreshCookie='__Host-relay-beta-refresh';
export const pendingCookie='__Host-relay-beta-pending';
export const modeCookie='__Host-relay-beta-mode';
export function authClient(){if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)throw new Error('Email sign-in is not configured yet.');return createClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
export async function saveSession(session:Session){const jar=await cookies();const options={httpOnly:true,secure:true,sameSite:'lax' as const,path:'/'};jar.set(accessCookie,session.access_token,{...options,maxAge:session.expires_in||3600});jar.set(refreshCookie,session.refresh_token,{...options,maxAge:60*60*24*30});jar.set(modeCookie,'email',{...options,maxAge:60*60*24*30})}
export async function clearSession(){const jar=await cookies();for(const key of [accessCookie,refreshCookie,modeCookie,pendingCookie])jar.set(key,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0})}
export async function getViewer(){const jar=await cookies();const token=jar.get(accessCookie)?.value;
 if(token){const {data,error}=await authClient().auth.getUser(token);if(error&&(!error.status||error.status>=500))throw new Error('Email sign-in is temporarily unavailable.');if(error||!data.user?.email_confirmed_at)return null;return{userId:'sb:'+data.user.id,method:'email' as const};}
 if(jar.get(modeCookie)?.value==='chatgpt'){const user=await getChatGPTUser();return user?{userId:user.userId,method:'chatgpt' as const}:null;}return null;
}
