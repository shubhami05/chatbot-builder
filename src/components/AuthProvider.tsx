'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  session: any;
}


export default function AuthProvider({ children, session }: AuthProviderProps) {
  const [isLoading,setLoading] = useState(true)
  useEffect(()=>{
    setLoading(false);
  },[])

  if(isLoading){
    return <div>
      Loading...
    </div>
  }
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

