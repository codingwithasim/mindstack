"use client"

import { cn } from "@/lib/utils"
import { createContext, useEffect, useState } from "react"
import useEditor from "@/hooks/useEditor"
import Editable from "../ui/editable"
import { Trash } from "lucide-react"
import BlockRenderor from "./renderor"

type EditorProps = {
    params: { id: number }
}

export const EditorContext = createContext<any>(null)

export default function Editor({ params }: EditorProps) {

    const editor = useEditor(params.id)

    useEffect(() => {
        const handler = editor.handleArrowNavigation
        document.addEventListener("keydown", handler)
        
        return () => document.removeEventListener("keydown", handler)
    }, [editor.blocks])

    return (
        <EditorContext value={{editor}}>
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
                    className={cn("text-3xl font-bold", editor.title.length && "text-primary")}/>
            </header>
            <main
                className="dark:bg-background max-w-[1024px] h-full m-auto select-text">
                {
                    editor.blocks.map((block, idx) => {
                        const listIndex = block.type === "ordered_list" ?
                            editor.getNumberedListIndex(editor.blocks, block.id) :
                            undefined

                        if(block.parentBlockId) return null

                        return (
                            <div className="flex" key={idx}>
                                <BlockRenderor
                                    key={block.id}
                                    id={block.id}
                                    block={block}
                                    order={block.order}
                                    type={block.type}
                                    listIndex={listIndex}
                                    focus={block.id === editor.focusedBlockId}
                                    onEnter={(currentBlock, cursorPos) => editor.handleEnter(currentBlock, cursorPos)}
                                    onFocus={() => {
                                        editor.setIndex(idx)
                                        editor.setFocusedBlockId(block.id)
                                        console.log("parent id", block.id);
                                        
                                    }}
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
        </EditorContext>
    )
}