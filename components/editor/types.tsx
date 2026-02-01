export type Block = {
    id: string
    parentBlockId: number | null
    type: BlockType
    order: string
    data: { text: string, checked?: boolean }
    createdAt: number
    updatedAt: number
}

export type BlockType = "quote" | "text" | "heading1" | "heading2" | "heading3" | "ordered_list" | "bullet_list" | "check_list"

export type BlockComponentProps = {
    id: string
    order: string
    block: Block
    focus: boolean
    type: string
    listIndex?: number
    onEnter: (blockId: string, cursorPos: number) => void
    onBackspace: (blockId: string, cursorPos: number) => void
    onFocus: () => void
    onChange: (block: Block) => void
    data: { text: string}
    registerRef: (id: string, el: HTMLElement) => void
}