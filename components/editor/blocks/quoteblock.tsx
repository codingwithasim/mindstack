"use client"

import TextWrapper, { TextWrapperProps } from "./textwrapper";

export default function QuoteBlock(props: TextWrapperProps) {

    return (
        <TextWrapper className="w-full border-primary border-l-4 pl-2" {...props} />
    )
}