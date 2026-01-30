"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import TextBlock from "./blocks/textblock"
import useEditor from "@/hooks/useEditor"
import Editable from "../ui/editable"
import { Trash } from "lucide-react"
import BlockRenderor from "./renderor"

type EditorProps = {
    params: { id: number }
}

export default function Editor({ params }: EditorProps) {

    const editor = useEditor(params.id)

    useEffect(() => {
        const handler = editor.handleArrowNavigation
        document.addEventListener("keydown", handler)

        return () => document.removeEventListener("keydown", handler)
    }, [editor.blocks])

    return (
        <div className="w-screen">
            <header className="pt-30 pb-4 pl-6 max-w-[1024px] m-auto">
                <Editable
                    tag="h1"
                    onBlur={e => editor.renamePageAPI(e.currentTarget.textContent)  }
                    value={editor.title}
                    requestFocus={editor.title.length == 0}
                    onKeyDown={e => {
                        if(e.key === "Enter"){
                            editor.createFirstBlock()
                        }
                    }}
                    className={cn("text-3xl font-bold", editor.title.length && "text-black")}/>
            </header>
            <main
                className="max-w-[1024px] h-full m-auto">

                {
                    editor.blocks.map((block, idx) => {

                        return (
                            <div className="flex group" key={idx}>
                                <BlockRenderor
                                    key={block.id}
                                    id={block.id}
                                    block={block}
                                    order={block.order}
                                    type={block.type}
                                    focus={idx === editor.currentIndex}
                                    onEnter={(currentBlock, cursorPos) => editor.handleEnter(currentBlock, cursorPos)}
                                    onFocus={() => editor.setIndex(idx)}
                                    onBackspace={editor.handleBackspace}
                                    onChange={(block) => editor.handleDataChanges(block)}
                                    data={block.data}
                                    registerRef={(id, el) => {
                                        editor.registerRef(id, el)
                                    }}
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