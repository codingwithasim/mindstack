import { Clipboard, Copy, FileText, GripVertical, Heading1, Heading2, Heading3, ListChevronsDownUpIcon, ListIcon, ListOrdered, ListTodo, LucideIcon, Quote, RotateCwSquare, Trash, Type } from "lucide-react";
import HeadingBlock from "./blocks/headingblock";
import TextBlock from "./blocks/textblock";
import { Block, BlockType } from "./types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { memo, ReactNode } from "react";
import QuoteBlock from "./blocks/quoteblock";
import ListBlock from "./blocks/listblock";
import { Separator } from "../ui/separator";
import ToggleBlock from "./blocks/toggleblock";
import { toast } from "sonner";
import PageBlock from "./blocks/pageblock";
import useEditorStore from "@/stores/useEditorStore";
import { api } from "@/api";

export function BlockWrapper({ children, blockId, onTypeSelect, onItemSelect }: {children: ReactNode, blockId: string, onItemSelect?: (blockId: string, action: string) => void, onTypeSelect?: (type: BlockType)=> void,}) {
    
    const types: Array<{
        icon: LucideIcon
        label: string
        value: BlockType
    }> = [
        {
            icon: Type,
            label: "Text",
            value: "text"
        },
        {
            icon: Heading1,
            label: "Heading 1",
            value: "heading1"
        },
        {   
            icon: Heading2,
            label: "Headgin 2",
            value: "heading2"
        },
        {
            icon: Heading3,
            label: "Headgin 3",
            value: "heading3"
        },
        {
            icon: Quote,
            label: "Quote",
            value: "quote"
        },
        {
            icon: ListIcon,
            label: "Bullet List",
            value: "bullet_list"
        },
        {
            icon: ListOrdered,
            label: "Ordered List",
            value: "ordered_list"
        },
        {
            icon: ListTodo,
            label: "Todo List",
            value: "check_list"
        },
        {
            icon: ListChevronsDownUpIcon,
            label: "Section",
            value: "toggle"
        },
        {
            icon: FileText,
            label: "Page",
            value: "page"
        }
    ]
        const block = useEditorStore(s => s.blocksById[blockId])


    return (
        <div className={"flex items-center gap-2 flex-1 group"}>
            {/* <span className="text-xs bg-white text-black shadow-sm px-2 rounded-3xl">{block.order}</span> */}
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className={`group-hover:visible group-focus:visible invisible py-1 rounded-sm cursor-grab text-gray-400 hover:bg-zinc-200 dark:hover:bg-zinc-700`}>
                        <GripVertical size={18} />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-50">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>
                            Actions
                        </DropdownMenuLabel>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <RotateCwSquare />
                                Turn into
                            </DropdownMenuSubTrigger>

                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-50">
                                    {
                                        types.map((type, idx) => {
                                            return (
                                                <DropdownMenuItem
                                                    key={idx}
                                                    onClick={()=> {
                                                        if(onTypeSelect) onTypeSelect(type.value)
                                                    }}>
                                                    <type.icon/> {type.label}
                                                </DropdownMenuItem>
                                            )
                                        })
                                    }
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator/>

                    <DropdownMenuGroup>
                        {
                            [
                                {
                                    label: "Duplicate",
                                    icon: Copy,
                                    action: "duplicate"
                                },
                                {
                                    label: "Copy to clipboard",
                                    icon: Clipboard,
                                    action: "copy"
                                },
                                {
                                    label: "Delete",
                                    icon: Trash,
                                    action: "delete"
                                }
                            ].map((item, idx) => {
                                return (
                                    <DropdownMenuItem
                                        onClick={()=> {
                                            if(onItemSelect) onItemSelect(blockId ?? "", item.action)
                                        }}
                                        key={idx}>
                                        <item.icon/>
                                        {item.label}
                                    </DropdownMenuItem>
                                )
                            })
                        }
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            {children}
        </div>
    )
}

type BlockRendererProps = {
    block: Block
    listIndex?: number

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

function BlockRenderor(props: BlockRendererProps) {

    const handleBlockTypeChange = (type: BlockType) => {
        
        if(props.actions.onChange){
            props.actions.onChange({
                ...props.block,
                type
            })

            api.blocks.updateBlock(props.block.id, {type})
                .catch(err => console.error(err))
        }
    }

    const handleItemClick = async (blockId: string, action: string) => {
        
        switch(action){
            case "delete":
                if (props.actions.onDelete) {
                    await props.actions.onDelete(blockId)
                }
                break;
            case "duplicate":
                if (props.actions.onDuplicate) {
                    await props.actions.onDuplicate(blockId)
                }
                break;
            case "copy":
                if (props.actions.onCopy) {
                    await props.actions.onCopy(blockId)
                    toast.success("Copied to Clipboard")
                }
                break;
        }
    }

    const {onDelete, onDuplicate, getNumberedListIndex, onCopy, ...actions} = {...props.actions}

    switch (props.block.type) {
        case "text":
            return (
                <BlockWrapper
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}
                    onItemSelect={handleItemClick}>
                    <TextBlock 
                        block={props.block}
                        {...actions}
                    />
                </BlockWrapper>
            )

        case "heading1":
        case "heading2":
        case "heading3":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>

                    <HeadingBlock
                        placeholder={"Heading " + Number(props.block.type.at(-1))}
                        block={props.block}
                        level={Number(props.block.type.at(-1))} {...actions} />
                </BlockWrapper>
            )
        case "quote":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>
                    <QuoteBlock
                        placeholder="Empty quote"
                        block={props.block}
                        {...actions} />
                </BlockWrapper>
            )
        case "ordered_list":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        index={props.listIndex}
                        block={props.block}
                        placeholder="List"
                        listType="ordered" {...actions} />
                </BlockWrapper>
            )
        case "bullet_list":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        placeholder="List"
                        block={props.block}
                        listType="unordered" {...actions} />
                </BlockWrapper>
            )
        case "check_list":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        placeholder="To-do"
                        block={props.block}
                        listType="todo" {...actions} />
                </BlockWrapper>
            )
        case "divider":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>
                    <Separator/>
                </BlockWrapper>
            )
        case "toggle":

            return (
                    <div className="flex flex-col w-full gap-2">
                        <BlockWrapper
                            onItemSelect={handleItemClick}
                            blockId={props.block.id}
                            onTypeSelect={handleBlockTypeChange}>
                            <ToggleBlock
                                block={props.block}
                                {...actions}>
                            </ToggleBlock>
                        </BlockWrapper>
                    </div>
            )
        case "page":
            return(
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={props.block.id}
                    onTypeSelect={handleBlockTypeChange}>
                    <PageBlock 
                        onCopy={props.actions.onCopy}
                        onFocus={props.actions.onBlockFocus}
                        onDelete={props.actions.onDelete}
                        onChange={props.actions.onChange}
                        block={props.block}
                        {...actions}/>
                </BlockWrapper>
            )

        default:
            return null
    }
}

export default memo(BlockRenderor)

