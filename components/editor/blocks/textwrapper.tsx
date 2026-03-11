"use client"

import Editable from "@/components/ui/editable";
import { HTMLAttributes, memo, useCallback, useEffect, useRef, useState } from "react";
import { Block } from "../types";
import { cn } from "@/lib/utils";

export type TextWrapperProps = {
    id: string
    order: string
    data: { text: string }
    parentBlockId?: number
    onEnter?: (currentBlock: string, cursorPos: number, text?: string) => void
    onChange?: (block: Block) => void
    onFocus?: (blockId: string) => void
    onBackspace?: (id: string, cursorPos: number, text: string) => void
    onTab?: (blockId: string) => void
    focus?: boolean
    block: Block
    tag?: string
    placeholder?: string
    registerRef?: (id: string, el: HTMLDivElement) => void
    onSpace?: (blockId: string, text: string) => void
} & Omit<HTMLAttributes<HTMLDivElement>, "id" | "onChange">


function TextWrapper({ id, onChange, placeholder, onSpace, onEnter, onTab, tag = "div", block, focus = false, onFocus, registerRef, onBackspace, ...props }: TextWrapperProps) {

    const [draft, setDraft] = useState<string>(block.data.text)
    const inputRef = useRef<HTMLDivElement>(undefined)
    const { defaultValue, ...rest } = props

    // useEffect(() => {
    //     console.log("re-rendering block");
    // })

    const commitChanges = useCallback(() => {
        if (!onChange) return
        if (!inputRef.current) return

        const nextText: string = (inputRef.current.textContent ?? "").trimStart()

        //Text has not changed yet
        if (nextText === block.data.text) return

        const resolvedData = {
            ...block.data,
            text: nextText
        }

        onChange({
            ...block,
            data: resolvedData
        })
    }, [inputRef.current, block.data.text])

    useEffect(() => {
        setDraft(block.data.text)
    }, [block.id, block])

    return (
        <Editable
            value={draft}
            onClick={() => { if (onFocus) onFocus(block.id); console.log("pare: ", block.parentBlockId) }}
            onChange={value => {
                setDraft(value.toString())
            }}
            onBlur={commitChanges}
            requestFocus={focus}
            tag={tag}
            placeholder={placeholder}
            className={cn("w-full", props.className)}
            registerRef={(el) => {
                if (registerRef) registerRef(id, el)
                if (!inputRef.current) {
                    inputRef.current = el
                }
            }}
            onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()

                    if (onEnter) {
                        const selection = window.getSelection()
                        setDraft(prev => prev.slice(0, selection?.anchorOffset ?? prev.length))

                        commitChanges()

                        onEnter(id, selection?.anchorOffset ?? -1, draft)
                    }
                }

                if(e.key === "Tab"){
                    e.preventDefault()

                    if(onTab){ 
                        onTab(block.id)
                    }
                }

                if (e.key === " ") {

                    if (!onSpace) return

                    const text = e.currentTarget.textContent ?? ""
                    onSpace(block.id, text)
                }

                if (e.key === "Backspace") {

                    if(window.getSelection()?.anchorOffset == 0){
                        e.preventDefault()
                    }

                    const text = inputRef.current?.textContent ?? draft
                    if (onBackspace) onBackspace(id, window.getSelection()?.anchorOffset ?? -1, text)
                }
            }}
            {...rest}
        />
    )
}

export default memo(TextWrapper)