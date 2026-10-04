import {cookies} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {accessCookie,refreshCookie,modeCookie,pendingCookie,authClient,getViewer,saveSession,clearSession} from '../../supabase-auth';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
function fail(message:string,status=400){return json({error:message},status)}
export async function GET(){try{const user=await getViewer();return json({signedIn:Boolean(user),method:user?.method||null})}catch{return fail('Email sign-in is temporarily unavailable.',503)}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Please sign in from Pixel Relay.',403);
 const raw=await request.text();if(raw.length>12000)return fail('Request too large.',413);let b;try{b=JSON.parse(raw)}catch{return fail('Invalid request.')}
 if(b.op==='logout'){const jar=await cookies(),token=jar.get(accessCookie)?.value,refresh=jar.get(refreshCookie)?.value;if(token&&refresh){try{const client=authClient();await client.auth.setSession({access_token:token,refresh_token:refresh});await client.auth.signOut({scope:'local'})}catch{}}await clearSession();return json({ok:true});}
 if(b.op==='platform'){const u=await getChatGPTUser();if(!u)return fail('Sign in with ChatGPT first.',401);await clearSession();(await cookies()).set(modeCookie,'chatgpt',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:2592000});return json({signedIn:true,method:'chatgpt'});}
 const client=authClient();
 if(b.op==='refresh'){const jar=await cookies(),token=jar.get(accessCookie)?.value,refresh=jar.get(refreshCookie)?.value;
 if(token){const {data,error}=await client.auth.getUser(token);if(!error&&data.user?.email_confirmed_at)return json({signedIn:true,method:'email'});}
 if(refresh){const {data,error}=await client.auth.refreshSession({refresh_token:refresh});if(error&&(!error.status||error.status>=500))return fail('Email sign-in is temporarily unavailable. Please try again.',503);if(!error&&data.session&&data.user?.email_confirmed_at){await saveSession(data.session);return json({signedIn:true,method:'email'});}await clearSession();}
 const user=await getViewer();return json({signedIn:Boolean(user),method:user?.method||null});}
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return fail('Enter a valid email address.');
 if(b.op==='send'){const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:new URL('/auth/confirm',request.url).href}});if(error){if(error.status===429)return fail('Too many attempts. Please wait before requesting another email.',429);if(error.code==='email_address_not_authorized')return fail('This Supabase project cannot email this address yet. The owner needs to configure an email sender.',403);return fail(error.message||'Could not send the verification email.',400);}(await cookies()).set(pendingCookie,encodeURIComponent(email),{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:3600});return json({sent:true});}
 if(b.op==='verify'){if(typeof b.code!=='string'||!/^\d{6,10}$/.test(b.code))return fail('Enter the numeric verification code from your email.');const {data,error}=await client.auth.verifyOtp({email,token:b.code,type:'email'});if(error||!data.session||!data.user?.email_confirmed_at)return fail('That code is invalid, expired, or already used. Request a fresh email.');await saveSession(data.session);return json({signedIn:true});}
 return fail('Unknown sign-in request.',404);
 }catch(e){console.error('Beta auth request failed',e instanceof Error?e.message:'unknown');return fail('Email sign-in hit a connection problem. Please try again.',503)}}
