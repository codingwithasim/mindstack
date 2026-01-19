import client from "@/db/client";
import { pages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


/**Get a page by :id */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params
    const pageId = Number(id)

    if (Number.isNaN(pageId)) {
        return NextResponse.json({
            error: "Invalid page id"
            },
            {
                status: 400
            }
        );
    }

    const page = await client
        .select()
        .from(pages)
        .where(eq(pages.id, pageId))
        .limit(1)

    if (page.length === 0) {
        return NextResponse.json(
            { error: "Page not found" },
            { status: 404 }
        )
    }

    return NextResponse.json(page[0])
}

/**Handles renaming a page*/
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {

    const { title } = await req.json()

    if (!title || typeof title !== "string") {
        return NextResponse.json(
            { error: "No valid name was given" },
            { status: 400 }
        );
    }

    const { id } = await params
    const pageId = Number(id)

    if (Number.isNaN(pageId)) {
        return NextResponse.json(
            { error: "Invalid page id" },
            { status: 400 }
        );
    }

    const result = await client.update(pages).set({
        title,
        updatedAt: new Date()
    }).where(eq(pages.id, pageId))

    if (result.changes === 0) {
        return NextResponse.json(
            { error: "Page not found" },
            { status: 404 }
        )
    }

    return NextResponse.json({
        success: true,
        id: pageId,
        title,
    })
}

/**Handles deleting a page*/
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {

    const { id } = await params
    const pageId = Number(id)

    if(Number.isNaN(pageId)){
        return NextResponse.json(
            {error: "Invalid page id"},
            {status: 400}
        );
    }

    const result = await client
        .delete(pages)
        .where(eq(pages.id, pageId))

    if(result.changes === 0){
        return NextResponse.json(
            {error: "No page found"},
            {status: 404}
        );
    }

    return NextResponse.json({
        id: pageId,
        success: true
    })
}