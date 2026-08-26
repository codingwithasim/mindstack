"use client"

import { Block, BlockType } from "@/components/editor/types";
import { useEffect, useRef, useState } from "react";
import useEvent from "./useEvent";
import { toast } from "sonner";
import useEditorStore from "@/stores/useEditorStore";
import { api } from "@/api";

const TITLE_INPUT = "TITLE INPUT"




export default function useEditor(pageId: number) {

    const [title, setTitle] = useState<string>("")
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const [focusedBlockId, setFocusedBlockId] = useState<string>(TITLE_INPUT)
    const cursorRef = useRef<Map<string, HTMLDivElement>>(new Map())

    const blocksById = useEditorStore(state => state.blocksById)

    const insertBlock = useEditorStore(state => state.insertBlock)
    const updateBlock = useEditorStore(state => state.updateBlock)
    const deleteBlock = useEditorStore(state => state.deleteBlock)



    useEffect(() => {

        (async () => {
            /**Load page title*/
            try {
                const [pageData, blocks] = await Promise.all([
                    await api.pages.getPage(pageId),
                    await api.blocks.getBlocks(pageId)
                ])

                setTitle(pageData.title)
                useEditorStore.getState().setBlock(blocks)


            } catch (err) {
                console.log(err)
            }

        })()

    }, [pageId])

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

    const splitBlockIntoTwo = (block: Block, offset: number): {firstBlock: Block, secondBlock: Block} | undefined => {
        
        const blocks = Object.values(useEditorStore.getState().blocksById)
        blocks.sort((b1, b2) => parseFloat(b1.order) - parseFloat(b2.order))
        
        const idx = blocks.findIndex(b => b.id === block.id)
        if(idx === -1) return

        const next: Block = blocks[idx + 1]
        const isHeading = block.type === "heading1" || block.type === "heading2" || block.type === "heading3"

        const cursorOffset = Math.max(0, Math.min(offset, block.data.text.length))

        //Calculate new order for block
        const orderBefore = parseFloat(block.order) || 0
        const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
        let newOrderNum = ((orderBefore + orderAfter) / 2)

        if (newOrderNum === orderBefore || newOrderNum === orderAfter) {
            newOrderNum += 0.000001
        }

        const newOrder = newOrderNum.toFixed(12)

        let secondBlockData: Partial<{
            text: string
            checked: boolean
            opened: boolean
            styles: any[]
        }> = {}

        secondBlockData.text = block.data.text.slice(cursorOffset)

        if (block.type === "check_list") {
            secondBlockData.checked = false
        }

        let newType: BlockType = "text"
        
        if(isHeading && cursorOffset === 0){
            newType = block.type
        }

        if(["check_list", "bullet_list", "ordered_list"].includes(block.type)){
            newType = block.type
        }

        if(block.type === "toggle") {
            newType = block.type
            secondBlockData.opened = false
        }
        
        const styles = block.data.styles ?? []

        const firstBlockStyles = []
        const newBlockStyles = []

        for(const style of styles){
            const {start, end} = style
            
            //style range comes before the cursor
            if(end <= cursorOffset){
                firstBlockStyles.push(style)
                continue
            }

            //style range comes after the cursor so it goes into the next block
            if(start >= cursorOffset){
                //subtract the offset from the range
                newBlockStyles.push({
                    ...style,
                    start: style.start - cursorOffset,
                    end: style.end - cursorOffset
                })
                continue
            }

            //split the range otherwise
            firstBlockStyles.push({
                ...style,
                end: cursorOffset
            })

            newBlockStyles.push({
                ...style,
                start: 0,
                end: style.end - cursorOffset
            })
        }

        secondBlockData.styles = newBlockStyles

        const timestamp = Date.now()

        const firstBlock: Block = {
            ...block, 
            data: {
                ...block.data,
                styles: firstBlockStyles,
                text: block.data.text.slice(0, cursorOffset),
            },
            type: cursorOffset === 0 && block.type.startsWith("heading") ? "text" : block.type,
            updatedAt: timestamp
        }

        const secondBlock: Block = {
            id: crypto.randomUUID(),
            parentBlockId: block.parentBlockId,
            type: newType,
            order: newOrder,
            data: {
                ...secondBlockData
            },
            createdAt: timestamp,
            updatedAt: timestamp
        }
        
        return {
            firstBlock: firstBlock,
            secondBlock: secondBlock
        }
    }

    /**========================= Client functions =========================== */

    function getCursorOffset(root: Node): number | null {
            const selection = window.getSelection()
    
            if (!selection || selection.rangeCount === 0) {
                return null
            }
    
            const range = selection.getRangeAt(0)
    
            if (!root.contains(range.startContainer)) {
                return null
            }
    
            const beforeCursor = document.createRange()
    
            beforeCursor.selectNodeContents(root)
            beforeCursor.setEnd(
                range.startContainer,
                range.startOffset
            )
    
            return beforeCursor.toString().length
        }


    const handleArrowNavigation = (e: KeyboardEvent) => {


        const blocks = Object.values(useEditorStore.getState().blocksById)
        blocks.sort((a, b) => parseFloat(a.order) - parseFloat(b.order))

        const key: string = e.key

        const root = cursorRef.current.get(focusedBlockId)
        if(!root) return

        const offset = getCursorOffset(root)

        if (offset === null) return

        if(e.ctrlKey){
            
            if(key === "v" && focusedBlockId != TITLE_INPUT){
                e.preventDefault()

                navigator.clipboard.readText().then(text => {
                    const lines = text.split("\n")
                    
                    if(!focusedBlockId) return

                    const currentBlockIndex = blocks.findIndex(b => b.id === focusedBlockId)

                    const currentBlock = blocks[currentBlockIndex]
                    const nextBlock = blocks[currentBlockIndex + 1]

                    const newText = currentBlock.data.text + lines[0]
                    if(lines.length ===1){
                        useEditorStore.getState().updateBlock(focusedBlockId, {
                            data: {
                                text: newText
                            }
                        })
                        requestAnimationFrame(()=> {
                            requestAnimationFrame(() => {
                                focusAt(focusedBlockId, newText.length)
                            })
                        })
                        return
                    }

                    const orderBefore = parseFloat(currentBlock.order)
                    const orderAfter = nextBlock ? parseFloat(nextBlock.order) : orderBefore + 1
                    let newOrder = ((orderBefore + orderAfter) / 2).toFixed(12)
                    
                    
                    let newBlocks = []
                    const currentTimestamp = Date.now()

                    let i = 0;

                    for(; i < lines.length; i++){
                        const newBlock: Block = {
                            id: crypto.randomUUID(),
                            type: "text",
                            order: newOrder,
                            data: {text: lines[i]},
                            parentBlockId: null,
                            createdAt: currentTimestamp,
                            updatedAt: currentTimestamp
                        }
                        newBlocks.push(newBlock)
                        newOrder = ((parseFloat(newOrder) + orderAfter) / 2).toFixed(12)
                    }

                    const newWorkingBlocks = [...blocks, ...newBlocks].sort((b1, b2) => parseFloat(b1.order) - parseFloat(b2.order))
                    
                    for(const block of newBlocks){
                        insertBlock(block)
                    }

                    const currentIndex = newWorkingBlocks.findIndex(b => b.id === focusedBlockId)
                    const targetBlock = newWorkingBlocks[currentIndex + i]
                    
                    setFocusedBlockId(targetBlock.id)

                    api.blocks.batch(pageId, {create: newBlocks}).then(res => console.log(res))
                }) 
            }
        }

        if (key === "ArrowUp") {
            e.preventDefault()
            setFocusedBlockId(prevId => {

                if (!prevId) {
                    return blocks.length > 0 ? blocks[0].id : prevId
                }

                if(prevId === TITLE_INPUT){
                    return prevId
                }

                const idx = blocks.findIndex(b => b.id === prevId)

                let prevIndex: number;
                let isClosedNestedBlock: boolean = false

                for (prevIndex = idx - 1; prevIndex >= 0; prevIndex--) {
                    const block = blocks[prevIndex]

                    if (block.type === "divider") continue
                    
                    if(block.parentBlockId){
                        
                        if(isClosedNestedBlock) continue
                        const parentBlock = blocks.find(b => b.id === block.parentBlockId)

                        if(!parentBlock) return prevId

                        if(parentBlock.type !== "toggle"){
                            break
                        }

                        if(parentBlock.data.opened){
                            break
                        }

                        isClosedNestedBlock = true
                        continue
                    }

                    break
                }

                if (prevIndex === -1){
                    setCursorAt(TITLE_INPUT, offset)
                    return TITLE_INPUT
                }else{
                    setCursorAt(blocks[prevIndex].id, offset)
                }

                return blocks[prevIndex].id
            }
            )
        }

        if (key === "ArrowDown") {
            e.preventDefault()
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

                        if(parentBlock.type !== "toggle"){
                            break
                        }

                        if(parentBlock.data.opened){
                            break
                        }

                        isClosedNestedBlock = true
                        continue
                    }

                    break
                }

                if (nextIndex === blocks.length) return prevId

                focusAt(blocks[nextIndex].id, offset)
                setCursorAt(blocks[nextIndex].id, offset)
                return blocks[nextIndex].id
            })
        }

        if (key === "ArrowLeft") {

            if(!focusedBlockId) return

            const idx = blocks.findIndex(b => b.id === focusedBlockId)

            if(focusedBlockId === TITLE_INPUT) return

            if (offset !== 0) return

            if(idx === 0){
                const text = cursorRef.current.get(TITLE_INPUT)?.textContent

                setFocusedBlockId(TITLE_INPUT)
                focusAt(TITLE_INPUT, text ? text.length : 0)
                return 
            }

            let prevIndex: number

            for (prevIndex = idx - 1; prevIndex >= 0; prevIndex--) {
                if (blocks[prevIndex].type !== "divider") break
            }


            setCursorAt(blocks[prevIndex].id, blocks[prevIndex].data.text.length)
            setFocusedBlockId(blocks[prevIndex].id)

        }

        if (key === "ArrowRight") {
            
            if(!focusedBlockId) return

            if(focusedBlockId === TITLE_INPUT ){
                const title = cursorRef.current.get(TITLE_INPUT)?.textContent
                
                if(!title) return
                
                const isCursorAtEnd = offset === title.length
                if(!isCursorAtEnd) return 

                focusAt(blocks[0].id, 0)
                return
            }

            const index = blocks.findIndex(b => b.id === focusedBlockId)

            if(index === -1 || index === blocks.length - 1) return

            const current = blocks[index]

            if(!current) return

            if (offset !== current.data.text.length) return

            let nextIndex: number

            for (nextIndex = index + 1; nextIndex < blocks.length; nextIndex++) {
                if (blocks[nextIndex].type !== "divider") break
            }

            setFocusedBlockId(blocks[nextIndex].id)
            setCursorAt(blocks[nextIndex].id, 0)
        }
    }

    const registerRef = (id: string, el: HTMLDivElement) => {
        if (el) {
            cursorRef.current.set(id, el)

            const pending = pendingFocusRef.current

            if (pending?.blockId === id) {
                focusAt(id, pending.offset)
                pendingFocusRef.current = null
            }
        } else {
            cursorRef.current.delete(id)
        }
    }
    

    const enterKeyRef = useRef<number>(null)
    const counter = useRef<number>(0)

    const pendingFocusRef = useRef<{
        blockId: string
        offset: number
    } | null>(null)


    const handleEnter = async (blockId: string, cursorPos: number, block?: Block) => {

        // if(!enterKeyRef.current){
        //     enterKeyRef.current = Date.now()
        //     console.log("Enter pressing started");
        //     counter.current = 1
        //     return
        // }

        // if(Date.now() - enterKeyRef.current > 100){
        //     console.log("Pressing stopped with value", counter.current);
        //     counter.current = 0
        //     enterKeyRef.current = null
        //     return
        // }else{
        //     counter.current++
        //     enterKeyRef.current = Date.now()
        //     return
        // }


        if(blockId === TITLE_INPUT){
            const editor = useEditorStore.getState()
            const firstBlockId = editor.rootIds[0]

            if(!firstBlockId) return

            const firstBlock = editor.blocksById[firstBlockId]

            const newOrder = (parseFloat(firstBlock.order) / 2).toFixed(12)

            const titleInput = cursorRef.current.get(TITLE_INPUT)

            if(!titleInput || !titleInput.textContent) return
            const text = titleInput.textContent

            const timestamp = Date.now()
            const id = crypto.randomUUID()

            const newBlock: Block = {
                id,
                parentBlockId: null,
                type: "text",
                order: newOrder,
                data: {
                    text: text.slice(cursorPos)
                },
                createdAt: timestamp,
                updatedAt: timestamp
            }

            setTitle(text.slice(0, cursorPos))
            insertBlock(newBlock)
            setFocusedBlockId(id)
            focusAt(id, 0)

            api.blocks.createBlock(pageId, newBlock).catch(error => {
                console.error("Failed to create block:", error)
            })
            return            
        }


        const blocks = Object.values(blocksById)
        blocks.sort((b1, b2) => parseFloat(b1.order) - parseFloat(b2.order))
        
        const currentIndex = blocks.findIndex(b => b.id === blockId)

        if (currentIndex === -1) return

        let currentBlock = blocks[currentIndex]

        if (block) {
            currentBlock = block
        }

        const nextBlock = blocks[currentIndex + 1]
        
        //Convert list item to text if it has no text
        if (currentBlock.type.endsWith("list") && !currentBlock.data.text.length) {
            updateBlock(blockId, {type: "text"})
            api.blocks.updateBlock(blockId, {type: "text"})
            return
        }

        if (currentBlock.type === "toggle") {

            const isCursorAtStart = cursorPos === 0
            const isCursorAtEnd = cursorPos === text?.length
            const isEmpty = text?.length === 0

            if (isEmpty) {
                updateBlock(blockId, {type: "text"})
                return
            }

            if (isCursorAtStart) {
                const prev = blocks[currentIndex - 1]
                const order = (parseFloat(currentBlock.order) + (prev ? parseFloat(prev.order) : 0)) / 2

                const newBlock = {
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
                }

                // setBlocks(newBlocks)
                insertBlock(newBlock)
                focusAt(currentBlock.id, 0)

                // await createBlockAPI(pageId, newBlocks[index])

                return
            }

            if (isCursorAtEnd) {

                if (currentBlock.data.opened) {
                    let orderBefore = parseFloat(currentBlock.order)

                    for(let i = currentIndex; i < blocks.length; i++){
                        if(!blocks[i].parentBlockId){
                            break
                        }
                    }


                    const orderAfter = nextBlock ? parseFloat(nextBlock.order) : orderBefore + 1
                    const newOrder = ((orderBefore + orderAfter) / 2).toFixed(12)

                    const newId = crypto.randomUUID()

                    const newBlock: Block = {
                        id: newId,
                        type: "text",
                        data: {
                            text: ""
                        },
                        parentBlockId: blockId,
                        order: newOrder,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }

                    insertBlock(newBlock)
                    setFocusedBlockId(newId)
                    focusAt(newId, 0)

                    api.blocks.createBlock(pageId, newBlock)
                    return
                }
            }

        }


        //Calculate the order of the new block

        const orderBefore = parseFloat(currentBlock.order)
        const orderAfter = nextBlock ? parseFloat(nextBlock.order) : orderBefore + 1
        const newOrder = ((orderBefore + orderAfter) / 2).toFixed(12)
        

        const beforeText: string = currentBlock.data.text.slice(0, cursorPos);
        const afterText: string = currentBlock.data.text.slice(cursorPos);

        const workingBlocks: Block[] = blocks

        workingBlocks[currentIndex] = currentBlock

        //Checks if cursor is at the end of the line
        const cursorAtEnd = workingBlocks[currentIndex].data.text.length === cursorPos

        const splitBlocks = splitBlockIntoTwo(currentBlock, cursorPos)

        if(!splitBlocks) return

        
        updateBlock(blockId, {
            ...currentBlock,
            updatedAt: Date.now(),
            data: {
                ...splitBlocks.firstBlock.data
            }
        })

        const newBlock = splitBlocks.secondBlock

        insertBlock(newBlock)

        setFocusedIndex(currentIndex + 1)
        setFocusedBlockId(newBlock.id)

        focusAt(newBlock.id, 0)

        // Call API
        try {
             await api.blocks.createBlock(pageId, newBlock)

            //Edits the previous block if cursorAtEnd is false
            const type = splitBlocks.firstBlock.type

            if (!cursorAtEnd) {
                await api.blocks.updateBlock(blockId, { data: {...splitBlocks.firstBlock.data}, type })
            }
        } catch (err) {
            console.log("Failed to split block", err)
        }

    }

    const handleDeleteBlock = async (blockId: string) => {
        if (focusedIndex == 0) return;

        //Filter out blocks excluding blockId
        deleteBlock(blockId)

        if (focusedIndex) {
            setFocusedIndex(focusedIndex - 1)
        }

        try {
            await api.blocks.deleteBlock(blockId)
        } catch (err) {
            console.log(err)
        }
    }

    const handleDataChanges = async (block: Block) => {

        let data : Partial<{
            id: number
            title: string
        }> = {}

        if(block.type === "page"){
            try{
                const response = await fetch("/api/pages/" + pageId, {
                    method: "POST"
                })

                data = await response.json()
            }catch(err){
                console.log(err);
                return
            }
            
        }

        block["data"] = {
            ...block.data,
            pageId: data.id
        }

        updateBlock(block.id, block)

        await api.blocks.updateBlock(block.id, {
            type: block.type,
            data: block.data
        })
    }

    const handleBackspace = async (blockId: string, cursorPos: number, block?: Block) => {

        if (cursorPos) return
        const blocksById = useEditorStore.getState().blocksById

        const blocks = Object.values(blocksById)
        blocks.sort((b1, b2) => parseFloat(b1.order) - parseFloat(b2.order))

        const idx = blocks.findIndex(b => b.id === blockId)

        const text = block?.data.text ?? null
        
        

        if (["bullet_list", "ordered_list", "check_list", "quote", "toggle"].includes(blocks[idx].type)) {
            if (cursorPos === 0) {
                updateBlock(blockId, {
                    type: "text",
                    data: {
                        ...blocks[idx].data,
                        text: block?.data.text ?? blocks[idx].data.text
                    }
                })

                cursorRef.current.delete(blockId)

                focusAt(blockId, 0)

                await api.blocks.updateBlock(blockId, { type: "text", data: {
                        ...blocks[idx].data,
                        text: block?.data.text ?? blocks[idx].data.text
                    } })
                return;
            }
        }

        if (idx < 0) return

        if(idx === 0 && !cursorPos){
            const titleLength = title.length
            setTitle(prevTitle => prevTitle + (text != null ? text : blocks[0].data.text))
            useEditorStore.getState().deleteBlock(blockId)

            try{
                await api.blocks.deleteBlock(blockId)
            }catch(err){
                console.error(err)
            }

            focusAt(TITLE_INPUT, titleLength)
            return
        }

        let prevIndex: number;

        for (prevIndex = idx - 1; prevIndex >= 0; prevIndex--) {
            if (blocks[prevIndex].type !== "divider") {
                break;
            }
        }

        if (prevIndex === -1) return

        const prevBlock = blocks[prevIndex]

        const delta = prevBlock.data.text.length
        const modifiedStyles = (blocks[idx].data.styles ?? []).map(style => {
            return {
                ...style,
                start: style.start + delta,
                end: style.end + delta
            }
        })
        
        

        const resolvedData = {
            ...prevBlock.data,
            text: prevBlock.data.text + text,
            styles: [
                ...prevBlock.data.styles ?? [],
                ...modifiedStyles
            ] 
        }


        const merged: Block = {
                ...prevBlock,
                data: resolvedData
        }

        updateBlock(merged.id, merged)
        deleteBlock(blockId)

        setFocusedIndex(prevIndex)
        setFocusedBlockId(blocks[prevIndex].id)

        setCursorAt(merged.id, prevBlock.data.text.length)

        await api.blocks.updateBlock(blocks[prevIndex].id, { data: resolvedData })
        await api.blocks.deleteBlock(blockId)
    }

    function setCursorAt(blockId: string, offset: number) {
        requestAnimationFrame(() => {

             const root = cursorRef.current.get(blockId)

            if (!root || !document.contains(root)) {
                cursorRef.current.delete(blockId)
                pendingFocusRef.current = {
                    blockId,
                    offset
                }
                
                return
            }

            root.focus()

            const selection = window.getSelection()

            if (!selection) return

            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            )

            let remaining = offset
            let node: Node | null

            while((node = walker.nextNode())){
                if(node){
                    const length = node.textContent?.length ?? 0

                    if(remaining <= length){
                        const range = document.createRange()

                        range.setStart(node, remaining)
                        range.collapse(true)

                        selection.removeAllRanges()
                        selection.addRange(range)

                        return
                    }

                    remaining -= length
                }
            }
        })
    }

    function focusAt(blockId: string, offset: number) {

        requestAnimationFrame(() => {
            const el = cursorRef.current.get(blockId)

            if (!el || !document.contains(el)) {
                cursorRef.current.delete(blockId)
                pendingFocusRef.current = {
                    blockId,
                    offset
                }
                
                return
            }
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

        insertBlock(block)
        setFocusedIndex(0)

        api.blocks.createBlock(pageId, block)
    }

    async function createBlock(data: Omit<Block, "id" | "updatedAt" | "createdAt">) {
        const block: Block = {
            ...data,
            id: crypto.randomUUID(),
            updatedAt: Date.now(),
            createdAt: Date.now()
        }

        insertBlock(block)
         api.blocks.createBlock(pageId, block)
    }

    const getNumberedListIndex = (blockId: string) => {

        const blocks = Object.values(useEditorStore.getState().blocksById)
        
        blocks.sort((a, b) => parseFloat(a.order) - parseFloat(b.order))

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

    const duplicateBlock = async (blockId: string) => {
        if (!blockId || typeof blockId !== "string") return

        const current: Block = useEditorStore.getState().getBlock(blockId)

        if(!current) return

        const clientId = crypto.randomUUID()

        const newBlock = { ...current, id: clientId }

        insertBlock(newBlock)
        setFocusedBlockId(clientId)

        try {
             api.blocks.createBlock(pageId, newBlock)
        } catch (err) {
            console.log(err);
        }
    }

    const copy = async (blockId: string) => {
        if (!blockId || typeof blockId !== "string") return

        const current = useEditorStore.getState().getBlock(blockId)


        if(!current) return

        const textToCopy = current.data.text

        return await navigator.clipboard.writeText(textToCopy)
    }

    const shortcuts: Map<String, BlockType> = new Map()
    shortcuts.set("1.", "ordered_list")
    shortcuts.set("-", "bullet_list")
    shortcuts.set("?", "check_list")
    shortcuts.set("#", "heading1")
    shortcuts.set("##", "heading2")
    shortcuts.set("###", "heading3")
    shortcuts.set("---", "divider")
    shortcuts.set(">", "toggle")

    const handleSpace = async (blockId: string, text: string) => {
        if (blockId === null || text === null) return

        const block: Block = blocksById[blockId]
        
        const data: Partial<{
            type: BlockType
            data: {
                text: string
                checked?: boolean
                opened?: boolean
                startingIndex?: number
            }
        }> = {
            data: {...block.data},
            type: block.type
        }

        const trimmed : string = text.trimEnd()

        const match = trimmed.match(/^(\d+)\.$/)

        if(match){
            data.type = "ordered_list"
            if(data.data){
                data.data.startingIndex = Number(match[1])
            }
        }else{
            if (!shortcuts.has(trimmed)) return
            
            if (data.data) {
                data.data.text = ""
            }

            data.type = shortcuts.get(trimmed)
        }

        if(block.type.startsWith("heading") && data.type === "ordered_list") return
        
        updateBlock(blockId, data)

        const el = cursorRef.current.get(blockId)

        if (el) {
            el.textContent = ""
        }

        cursorRef.current.delete(blockId)
        focusAt(blockId, 0)

        await api.blocks.updateBlock(block.id, {
            type: data.type,
            data: data.data
        })
    }
    

    //This fonction is still in working progress
    const handleTab = async (blockId: string) => {

        const block = blocksById[blockId]

        if(block.type !== "text"){
            toast.error("Can not be a child of type " + block.type)
            return
        }

        updateBlock(blockId, {parentBlockId: block.id})
        
        // await updateAPI(blockId, { parentBlockId: blocks[idx - 1].id })
    }

    const addTitleRef = (ref: HTMLDivElement)=> {
        registerRef(TITLE_INPUT, ref)
    }

    const handleArrowNavigationEvent = useEvent(handleArrowNavigation)
    const handleEnterEvent = useEvent(handleEnter)
    const handleDeleteBlockEvent = useEvent(handleDeleteBlock)
    const handleDataChangesEvent = useEvent(handleDataChanges)
    const handleBackspaceEvent = useEvent(handleBackspace)
    const registerRefEvent = useEvent(registerRef)
    const renamePageAPIEvent = useEvent(api.pages.renamePageAPI)
    const createFirstBlockEvent = useEvent(createFirstBlock)
    const getNumberedListIndexEvent = useEvent(getNumberedListIndex)
    const createBlockEvent = useEvent(createBlock)
    const duplicateBlockEvent = useEvent(duplicateBlock)
    const copyEvent = useEvent(copy)
    const handleSpaceEvent = useEvent(handleSpace)
    const handleTabEvent = useEvent(handleTab)
    const handleTitleRef = useEvent(addTitleRef)

    

    return {
        state: {
            title,
            focusedBlockId,
            pageId
        },

        actions: {
            setIndex: setFocusedIndex,
            setFocusedBlockId,

            duplicateBlock: duplicateBlockEvent,
            copy: copyEvent,
            onSpace: handleSpaceEvent,
            indentBlock: handleTabEvent,
            createBlock: createBlockEvent,
            handleArrowNavigation: handleArrowNavigationEvent,
            getNumberedListIndex: getNumberedListIndexEvent,
            createFirstBlock: createFirstBlockEvent,
            renamePageAPI: renamePageAPIEvent,
            registerRef: registerRefEvent,
            handleBackspace: handleBackspaceEvent,
            handleDataChanges: handleDataChangesEvent,
            deleteBlock: handleDeleteBlockEvent,
            handleEnter: handleEnterEvent,
        },
        others: {
            addTitleRef: handleTitleRef,
            setTitle
        }
    }
}

