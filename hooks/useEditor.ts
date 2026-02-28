"use client"

import { Block, BlockType } from "@/components/editor/types";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function useEvent<T extends (...args: any[]) => any>(handler: T): T {
    const handlerRef = useRef(handler)

    useLayoutEffect(() => {
        handlerRef.current = handler
    }, [handler])

    return useCallback(((...args: any[]) => handlerRef.current(...args)) as T, [])
}

export default function useEditor(pageId: number) {

    const [title, setTitle] = useState<string>("")
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const [focusedBlockId, setFocusedBlockId] = useState<String>()
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

    function normalizeOrders(blocks: Block[]): Block[] {
        const sorted = [...blocks].sort(
            (a, b) => parseFloat(a.order) - parseFloat(b.order)
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
            opened: boolean
        }> = {}

        newBlockData.text = previous.data.text.slice(cursorPos)

        if (previous.type === "check_list") {
            newBlockData.checked = false
        }

        let newType = "text"
        
        if(isHeading && cursorPos === 0){
            newType = previous.type
        }

        if(["check_list", "bullet_list", "ordered_list"].includes(previous.type)){
            newType = previous.type
        }

        if(previous.type === "toggle") {
            newType = previous.type
            newBlockData.opened = false
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
                parentBlockId: previous.parentBlockId,
                type: newType,
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

    const createBlockAPI = async (pageId: number, block: Omit<Block, "updatedAt" | "createdAt">) => {

        const res = await fetch("/api/pages/" + pageId + "/blocks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: block.id,
                blockOrder: block.order,
                type: block.type,
                data: block.data,
                parentBlockId: block.parentBlockId,
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
            setFocusedBlockId(prevId => {

                if (!prevId) {
                    return blocks.length > 0 ? blocks[0].id : prevId
                }

                const idx = blocks.findIndex(b => b.id === prevId)

                let prevIndex: number;
                let isClosedNestedBlock: boolean = false

                for (prevIndex = idx - 1; prevIndex >= 0; prevIndex--) {
                    const block = blocks[prevIndex]

                    if (block.type === "divider") continue
                    
                    if(block.parentBlockId){
                        console.log(block, isClosedNestedBlock);
                        
                        if(isClosedNestedBlock) continue
                        const parentBlock = blocks.find(b => b.id === block.parentBlockId)

                        if(!parentBlock) return prevId

                        if(parentBlock.data.opened){
                            break
                        }

                        isClosedNestedBlock = true
                        continue
                    }

                    break
                }

                if (prevIndex === -1) return blocks[idx].id

                const sel = window.getSelection()

                if (!sel) return blocks[prevIndex].id

                const offset = sel.anchorOffset

                focusAt(blocks[prevIndex].id, offset)
                return blocks[prevIndex].id
            }
            )
        }

        if (e.key === "ArrowDown") {
            setFocusedBlockId(prevId => {
                if (prevId === null) return blocks[0].id

                const idx: number = blocks.findIndex(b => b.id === prevId)

                if (blocks.length === idx + 1) return prevId

                let nextIndex: number
                let isClosedNestedBlock: boolean = false

                for (nextIndex = idx + 1; nextIndex < blocks.length; nextIndex++) {
                    const block = blocks[nextIndex]

                    if (block.type === "divider") continue

                    if(block.parentBlockId){
                        if(isClosedNestedBlock) continue
                        const parentBlock = blocks.find(b => b.id === block.parentBlockId)

                        if(!parentBlock) return prevId

                        if(parentBlock.data.opened){
                            break
                        }

                        isClosedNestedBlock = true
                        continue
                    }

                    break
                }

                if (nextIndex === blocks.length) return prevId

                const sel = window.getSelection()

                if (!sel) return blocks[nextIndex].id

                const offset = sel.anchorOffset

                focusAt(blocks[nextIndex].id, offset)
                return blocks[nextIndex].id
            })
        }

        if (e.key === "ArrowLeft") {
            setFocusedBlockId(prevId => {

                
                const idx = blocks.findIndex(b => b.id === prevId)
                if (prevId === null || idx === 0) return prevId

            
                const sel = window.getSelection()
                if (!sel) return prevId

                if (sel.anchorOffset !== 0) return prevId

                let prevIndex: number

                for (prevIndex = idx - 1; prevIndex >= 0; prevIndex--) {
                    if (blocks[prevIndex].type !== "divider") break
                }

                focusAt(blocks[prevIndex].id, blocks[prevIndex].data.text.length)

                return blocks[prevIndex].id
            })

        }

        if (e.key === "ArrowRight") {
            setFocusedBlockId(prevId => {

                const idx = blocks.findIndex(b => b.id === prevId)
                if (prevId === null || idx === blocks.length - 1) return prevId

                const sel = window.getSelection()
                if (!sel) return prevId

                const current = blocks[idx]

                if(!current) return prevId

                if (sel.anchorOffset !== current.data.text.length) return prevId

                let nextIndex: number

                for (nextIndex = idx + 1; nextIndex < blocks.length; nextIndex++) {
                    if (blocks[nextIndex].type !== "divider") break
                }

                focusAt(blocks[nextIndex].id, 0)

                return blocks[nextIndex].id
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

    const handleEnter = async (blockId: string, cursorPos: number, text?: string) => {

        const index = blocks.findIndex(b => b.id === blockId)

        if (index === -1) return

        let current = blocks[index]

        if (text !== undefined) {
            current = {
                ...current, data: {
                    ...current.data, text
                }
            }
        }

        const next = blocks[index + 1]

        if (current.type.endsWith("list") && !current.data.text.length) {
            updateBlock(blockId, { type: "text" })
            updateAPI(blockId, {type: "text"})
            return
        }

        if (current.type === "toggle") {
            const isCursorAtStart = cursorPos === 0
            const isCursorAtEnd = cursorPos === text?.length
            const isEmpty = text?.length === 0

            if (isEmpty) {
                updateBlock(blockId, { type: "text" })
                return
            }

            if (isCursorAtStart) {
                const prev = blocks[index - 1]
                const order = (parseFloat(current.order) + (prev ? parseFloat(prev.order) : 0)) / 2

                const newBlocks = insertBlock(blocks, {
                    id: crypto.randomUUID(),
                    type: "toggle",
                    parentBlockId: null,
                    data: {
                        text: "",
                        opened: false
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    order: order.toFixed(12)
                })

                newBlocks[index + 1] = current
                setBlocks(newBlocks)
                await createBlockAPI(pageId, newBlocks[index])

                return
            }

            if (isCursorAtEnd) {

                if (current.data.opened) {

                    const orderBefore = parseFloat(current.order)
                    const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
                    const newOrder = ((orderBefore + orderAfter) / 2).toFixed(12)

                    const newBlocks = insertBlock(blocks, {
                        id: crypto.randomUUID(),
                        type: "text",
                        data: {
                            text: ""
                        },
                        parentBlockId: blockId,
                        order: newOrder,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    })

                    setBlocks(newBlocks)
                    setFocusedBlockId(newBlocks[index + 1].id)

                    await createBlockAPI(pageId, newBlocks[index + 1])
                    return
                }
            }

        }

        //Calculate new order for block
        const orderBefore = parseFloat(current.order)
        const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
        const newOrder = ((orderBefore + orderAfter) / 2).toFixed(12)

        const beforeText: string = current.data.text.slice(0, cursorPos);
        const afterText: string = current.data.text.slice(cursorPos);

        const workingBlocks: Block[] = [...blocks]

        workingBlocks[index] = current

        //Checks if cursor is at the end of the line
        const cursorAtEnd = workingBlocks[index].data.text.length === cursorPos

        const newBlocks: Block[] = splitBlock(workingBlocks, blockId, cursorPos)

        setBlocks(newBlocks)
        setFocusedIndex(index + 1)
        setFocusedBlockId(newBlocks[index + 1].id)
        console.log(newBlocks[index + 1].id);
        

        //Call API
        try {
            await createBlockAPI(pageId, {
                id: newBlocks[index + 1].id,
                type: newBlocks[index + 1].type,
                order: newOrder,
                data: { text: cursorAtEnd ? "" : afterText },
                parentBlockId: newBlocks[index + 1].parentBlockId
            })

            //Edits the previous block if cursorAtEnd is false
            const type = newBlocks[index].type

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

        let data : {
            id: number
            title: string
        }

        if(block.type === "page"){
            console.log("here");
            
            try{
                const response = await fetch("/api/pages/" + pageId, {
                    method: "POST"
                })

                data = await response.json()

                console.log(data);
            }catch(err){
                console.log(err);
                return
            }
            
        }

        setBlocks(prev => prev.map(b => {
            if (b.id === block.id) {
                if(data){
                    block.data = {
                        ...block.data,
                        pageId: data.id
                    }
                }
                return block
            }
            return b
        }))

        await updateAPI(block.id, {
            type: block.type,
            data: block.data
        })
    }

    const handleBackspace = async (blockId: string, cursorPos: number, text: string) => {
        if (cursorPos) return

        const idx = blocks.findIndex(b => b.id === blockId)

        if (["bullet_list", "ordered_list", "check_list", "quote", "toggle"].includes(blocks[idx].type)) {
            if (cursorPos === 0) {
                handleDataChanges({
                    ...blocks[idx],
                    type: "text",
                    data: {
                        ...blocks[idx].data,
                        text
                    }
                })
                await updateAPI(blockId, { type: "text" })
                return;
            }
        }

        if (idx <= 0) return

        let prevIndex: number;

        for (prevIndex = idx - 1; prevIndex >= 0; prevIndex--) {
            if (blocks[prevIndex].type !== "divider") {
                break;
            }
        }

        if (prevIndex === -1) return

        const prevBlock = blocks[prevIndex]

        const resolvedData = {
            ...prevBlock.data,
            text: prevBlock.data.text + text
        }

        setBlocks(prev => {

            const merged: Block = {
                ...prevBlock,
                data: resolvedData
            }

            const updates: Block[] = [
                ...prev.slice(0, prevIndex), //Blocks before the merged block
                merged, //Merged block
                ...prev.slice(prevIndex + 1, idx), //Blocks after merged block till current block (excluded)
                ...prev.slice(idx + 1) //Blocks after current block (excluded)
            ]

            return updates
        })

        console.log(resolvedData);


        setFocusedIndex(prevIndex)
        setFocusedBlockId(blocks[prevIndex].id)

        const mergedLength: number = blocks[prevIndex].data.text.length ?? 0

        focusAt(blocks[prevIndex].id, mergedLength)

        console.log(resolvedData);

        await updateAPI(blocks[prevIndex].id, { data: resolvedData })
        await deleteBlockAPI(blockId)
    }

    function focusAt(blockId: string, offset: number) {
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

    async function createBlock(data: Omit<Block, "id" | "updatedOn" | "createdOn">) {
        const block: Block = {
            ...data,
            id: crypto.randomUUID(),
            updatedAt: Date.now(),
            createdAt: Date.now()
        }

        setBlocks(prev => insertBlock(blocks, block))

        await createBlockAPI(pageId, block)
    }

    const getNumberedListIndex = (blocks: Block[], blockId: string) => {

        const idx: number = blocks.findIndex(b => b.id === blockId)

        const isNested = blocks[idx].parentBlockId != null

        if (idx === -1) return 0

        if(idx > 0){
            if(blocks[idx-1].type !== "ordered_list" && blocks[idx].data.startingIndex)
                return blocks[idx].data.startingIndex
        }else{
            if(blocks[idx].type === "ordered_list" && blocks[idx].data.startingIndex)
                return blocks[idx].data.startingIndex
        }

        let count = 1;
        let countWithStartingIndex = 1

        if (blocks[idx].type !== "ordered_list") return 0

        let i = idx - 1

        for (; i >= 0; i--) {
            if (blocks[i].type !== "ordered_list" || (!isNested && blocks[i].parentBlockId)) break
            countWithStartingIndex += blocks[i].data.startingIndex ?? 1
            count += 1
        }

        i++
        
        const b = blocks[i]
        if(b.data.startingIndex && b.data.startingIndex > 1){
            return b.data.startingIndex + count
        }
        return count
    }

    const dublicateBlock = async (blockId: string) => {
        if (!blockId || typeof blockId !== "string") return

        const idx = blocks.findIndex(block => blockId === block.id)

        if (idx === -1) return

        const current: Block = blocks[idx]

        const clientId = crypto.randomUUID()

        const newBlock = { ...current, id: clientId }

        const newBlocks = insertBlock(blocks, newBlock)

        setBlocks(newBlocks)
        setFocusedBlockId(clientId)

        try {
            await createBlockAPI(pageId, newBlock)
        } catch (err) {
            console.log(err);
        }
    }

    const copy = async (blockId: string) => {
        if (!blockId || typeof blockId !== "string") return

        const idx = blocks.findIndex(block => blockId === block.id)

        if (idx === -1) return

        const current: Block = blocks[idx]

        const textToCopy = current.data.text

        return await navigator.clipboard.writeText(textToCopy)
    }

    const handleSpace = async (blockId: string, text: string) => {

        if (blockId === null || text === null) return

        const idx: number = blocks.findIndex(b => b.id === blockId)

        if (idx === -1) return

        const block: Block = blocks[idx]

        const shortcuts: Map<String, BlockType> = new Map()
        shortcuts.set("1.", "ordered_list")
        shortcuts.set("-", "bullet_list")
        shortcuts.set("?", "check_list")
        shortcuts.set("#", "heading1")
        shortcuts.set("##", "heading2")
        shortcuts.set("###", "heading3")
        shortcuts.set("---", "divider")
        shortcuts.set(">", "toggle")

        const data: Partial<{
            type: BlockType
            data: {
                text: string
                checked?: boolean
                opened?: boolean
                startingIndex?: number
            }
        }> = {
            data: block.data,
            type: block.type
        }

        const trimmed:string = text.trimEnd()

        const match = trimmed.match(/^(\d+)\./)

        if(match){
            const value = match[0]
            data.type = "ordered_list"
            if(data.data){
                data.data.startingIndex = Number(match[1])
            }
        }else{
            if (!shortcuts.has(trimmed)) return
            if (data.data) {
                data.data.text = ""
            }

            data.type = shortcuts.get(text.trimEnd())
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

    const handleArrowNavigationEvent = useEvent(handleArrowNavigation)
    const handleEnterEvent = useEvent(handleEnter)
    const handleDeleteBlockEvent = useEvent(handleDeleteBlock)
    const handleDataChangesEvent = useEvent(handleDataChanges)
    const handleBackspaceEvent = useEvent(handleBackspace)
    const registerRefEvent = useEvent(registerRef)
    const renamePageAPIEvent = useEvent(renamePageAPI)
    const createFirstBlockEvent = useEvent(createFirstBlock)
    const getNumberedListIndexEvent = useEvent(getNumberedListIndex)
    const createBlockEvent = useEvent(createBlock)
    const dublicateBlockEvent = useEvent(dublicateBlock)
    const copyEvent = useEvent(copy)
    const handleSpaceEvent = useEvent(handleSpace)

    return {
        title,
        blocks,
        currentIndex: focusedIndex,
        setIndex: setFocusedIndex,
        handleArrowNavigation: handleArrowNavigationEvent,
        handleEnter: handleEnterEvent,
        deleteBlock: handleDeleteBlockEvent,
        handleDataChanges: handleDataChangesEvent,
        handleBackspace: handleBackspaceEvent,
        registerRef: registerRefEvent,
        renamePageAPI: renamePageAPIEvent,
        createFirstBlock: createFirstBlockEvent,
        getNumberedListIndex: getNumberedListIndexEvent,
        createBlock: createBlockEvent,
        setFocusedBlockId,
        focusedBlockId,
        dublicateBlock: dublicateBlockEvent,
        copy: copyEvent,
        onSpace: handleSpaceEvent
    }
}

//Lines: 329
