"use client"

import { cn } from "@/lib/utils"
import { FormEvent, HTMLAttributes, useEffect, useRef, useState } from "react"


type EditableProps = {
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void,
    className?: string
    requestFocus?: boolean
    registerRef?: (el: HTMLDivElement) => void
    tag?: string
    placeholder?: string
} & HTMLAttributes<HTMLDivElement>

export default function Editable({ value: controlledValue, defaultValue = "", placeholder = "", tag="div", requestFocus= false, onChange, registerRef, className, ...props}: EditableProps) {
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
    }, [value, tag])

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

        if(nextValue === ""){
            e.currentTarget.innerHTML = ""
        }

        onChange?.(nextValue)
    }

    const Tag = tag

    const defaultClasses = "py-1 outline-none before:absolute before:h-full before:left-0" +
        "before:top-0 before:pointer-events-none before:text-placeholder empty:before:content-[attr(data-placeholder)]"

    
    return (
        <Tag
            className={cn(defaultClasses , className, "before:text-placeholder")}
            contentEditable
            tabIndex={0}
            aria-multiline="true"
            data-placeholder={placeholder}
            role="textbox"
            ref={divRef}
            onInput={handleInput}
            suppressContentEditableWarning
            {...props}
        />
    )
}
