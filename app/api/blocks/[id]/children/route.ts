import client from "@/db/client";
import { blockData, blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**Get all children blocks of block with id [:id]*/
export async function GET(req: NextRequest, { params }: { params: { id: string }}){
    const { id } = await params
    const parentId = String(id)

    if(!parentId){
        return NextResponse.json(
            {error: "Invalid block id"},
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
        .leftJoin(blockData, eq(blockData.blockId, blocks.id))
        .where(eq(blocks.parentBlockId, parentId))
        
    return NextResponse.json(result)
}
