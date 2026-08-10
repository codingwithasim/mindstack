import { cn } from "@/lib/utils";
import TextWrapper, { TextWrapperProps } from "./textwrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { api } from "@/api";

type ListProps = {
    index?: number
    listType?: "ordered" | "unordered" | "todo"
} & TextWrapperProps

export default function ListBlock({listType="ordered", index, ...props}: ListProps){

    const listIndex = index ?? -1
    const {onChange, block} = props

    const handleCheckboxChange = async (val: boolean) => {
        
        if(!onChange) return;

        onChange({...block, data: {text: block.data.text, checked: val}})

        api.blocks.updateBlock(block.id, {
            data: {
                text: block.data.text,
                checked: val
            }
        })
    }

    return (
        <div className="flex items-center gap-2.5 flex-1">
            <div className={cn("grid text-center place-items-center min-w-6 select-none text-muted-foreground", listType === "unordered" && "text-black dark:text-white text-2xl")}>
                {
                    listType === "ordered" ?
                    listIndex + '.' :
                    listType === "unordered" ?
                    '•':
                    <Checkbox checked={props.block.data.checked} onCheckedChange={handleCheckboxChange}/>
                }
            </div>
            <TextWrapper
            className={cn("flex-1", listType === "todo" && props.block.data.checked && "line-through text-muted-foreground")}
                {...props}/>
        </div>
    )
}