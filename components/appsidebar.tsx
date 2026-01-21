"use client"

import { File, FileText, Home, LayoutDashboard, PenLine, Search, Settings, Trash } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "./ui/sidebar"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function AppSideBar(){

    const [pages, setPages] = useState<any[]>([])

    useEffect(()=> {
        fetch("/api/pages").then(response => {
            response.json().then(pages => {
                setPages(pages)
            })
        })
    }, [])

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
                    <SidebarGroupLabel>Pages</SidebarGroupLabel>
                    <SidebarMenu>
                        {
                            pages.slice(0, 5).map(page => {
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