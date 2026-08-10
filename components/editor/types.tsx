export type Block = {
    id: string
    parentBlockId: string | null
    type: BlockType
    order: string
    data: { 
        text: string
        checked?: boolean
        opened?: boolean
        pageId?: number
        startingIndex?: number
    }
    createdAt: number
    updatedAt: number
}

export type BlockType = "quote" | "text" | "heading1" | "heading2" | "heading3" | "ordered_list" | "bullet_list" | 
    "check_list" | "divider" | "toggle" | "page"
    

export type BlockComponentProps = {
    id: string
    order: string
    block: Block
    focus: boolean
    type: string
    listIndex?: number
    onEnter?: (blockId: string, cursorPos: number, text?: string) => void
    onBackspace: (blockId: string, cursorPos: number, text: string) => void
    onFocus: (blockId: string) => void
    onChange?: (block: Block) => void
    onSpace?: (blockId: string, text: string) => void
    onTab?: (blockId: string) => void
    data: { text: string}
    registerRef: (id: string, el: HTMLDivElement) => void
    onDelete?: (blockId: string) => void | Promise<void>
    onDuplicate?: (blockId: string) => void | Promise<void>
    onCopy?: (blockId: string) => void | Promise<void>
    
}

export type Page = {
    id: number
    title: string
    updatedAt: number
    createdAt: number    
    parentPageId: number | null
}
