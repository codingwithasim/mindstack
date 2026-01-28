"use client"

import { cn } from "@/lib/utils"
import { FormEvent, HTMLAttributes, useEffect, useRef, useState } from "react"

type Tag = "div" | "h1" | "h2" | "h3" | "h4" | "h5"
type EditableProps = {
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void,
    className?: string
    requestFocus?: boolean
    registerRef?: (el: HTMLDivElement) => void
    tag?: Tag
} & HTMLAttributes<HTMLDivElement>

export default function Editable({ value: controlledValue, defaultValue = "", tag="div", requestFocus= false, onChange, registerRef, className, ...props}: EditableProps) {
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
        if(!divRef.current) return

        if(registerRef){
            registerRef(divRef.current)
        }
        
    }, [registerRef])

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

    const Tag = tag
    
    return (
        <Tag
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
