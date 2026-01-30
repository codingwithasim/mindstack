export type Block = {
    id: string
    parentBlockId: number | null
    type: BlockType
    order: string
    data: { text: string }
    createdAt: number
    updatedAt: number
}

export type BlockType = "text" | "heading1" | "heading2" | "heading3"

export type BlockComponentProps = {
    id: string
    order: string
    block: Block
    focus: boolean
    type: string
    onEnter: (blockId: string, cursorPos: number) => void
    onBackspace: (blockId: string, cursorPos: number) => void
    onFocus: () => void
    onChange: (block: Block) => void
    data: { text: string}
    registerRef: (id: string, el: HTMLElement) => void
}