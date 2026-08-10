import { Block } from "@/components/editor/types"
import { request } from "./client"


type APIBlock = {
    id: string
    type: string
    order: string
    parentBlockId: string | null
    data: string
    createdAt: number
    updatedAt: number
}

type  BatchPayload = {
    create: Record<string, any> //Will become optional once the other operations are available
    update?: Record<string, any>
    delete?: Record<string, any>
}

export function createBlock(pageId: number, block: Block) {
    
    return request<Block>(
        "/api/pages/" + pageId + "/blocks",
        {
            method: "POST",
            body: JSON.stringify(block)
        }
    )
}

export async function deleteBlock(blockId: string) {
    const response = await fetch(`/api/blocks/${blockId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    })

    if (!response.ok) {
        throw new Error("Failed to delete the block")
    }

    return await response.json()
}

export async function updateBlock(blockId: string, patch: Partial<Block>) {
    const response = await fetch(`/api/blocks/${blockId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(patch)
    })

    if (!response.ok) {
        throw new Error("Failed to update the block")
    }

    return await response.json()
}

export async function getBlocks(pageId: number) {

    const response = await fetch("/api/pages/" + pageId + "/blocks", { method: "GET" })

    if (!response.ok) {
        throw new Error(`Failed to fetch blocks: ${response.status}`)
    }

    const data = await response.json()

    return data.map((block: APIBlock) => {
        return {
            ...block,
            data: JSON.parse(block.data)
        }
    })
}

export async function batch(pageId: number, batchPayload: BatchPayload) {

    if(!batchPayload.create){
        throw new Error("payload must have \'create\' property")
    }

    const response = await fetch(
        "/api/pages/" + pageId + "/blocks/batch",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(batchPayload)
        })
    if (!response.ok) {
        throw new Error(`The transaction could not be compelted: ${response.status}`)
    }

    return await response.json()

}