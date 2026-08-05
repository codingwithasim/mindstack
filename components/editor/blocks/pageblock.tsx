import { File } from "lucide-react";
import { Block } from "../types";
import Link from "next/link";

type PageProps = {
    block: Block
    onEnter?: (blockId: string, cursorPos: number, text?: string) => void
    onBackspace: (blockId: string, cursorPos: number, text: string) => void
    onFocus: (blockId: string) => void
    onChange?: (block: Block) => void
    onSpace?: (blockId: string, text: string) => void
    onTab?: (blockId: string) => void
    registerRef: (id: string, el: HTMLDivElement) => void
    onDelete?: (blockId: string) => void | Promise<void>
    onDuplicate?: (blockId: string) => void | Promise<void>
    onCopy?: (blockId: string) => void | Promise<void>
}

export default function PageBlock(props: PageProps) {
    return (
        <Link href={"/pages/" + props.block.data.pageId} className="flex w-full items-center gap-4 hover:bg-muted px-4 py-2 rounded-lg">
            <File size={16} />
            My subpage
        </Link>
    )
}