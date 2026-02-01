"use client"

import TextWrapper, { TextWrapperProps } from "./textwrapper";

export default function QuoteBlock(props: TextWrapperProps) {

    return (
        <TextWrapper className="w-full text-zinc-800 border-black border-l-4 pl-2" {...props} />
    )
}