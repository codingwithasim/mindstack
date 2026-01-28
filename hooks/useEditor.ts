"use client"

import Block from "@/components/editor/block";
import { useEffect, useRef, useState } from "react";

type Block = {
    id: string
    parentBlockId: number | null
    type: string
    order: string
    data: { text: string }
    createdAt: number
    updatedAt: number
}


export default function useEditor(pageId: number) {

    const [title, setTitle] = useState<string>("")
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const cursorRef = useRef<Map<string, HTMLDivElement>>(new Map())


    useEffect(() => {

        /**Load page title*/
        fetch("/api/pages/" + pageId).then(response => {
            response.json().then(page => {
                if (response.status === 200) {
                    setTitle(page.title)
                    return
                }
            })
        }).catch(err => console.log(err.message))

        /**Load current page's blocks*/
        fetch("/api/pages/" + pageId + "/blocks", { method: "GET" })
            .then(response => {
                response.json().then(data => {
                    if (response.status === 200) {
                        setBlocks(data.map((b: any) => {
                            return {
                                ...b,
                                data: JSON.parse(b.data)
                            }
                        }))
                    }
                }
                )
            })
    }, [])

    /**========================= Helper functions =========================== */

    const insertBlock = (blocks: Block[], block: Block) => {
        return [
            ...blocks, block
        ].sort((a, b) => parseFloat(a.order) - parseFloat(b.order))
    }

    const deleteBlock = (blocks: Block[], blockId: string) => {
        return blocks.filter(b => b.id !== blockId)
    }

    const splitBlock = (blocks: Block[], blockId: string, cursorPos: number): Block[] => {
        
        const idx: number = blocks.findIndex(b => b.id === blockId)

        if(idx === -1) return blocks
    
        const previous: Block = blocks[idx]
        const next: Block = blocks[idx + 1]

        cursorPos = Math.max(0, Math.min(cursorPos, previous.data.text.length))

        //Calculate new order for block
        const orderBefore = parseFloat(previous.order)
        const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
        const newOrder = ((orderBefore + orderAfter) / 2).toFixed(5)

        return [
            ...blocks.slice(0, idx),
            {
                ...previous,
                data: {text: previous.data.text.slice(0, cursorPos)},
                updatedAt: Date.now()
            },
            {
                id: crypto.randomUUID(),
                parentBlockId: null,
                type: "text",
                order: newOrder,
                data: {
                    text: previous.data.text.slice(cursorPos)
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            ...blocks.slice(idx + 1)
        ]
    }

    const mergeBlock = (blocks: Block[], blockId: string, toId: string) => {

    }

    /**========================= API Helper functions =========================== */

    const createBlockAPI = async (pageId: number, block: Omit<Block, "updatedAt" | "createdAt" | "parentBlockId">) => {
        const res = await fetch("/api/pages/" + pageId + "/blocks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: block.id,
                blockOrder: block.order,
                type: block.type,
                data: block.data
            })
        })

        if (!res.ok) {
            throw new Error("Failed to create block")
        }

        return await res.json()
    }

    const deleteBlockAPI = async (blockId: string) => {
        const res = await fetch(`/api/blocks/${blockId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        })

        if(!res.ok){
            throw new Error("Failed to delete the block")
        }

        return await res.json()
    }

    const updateAPI = async (blockId: string, patch: {type?: string, blockOrder?: string, data: object}) => {
        
        if(!patch || Object.entries(patch).length === 0){
            throw new Error("No data was given to update")
        }
        
        const res = await fetch(`/api/blocks/${blockId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patch)
        })

        if(!res.ok){
            throw new Error("Failed to update the block")
        }

        return await res.json()
    }

    const createPageAPI = async (title: string = "") => {
        return await fetch("/api/pages/", {
            method: "POST",
            body: JSON.stringify({
                title
            })
        })
    }

    const renamePageAPI = async (title: string) => {
        const res = await fetch(`/api/pages/${pageId}`, {
            method: "PATCH",
            body: JSON.stringify({title})
        })

        if(!res.ok){
            throw new Error("Failed to rename the page !");
        }

        return await res.json()
    }

    /**========================= Client functions =========================== */

    const handleArrowNavigation = (e: KeyboardEvent) => {

        if(!blocks || blocks.length === 0) return

        if (e.key === "ArrowUp") {
            setFocusedIndex(i =>
                {
                    if(i === null || i === 0){
                        return 0
                    }

                    const prevIndex = i -1
                    const el = cursorRef.current.get(blocks[i].id)
                    
                    if(!el) return i - 1

                    const sel = window.getSelection()

                    if(!sel) return i - 1

                    const offset = sel.anchorOffset


                    focusAt(blocks[prevIndex].id, offset)
                    return i - 1
                }
            )
        }

        if (e.key === "ArrowDown") {
            setFocusedIndex(i =>
                {
                    if(i === null){return 0}
                    if( blocks.length === i + 1) return i

                        const prevIndex = i + 1
                        const el = cursorRef.current.get(blocks[i].id)
                        
                        if(!el) return i + 1

                        const sel = window.getSelection()

                        if(!sel) return i + 1

                        const offset = sel.anchorOffset


                        focusAt(blocks[prevIndex].id, offset)
                        return i + 1
                }
            )
        }

        if(e.key === "ArrowLeft") {
            setFocusedIndex(i => {
                if(i === null || i === 0) return i

                const sel = window.getSelection()
                if(!sel) return i     
                
                if(sel.anchorOffset !== 0) return i

                focusAt(blocks[i - 1].id, blocks[i - 1].data.text.length)

                return i - 1
            })
            
        }

        if(e.key === "ArrowRight") {
            setFocusedIndex(i => {
                if(i === null || i === blocks.length - 1) return i

                const sel = window.getSelection()
                if(!sel) return i

                const current = blocks[i]

                if(!current) return i
                if(sel.anchorOffset !== current.data.text.length) return i

                focusAt(blocks[i + 1].id, 0)

                return i + 1
            })
        }
    }

    const registerRef = (id: string, el: HTMLDivElement) => {
        if(el){
            cursorRef.current.set(id, el)
        }else{
            cursorRef.current.delete(id)
        }
    }

    const handleEnter = async (blockId: string, cursorPos: number) => {

        const index = blocks.findIndex(b => b.id === blockId)

        if(index === -1) return

        const previous = blocks[index]
        const next = blocks[index + 1]

        //Calculate new order for block
        const orderBefore = parseFloat(previous.order)
        const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
        const newOrder = ((orderBefore + orderAfter) / 2).toFixed(5)

        const current: Block = blocks[index]
        const beforeText: string = current.data.text.slice(0, cursorPos);
        const afterText: string = current.data.text.slice(cursorPos);

        //Checks if cursor is at the end of the line
        const cursorAtEnd = blocks[index].data.text.length === cursorPos

        const newBlocks: Block[] = splitBlock(blocks, blockId, cursorPos)
        setBlocks(newBlocks)
        setFocusedIndex(index + 1)

        //Call API
        try{
            await createBlockAPI(pageId, {
                id: newBlocks[index + 1].id,
                type: "text",
                order: newOrder,
                data: { text: cursorAtEnd ? "" : afterText}
            })

            //Edits the previous block if cursorAtEnd is false
            if (!cursorAtEnd) {
                await updateAPI(blockId, { data: { text: beforeText}})
            }
        }catch(err){
            console.log("Failed to split block", err)
        }
        
    }

    const handleDeleteBlock = async (blockId: string) => {
        if (focusedIndex == 0) return;

            //Filter out blocks excluding blockId
            setBlocks(prev => deleteBlock(prev, blockId))

            if (focusedIndex) {
                setFocusedIndex(focusedIndex - 1)
            }

            try{
                await deleteBlockAPI(blockId)
            }catch(err){
                console.log(err)
            }
    }

    const handleDataChanges = (blockId: string, value: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.id === blockId) {
                return { ...block, data: { text: value } }
            }
            return block
        }))
    }

    const handleBackspace = async (blockId: string, cursorPos: number) => {

        if (cursorPos) return

        const idx = blocks.findIndex(b => b.id === blockId)

        if (idx <= 0) return


        setBlocks(prev => {
            const updates: Block[] = [
                ...prev.slice(0, idx - 1),
                {
                    ...prev[idx - 1],
                    data: {
                        text: prev[idx - 1].data.text + prev[idx].data.text,
                    },
                    updatedAt: Date.now()
                },
                ...prev.slice(idx + 1)
            ]

            return updates
        })

        setFocusedIndex(idx - 1)
        focusAt(blocks[idx - 1].id, blocks[idx-1].data.text.length)

        await deleteBlockAPI(blockId)
    }

    function focusAt(blockId: string, offset: number) {
        requestAnimationFrame(() => {
            const el = cursorRef.current.get(blockId)

            if (!el) return

            el.focus()

            const selection = window.getSelection()
            if (!selection) return

            const range = document.createRange()

            const textNode = el.firstChild
            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return

            range.setStart(textNode, Math.min(offset, textNode.textContent!.length))
            range.collapse(true)

            selection.removeAllRanges()
            selection.addRange(range)
        })
    }

    return {
        title,
        blocks,
        currentIndex: focusedIndex,
        setIndex: setFocusedIndex,
        handleArrowNavigation,
        handleEnter,
        deleteBlock: handleDeleteBlock,
        handleDataChanges,
        handleBackspace,
        registerRef,
        renamePageAPI
    }
}

//Lines: 329