"use client"

import { cn } from "@/lib/utils"
import { createContext, useCallback, useEffect, useMemo } from "react"
import useEditor from "@/hooks/useEditor"
import Editable from "../ui/editable"
import BlockTree from "./blockstree"
import useEditorStore from "@/stores/useEditorStore"
import { Block } from "./types"

type EditorProps = {
    params: { id: number }
}

const TITLE_INPUT = "TITLE INPUT"

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


    const dummyBlock: Block = {
        id: "fake id",
        order: "1",
        parentBlockId: null,
        type: "text",
        data: {
            text: "A quick brown fox jumps over the lazy dog.",
            styles: [
                {
                    start: 2,
                    end: 7,
                    styles: {
                        bold: true,
                        italic: true
                    } 
                },
                {
                    start: 8,
                    end: 22,
                    styles: {
                        color: "red"
                    }
                },
                {
                    start: 38,
                    end: 41,
                    styles: {
                        link: "google.com"  
                    }
                }
            ]
        },
        updatedAt: Date.now(),
        createdAt: Date.now()
    }

                        
    return (
        <div className="w-screen">
            <header className="pt-30 pb-4 pl-6 max-w-5xl m-auto">
                <Editable
                    tag="h1"
                    onBlur={e => {
                        if(params.id && e.currentTarget.textContent){
                            editor.actions.renamePageAPI(params.id, e.currentTarget.textContent)
                        }
                    }  }
                    value={editor.state.title}
                    requestFocus={editor.state.title.length == 0}
                    onFocus={()=> editor.actions.setFocusedBlockId(TITLE_INPUT)}
                    onChange={(value)=> editor.others.setTitle(value.toString())}
                    onKeyDown={e => {
                        if(e.key === "Enter"){
                            e.preventDefault()

                            if(useEditorStore.getState().rootIds.length === 0){
                                editor.actions.createFirstBlock()
                            }else{
                                const selection = window.getSelection()
                                const offset = selection?.anchorOffset
                                if(offset){
                                    editor.actions.handleEnter(TITLE_INPUT, offset)
                                }
                            }
                        }
                    }}
                    registerRef={editor.others.addTitleRef}
                    className={cn("text-3xl font-medium", editor.state.title.length && "text-primary")}/>
            </header>
            <main
                className="dark:bg-background max-w-5xl h-full m-auto select-text">
                {/* <RichTextEditor
                    className="px-7 py-2"
                    block={dummyBlock}
                /> */}
                <BlockTree
                    actions={rendererActions}/>
            </main>
        </div>
    )
}