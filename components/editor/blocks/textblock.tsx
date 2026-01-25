"use client"


import Editable from "@/components/ui/editable";
import { FormEvent, HTMLAttributes, RefObject, useEffect, useRef, useState } from "react";

type TextBlockProps = {
    id: string
    order: string
    data: { text: string }
    parentBlockId?: number
    onEnter?: (currentBlock: string, cursorPos: number) => void
    onChange?: (id: string, value: string) => void
    onFocus?: () => void
    onBackspace?: (id: string, cursorPos: number) => void
    focus?: boolean
    registerRef?: (id: string, el: HTMLDivElement) => void
} & Omit<HTMLAttributes<HTMLDivElement>, "id" | "onChange">


export default function TextBlock({ id, data, onChange, onEnter, focus = false, onFocus, registerRef, onBackspace, ...props }: TextBlockProps) {


    const saveChanges = (e: FormEvent) => {

        const value: string = e.currentTarget.textContent ?? ""

        fetch("/api/blocks/" + id, {
            method: "PATCH",
            body: JSON.stringify({
                data: { text: value }
            })
        }).then(response => {
            response.json().then(result => {
                console.log("✅ Saving completed.");

            })
        })
    }

    const {defaultValue, ...rest} = props

    return (
        <Editable
            value={data.text}
            onClick={() => { if (onFocus) onFocus() }}
            onChange={value => { if (onChange) onChange(id, value.toString()) }}
            onBlur={saveChanges}
            requestFocus={focus}
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

                // if (e.key === "Backspace" && data.text.length == 0) {
                //     if (onBackspace) onBackspace(id)
                // }
            }}
            {...rest}
        />
    )


}