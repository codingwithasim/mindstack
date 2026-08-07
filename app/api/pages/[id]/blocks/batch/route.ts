import client from "@/db/client";
import { blockData, blocks } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

type Block = {
    id: string
    type: string
    parentBlockId?: string
    order: string
    data: Record<string, unknown>
}

type BatchPayload = {
    create?: Block[]
    update?: Block[]
    delete?: Block[]
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {

    const { id } = await params

    const pageId = Number(id)

    //Verify the page id
    if (Number.isNaN(pageId)) {
        return NextResponse.json(
            { message: "Invalid page id" },
            { status: 400 }
        )
    }

    const payload: BatchPayload = await request.json()

    console.log(payload);
    
    if (!Array.isArray(payload.create)) {
        return NextResponse.json(
            { message: "'create' must of an array" },
            { status: 400 }
        )
    }

    if(payload.create.length === 0){
        return NextResponse.json(
            {message: "Nothing to create"}
        )
    }

    const currentTimestamp = new Date()

    const blockRows = payload.create.map(block => (
        {
            id: block.id,
            pageId,
            type: block.type,
            blockOrder: block.order,
            parentBlockId: block.parentBlockId ?? null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp
        }
    ))

    const blockDataRows = payload.create.map(block => (
        {
            blockId: block.id,
            data: JSON.stringify(block.data ?? { text: "" })
        }
    ))


    client.transaction(tx => {
        tx.insert(blocks).values(blockRows).run()
        tx.insert(blockData).values(blockDataRows).run()
    })

    return NextResponse.json({
        dataRecieved: {
            ...payload
        }
    })
}