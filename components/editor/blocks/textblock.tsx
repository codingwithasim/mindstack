"use client"

import { memo, useEffect } from "react";
import TextWrapper, { TextWrapperProps } from "./textwrapper";

function TextBlock(props: TextWrapperProps) {

    useEffect(() => {
        console.log("re-rendering block from text-block");
    })

    return (
        <div className="flex flex-col w-full">
            <TextWrapper className="w-full focus:empty:before:content-['Type_something...']" {...props} />
        </div>
    )
}

export default memo(TextBlock)