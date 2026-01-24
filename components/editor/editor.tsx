"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import TextBlock from "./blocks/textblock"
import useEditor from "@/hooks/useEditor"
import Editable from "../ui/editable"
import { Trash } from "lucide-react"

type EditorProps = {
    params: { id: number }
}

export default function Editor({ params }: EditorProps) {

    const editor = useEditor(params.id)

    useEffect(() => {
        const handler = editor.handleArrowNavigation
        document.addEventListener("keydown", handler)

        return () => document.removeEventListener("keydown", handler)
    }, [])

    return (
        <div className="w-screen">
            <header className="pt-30 pb-4 max-w-[1024px] m-auto">
                <h1 className={cn("text-3xl font-bold text-zinc-300", editor.title.length && "text-black")}>{editor.title.length ? editor.title : "New page"}</h1>
            </header>
            <main
                className="max-w-[1024px] h-full m-auto">

                {
                    editor.blocks.map((block, idx) => {

                        return (
                            <div className="flex group" key={idx}>
                                <TextBlock
                                    key={block.id}
                                    id={block.id}
                                    order={block.order}
                                    focus={idx === editor.currentIndex}
                                    onEnter={editor.handleEnter}
                                    onFocus={() => editor.setIndex(idx)}
                                    onBackspace={editor.handleBackspace}
                                    className="flex-1"
                                    onChange={(blockId, value) => editor.handleDataChanges(blockId, value)}
                                    data={block.data}
                                />

                                <Trash className="opacity-0 cursor-pointer group-hover:opacity-55" size={16} onClick={()=> editor.deleteBlock(block.id)}/>
                            </div>
                        )
                    })
                }
            </main>
        </div>
    )
}