import { Clipboard, Copy, FileText, GripVertical, Heading1, Heading2, Heading3, ListChevronsDownUpIcon, ListIcon, ListOrdered, ListTodo, LucideIcon, Minus, Quote, RotateCwSquare, Trash, Type } from "lucide-react";
import HeadingBlock from "./blocks/headingblock";
import TextBlock from "./blocks/textblock";
import { BlockComponentProps, BlockType } from "./types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { memo, ReactNode, useEffect } from "react";
import QuoteBlock from "./blocks/quoteblock";
import ListBlock from "./blocks/listblock";
import { Separator } from "../ui/separator";
import ToggleBlock from "./blocks/toggleblock";
import { toast } from "sonner";
import PageBlock from "./blocks/pageblock";

export function BlockWrapper({ children, blockId, onTypeSelect, onItemSelect }: {children: ReactNode, blockId?: string, onItemSelect?: (blockId: string, action: string) => void, onTypeSelect?: (type: BlockType)=> void,}) {
    
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

    return (
        <div className={"flex items-center gap-2 flex-1 group"}>
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


function BlockRenderor(props: BlockComponentProps) {

    const { type, id, onChange, block, onDelete, onDuplicate, onCopy } = props

    const handleBlockTypeChange = (type: BlockType) => {
        if(onChange){
            onChange({
                ...block,
                type
            })

            fetch("/api/blocks/" + id, {
                method: "PATCH",
                body: JSON.stringify({
                    type
                })
            }).then(response => {
                response.json().then(result => {
                    console.log("✅ Type changed.");
                })
            })
        }
    }

    const handleItemClick = async (blockId: string, action: string) => {
        
        switch(action){
            case "delete":
                if (onDelete) {
                    await onDelete(blockId)
                }
                break;
            case "duplicate":
                if (onDuplicate) {
                    await onDuplicate(blockId)
                }
                break;
            case "copy":
                if (onCopy) {
                    await onCopy(blockId)
                    toast.success("Copied to Clipboard")
                }
                break;
        }
    }

    const {listIndex, onDelete : s, onDuplicate: d, ...rest} = props

    switch (type) {
        case "text":
            return (
                <TextBlock {...rest} />
            )

        case "heading1":
        case "heading2":
        case "heading3":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <HeadingBlock
                        placeholder={"Heading " + Number(type.at(-1))}
                        level={Number(type.at(-1))} {...rest} />
                </BlockWrapper>
            )
        case "quote":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <QuoteBlock
                        placeholder="Empty quote"
                        {...rest} />
                </BlockWrapper>
            )
        case "ordered_list":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        index={listIndex}
                        placeholder="List"
                        listType="ordered" {...rest} />
                </BlockWrapper>
            )
        case "bullet_list":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        placeholder="List"
                        listType="unordered" {...rest} />
                </BlockWrapper>
            )
        case "check_list":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        placeholder="To-do"
                        listType="todo" {...rest} />
                </BlockWrapper>
            )
        case "divider":
            return (
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <Separator/>
                </BlockWrapper>
            )
        case "toggle":
            return (
                    <ToggleBlock {...rest}/>
            )
        case "page":
            return(
                <BlockWrapper
                    onItemSelect={handleItemClick}
                    blockId={id}
                    onTypeSelect={handleBlockTypeChange}>
                    <PageBlock {...rest}/>
                </BlockWrapper>
            )

        default:
            return null
    }
}

export default memo(BlockRenderor)
