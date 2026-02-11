"use client"

import { File, FileText, Home, LayoutDashboard, MoonIcon, MoreVertical, Pencil, PenLine, Plus, Search, Settings, Sunrise, Sunset, Trash } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "./ui/sidebar"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useTheme } from "next-themes"

export default function AppSideBar() {

    const [pages, setPages] = useState<any[]>([])

    const router = useRouter()

    const {theme, setTheme} = useTheme()

    

    useEffect(() => {
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
        try {
            const res = await fetch("/api/pages", {
                method: "POST",
                body: JSON.stringify({
                    title: ""
                })
            })

            if (!res.ok) {
                setPages(prev => prev.filter(p => p.id !== tempId))
                throw new Error("Failed to create page")
            }

            const newPage = await res.json()

            setPages(prev => prev.map(p => {
                if (p.id === tempId) {
                    return {
                        ...p, id: newPage.id
                    }
                }
                return p
            }))

            router.push("/pages/" + newPage.id)

        } catch (err) {
            console.log(err)
        }
    }

    const handleDeletePage = async (pageId: number) => {
        if (!pageId) return

        setPages(prev => prev.filter(page => page.id !== pageId))

        try {
            const res = await fetch("/api/pages/" + pageId, {
                method: "DELETE"
            })

            if (!res.ok) {
                throw new Error("Failed to delete page")
            }

            router.push("/")
        } catch (err) {
            console.log(err)
        }

    }

    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if(!mounted) return null

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenuButton size={"lg"} className="bg-zinc-100 dark:bg-zinc-800">
                    <div className="bg-indigo-700 text-white size-8 aspect-square rounded-lg grid place-items-center">
                        <PenLine size={16} />
                    </div>
                    <span className="font-medium">Mindstack</span>
                </SidebarMenuButton>
            </SidebarHeader>

            <SidebarContent className="overflow-hidden">
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Search /> Search
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Home /> Home
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
                            className="ml-auto hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            onClick={handlePageCreation}>
                            <Plus/>
                        </Button>
                    </SidebarGroupLabel>

                    <SidebarMenu>
                        {
                            pages.slice(0, 50).map(page => {
                                return (
                                    <SidebarMenuItem key={page.id} >
                                        <SidebarMenuButton asChild>
                                            <Link
                                                className="text-gray-700 dark:text-gray-200 truncate group/page"
                                                href={"/pages/" + page.id}>
                                                <FileText /> {page.title ?? "New page"}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant={"secondary"}
                                                            size={"icon-xs"}
                                                            className="bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700 ml-auto invisible group-hover/page:visible transition-none">
                                                            <MoreVertical/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-50">
                                                        <DropdownMenuItem onClick={() => handleDeletePage(page.id)}>
                                                            <Trash />
                                                            Delete page
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })
                        }
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Settings /> Settings
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Trash /> Bin
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarFooter className="mt-auto">
                    <SidebarMenuButton onClick={()=> setTheme(theme === "dark" ? "light" : "dark")}>
                        {
                            theme === "dark" ? <Sunrise/> : <Sunset/>
                        }
                        {theme === "dark" ? "Light" : "Dark"} mode
                    </SidebarMenuButton>
                </SidebarFooter>
            </SidebarContent>
        </Sidebar>
    )
}