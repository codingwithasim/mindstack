"use client"


import Editable from "@/components/ui/editable";
import { FormEvent, HTMLAttributes, RefObject, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Block } from "../types";
import { cn } from "@/lib/utils";
import { EditorContext } from "../editor";

export type TextWrapperProps = {
    id: string
    order: string
    data: { text: string }
    parentBlockId?: number
    onEnter?: (currentBlock: string, cursorPos: number, text?: string) => void
    onChange?: (block: Block) => void
    onFocus?: () => void
    onBackspace?: (id: string, cursorPos: number) => void
    focus?: boolean
    block: Block
    tag?: string
    placeholder?: string
    registerRef?: (id: string, el: HTMLDivElement) => void
} & Omit<HTMLAttributes<HTMLDivElement>, "id" | "onChange">


export default function TextWrapper({ id, onChange, placeholder, onEnter, tag = "div", block, focus = false, onFocus, registerRef, onBackspace, ...props }: TextWrapperProps) {


    const { editor } = useContext(EditorContext)

    const [draft, setDraft] = useState<string>(block.data.text)
    const inputRef = useRef<HTMLDivElement>(undefined)
    const {defaultValue, ...rest} = props

    const commitChanges = useCallback(() => {
        if (!onChange) return
        if(!inputRef.current) return

        const nextText : string = (inputRef.current.textContent ?? "").trimStart()

        //Text has not changed yet
        if( nextText === block.data.text) return
        
        const resolvedData = {
            ...block.data,
            text: nextText
        }


        onChange({
            ...block,
            data: resolvedData
        })
    }, [inputRef.current, block.data.text])



    useEffect(()=> {
        if(!focus) return
        setDraft(block.data.text)
    }, [block.id, block.data.text])

    return (
        <Editable
            value={draft}
            onClick={() => { if (onFocus) onFocus() }}
            onChange={value => { 
                setDraft(value.toString())
            }}
            onBlur={commitChanges}
            requestFocus={focus}
            tag={tag}
            placeholder={placeholder}
            className={cn("w-full", props.className)}
            registerRef={(el) => {
                if(registerRef) registerRef(id, el)
                if(!inputRef.current){
                    inputRef.current = el
                }
            }}
            onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()

                    if (onEnter) {
                        const selection = window.getSelection()
                        setDraft(prev => prev.slice(0, selection?.anchorOffset ?? prev.length))
                        onEnter(id, selection?.anchorOffset ?? -1, draft)
                    }
                }

                if (e.key === " ") {
                    const text = e.currentTarget.textContent ?? ""
                    editor.onSpace(block.id, text)
                }

                if(e.key === "Backspace"){
                    if(onBackspace) onBackspace(id, window.getSelection()?.anchorOffset ?? -1)
                }
            }}
            {...rest}
        />
    )


}