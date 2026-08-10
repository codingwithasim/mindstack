import { isValidOrder } from "@/app/api/blocks/[id]/route";
import client from "@/db/client";
import { blockData, blocks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/*Creates a new block in the current page*/
export async function POST(req: NextRequest, { params }: { params: {id: string}}){
    const { id } = await params

    const pageId = Number(id)

    if(Number.isNaN(pageId)){
        return NextResponse.json(
            {error: "Invalid page id"},
            {status: 400}
        );
    }

    const payload = await req.json()

    if(!payload.type || typeof payload.type !== "string"){
        return NextResponse.json(
            {error: "No valid type provided"},
            {status: 400}
        )
    }

    if(!payload.id || typeof payload.id !== "string"){
        return NextResponse.json(
            {error: "No valid id provided"},
            {status: 400}
        )
    }

    const parentBlockId = payload.parentBlockId ? payload.parentBlockId : null

    let blockOrder = "1.00000";

    if(payload.order && isValidOrder(payload.order)){
        blockOrder = payload.order
    }else{
        const lastOrderRow = await client
        .select({lastOrder: blocks.blockOrder})
        .from(blocks)
        .where(eq(blocks.pageId, pageId))
        .orderBy(desc(blocks.blockOrder))
        .limit(1)

        if(lastOrderRow.length > 0){
            const lastOrder = parseFloat(lastOrderRow[0].lastOrder)
            blockOrder = (lastOrder + 1).toFixed(5)
        }
    }

    const timestamp = new Date()

    // Inset the new block
    const result = await client
        .insert(blocks)
        .values({
            id: payload.id,
            pageId,
            parentBlockId,
            blockOrder,
            type: payload.type,
            createdAt: timestamp,
            updatedAt: timestamp
        })

    const blockId = payload.id
    
    await client
        .insert(blockData)
        .values({
            blockId,
            data: JSON.stringify(payload.data || { text: "" })
        })


    return NextResponse.json({
        id: blockId,
        pageId,
        parentBlockId,
        type: payload.type,
        blockOrder,
        data: payload.data || { text: ""},
        createdAt: timestamp.getTime(),
        updatedAt: timestamp.getTime()
    })
}

/*Reads all the blocks of a specifique page*/
export async function GET(req: NextRequest, {params}: {params: {id: string}}){
    const { id } = await params

    const pageId = Number(id)

    if(Number.isNaN(pageId)){
        return NextResponse.json(
            {error: "Invalid page id"},
            {status: 400}
        );
    }

    const result = await client
        .select({
            id: blocks.id,
            type: blocks.type,
            order: blocks.blockOrder,
            data: blockData.data,
            parentBlockId: blocks.parentBlockId,
            createdAt: blocks.createdAt,
            updatedAt: blocks.updatedAt
        })
        .from(blocks)
        .leftJoin(blockData, eq(blocks.id, blockData.blockId))
        .where(eq(blocks.pageId, pageId))
        .orderBy(blocks.blockOrder)

    return NextResponse.json(result)
}