"use client"

import { memo, useContext, useEffect, useState } from "react";
import TextWrapper, { TextWrapperProps } from "./textwrapper";
import { Block } from "../types";
import { EditorContext } from "../editor";
import BlockRenderor, { BlockWrapper } from "../renderor";

function TextBlock(props: TextWrapperProps) {

    const [children, setChildren] = useState<Block[]>([])

    // const { editor } = useContext(EditorContext)


    useEffect(() => {
        console.log("re-rendering block from text-block");
    })

    // useEffect(() => {
    //     if (!editor) return

    //     setChildren(editor.state.blocks.filter(block => block.parentBlockId === props.block.id))
    // }, [editor.state.blocks])

    const onEnter = props.onEnter ?? (() => {})
    const onFocus = props.onFocus ?? (() => {})
    const onTab = props.onTab ?? (() => {})
    const onSpace = props.onSpace ?? (() => {})
    const onBackspace = props.onBackspace ?? (()=> {})
    const onChange = props.onChange ?? (()=> {})
    // const onDelete = props.onDelete ?? (()=> {})

    const registerRef = props.registerRef ?? (()=> {})

    return (
        <div className="flex flex-col w-full">
            <BlockWrapper
                blockId={props.block.id}
                >
                <TextWrapper className="w-full focus:empty:before:content-['Type_something...']" {...props} />
            </BlockWrapper>

            {
                children.length > 0 &&
                <div className="flex flex-col pl-4 w-full transition-all pb-2">
                    {
                        children.map((block) => {

                            const listIndex = block.type === "ordered_list" ?
                                editor.actions.getNumberedListIndex(children, block.id) : undefined

                            return (
                                <BlockRenderor
                                    key={block.id}
                                    id={block.id}
                                    block={block}
                                    order={block.order}
                                    type={block.type}
                                    onTab={onTab}
                                    listIndex={listIndex}
                                    focus={block.id === editor.state.focusedBlockId}
                                    onEnter={onEnter}
                                    onFocus={onFocus}
                                    onBackspace={onBackspace}
                                    onChange={onChange}
                                    data={block.data}
                                    registerRef={registerRef}
                                    onDelete={editor.actions.deleteBlock}
                                    onDuplicate={editor.actions.dublicateBlock}
                                    onCopy={editor.actions.copy}
                                    onSpace={onSpace}
                                />
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}

export default memo(TextBlock)