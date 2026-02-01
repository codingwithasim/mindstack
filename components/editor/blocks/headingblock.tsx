import { cn } from "@/lib/utils"
import TextWrapper, { TextWrapperProps } from "./textwrapper"


export default function HeadingBlock({ level = 1, ...props }: TextWrapperProps & {level: number}) {

    const type = "h" + Math.max(1, Math.min(level, 3))

    return (
        <TextWrapper 
            className={cn("w-full font-bold py-1 text-zinc-800", level === 1 && "text-3xl", level === 2 && "text-2xl", level === 3 && "text-xl")}
            tag={type}
            {...props}
        />
    )
}