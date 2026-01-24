"use client"

import { cn } from "@/lib/utils"
import { FormEvent, HTMLAttributes, useEffect, useRef, useState } from "react"

type EditableProps = {
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void,
    className?: string
    requestFocus?: boolean
} & HTMLAttributes<HTMLDivElement>

export default function Editable({ value: controlledValue, defaultValue = "", requestFocus= false, onChange, className, ...props}: EditableProps) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
    const divRef = useRef<HTMLDivElement>(null)
    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : uncontrolledValue

    useEffect(() => {
        const node = divRef.current
        if (!node) return
        const nextValue = value ?? ""

        if (node.textContent !== nextValue) {
            node.textContent = nextValue
        }
    }, [value])

    useEffect(()=> {
        if(divRef.current && requestFocus){
            divRef.current.focus()
        }
    }, [requestFocus])

    const handleInput = (e: FormEvent<HTMLDivElement>) => {
        const nextValue = e.currentTarget.textContent ?? ""
        if (!isControlled) {
            setUncontrolledValue(nextValue)
        }
        onChange?.(nextValue)
    }

    return (
        <div
            className={cn(className)}
            contentEditable
            tabIndex={0}
            aria-multiline="true"
            role="textbox"
            ref={divRef}
            onInput={handleInput}
            suppressContentEditableWarning
            {...props}
        />
    )
}
