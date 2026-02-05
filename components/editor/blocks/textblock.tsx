"use client"


import TextWrapper, { TextWrapperProps } from "./textwrapper";

export default function TextBlock(props : TextWrapperProps) {

    return (
        <TextWrapper className="w-full focus:empty:before:content-['Type_something...']" {...props} />
    )
}