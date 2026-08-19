"use client"

import { cn } from "@/lib/utils"
import { FormEvent, ForwardedRef, forwardRef, HTMLAttributes, KeyboardEventHandler, ReactElement, ReactEventHandler, useEffect, useLayoutEffect, useRef, useState } from "react"

type EditableProps = {
    value?: string
    manageContent?: boolean
    defaultValue?: string
    onChange?: (value: string) => void,
    className?: string
    requestFocus?: boolean
    registerRef?: (el: HTMLDivElement) => void
    tag?: string
    placeholder?: string
} & HTMLAttributes<HTMLDivElement>

function Editable({manageContent = true, value: controlledValue, defaultValue = "", placeholder = "", tag="div", requestFocus= false, onChange, registerRef, className, ...props}: EditableProps, ref: ForwardedRef<HTMLDivElement>) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
    const divRef = useRef<HTMLDivElement>(null)
    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : uncontrolledValue

    useLayoutEffect(() => {
        if(!manageContent) return
        
        const node = divRef.current
        if (!node) return
        const nextValue = value ?? ""

        if (node.textContent === nextValue) return

        const isFocused = document.activeElement === node
        const selection = isFocused ? window.getSelection() : null
        const selectionInNode = Boolean(selection && selection.anchorNode && node.contains(selection.anchorNode))
        const offset = selectionInNode ? selection!.anchorOffset : 0

        node.textContent = nextValue

        if (isFocused && selectionInNode) {
            const textNode = node.firstChild
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                const range = document.createRange()
                range.setStart(textNode, Math.min(offset, textNode.textContent!.length))
                range.collapse(true)
                selection!.removeAllRanges()
                selection!.addRange(range)
            }
        }
    }, [value, tag, defaultValue, manageContent])

    const setEditorRef = (node: HTMLDivElement | null) => {
        divRef.current = node

        if (typeof ref === "function") {
            ref(node)
        } else if (ref) {
            ref.current = node
        }
    }

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

        if(!manageContent) return

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
            className={cn(defaultClasses, className, "before:text-placeholder")}
            contentEditable
            tabIndex={0}
            aria-multiline="true"
            data-placeholder={placeholder}
            onInput={handleInput}
            role="textbox"
            ref={setEditorRef}
            suppressContentEditableWarning
            {...props}
        >
        </Tag>
    )
}

export default forwardRef(Editable)