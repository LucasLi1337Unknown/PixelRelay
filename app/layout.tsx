import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Pixel Relay — chat, play, connect',description:'A retro pixel world for messages, Moments, groups, and multiplayer games.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
