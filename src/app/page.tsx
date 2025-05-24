'use client'

import { useEffect, useState } from "react";

export default function Home() {
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false)
  }, [])

  if (isLoading) {
    return <div className="h-screen w-screen text-2xl flex items-center justify-center">
      Loading...
    </div>
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <p>this is home page</p>
    </div>
  );
}
