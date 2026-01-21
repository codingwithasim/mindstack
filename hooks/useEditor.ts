    "use client"

    import { FormEvent, useEffect, useState } from "react";

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
        const [currentIndex, setCurrentIndex] = useState<number | null>(null)

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
            setCurrentIndex(i => {
                if (i === null) return null
                if (blocks.length === 0) return null
                return Math.max(0, Math.min(blocks.length - 1, i))
            })
        }, [blocks.length, currentIndex])


        const handleArrowNavigation = (e: KeyboardEvent) => {

            if(e.key === "ArrowUp"){
                setCurrentIndex(i => 
                    i === null ? 0 : i - 1
                )
            }

            if(e.key === "ArrowDown"){
                setCurrentIndex(i => 
                    i === null ? 0 : i + 1
                )

            }
        }

        const handleEnter = async (blockId: number) => {
            const idx = blocks.findIndex(block => block.id === blockId)
            
            const previous = blocks[idx]
            const next = blocks[idx + 1]

            //Calculate new order for block
            const orderBefore = parseFloat(previous.order)
            const orderAfter = next ? parseFloat(next.order) : orderBefore + 1
            const newOrder = ((orderBefore +  orderAfter) / 2).toFixed(5)

            

            //Add a block with temp id for optimisitic UI + Re-order blocks
            const tempId: number = - Date.now()
            setBlocks(prev => {
                const updated: Block[] = [...prev, {
                    id: tempId,
                    type: "text",
                    order: newOrder,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    data: { text : ""},
                    parentBlockId: null
                }]

                return updated.sort((a, b) => parseFloat(a.order) - parseFloat(b.order))
            })
            setCurrentIndex(idx + 1)

            //Call API
            const res = await fetch("/api/pages/" + pageId + "/blocks", {
                method: "POST",
                body: JSON.stringify({
                    type: "text",
                    order: newOrder,
                    data: { text: ""}
                })
            })

            const newBlock = await res.json()

            setBlocks(blocks => blocks.map(b => {
                if(b.id === tempId){
                    return {...b, id: newBlock.id}
                }
                return b
            }))
        }

        const deleteBlock = async (blockId: number) => {

            if(currentIndex == 0) return;

            setBlocks(blocks => blocks.filter(b => blockId !== b.id))

            if(currentIndex){
                setCurrentIndex(currentIndex - 1)
            }

            await fetch("/api/blocks/" + blockId, {
                method: "DELETE"
            })
        }

        return {
            title,
            blocks,
            currentIndex,
            setIndex: setCurrentIndex,
            handleArrowNavigation,
            handleEnter,
            deleteBlock
        }
    }