"use client"


import Editable from "@/components/ui/editable";
import { FormEvent, HTMLAttributes, RefObject, useEffect, useRef, useState } from "react";
import { Block } from "../types";

export type TextWrapperProps = {
    id: string
    order: string
    data: { text: string }
    parentBlockId?: number
    onEnter?: (currentBlock: string, cursorPos: number) => void
    onChange?: (block: Block) => void
    onFocus?: () => void
    onBackspace?: (id: string, cursorPos: number) => void
    focus?: boolean
    block: Block
    tag?: string
    registerRef?: (id: string, el: HTMLDivElement) => void
} & Omit<HTMLAttributes<HTMLDivElement>, "id" | "onChange">


export default function TextWrapper({ id, data, onChange, onEnter, tag = "div", block, focus = false, onFocus, registerRef, onBackspace, ...props }: TextWrapperProps) {

    const saveChanges = (e: FormEvent) => {

        const value: string = e.currentTarget.textContent ?? ""

        fetch("/api/blocks/" + id, {
            method: "PATCH",
            body: JSON.stringify({
                data: { text: value }
            })
        })
    }

    const {defaultValue, ...rest} = props

    return (
        <Editable
            value={block.data.text}
            onClick={() => { if (onFocus) onFocus() }}
            onChange={value => { if (onChange) onChange({
                ...block,
                data: {text: value.toString()}
            })}}
            onBlur={saveChanges}
            requestFocus={focus}
            tag={tag}
            className="w-full text-zinc-800"
            registerRef={(el) => {
                if(registerRef) registerRef(id, el)
            }}
            onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()

                    if (onEnter) {
                        const selection = window.getSelection()
                        
                        onEnter(id, selection?.anchorOffset ?? -1)
                    }
                }

                if(e.key === "Backspace"){
                    if(onBackspace) onBackspace(id, window.getSelection()?.anchorOffset ?? -1)
                }
            }}
            {...rest}
        />
    )


}