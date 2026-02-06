"use client"

import Block from "@/components/editor/block";
import { BlockType } from "@/components/editor/types";
import { useEffect, useRef, useState } from "react";

export type Block = {
    id: string
    parentBlockId: number | null
    type: BlockType
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

    const blocksRef = useRef<boolean>(false);

    

    /**========================= Helper functions =========================== */

    function normalizeOrders(blocks: Block[]): Block[] {
        const sorted = [...blocks].sort(
            (a, b) => Number(a.order) - Number(b.order)
        )

        return sorted.map((block, i) => ({
            ...block,
            order: (i + 1).toFixed(10)
        }))
    }


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

        if (idx === -1) return blocks

        const previous: Block = blocks[idx]
        const next: Block = blocks[idx + 1]
        const isHeading = previous.type === "heading1" || previous.type === "heading2" || previous.type === "heading3"

        cursorPos = Math.max(0, Math.min(cursorPos, previous.data.text.length))


        //Calculate new order for block
        const orderBefore = parseFloat(previous.order) || 0
        const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
        let newOrderNum = ((orderBefore + orderAfter) / 2)

        if (newOrderNum === orderBefore || newOrderNum === orderAfter) {
            newOrderNum += 0.000001
        }

        const newOrder = newOrderNum.toFixed(12)

        let newBlockData: Partial<{
            text: string
            checked: boolean
        }> = {}

        newBlockData.text = previous.data.text.slice(cursorPos)

        if (previous.type === "check_list") {
            newBlockData.checked = false
        }
        return [
            ...blocks.slice(0, idx),
            //Previous block
            {
                ...previous,
                data: { ...previous.data, text: previous.data.text.slice(0, cursorPos) },
                updatedAt: Date.now(),
                type: cursorPos === 0 && previous.type.startsWith("heading") ? "text" : previous.type
            },

            //New block
            {
                id: crypto.randomUUID(),
                parentBlockId: null,
                type: isHeading && cursorPos === 0 || ["check_list", "bullet_list", "ordered_list"].includes(previous.type) ? previous.type : "text",
                order: newOrder,
                data: newBlockData,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            ...blocks.slice(idx + 1)
        ]
    }

    const updateBlock = (blockId: string, blockData: Partial<Omit<Block, "id">>) => {
        setBlocks(prev => prev.map(b => {
            if (b.id === blockId) {
                return { ...b, ...blockData }
            }
            return b
        }))
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

        if (!res.ok) {
            throw new Error("Failed to delete the block")
        }

        return await res.json()
    }

    const updateAPI = async (blockId: string, patch: { type?: string, blockOrder?: string, data?: object }) => {

        if (!patch || Object.entries(patch).length === 0) {
            throw new Error("No data was given to update")
        }

        const res = await fetch(`/api/blocks/${blockId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patch)
        })

        if (!res.ok) {
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
            body: JSON.stringify({ title })
        })

        if (!res.ok) {
            throw new Error("Failed to rename the page !");
        }

        return await res.json()
    }

    /**========================= Client functions =========================== */

    const handleArrowNavigation = (e: KeyboardEvent) => {

        if (!blocks || blocks.length === 0) return

        if (e.key === "ArrowUp") {
            setFocusedIndex(i => {
                if (i === null || i === 0) {
                    return 0
                }

                let prevIndex: number;

                for(prevIndex = i - 1; prevIndex >= 0; prevIndex--){
                    if(blocks[prevIndex].type !== "divider") break
                }

                if(prevIndex === -1) return i

                
                const el = cursorRef.current.get(blocks[i].id)

                if (!el) return i

                const sel = window.getSelection()

                if (!sel) return prevIndex

                const offset = sel.anchorOffset

                focusAt(blocks[prevIndex].id, offset)
                return prevIndex
            }
            )
        }

        if (e.key === "ArrowDown") {
            setFocusedIndex(i => {
                if (i === null) { return 0 }
                if (blocks.length === i + 1) return i

                let nextIndex : number

                for(nextIndex = i + 1; nextIndex < blocks.length; nextIndex++){
                    if(blocks[nextIndex].type !== "divider") break
                }

                if(nextIndex === blocks.length) return i

                const el = cursorRef.current.get(blocks[i].id)

                if (!el) return nextIndex

                const sel = window.getSelection()

                if (!sel) return nextIndex

                const offset = sel.anchorOffset

                focusAt(blocks[nextIndex].id, offset)
                return nextIndex
            }
            )
        }

        if (e.key === "ArrowLeft") {
            setFocusedIndex(i => {
                if (i === null || i === 0) return i

                const sel = window.getSelection()
                if (!sel) return i

                if (sel.anchorOffset !== 0) return i

                let prevIndex: number

                for(prevIndex = i - 1; prevIndex >= 0; prevIndex--){
                    if(blocks[prevIndex].type !== "divider") break
                }

                focusAt(blocks[prevIndex].id, blocks[prevIndex].data.text.length)

                return prevIndex
            })

        }

        if (e.key === "ArrowRight") {
            setFocusedIndex(i => {
                if (i === null || i === blocks.length - 1) return i

                const sel = window.getSelection()
                if (!sel) return i

                const current = blocks[i]

                if (!current) return i
                if (sel.anchorOffset !== current.data.text.length) return i

                let nextIndex : number

                for(nextIndex = i + 1; nextIndex < blocks.length; nextIndex++){
                    if(blocks[nextIndex].type !== "divider") break
                }

                focusAt(blocks[nextIndex].id, 0)

                return nextIndex
            })
        }
    }

    const registerRef = (id: string, el: HTMLDivElement) => {
        if (el) {
            cursorRef.current.set(id, el)
        } else {
            cursorRef.current.delete(id)
        }
    }

    const handleEnter = async (blockId: string, cursorPos: number) => {

        const index = blocks.findIndex(b => b.id === blockId)

        if (index === -1) return

        const previous = blocks[index]
        const next = blocks[index + 1]

        if (previous.type.endsWith("list") && !previous.data.text.length) {
            updateBlock(blockId, { type: "text" })
            return
        }

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

        console.log(newBlocks[index + 1]);
        

        //Call API
        try {
            await createBlockAPI(pageId, {
                id: newBlocks[index + 1].id,
                type: newBlocks[index + 1].type,
                order: newOrder,
                data: { text: cursorAtEnd ? "" : afterText }
            })

            //Edits the previous block if cursorAtEnd is false
            const type = newBlocks[index].type
            console.log(type);

            if (!cursorAtEnd) {
                await updateAPI(blockId, { data: { text: beforeText }, type })
            }
        } catch (err) {
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

        try {
            await deleteBlockAPI(blockId)
        } catch (err) {
            console.log(err)
        }
    }


    const handleDataChanges = async (block: Block) => {
        const value: string = block.data.text

        const shortcuts: Map<String, BlockType> = new Map()
        shortcuts.set("1.", "ordered_list")
        shortcuts.set("-", "bullet_list")
        shortcuts.set("?", "check_list")
        shortcuts.set("#", "heading1")
        shortcuts.set("##", "heading2")
        shortcuts.set("###", "heading3")
        shortcuts.set("---", "divider")


        const data: Partial<{
            type: BlockType
            data: {
                text: string
                checked?: boolean
            }
        }> = {
            data: block.data,
            type: block.type
        }

        const trimmed = value.trimEnd()

        if (shortcuts.has(trimmed)) {

            if(trimmed === "---"){
                data.type = "divider"
            }

            if(trimmed !== value){
                if (data.data) {
                   data.data.text = ""
                }
                data.type = shortcuts.get(value.trimEnd())
            }
        }

        setBlocks(prev => prev.map(b => {
            if (b.id === block.id) {
                return {
                    ...b,
                    ...data
                }
            }
            return b
        }))

        await updateAPI(block.id, {
            type: data.type,
            data: data.data
        })
    }

    const handleBackspace = async (blockId: string, cursorPos: number) => {

        if (cursorPos) return

        const idx = blocks.findIndex(b => b.id === blockId)

        if (["bullet_list", "ordered_list", "check_list", "quote"].includes(blocks[idx].type)) {
            if (cursorPos === 0) {
                handleDataChanges({
                    ...blocks[idx],
                    type: "text"
                })
                await updateAPI(blockId, { type: "text" })
                return;
            }
        }

        if (idx <= 0) return


        let prevIndex: number;

        for (prevIndex = idx -1; prevIndex >= 0; prevIndex--) {
            if (blocks[prevIndex].type !== "divider") {
                break;
            }
        }

        if (prevIndex === -1) return

        setBlocks(prev => {
            
            const prevBlock = prev[prevIndex]
            const currentBlock = prev[idx]

            const merged: Block = {
                ...prevBlock,
                data: {
                    text: prevBlock.data.text + currentBlock.data.text
                }
            }

            const updates: Block[] = [
                ...prev.slice(0, prevIndex), //Blocks before the merged block
                merged, //Merged block
                ...prev.slice(prevIndex + 1, idx), //Blocks after merged block till current block (excluded)
                ...prev.slice(idx + 1) //Blocks after current block (excluded)
            ]

            return updates
        })



        setFocusedIndex(prevIndex)
        focusAt(blocks[prevIndex].id, blocks[prevIndex].data.text.length)

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

    async function createFirstBlock() {
        const block: Block = {
            id: crypto.randomUUID(),
            type: "text",
            data: { text: "" },
            order: "1.00000",
            parentBlockId: null,
            updatedAt: Date.now(),
            createdAt: Date.now()
        }

        setBlocks([block])
        setFocusedIndex(0)

        await createBlockAPI(pageId, block)
    }

    const getNumberedListIndex = (blocks: Block[], idx: number) => {
        let count = 1;

        if (blocks[idx].type !== "ordered_list") return 0

        for (let i = idx - 1; i >= 0; i--) {
            if (blocks[i].type !== "ordered_list") break
            count++
        }
        return count
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
        renamePageAPI,
        createFirstBlock,
        getNumberedListIndex
    }
}

//Lines: 329