import { memo, useEffect } from "react"
import { Block } from "./types"
import BlockRenderor from "./renderor"
import useEditorStore from "@/stores/useEditorStore"

const EMPTY_LIST: string[] = []

type TreeProps = {
    actions: {
        onEnter: (blockId: string, cursorPos: number, block?: Block) => void
        onBackspace: (blockId: string, cursorPos: number, block: Block) => void
        onBlockFocus: (blockId: string) => void
        onChange?: (block: Block) => void
        onSpace?: (blockId: string, text: string) => void
        onTab?: (blockId: string) => void
        registerRef: (id: string, el: HTMLDivElement) => void
        onDelete?: (blockId: string) => void | Promise<void>
        onDuplicate?: (blockId: string) => void | Promise<void>
        onCopy?: (blockId: string) => void | Promise<void>
        getNumberedListIndex(blockId: String): number
    }
}

type BlockNodeProps = {
    blockId: string
    actions: TreeProps["actions"]
}

export default function BlockTree(props: TreeProps) {

    const rootIds = useEditorStore(state => state.rootIds)

    return (
        <>
            {
                <div className="flex w-full flex-col">
                   {
                    rootIds.map(id => {
                        return (
                            <BlockNode
                                key={id}
                                blockId={id}
                                actions={props.actions}
                            />
                        )
                    })
                   }
                </div>
            }
        </>
    )
}


const BlockNode = memo((props: BlockNodeProps) => {

    const currentBlock = useEditorStore(state => state.getBlock(props.blockId))
    const children = useEditorStore(state => state.childrenByParentId[props.blockId] ?? EMPTY_LIST)

    if (!currentBlock) {
        return null
    }

    const listIndex = currentBlock.type === "ordered_list" ?
        props.actions.getNumberedListIndex(props.blockId) :
        undefined

    let renderedChildren = children.map(childId => {
        return (
            <BlockNode
                key={childId}
                blockId={childId}
                actions={props.actions}
            />
        )
    })

    return (
        <div className="flex w-full flex-col">
            <BlockRenderor
                block={currentBlock}
                listIndex={listIndex}
                actions={props.actions}
            />

            <div className="flex w-full flex-col pl-4 transition-all pb-2">
                {
                    currentBlock.type === "toggle" && currentBlock.data.opened && renderedChildren
                }
            </div>
        </div>
    )})