"use client"

import { File, FileText, Home, LayoutDashboard, Pencil, PenLine, Plus, Search, Settings, Trash } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "./ui/sidebar"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "./ui/button"
import { navigate } from "next/dist/client/components/segment-cache/navigation"
import { useRouter } from "next/navigation"

export default function AppSideBar(){

    const [pages, setPages] = useState<any[]>([])

    const router = useRouter()

    useEffect(()=> {
        fetch("/api/pages").then(response => {
            response.json().then(pages => {
                setPages(pages)
            })
        })
    }, [])

    const handlePageCreation = async () => {
        const tempId = -Date.now()

        setPages(prev => [
            {
                id: tempId,
                title: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                parentPageId: null
            },
            ...prev
        ])

        // TODO: switch pages to client-generated IDs for optimistic routing
        try{
            const res = await fetch("/api/pages", {
                method: "POST",
                body: JSON.stringify({
                    title: ""
                })
            })

            if(!res.ok){
                setPages(prev => prev.filter(p => p.id !== tempId))
                throw new Error("Failed to create page")
            }

            const newPage = await res.json()

            setPages(prev => prev.map(p => {
                if(p.id === tempId){
                    return {
                        ...p, id: newPage.id
                    }
                }
                return p
            }))
            
            router.push("/pages/" + newPage.id)

        }catch(err){
            console.log(err)
        }
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenuButton size={"lg"} className="bg-gray-100">
                        <div className="bg-indigo-700 text-white size-8 aspect-square rounded-lg grid place-items-center">
                            <PenLine size={16}/>
                        </div>
                        <span className="font-medium">Mindstack</span>
                </SidebarMenuButton>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Search/> Search
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Home/> Home
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>
                        Pages
                        <Button
                            variant={"secondary"}
                            size={"icon-xs"}
                            className="ml-auto hover:bg-gray-200"
                            onClick={handlePageCreation}>
                            <Plus color="#121212"/>
                        </Button>
                    </SidebarGroupLabel>
                    
                    <SidebarMenu>
                        {
                            pages.slice(0, 50).map(page => {
                                return (
                                    <SidebarMenuItem key={page.id}>
                                        <SidebarMenuButton asChild>
                                            <Link href={"/pages/" + page.id}>
                                                <FileText/> {page.title ?? "New page"}
                                            </Link>
                                            
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })
                        }
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator/>
                
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Settings/> Settings
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Trash/> Bin
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}