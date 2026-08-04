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

    const handleEnter = useCallback(editor.actions.handleEnter, [editor.actions.handleEnter])

    const handleFocus = useCallback((blockId: string) => {
        editor.actions.setFocusedBlockId(blockId)
    }, [editor.actions.setFocusedBlockId])

    const handleRegisterRef = useCallback((id: string, el: HTMLDivElement)=> {
        editor.actions.registerRef(id, el)
    }, [editor.actions.registerRef])

    const handleChanges = useCallback((block: Block) => {
        editor.actions.handleDataChanges(block)
    }, [editor.actions.handleDataChanges])
                                    
    return (
        <EditorContext value={{editor}}>
            <div className="w-screen">
            <header className="pt-30 pb-4 pl-6 max-w-[1024px] m-auto">
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
                className="dark:bg-background max-w-[1024px] h-full m-auto select-text">
                    {/* <PageBlock/> */}
                {
                    editor.state.blocks.map((block, idx) => {
                        const listIndex = block.type === "ordered_list" ?
                            editor.actions.getNumberedListIndex(editor.state.blocks, block.id) :
                            undefined

                        if(block.parentBlockId) return null


                        return (
                            <div className="flex" key={block.id}>
                                <BlockRenderor
                                    id={block.id}
                                    block={block}
                                    order={block.order}
                                    type={block.type}
                                    blocks={editor.state.blocks}
                                    listIndex={listIndex}
                                    focus={block.id === editor.state.focusedBlockId}
                                    onEnter={handleEnter}
                                    onDelete={editor.actions.deleteBlock}
                                    onCopy={editor.actions.copy}
                                    onDuplicate={editor.actions.dublicateBlock}
                                    onFocus={handleFocus}
                                    onBackspace={editor.actions.handleBackspace}
                                    onChange={handleChanges}
                                    data={block.data}
                                    onSpace={editor.actions.onSpace}
                                    onTab={editor.actions.indentBlock}
                                    registerRef={handleRegisterRef}
                                    childrenMap={editor.state.childrenMap}
                                    focusedBlockId={editor.state.focusedBlockId}
                                    getNumberedListIndex={editor.actions.getNumberedListIndex}
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