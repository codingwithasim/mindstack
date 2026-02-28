import { File } from "lucide-react";
import { BlockComponentProps, Page } from "../types";
import Link from "next/link";

type PageProps = BlockComponentProps

export default function PageBlock(props: PageProps){
    return(
        <Link href={"/pages/" + props.block.data.pageId} className="flex w-full items-center gap-4 hover:bg-muted px-4 py-2 rounded-lg">
            <File size={16}/>
            My subpage
        </Link>
    )
}