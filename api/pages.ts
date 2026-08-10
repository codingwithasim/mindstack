import { Page } from "@/components/editor/types";
import { request } from "./client"


type APIPage = Page

export async function renamePageAPI (pageId: number, newTitle: string) {
    
    const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle })
    })

    if (!response.ok) {
        throw new Error("Failed to rename the page !");
    }

    return await response.json()
}

export async function getPage(pageId: number): Promise<APIPage>{
    const response = await fetch("/api/pages/" + pageId)
    
    if(!response.ok){
        throw new Error(`Couldn't load page data: ${response.status}`)
    }
    
    return await response.json()
}

export function getPages(){
    return request<APIPage[]>(
        "/api/pages"
    )
}

export function createPage(title: string = ""){
    return request<APIPage>("/api/pages", {
        method: "POST",
        body: JSON.stringify({
            title
        })
    })
}

export function deletePage(pageId: number){
    return request<{
        pageId?: number
        success?: boolean
        error?: string
    }>(
        `/api/pages/${pageId}`,
        {
            method: "DELETE"
        }
    )
}

