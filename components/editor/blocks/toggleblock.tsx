"use client"


import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import TextWrapper, { TextWrapperProps } from "./textwrapper";
import React, { memo, useCallback, useContext, useEffect, useState } from "react";
import { BlockWrapper } from "../renderor";

type ToggleProps = TextWrapperProps & {
    children: React.ReactNode
}

function ToggleBlock({children, ...props}: ToggleProps) {

    useEffect(()=> {
        console.log("rerender from toggle ");    
    })

    const handleStateChange = (opened: boolean) => {
        if(!props.onChange) return
        
        props.onChange({...props.block, data: { ...props.block.data, opened}})
    }

    return (
        <div className="flex flex-col w-full gap-2">

            <BlockWrapper>
                <div className="flex gap-1 w-full">
                    <div
                        onClick={() => handleStateChange(props.block.data.opened ?? false ? false : true)}
                        className="hover:bg-zinc-200 dark:hover:bg-zinc-700 h-fit mt-1 cursor-pointer p-1 rounded-sm">
                        { props.block.data.opened ?? false ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                    </div>
                    <TextWrapper className="w-full font-medium" placeholder="Toggle" {...props} />
                </div>
            </BlockWrapper>


            {/* <div className="flex flex-col pl-4 w-full before:left-3 before:absolute before:text-gray-300 before:content[''] before:w-px before:h-[calc(100%-10px)] before:top-0  before:border-l relative"> */}
            <div className="flex flex-col pl-4 w-full transition-all pb-2">
                {
                    props.block.data.opened && children
                }
            </div>
        </div>
    )
}

export default memo(ToggleBlock)