import {cookies} from 'next/headers';
import {authClient,saveSession,pendingCookie} from '../../../supabase-auth';
export const dynamic='force-dynamic';
export async function POST(request:Request){const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Return to Pixel Relay to finish verification.'},{status:403,headers});
 const raw=await request.text();if(raw.length>16000)return Response.json({error:'Invalid confirmation.'},{status:400,headers});const b=JSON.parse(raw),client=authClient();
 let result;
 if(typeof b.token_hash==='string'&&b.token_hash.length<=256&&['email','magiclink','signup'].includes(b.type))result=await client.auth.verifyOtp({token_hash:b.token_hash,type:b.type});
 else if(typeof b.access_token==='string'&&typeof b.refresh_token==='string')result=await client.auth.setSession({access_token:b.access_token,refresh_token:b.refresh_token});
 else return Response.json({error:'This link is missing its verification token. Return to sign-in and request a fresh email.'},{status:400,headers});
 if(result.error||!result.data.session)return Response.json({error:'This link has expired or has already been used. Request a fresh email.'},{status:400,headers});
 const {data,error}=await client.auth.getUser(result.data.session.access_token);const pending=(await cookies()).get(pendingCookie)?.value;
 if(!pending||data.user?.email?.toLowerCase()!==decodeURIComponent(pending))return Response.json({error:'Open this link in the same browser where you requested it. Or return to sign-in and enter your numeric code.'},{status:400,headers});
 if(error||!data.user?.email_confirmed_at)return Response.json({error:'Email verification is not complete.'},{status:401,headers});await saveSession(result.data.session);return Response.json({signedIn:true},{headers});
 }catch{return Response.json({error:'Could not confirm this email. Please request a fresh sign-in email.'},{status:400,headers})}}
