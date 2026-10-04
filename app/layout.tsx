import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Pixel Relay Beta — isolated testing',description:'The isolated test version of Pixel Relay. Beta chats are separate from the main site.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
