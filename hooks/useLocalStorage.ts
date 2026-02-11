"use client";
import { useEffect, useState } from "react";

/**
 * 
 * @param key Item key that is 
 * @param defaultValue 
 * @returns 
 */
export default function useLocalStorage<V>(key: string, defaultValue?: V): [V, (value: V | ((prev: V) => V)) => void] {
    const [value, setValue] = useState<V>(() => {

        if (typeof window === "undefined") return defaultValue

        try {
            const item = localStorage.getItem(key)
            if (item) return JSON.parse(item)

        } catch (err) {
            return defaultValue
        }
    });

    const handleNewValue = (value: V | ((prev: V) => V)) => {

        if (typeof window === "undefined") return

        setValue(prev => {
            const resolved =
                typeof value === "function"
                    ? (value as (prev: V) => V)(prev)
                    : value

            if (resolved == null) {
                localStorage.removeItem(key)
            } else {
                localStorage.setItem(key, JSON.stringify(resolved))
            }

            return resolved
        })

    }

    return [value, handleNewValue] as [V, (value: V | ((prev: V) => V)) => void]
}