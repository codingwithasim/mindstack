import { Check, ChevronRight, GripVertical, Heading1, Heading2, Heading3, List, ListIcon, ListOrdered, ListTodo, LucideIcon, Quote, RotateCwSquare, Type } from "lucide-react";
import HeadingBlock from "./blocks/headingblock";
import TextBlock from "./blocks/textblock";
import { Block, BlockComponentProps, BlockType } from "./types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ReactNode } from "react";
import QuoteBlock from "./blocks/quoteblock";
import ListBlock from "./blocks/listblock";

function BlockWrapper({ children, onTypeSelect }: {children: ReactNode, onTypeSelect?: (type: BlockType)=> void}) {
    
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
        }
    ]
    
    
    return (
        <div className="flex group items-center gap-2 flex-1">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className="group-hover:visible group-focus:visible invisible py-1 rounded-sm cursor-grab text-gray-400 hover:bg-gray-100">
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
                </DropdownMenuContent>
            </DropdownMenu>
            {children}
        </div>
    )
}

export default function BlockRenderor(props: BlockComponentProps) {

    const { type, id, onChange, block } = props

    const handleBlockTypeChange = (type: BlockType) => {
        console.log(type);
        
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

    const {listIndex, ...rest} = props

    switch (type) {
        case "text":
            return (
                <BlockWrapper
                    onTypeSelect={handleBlockTypeChange}>
                    <TextBlock {...rest} />
                </BlockWrapper>
            )

        case "heading1":
        case "heading2":
        case "heading3":
            return (
                <BlockWrapper
                    onTypeSelect={handleBlockTypeChange}>
                    <HeadingBlock
                        level={Number(type.at(-1))} {...rest} />
                </BlockWrapper>
            )
        case "quote":
            return (
                <BlockWrapper
                    onTypeSelect={handleBlockTypeChange}>
                    <QuoteBlock {...rest} />
                </BlockWrapper>
            )
        case "ordered_list":
            return (
                <BlockWrapper
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        index={listIndex}
                        listType="ordered" {...rest} />
                </BlockWrapper>
            )
        case "bullet_list":
            return (
                <BlockWrapper
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        listType="unordered" {...rest} />
                </BlockWrapper>
            )
        case "check_list":
            return (
                <BlockWrapper
                    onTypeSelect={handleBlockTypeChange}>
                    <ListBlock
                        listType="todo" {...rest} />
                </BlockWrapper>
            )

        default:
            return null
    }
}