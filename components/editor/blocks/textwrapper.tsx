"use client"

import Editable from "@/components/ui/editable";
import { HTMLAttributes, memo, useCallback, useEffect, useRef, useState } from "react";
import { Block } from "../types";
import { cn } from "@/lib/utils";
import RichTextEditor from "../rich-text-editor";

export type TextWrapperProps = {
    onEnter?: (currentBlock: string, cursorPos: number, text?: string) => void
    onChange?: (block: Block) => void
    onBlockFocus?: (blockId: string) => void
    onBackspace?: (id: string, cursorPos: number, text: string) => void
    onTab?: (blockId: string) => void
    focus?: boolean
    block: Block
    tag?: string
    placeholder?: string
    registerRef?: (id: string, el: HTMLDivElement) => void
    onSpace?: (blockId: string, text: string) => void
} & Omit<HTMLAttributes<HTMLDivElement>, "id" | "onChange">


function TextWrapper({ onChange, placeholder, onSpace, onEnter, onTab, tag = "div", block, focus = false, onBlockFocus, registerRef, onBackspace, ...props }: TextWrapperProps) {

    const [draft, setDraft] = useState<string>(block.data.text)
    const inputRef = useRef<HTMLDivElement>(undefined)
    const { defaultValue, ...rest } = props


    const commitChanges = useCallback((newBlock: Block) => {
        if (!onChange) return
        if (!inputRef.current) return

        const nextText: string = newBlock.data.text.trimStart()

        //Text has not changed yet
        if (nextText === block.data.text && newBlock.data.styles === block.data.styles) return

        onChange({
            ...block,
            data: newBlock.data
        })
    }, [inputRef.current, block.data.text])

    const handleFocus = useCallback(() => {
        onBlockFocus?.(block.id);
    }, [block.id, onBlockFocus]);

    useEffect(() => {
        setDraft(block.data.text)
    }, [block.id, block])

    return (
        <RichTextEditor
            block={block}
            onFocus={handleFocus}
            onChange={value => {
                setDraft(value.toString())
            }}
            onFocusExit={commitChanges}
            tag={tag}
            placeholder={placeholder}
            className={cn("w-full", props.className)}
            registerRef={(el) => {
                if (registerRef) registerRef(block.id, el)
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

                        onEnter(block.id, selection?.anchorOffset ?? -1, draft)
                    }
                }

                if (e.key === "Tab") {
                    e.preventDefault()

                    if (onTab) {
                        onTab(block.id)
                    }
                }

                if (e.key === " ") {

                    if (!onSpace) return

                    const text = e.currentTarget.textContent ?? ""
                    onSpace(block.id, text)
                }

                if (e.key === "Backspace") {
                    const text = inputRef.current?.textContent ?? draft
                    if (onBackspace) onBackspace(block.id, window.getSelection()?.anchorOffset ?? -1, text)
                }
            }}
            {...rest}
        />
    )
}

export default memo(TextWrapper)