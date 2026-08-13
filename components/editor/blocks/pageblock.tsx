import { File } from "lucide-react";
import { Block } from "../types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/api";
import { assert } from "console";

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

    const [pageTitle, setPageTitle] = useState("My page")

    useEffect(() => {
        const parentPageId = props.block.data.pageId

        if(!parentPageId){
            console.error("Page parent id was not found...")
            return
        }

        api.pages.getPage(parentPageId)
            .then(page => {
                setPageTitle(page.title)
            })
    }, [props.block.data.pageId])

    return (
        <Link href={"/pages/" + props.block.data.pageId} className="flex w-full items-center gap-4 hover:bg-muted px-4 py-2 rounded-lg">
            <File size={16} />
            {pageTitle}
        </Link>
    )
}