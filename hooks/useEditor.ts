"use client"

import { useEffect, useRef, useState } from "react";

type Block = {
    id: number
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

    useEffect(() => {
        setFocusedIndex(i => {
            if (i === null) return null
            if (blocks.length === 0) return null
            return Math.max(0, Math.min(blocks.length - 1, i))
        })
    }, [blocks.length, focusedIndex])


    const handleArrowNavigation = (e: KeyboardEvent) => {

        if (e.key === "ArrowUp") {
            setFocusedIndex(i =>
                i === null ? 0 : i - 1
            )
        }

        if (e.key === "ArrowDown") {
            setFocusedIndex(i =>
                i === null ? 0 : i + 1
            )

        }
    }

    const handleEnter = async (blockId: number, cursorPos: number) => {

        const index = blocks.findIndex(b => b.id === blockId)

        const previous = blocks[index]
        const next = blocks[index + 1]

        //Calculate new order for block
        const orderBefore = parseFloat(previous.order)
        const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
        const newOrder = ((orderBefore + orderAfter) / 2).toFixed(5)


        const current: Block = blocks[index]
        const beforeText: string = current.data.text.slice(0, cursorPos);
        const afterText: string = current.data.text.slice(cursorPos);

        //Add a block with temp id for optimisitic UI + Re-order blocks
        const tempId: number = - Date.now()

        //Checks if cursor is at the end of the line
        //It is used to find out whether to cut the text or not
        const cursorAtEnd = blocks[index].data.text.length === cursorPos

        setBlocks(prev => {
            const updated: Block[] = [
                ...prev.slice(0, index),
                {
                    ...current,
                    data: {
                        text: beforeText
                    },
                    updatedAt: Date.now()
                },
                {
                    id: tempId,
                    type: "text",
                    order: newOrder,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    data: { text: cursorAtEnd ? "" : afterText },
                    parentBlockId: null
                },
                ...prev.slice(index + 1)
            ]

            return updated.sort((a, b) => parseFloat(a.order) - parseFloat(b.order))
        })

        //Call API
        //Creates the new block
        setFocusedIndex(prev => prev ? prev + 1 : 0)

        const res = await fetch("/api/pages/" + pageId + "/blocks", {
            method: "POST",
            body: JSON.stringify({
                type: "text",
                order: newOrder,
                data: { text: cursorAtEnd ? "" : afterText }
            })
        })

        //Edits the previous block if cursorAtEnd is false
        if (!cursorAtEnd) {
            const res = await fetch("/api/blocks/" + blockId, {
                method: "PATCH",
                body: JSON.stringify({
                    data: { text: beforeText }
                })
            })
        }

        const newBlock = await res.json()

        //Replace the tempId with the new one
        setBlocks(blocks => blocks.map(b => {
            if (b.id === tempId) {
                return { ...b, id: newBlock.id }
            }
            return b
        }))
    }

    const deleteBlock = async (blockId: number) => {

        if (focusedIndex == 0) return;

        //Filter out blocks excluding blockId
        setBlocks(blocks => blocks.filter(b => blockId !== b.id))

        if (focusedIndex) {
            setFocusedIndex(focusedIndex - 1)
        }

        await fetch("/api/blocks/" + blockId, {
            method: "DELETE"
        })
    }

    const handleDataChanges = (blockId: number, value: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.id === blockId) {
                return { ...block, data: { text: value } }
            }
            return block
        }))
    }

    const handleBackspace = async (blockId: number, cursorPos: number) => {

        console.log(blockId, cursorPos);

        if (cursorPos) return

        const idx = blocks.findIndex(b => b.id === blockId)

        if (!idx) return

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

        await fetch("/api/blocks/" + blockId, {
            method: "DELETE"
        })

    }

    return {
        title,
        blocks,
        currentIndex: focusedIndex,
        setIndex: setFocusedIndex,
        handleArrowNavigation,
        handleEnter,
        deleteBlock,
        handleDataChanges,
        handleBackspace
    }
}