"use client"

import { cn } from "@/lib/utils"
import { createContext, useCallback, useEffect, useState } from "react"
import useEditor from "@/hooks/useEditor"
import Editable from "../ui/editable"
import BlockRenderor from "./renderor"
import { Block } from "./types"

type EditorProps = {
    params: { id: number }
}

export const EditorContext = createContext<any>(null)

export default function Editor({ params }: EditorProps) {

    const editor = useEditor(params.id)

    useEffect(() => {
        const handler = editor.actions.handleArrowNavigation
        document.addEventListener("keydown", handler)

        return () => document.removeEventListener("keydown", handler)
    }, [editor.state.blocks])

    const handleFocus = useCallback((blockId: string) => {
        editor.actions.setFocusedBlockId(blockId)
        console.log(blockId, "was focused");
        
    }, [editor.actions.setFocusedBlockId])

    const handleRegisterRef = useCallback((id: string, el: HTMLDivElement)=> {
        editor.actions.registerRef(id, el)
    }, [editor.actions.registerRef])
                        
    return (
        <EditorContext value={{editor}}>
            <div className="w-screen">
            <header className="pt-30 pb-4 pl-6 max-w-5xl m-auto">
                <Editable
                    tag="h1"
                    onBlur={e => editor.actions.renamePageAPI(e.currentTarget.textContent)  }
                    value={editor.state.title}
                    requestFocus={editor.state.title.length == 0}
                    onKeyDown={e => {
                        if(e.key === "Enter"){
                            editor.actions.createFirstBlock()
                        }
                    }}
                    className={cn("text-3xl font-bold", editor.state.title.length && "text-primary")}/>
            </header>
            <main
                className="dark:bg-background max-w-5xl h-full m-auto select-text">
                {
                    editor.state.blocks.map((block, idx) => {
                        const listIndex = block.type === "ordered_list" ?
                            editor.actions.getNumberedListIndex(editor.state.blocks, block.id) :
                            undefined

                        if(block.parentBlockId) return null

                        return (
                            <div className="flex" key={block.id}>
                                <BlockRenderor
                                    block={block}
                                    listIndex={listIndex}
                                    focus={block.id === editor.state.focusedBlockId}
                                    
                                    state={{
                                        blocks: editor.state.blocks,
                                        childrenMap: editor.state.childrenMap,
                                        focusedBlockId: editor.state.focusedBlockId,
                                        currentIndex: editor.state.currentIndex
                                    }}

                                    actions={{
                                        onEnter: editor.actions.handleEnter,
                                        onBackspace: editor.actions.handleBackspace,
                                        onBlockFocus: handleFocus,
                                        onChange: editor.actions.handleDataChanges,
                                        onSpace: editor.actions.onSpace,
                                        onTab: editor.actions.indentBlock,
                                        registerRef: handleRegisterRef,
                                        onDelete: editor.actions.deleteBlock,
                                        onDuplicate: editor.actions.duplicateBlock,
                                        onCopy: editor.actions.copy,
                                        getNumberedListIndex: editor.actions.getNumberedListIndex,

                                    }}
                                    />
                            </div>
                        )
                    })
                }
            </main>
        </div>
        </EditorContext>
    )
}