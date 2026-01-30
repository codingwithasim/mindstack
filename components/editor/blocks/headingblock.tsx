import Editable from "@/components/ui/editable"
import { cn } from "@/lib/utils"
import { FormEvent, HTMLAttributes } from "react"
import { Block } from "../types"

type HeadingBlockProps = {
    id: string
    order: string
    data: { text: string }
    parentBlockId?: number
    onEnter?: (currentBlock: string, cursorPos: number) => void
    onChange?: (block: Block) => void
    onFocus?: () => void
    block: Block
    onBackspace?: (id: string, cursorPos: number) => void
    focus?: boolean
    registerRef?: (id: string, el: HTMLDivElement) => void
    level?: number
} & Omit<HTMLAttributes<HTMLHeadingElement>, "id" | "onChange">

export default function HeadingBlock({ id, data, onChange, block, level= 1, onEnter, focus = false, onFocus, registerRef, onBackspace, ...props }: HeadingBlockProps) {

    const { defaultValue, ...rest } = props

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

    return (
        <Editable
            value={data.text}
            onClick={() => { if (onFocus) onFocus() }}
            onChange={value => { if (onChange) onChange({
                ...block,
                data: { text: value.toString()}
            }) }}
            requestFocus={focus}
            className={cn("w-full font-bold py-1 text-zinc-800", level === 1 && "text-3xl", level === 2 && "text-2xl", level === 3 && "text-xl")}
            tag="h1"
            onBlur={saveChanges}
            registerRef={(el) => {
                if (registerRef) registerRef(id, el)
            }}
            onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()

                    if (onEnter) {
                        const selection = window.getSelection()

                        onEnter(id, selection?.anchorOffset ?? -1)
                    }
                }

                if (e.key === "Backspace") {
                    if (onBackspace) onBackspace(id, window.getSelection()?.anchorOffset ?? -1)
                }
            }}
            {...rest}
        />
    )
}