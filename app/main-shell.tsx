'use client';
import Relay from './relay';
export default function MainShell({signedIn}:{signedIn:boolean}){return <Relay signedIn={signedIn} onSignOut={()=>window.location.assign('/signout-with-chatgpt?return_to=/')}/>;}
