'use client'

import { useEffect, useState } from "react";

export default function NotFoundPage() {
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
        <div className="h-full w-full flex items-center justify-center">
            <h1>PAGE NOT FOUND - 404!</h1>
        </div>
    )
}