'use client';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
export default function RedirectRapport(){
  const params = useParams();
  const id = (params as any).sessionId;
  useEffect(()=>{
    if(id) window.location.href = `/rapport-profond?sessionId=${id}`;
  },[id]);
  return <div style={{padding:40}}>Redirection vers rapport-profond?sessionId={id}...</div>
}
