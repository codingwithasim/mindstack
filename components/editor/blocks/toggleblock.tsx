"use client"


import { ChevronDown, ChevronsDownUp, ChevronsUpDown, FoldVertical, UnfoldVertical } from "lucide-react";
import TextWrapper, { TextWrapperProps } from "./textwrapper";
import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";
import { EditorContext } from "../editor";
import { Block } from "../types";
import BlockRenderor, { BlockWrapper } from "../renderor";

export default function ToggleBlock(props: TextWrapperProps) {

    const id: string = props.block.id


    const { editor } = useContext(EditorContext)

    const [subBlocks, setSubBlocks] = useState<Block[]>()

    const handleStateChange = (opened: boolean) => {
        if(!props.onChange) return
        
        props.onChange({...props.block, data: { ...props.block.data, opened}})
    }

    useEffect(() => {
        setSubBlocks(editor.blocks.filter(b => {
            return id === b.parentBlockId
        }))
    }, [editor.blocks])

    const handleChange = (block: Block) => {
        editor.handleDataChanges(block)


        setSubBlocks(prev => {
            if (!prev) return prev

            return prev.map(b => {
                if (b.id === block.id) {
                    return { ...b, data: { ...b.data, text: block.data.text } }
                }
                return b
            })
        })
    }

    const createBlock = () => {

        const idx = editor.blocks.findIndex(b => b.id == id)

        if (idx === -1) return

        const prevOrder = parseFloat(props.block.order) || 0
        const nextOrder = editor.blocks[idx + 1] ? parseFloat(editor.blocks[idx + 1].order) : prevOrder + 1

        let newOrderNum = ((prevOrder + nextOrder) / 2)

        if (newOrderNum === prevOrder || newOrderNum === nextOrder) {
            newOrderNum += 0.000001
        }

        const newOrder = newOrderNum.toFixed(12)

        const block: Omit<Block, "id" | "createdAt" | "updatedAt"> = {
            parentBlockId: id,
            order: newOrder,
            data: { text: "" },
            type: "text"
        }

        editor.createBlock(block)
    }

    return (
        <div className="flex flex-col w-full gap-2">

            <BlockWrapper>
                <div className="flex gap-1 w-full">
                    <div
                        onClick={() => handleStateChange(props.block.data.opened ?? false ? false : true)}
                        className="hover:bg-zinc-200 dark:hover:bg-zinc-700 h-fit mt-1 cursor-pointer p-1 rounded-sm">
                        { props.block.data.opened ?? false ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                    </div>
                    <TextWrapper className="w-full font-medium" placeholder="Toggle" {...props} />
                </div>
            </BlockWrapper>


            {/* <div className="flex flex-col pl-4 w-full before:left-3 before:absolute before:text-gray-300 before:content[''] before:w-px before:h-[calc(100%-10px)] before:top-0  before:border-l relative"> */}
            <div className="flex flex-col pl-4 w-full transition-all pb-2">

                {
                    props.block.data.opened &&
                        subBlocks?.length ? subBlocks.map((block, idx) => {

                            const listIndex = block.type === "ordered_list" ?
                                editor.getNumberedListIndex(subBlocks, block.id) : undefined

                            return (
                                <BlockRenderor
                                    key={block.id}
                                    id={block.id}
                                    block={block}
                                    order={block.order}
                                    type={block.type}
                                    listIndex={listIndex}
                                    focus={block.id === editor.focusedBlockId}
                                    onEnter={(currentBlock, cursorPos, text) => editor.handleEnter(currentBlock, cursorPos, text)}
                                    onFocus={() => {
                                        editor.setIndex(idx)
                                        editor.setFocusedBlockId(block.id)
                                        console.log(block.id);

                                    }}
                                    onBackspace={editor.handleBackspace}
                                    onChange={(block) => handleChange(block)}
                                    data={block.data}
                                    registerRef={(id, el) => {
                                        editor.registerRef(id, el)
                                    }}
                                />
                            )
                        }) :
                        props.block.data.opened &&
                        <Button
                            variant={"secondary"}
                            className="bg-transparent"
                            onClick={createBlock}
                        >Empty toggle. Click to add a block</Button>
                }


            </div>
        </div>
    )
}