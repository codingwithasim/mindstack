"use client"

import { cn } from "@/lib/utils"
import { createContext, useCallback, useEffect, useMemo } from "react"
import useEditor from "@/hooks/useEditor"
import Editable from "../ui/editable"
import BlockTree from "./blockstree"

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
    }, [])

    const handleFocus = useCallback((blockId: string) => {
        editor.actions.setFocusedBlockId(blockId)
    }, [editor.actions.setFocusedBlockId])

    const handleRegisterRef = useCallback((id: string, el: HTMLDivElement)=> {
        editor.actions.registerRef(id, el)
    }, [editor.actions.registerRef])


    const rendererActions = useMemo(() => ({
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
    }), [
        editor.actions.handleEnter,
        editor.actions.handleBackspace,
        editor.actions.handleDataChanges,
        editor.actions.onSpace,
        editor.actions.indentBlock,
        editor.actions.deleteBlock,
        editor.actions.duplicateBlock,
        editor.actions.copy,
        editor.actions.getNumberedListIndex,
        handleFocus,
        handleRegisterRef,
    ])

                        
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
                <BlockTree
                    actions={rendererActions}/>
            </main>
        </div>
        </EditorContext>
    )
}