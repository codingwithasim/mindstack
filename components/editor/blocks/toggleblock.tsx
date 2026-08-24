"use client"


import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import TextWrapper, { TextWrapperProps } from "./textwrapper";
import React, { memo, useEffect } from "react";

function ToggleBlock({children, ...props}: TextWrapperProps) {

    const handleStateChange = (opened: boolean) => {
        if(!props.onChange) return
        
        props.onChange({...props.block, data: { ...props.block.data, opened}})
    }

    return (
        <div className="flex flex-col w-full gap-2">

                <div className="flex gap-1 w-full">
                    <div
                        onClick={() => handleStateChange(props.block.data.opened ?? false ? false : true)}
                        className="hover:bg-zinc-200 dark:hover:bg-zinc-700 h-fit mt-1 cursor-pointer p-1 rounded-sm">
                        { props.block.data.opened ?? false ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                    </div>
                    <TextWrapper className="w-full font-medium" placeholder="Toggle" {...props} />
                </div>
        </div>
    )
}


export default memo(ToggleBlock)
