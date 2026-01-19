"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"


type EditorProps = {
    params: { page: number}
}

export default function Editor({params}: EditorProps){

    const [title, setTitle] = useState<string>("")

    useEffect(()=> {
        fetch("/api/pages/" + params.page).then(response => {
            response.json().then(page => {
                if(response.status === 200){
                    setTitle(page.title)
                    return
                }
            })
        }).catch(err => console.log(err.message))
    }, [])

    useEffect(()=> {
        fetch("/api/pages/1/blocks", {
            method: "GET"
        }).then(response => {
            response.json().then(data => {
                console.log(data)
            })
        })
    }, [])

    return (
        <div className="w-screen">
            <header className="pt-30 pb-4 max-w-[1024px] m-auto">
                <h1 className={cn("text-3xl font-bold text-zinc-300", title.length && "text-black")}>{title.length ? title : "New page"}</h1>
            </header>
            <main className="max-w-[1024px] m-auto">
                <span>Hello world</span>
                <input className="border-none block shadow-none focus:border-none" />
            </main>
        </div>
    )
}