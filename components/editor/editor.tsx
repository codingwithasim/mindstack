"use client"

import { cn } from "@/lib/utils"
import { useEffect } from "react"
import TextBlock from "./blocks/textblock"
import useEditor from "@/hooks/useEditor"

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
                            <TextBlock
                                key={block.id}
                                id={block.id}
                                order={block.order}
                                focus={idx === editor.currentIndex}
                                onEnter={editor.handleEnter}
                                onFocus={() => editor.setIndex(idx)}
                                onBackspace={editor.deleteBlock}
                                data={block.data} />
                        )
                    })
                }
            </main>
        </div>
    )
}