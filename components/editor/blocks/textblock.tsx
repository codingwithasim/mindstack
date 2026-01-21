"use client"


import { FormEvent, RefObject, useEffect, useRef, useState } from "react";

interface TextBlockProps {
    id: number
    order: string
    data: { text: string }
    parentBlockId?: number
    onEnter?: (currentBlock: number) => void
    onChange?: (id: number, value: string) => void
    onFocus?: () => void
    onBackspace?: (id: number) => void
    focus?: boolean
}


export default function TextBlock({ id, data, onChange, onEnter, focus = false, onFocus, onBackspace }: TextBlockProps) {

    const [value, setValue] = useState(data.text)

    const divRef: RefObject<HTMLDivElement | undefined> = useRef(undefined)


    const handleInputChange = (e: FormEvent) => {
        const value = e.currentTarget.textContent

        setValue(value)

        if (onChange) {
            onChange(id, value)
        }
    }

    useEffect(() => {
        if (divRef.current) {
            divRef.current.textContent = value;
        }
    }, []);

    useEffect(() => {
        if (focus && divRef.current) {
            divRef.current.focus()
        }
    }, [focus])


    const saveChanges = () => {
        if (value === data.text) return

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

    return (
        <div
            contentEditable
            role="textbox"
            ref={divRef}
            tabIndex={0}
            aria-multiline
            onBlur={saveChanges}
            onInput={handleInputChange}
            onClick={() => {
                if (onFocus) {
                    onFocus()
                }
            }}
            onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()

                    if (onEnter) {
                        onEnter(id)
                    }
                }

                if(e.key === "Backspace" && value.length == 0){
                    if(onBackspace) onBackspace(id)
                }
            }}
            className="text-[16px] py-1.5 leading-noraml focus:outline-none"
            suppressContentEditableWarning>
        </div>
    )


}