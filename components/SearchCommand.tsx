"use client"

import { useEffect, useState } from "react"
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { SidebarMenuButton } from "./ui/sidebar"
import { File, Search } from "lucide-react"
import { Page } from "./editor/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Kbd } from "./ui/kbd"

export function SearchCommand() {
    const [open, setOpen] = useState(false)

    const [items, setItems] = useState<Page[]>()
    const router = useRouter()


    useEffect(() => {
        fetch("/api/pages").then(response => {
            response.json().then(pages => {
                setItems(pages)
            })
        })
    }, [])


    useEffect(()=> {
        const handler = function(e: KeyboardEvent){
            if(e.key === "k" && e.ctrlKey && !open){
                e.preventDefault()
                setOpen(true)
            }
        }

        document.addEventListener("keydown", handler)

        return ()=> document.removeEventListener("keydown", handler)
    }, [])


    return (
        <div className="flex flex-col gap-4">
            <SidebarMenuButton onClick={() => setOpen(true)}>
                <Search />
                Search

                <Kbd className="ml-auto">Ctrl+K</Kbd>
            </SidebarMenuButton>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <Command>
                    <CommandInput placeholder="Search in your pages..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            {
                                items && items.map(item => {
                                    return (
                                        <CommandItem
                                            asChild
                                            key={item.id}
                                            onSelect={() => {
                                                setOpen(false)
                                                router.push("/pages/" + item.id)
                                            }}>
                                            <Link href={"/pages/" + item.id}>
                                                <File />
                                                {item.title}
                                            </Link>
                                        </CommandItem>
                                    )
                                })
                            }
                        </CommandGroup>
                    </CommandList>
                </Command>
            </CommandDialog>
        </div>
    )
}
