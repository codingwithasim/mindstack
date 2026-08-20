import { CSSProperties, FormEvent, FormEventHandler, HTMLAttributes, useEffect, useRef, useState } from "react";
import Editable  from "../ui/editable";
import { Block } from "./types";
import { useTheme } from "next-themes";


type SelectionOffsets = {
    start: number
    end: number
}

type RichEditorProps = {
    block: Block
    defaultValue?: string
    onChange?: (value: string) => void,
    className?: string
    requestFocus?: boolean
    registerRef?: (el: HTMLDivElement) => void
    tag?: string
    placeholder?: string
    onFocusExit?: (block: Block) => void
    onEnter?: (block: Block, selection: SelectionOffsets) => void
} & HTMLAttributes<HTMLDivElement>

type TextStyleRange = {
    start: number
    end: number
    styles: Record<string, any>
}

const colors = {
    "#FFFF8F" : "#6B6B22"
}

function RichTextEditor(editorProps: RichEditorProps){

    const {block, onFocusExit, onEnter, ...props} = editorProps

    const editorRef = useRef<HTMLDivElement>(null)
    const [styles, setStyles] = useState<TextStyleRange[] | undefined>(block.data.styles)
    const [text, setText] = useState<string>(block.data.text)
    const skipNextModelUpdate = useRef<boolean>(false)

    const { resolvedTheme } = useTheme()


    useEffect(()=> {
        if(!text || !editorRef.current) return
        editorRef.current.innerHTML = renderStyles(text, styles)
    }, [resolvedTheme])

    useEffect(()=> {
        if(!editorRef.current) return

        const newText = block.data.text
        const newStyles = block.data.styles

        setText(newText)
        setStyles(newStyles)

        editorRef.current.innerHTML = renderStyles(newText, newStyles)        
    }, [resolvedTheme, block])

    const calcSelection = (root: HTMLDivElement): SelectionOffsets | undefined => {
        const selection = window.getSelection()
                
        if(!selection || selection.rangeCount === 0 || !editorRef.current) return

        const range = selection.getRangeAt(0)

        const startContainer = range.startContainer
        const endContainer = range.endContainer
        const startOffset = range.startOffset
        const endOffset = range.endOffset

        const startRange = document.createRange()
        startRange.selectNodeContents(root)
        startRange.setEnd(startContainer, startOffset)

        const endRange = document.createRange()
        endRange.selectNodeContents(root)
        endRange.setEnd(endContainer, endOffset)

        const start = startRange.toString().length
        const end = endRange.toString().length

        return {
            start: Math.min(start, end),
            end: Math.max(start, end),
        }
    }

    function toggleStyle(stylesDraft: TextStyleRange[] | undefined, start: number, end: number, load: {key: string, value: any}){
        const newStyles: TextStyleRange[] = []
        let shouldApplyStyle = true

        if(stylesDraft){
            for(const style of stylesDraft){

                //Prevent other styles from getting delete
                if(!style.styles[load.key]) {
                    newStyles.push(style)
                    continue
                }

                //No overlap
                if(style.end <= start || style.start >= end){
                    newStyles.push(style)
                    continue
                }

                shouldApplyStyle = false

                //keep left side
                if(style.start < start){
                    newStyles.push({
                        start: style.start,
                        end: start,
                        styles: {...style.styles}
                    })
                }

                //keep right side
                if(style.end > end){
                    newStyles.push({
                        start: end,
                        end: style.end,
                        styles: {...style.styles}
                    })
                }

                const styleWithoutCurrent = {
                    ...style,
                    styles: {
                        ...style.styles
                    }
                }

                delete styleWithoutCurrent.styles[load.key]

                if(Object.keys(styleWithoutCurrent.styles).length){

                    newStyles.push({
                        start,
                        end,
                        styles: {...styleWithoutCurrent.styles}
                    })
                }
            }
        }

        if(shouldApplyStyle){
            newStyles.push({
                start,
                end,
                styles: {
                    [load.key] : load.value
                }
            })
        }

        return newStyles
    }

    function deleteSelection(text: string, styles: TextStyleRange[], selection: SelectionOffsets){
        
        const {start, end} = selection
        const newStyles: TextStyleRange[] = []

        const delta = end - start

        for(const style of styles){

            //style before selection, nothing changes
            if(style.end <= start) {
                newStyles.push(style)
                continue
            }

            skipNextModelUpdate.current = true

            //style after selection
            if(style.start >= end){
                newStyles.push(
                    {
                        ...style,
                        start: style.start - delta,
                        end: style.end - delta
                    }
                )
                continue
            }

            //keep the part before selection
            if(style.start < start){
                newStyles.push(
                    {
                        ...style,
                        end: start
                    }
                )
            }

            //keep the part after selection
            if(style.end > end){
                newStyles.push(
                    {
                        ...style,
                        start,
                        end: style.end - delta
                    }
                )
            }
        }

        return newStyles
    }

    useEffect(()=> {
        if(!styles) return
    }, [styles])

    const handleKeyDown = (root: KeyboardEvent) => {
        const key: string = root.key.toLowerCase();

        if(!editorRef.current ) return

        if(root.ctrlKey){
            const offsets = calcSelection(editorRef.current)
            
            if(!offsets) return

            const {start, end} = offsets

            const editorStyles = {
                b : {
                    key: "bold",
                    value: true
                },
                i: {
                    key: "italic",
                    value: true
                },
                u: {
                    key: "underline",
                    value: true
                },
                h: {
                    key: "background",
                    value: "#FFFF8F"
                }
            }

            

            let style = editorStyles[key as keyof typeof editorStyles]

            if(root.shiftKey && key.toLocaleLowerCase() === "s"){
                style = 
                    {
                        key: "strikethrough",
                        value: true
                    }
            }


            if(!style) return

            const offset = getCursorOffset(editorRef.current)

            if(offset === null) return

            root.preventDefault()
            const newStyles = toggleStyle(
                styles,
                start,
                end,
                style
            )

            setStyles(newStyles)
            const html = renderStyles(text, newStyles)
            
            if(editorRef.current){
                editorRef.current.innerHTML = html
            }

            setCursorAt(editorRef.current, offset)
            return
        }

        if(key === "backspace" || key === "delete"){
            const offsets = calcSelection(editorRef.current)

            if(!styles || !offsets || offsets.start === offsets.end) return


            setStyles(deleteSelection(text, styles, offsets))
        }

        if(key === "enter"){
            if(!onEnter) return

            const offsets = calcSelection(editorRef.current)
            if(!offsets) return

            let newStyles = styles
            let newText = text

            if(offsets.start !== offsets.end){
                newStyles = deleteSelection(text, styles ?? [], offsets)
                newText = text.slice(0, offsets.start) + text.slice(offsets.end)
            }

            const newBlock: Block = {
                ...block,
                data: {
                    ...block.data,
                    styles: newStyles,
                    text: newText
                }
            }


            onEnter(newBlock, offsets)
        }
    }

    function setCursorAt(root: Node, offset: number) {
        requestAnimationFrame(() => {
            const selection = window.getSelection()

            if (!selection) return

            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            )

            let remaining = offset
            let node: Node | null

            while((node = walker.nextNode())){
                if(node){
                    const length = node.textContent?.length ?? 0

                    if(remaining <= length){
                        const range = document.createRange()

                        range.setStart(node, remaining)
                        range.collapse(true)

                        selection.removeAllRanges()
                        selection.addRange(range)

                        return
                    }

                    remaining -= length
                }
            }
        })
    }

    const renderStyles = (text: string, styles?: TextStyleRange[]) => {

        if(!styles) {
            return text
        }

        const boundries = new Set<number>()

        boundries.add(0)
        boundries.add(text.length)

        for(const style of styles){
            boundries.add(style.start)
            boundries.add(style.end)
        }

        const points = [...boundries].sort((a, b) => a - b)

        let result = ""

        for(let i = 0; i < points.length - 1; i++){
            const start = points[i]
            const end = points[i+1]

            const cssText : string[] = []

            for(const style of styles){
                if(style.start < end && style.end > start){
                    if(style.styles.bold){
                        cssText.push("font-weight:bold")
                    }

                    if(style.styles.italic){
                        cssText.push("font-style:italic")
                    }

                    if(style.styles.underline){
                        cssText.push("text-decoration:underline")
                    }

                    if(style.styles.overline){
                        cssText.push("text-decoration:overline")
                    }

                    if(style.styles.overline && style.styles.underline){
                        cssText.push("text-decoration:underline overline")
                        
                    }

                    if(style.styles.strikethrough){
                        cssText.push("text-decoration:line-through")
                    }

                    if(style.styles.color){
                        cssText.push(`color:${style.styles.color}`)
                    }

                    if(style.styles.background){
                        const backgroundColor =
                            resolvedTheme === "light"
                                ? style.styles.background
                                : colors[style.styles.background as keyof typeof colors]
                        cssText.push(`background:${backgroundColor}`)
                    }
                }
            }

            const content = text.slice(start, end)

            let element = `<span style="${cssText.join(";")}">${content}</span>`;
            result += element
        }

        return result
    }

    function getCursorOffset(root: Node): number | null {
        const selection = window.getSelection()

        if (!selection || selection.rangeCount === 0) {
            return null
        }

        const range = selection.getRangeAt(0)

        if (!root.contains(range.startContainer)) {
            return null
        }

        const beforeCursor = document.createRange()

        beforeCursor.selectNodeContents(root)
        beforeCursor.setEnd(
            range.startContainer,
            range.startOffset
        )

        return beforeCursor.toString().length
    }

    const handleInput = (root: FormEvent<HTMLDivElement>) => {
        const selection = window.getSelection()

        if (!selection || !editorRef.current) {
            return
        }

        const nodeText = root.currentTarget.textContent

        if(nodeText.length === text.length) return

        setText(nodeText)

        if(skipNextModelUpdate.current){
            skipNextModelUpdate.current = false
            return
        }

        const offset = getCursorOffset(editorRef.current)

        if(offset === null) return

        let delta = nodeText.length - text.length


        setStyles(prev => {    
            if(!prev) return

            return prev.map(style => {
                const newStyle = {...style}

                if(style.start >= offset - 1){
                    newStyle.start += delta
                }

                if(style.end >= offset - 1){
                    newStyle.end += delta
                }
                return newStyle
            })
        })
    }


    return (
        <Editable
            ref={editorRef}
            value={block.data.text}
            manageContent={false}
            {...props}
            onInput={(e) => {
                if(props.onInput){
                    props.onInput(e)
                }
                handleInput(e)
            }}
            onBlur={() => {
                if(onFocusExit){
                    const resolvedBlock = {
                        ...block,
                        data: {
                            ...block.data,
                            text,
                            styles
                        }
                    }

                    onFocusExit(resolvedBlock)
                }
            }}
            onKeyDown={(event) => {
                if(props.onKeyDown){
                    props.onKeyDown(event)
                }
                handleKeyDown(event)
            }}
        />
    )
}

export default RichTextEditor