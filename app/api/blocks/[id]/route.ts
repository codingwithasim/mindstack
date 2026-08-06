import client from "@/db/client";
import { blockData, blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**Deletes a block and all its metadata*/
export async function DELETE(req: NextRequest, { params }: { params: { id: string }}){
    const { id } = await params
    const blockId = String(id)

    if(!blockId){
        return NextResponse.json(
            {error: "Invalid block id"},
            {status: 400}
        );
    }

    const result = await client
        .delete(blocks)
        .where(eq(blocks.id, blockId))

    if(result.changes === 0){
        return NextResponse.json(
            {error: "Block not found"},
            {status: 404}
        );
    }

    return NextResponse.json({
        success: true,
        id: blockId
    })
}

/**Update any block and/or it's data*/
export async function PATCH(req: NextRequest, {params}: { params: {id: string}}){
    const { id } = await params
    const blockId = String(id)

    if(!blockId){
        return NextResponse.json(
            {error: "Invalid block id"},
            {status: 400}
        );
    }

    const payload = await req.json()

    console.log(typeof payload);
    

    if(!payload || typeof payload !== "object"){
        return NextResponse.json(
            {error: "Invalid payload"}, {status: 400}
        )
    }

    if(!(payload.type || payload.blockOrder || payload.data || payload.parentBlockId)){
        return NextResponse.json(
            {error: "No data provided"}, {status: 400}
        )
    }

    if(payload.type && typeof payload.type !== "string"){
        return NextResponse.json(
            {error: "Invalid type"}, {status: 400}
        )
    }

    if(payload.parentBlockId && typeof payload.parentBlockId !== "string"){
        return NextResponse.json(
            {error: "Invalid parent block id"}, {status: 400}
        )
    }

    if(payload.blockOrder && !isValidOrder(payload.blockOrder)){
        return NextResponse.json(
            {error: "Invalid order"}, {status: 400}
        )
    }
    

    /* ===================== Update blocks table ===================== */

    const blockUpdate: Partial<{
        blockOrder: string
        type: string
        parentBlockId: string
        updatedAt: Date
    }> = {}

    if(payload.type) blockUpdate.type = payload.type
    if(payload.parentBlockId) blockUpdate.parentBlockId = payload.parentBlockId
    if(payload.blockOrder) blockUpdate.blockOrder = Number(payload.blockOrder).toFixed(5)

    if(Object.keys(blockUpdate).length > 0){
        blockUpdate.updatedAt = new Date()

        await client
        .update(blocks)
        .set(blockUpdate)
        .where(eq(blocks.id, blockId))
    }

    /* ===================== Update block_data table ===================== */

    if(payload.data){
        await client
        .update(blockData)
        .set({data: JSON.stringify(payload.data)})
        .where(eq(blockData.blockId, blockId))
    }

    return NextResponse.json({
        success: true,
        id: blockId,
        ...blockUpdate,
        data: payload.data ?? undefined
    })
}


/**Checks if order is correct*/
export function isValidOrder(order: unknown): boolean {
    if(typeof order !== "string") return false

    const num = Number(order)
    return Number.isFinite(num)
}