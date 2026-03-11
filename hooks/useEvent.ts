"use client"

import { useCallback, useLayoutEffect, useRef } from "react"


export default function useEvent<T extends (...args: any[]) => any>(handler: T): T {
    const handlerRef = useRef(handler)

    useLayoutEffect(() => {
        handlerRef.current = handler
    }, [handler])

    return useCallback(((...args: any[]) => handlerRef.current(...args)) as T, [])
}