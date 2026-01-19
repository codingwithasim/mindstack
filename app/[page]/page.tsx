"use server"

import Editor from "@/components/editor/editor";

export default async function PageEditor({params}: {params: {page: number}}){
    
    return (
        <Editor params={await params} />
    )
}