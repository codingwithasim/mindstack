import { useMemo } from "react"
import { Block } from "./types"
import BlockRenderor from "./renderor"


type TreeProps = {
    state: {
        blocks: Block[]
        childrenMap: Map<string, Block[]>
    }

    actions: {
        onEnter: (blockId: string, cursorPos: number, text?: string) => void
        onBackspace: (blockId: string, cursorPos: number, text: string) => void
        onBlockFocus: (blockId: string) => void
        onChange?: (block: Block) => void
        onSpace?: (blockId: string, text: string) => void
        onTab?: (blockId: string) => void
        registerRef: (id: string, el: HTMLDivElement) => void
        onDelete?: (blockId: string) => void | Promise<void>
        onDuplicate?: (blockId: string) => void | Promise<void>
        onCopy?: (blockId: string) => void | Promise<void>
        getNumberedListIndex(blocks: Block[], blockId: String): number
    }
}

export default function BlockTree(props: TreeProps) {
    

    return (
        <>
            {
                props.state.blocks.map(block => {
                    const listIndex = block.type === "ordered_list" ?
                        props.actions.getNumberedListIndex(props.state.blocks, block.id) :
                        undefined

                    if (block.parentBlockId) return null

                    const children = props.state.childrenMap.get(block.id) ?? []

                    let renderedChildren = null;

                    if (block.type === "toggle") {
                        renderedChildren = children.map(childBlock => {
                            const listIndex =
                                childBlock.type === "ordered_list"
                                    ? props.actions.getNumberedListIndex(props.state.blocks, childBlock.id)
                                    : undefined

                            return (
                                <BlockRenderor
                                    key={childBlock.id}
                                    block={childBlock}
                                    listIndex={listIndex}

                                    actions={props.actions}
                                />
                            )
                        })
                    }

                    return (
                        <div className="flex w-full flex-col" key={block.id}>
                            <BlockRenderor
                                block={block}
                                listIndex={listIndex}
                                actions={props.actions}
                            />
                            {
                                block.type === "toggle"
                                && block.data.opened && <div className="flex w-full flex-col pl-4 transition-all pb-2">
                                    {renderedChildren}
                                </div>
                            }
                        </div>
                    )
                })
            }
        </>
    )
}





