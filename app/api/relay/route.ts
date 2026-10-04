import { getViewer } from '../../supabase-auth';
import { database } from '../../../db';
export const dynamic = 'force-dynamic';
const colors = ['mint','amber','blue','pink','violet','coral'];
function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
class Problem extends Error{constructor(message:string,public status=400){super(message)}}
function value(v:unknown,min:number,max:number,label:string){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)throw new Problem(`${label} must be ${min}–${max} characters.`);return v.trim()}
async function identity(){const u=await getViewer();if(!u)throw new Problem('Sign in to continue.',401);return u.userId}
async function profile(id:string){const p=await database().prepare('SELECT id, handle, name, color, bio FROM profiles WHERE id = ?').bind(id).first();if(!p)throw new Problem('Choose your player name first.',409);return p}
async function access(room:string,user:string){const found=await database().prepare('SELECT room_id FROM members WHERE room_id = ? AND user_id = ?').bind(room,user).first();if(!found)throw new Problem('Join this room before reading or sending messages.',403)}
async function run<T>(query:string,...args:any[]){return (await database().prepare(query).bind(...args).all<T>()).results}
function error(e:unknown){if(e instanceof Problem)return json({error:e.message},e.status);console.error('Relay request failed',e);return json({error:'The connection hit a glitch. Your draft is still here; try again.'},503)}
export async function GET(request:Request){try{const uid=await identity(),db=database(),url=new URL(request.url),op=url.searchParams.get('op')||'bootstrap';
 if(op==='bootstrap'){
 const me=await db.prepare('SELECT id, handle, name, color, bio FROM profiles WHERE id = ?').bind(uid).first();if(!me)return json({me:null,rooms:[],people:[],dms:[]});
 const rooms=await run(`SELECT r.id,r.name,r.description,r.owner,(SELECT COUNT(*) FROM members WHERE room_id=r.id) AS members,1 AS joined FROM rooms r JOIN members m ON m.room_id=r.id AND m.user_id=? WHERE kind='group' ORDER BY r.created_at LIMIT 100`,uid);
 const requests=await run(`SELECT j.room_id,j.user_id,j.created_at,p.name,p.handle,r.name AS room_name FROM join_requests j JOIN rooms r ON r.id=j.room_id JOIN profiles p ON p.id=j.user_id WHERE r.owner=? AND j.status='pending' ORDER BY j.created_at LIMIT 100`,uid);
 const people=await run('SELECT p.id,p.handle,p.name,p.color,p.bio,COALESCE(s.seen_at,0) AS seen_at FROM profiles p LEFT JOIN presence s ON s.user_id=p.id ORDER BY COALESCE(s.seen_at,0) DESC LIMIT 100');
 const dms=await run(`SELECT r.id,p.id AS peer_id,p.name,p.handle,p.color,COALESCE((SELECT body FROM messages WHERE room_id=r.id ORDER BY id DESC LIMIT 1),'No messages yet') AS preview FROM rooms r JOIN members own ON own.room_id=r.id AND own.user_id=? JOIN members other ON other.room_id=r.id AND other.user_id!=? JOIN profiles p ON p.id=other.user_id WHERE r.kind='dm' ORDER BY COALESCE((SELECT MAX(created_at) FROM messages WHERE room_id=r.id),r.created_at) DESC LIMIT 100`,uid,uid);
 return json({me,rooms,people,dms,requests});}
 await profile(uid);
 if(op==='groups'){const q=(url.searchParams.get('q')||'').trim().slice(0,80),offset=Math.max(0,Math.min(10000,Number(url.searchParams.get('offset'))||0));const groups=await run(`SELECT r.id,r.name,r.description,r.owner,p.name AS owner_name,(SELECT COUNT(*) FROM members WHERE room_id=r.id) AS members,EXISTS(SELECT 1 FROM members WHERE room_id=r.id AND user_id=?) AS joined,(SELECT status FROM join_requests WHERE room_id=r.id AND user_id=?) AS request_status FROM rooms r JOIN profiles p ON p.id=r.owner WHERE r.kind='group' AND (instr(lower(r.name),lower(?))>0 OR instr(lower(r.description),lower(?))>0) ORDER BY r.created_at DESC LIMIT 51 OFFSET ?`,uid,uid,q,q,offset);return json({groups:groups.slice(0,50),more:groups.length>50});}
 if(op==='messages'){const room=value(url.searchParams.get('room'),1,200,'Room');await access(room,uid);const before=Number(url.searchParams.get('before')||0),after=Number(url.searchParams.get('after')||0);if(!Number.isSafeInteger(before)||before<0||!Number.isSafeInteger(after)||after<0)throw new Problem('Invalid message cursor.');
 const data=await run(`SELECT m.id,m.body,m.created_at,p.id AS user_id,p.name,p.handle,p.color FROM messages m JOIN profiles p ON p.id=m.user_id WHERE m.room_id=? ${before?'AND m.id < ?':after?'AND m.id > ?':''} ORDER BY m.id ${after?'ASC':'DESC'} LIMIT 50`,room,...(before?[before]:after?[after]:[]));return json({messages:after?data:data.reverse()});}
 if(op==='posts'){const posts=await run(`SELECT p.id,p.body,p.created_at,u.id AS user_id,u.name,u.handle,u.color,(SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS likes,EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=?) AS liked FROM posts p JOIN profiles u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 50`,uid);return json({posts});}
 throw new Problem('Unknown request.',404);
 }catch(e){return error(e)}}
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new Problem('Please send this request from Pixel Relay.',403);
 if(Number(request.headers.get('content-length')||0)>10000)throw new Problem('Message too large.',413);
 const raw=await request.text();if(raw.length>10000)throw new Problem('Message too large.',413);let body:any;try{body=JSON.parse(raw)}catch{throw new Problem('Invalid request.')}
 const uid=await identity(),db=database(),now=Date.now(),op=body.op;
 if(op==='profile'){
 const handle=value(body.handle,3,20,'Handle').toLowerCase();if(!/^[a-z0-9_]+$/.test(handle))throw new Problem('Use letters, numbers, or underscores for your handle.');
 const name=value(body.name,1,30,'Player name'),bio=typeof body.bio==='string'?body.bio.trim().slice(0,160):'',color=colors.includes(body.color)?body.color:'mint';
 const taken=await db.prepare('SELECT id FROM profiles WHERE handle=? AND id!=?').bind(handle,uid).first();if(taken)throw new Problem('That handle is taken. Try another.',409);
 try{await db.prepare('INSERT INTO profiles(id,handle,name,color,bio,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET handle=excluded.handle,name=excluded.name,color=excluded.color,bio=excluded.bio').bind(uid,handle,name,color,bio,now).run()}catch(e){if(String(e).includes('UNIQUE'))throw new Problem('That handle is taken. Try another.',409);throw e}
 await db.batch([db.prepare("INSERT OR IGNORE INTO rooms(id,kind,name,description,owner,created_at) VALUES('lobby','group','town-square','The place to say hello. Everyone can join.',?,?)").bind(uid,now),db.prepare("INSERT OR IGNORE INTO members(room_id,user_id) VALUES('lobby',?)").bind(uid)]);return json({ok:true});}
 await profile(uid);
 if(op==='heartbeat'){await db.prepare('INSERT INTO presence(user_id,seen_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET seen_at=excluded.seen_at').bind(uid,now).run();return json({ok:true});}
 if(op==='room'){
 const name=value(body.name,2,30,'Group name'),description=typeof body.description==='string'?body.description.trim().slice(0,160):'',id=crypto.randomUUID();
 const inserted=await db.prepare(`INSERT INTO rooms(id,kind,name,description,owner,created_at) SELECT ?,'group',?,?,?,? WHERE (SELECT COUNT(*) FROM rooms WHERE owner=? AND kind='group' AND id!='lobby')<3 AND NOT EXISTS(SELECT 1 FROM rooms WHERE owner=? AND kind='group' AND id!='lobby' AND created_at>?)`).bind(id,name,description,uid,now,uid,uid,now-60000).run();if(!inserted.meta.changes)throw new Problem('You can own 3 groups. Wait 60 seconds between new groups.',429);await db.prepare('INSERT INTO members(room_id,user_id) VALUES(?,?)').bind(id,uid).run();return json({room:id});}
 if(op==='join'){const room=value(body.room,1,200,'Room'),r=await db.prepare("SELECT id,owner FROM rooms WHERE id=? AND kind='group'").bind(room).first<{id:string;owner:string}>();if(!r)throw new Problem('Group not found.',404);
 if(room==='lobby'||r.owner===uid){await db.prepare('INSERT OR IGNORE INTO members(room_id,user_id) VALUES(?,?)').bind(room,uid).run();return json({ok:true});}
 if(await db.prepare('SELECT 1 FROM members WHERE room_id=? AND user_id=?').bind(room,uid).first())return json({ok:true});
 const old=await db.prepare('SELECT status,created_at FROM join_requests WHERE room_id=? AND user_id=?').bind(room,uid).first<{status:string;created_at:number}>();if(old?.status==='declined'&&now-old.created_at<86400000)throw new Problem('The owner declined this request. You can try again tomorrow.',429);
 await db.prepare("INSERT INTO join_requests(room_id,user_id,status,created_at) VALUES(?,?,'pending',?) ON CONFLICT(room_id,user_id) DO UPDATE SET status='pending',created_at=CASE WHEN status='pending' THEN created_at ELSE excluded.created_at END").bind(room,uid,now).run();return json({pending:true});}
 if(op==='reviewJoin'){const room=value(body.room,1,200,'Group'),target=value(body.target,1,200,'Player');const r=await db.prepare('SELECT owner FROM rooms WHERE id=?').bind(room).first<{owner:string}>();if(r?.owner!==uid)throw new Problem('Only the group owner can review requests.',403);const j=await db.prepare("SELECT 1 FROM join_requests WHERE room_id=? AND user_id=? AND status='pending'").bind(room,target).first();if(!j)throw new Problem('This request is no longer pending.',409);
 if(body.approve===true)await db.batch([db.prepare('INSERT OR IGNORE INTO members(room_id,user_id) VALUES(?,?)').bind(room,target),db.prepare("UPDATE join_requests SET status='approved',created_at=? WHERE room_id=? AND user_id=?").bind(now,room,target)]);else await db.prepare("UPDATE join_requests SET status='declined',created_at=? WHERE room_id=? AND user_id=?").bind(now,room,target).run();return json({ok:true});}
 if(op==='dm'){
 const target=value(body.target,1,200,'Recipient');if(target===uid)throw new Problem('Choose someone else to message.');await profile(target);
 const key=JSON.stringify([uid,target].sort()),id=crypto.randomUUID();await db.prepare("INSERT OR IGNORE INTO rooms(id,kind,name,owner,dm_key,created_at) VALUES(?,'dm','',?,?,?)").bind(id,uid,key,now).run();const room=await db.prepare('SELECT id FROM rooms WHERE dm_key=?').bind(key).first<{id:string}>();if(!room)throw new Error('Unable to create DM');await db.batch([db.prepare('INSERT OR IGNORE INTO members(room_id,user_id) VALUES(?,?)').bind(room.id,uid),db.prepare('INSERT OR IGNORE INTO members(room_id,user_id) VALUES(?,?)').bind(room.id,target)]);return json({room:room.id});}
 if(op==='send'){
 const room=value(body.room,1,200,'Room'),text=value(body.text,1,2000,'Message'),nonce=value(body.nonce,8,100,'Message ID');await access(room,uid);
 const exists=await db.prepare('SELECT id FROM messages WHERE nonce=? AND user_id=? AND room_id=?').bind(nonce,uid,room).first();if(exists)return json({ok:true});
 const recent=await db.prepare('SELECT id FROM messages WHERE user_id=? AND created_at>? LIMIT 1').bind(uid,now-800).first();if(recent)throw new Problem('One moment! Wait a second before sending again.',429);
 await db.prepare('INSERT INTO messages(room_id,user_id,body,nonce,created_at) VALUES(?,?,?,?,?)').bind(room,uid,text,nonce,now).run();return json({ok:true});}
 if(op==='post'){
 const text=value(body.text,1,1000,'Moment');const recent=await db.prepare('SELECT id FROM posts WHERE user_id=? AND created_at>? LIMIT 1').bind(uid,now-3000).first();if(recent)throw new Problem('Wait a few seconds before posting again.',429);await db.prepare('INSERT INTO posts(id,user_id,body,created_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),uid,text,now).run();return json({ok:true});}
 if(op==='like'){
 const id=value(body.post,1,100,'Post');if(!await db.prepare('SELECT id FROM posts WHERE id=?').bind(id).first())throw new Problem('Moment not found.',404);
 if(body.liked===true)await db.prepare('INSERT OR IGNORE INTO likes(post_id,user_id) VALUES(?,?)').bind(id,uid).run();else await db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').bind(id,uid).run();return json({ok:true});}
 if(op==='deletePost'){const id=value(body.post,1,100,'Post');await db.prepare('DELETE FROM posts WHERE id=? AND user_id=?').bind(id,uid).run();return json({ok:true});}
 throw new Problem('Unknown request.',404);
 }catch(e){return error(e)}}
