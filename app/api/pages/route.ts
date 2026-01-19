import client from "@/db/client";
import { pages } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

/**Get all pages pages including sub-pages*/
export async function GET(){
    const allPages = await client.select().from(pages)
    return NextResponse.json(allPages)
}

/**Create a new page*/
export async function POST(request: Request){
    const body = await request.json()

    const newPage = await client.insert(pages).values({
        title: body.title,
        createdAt: new Date(),
        updatedAt: new Date()
    })

    return NextResponse.json(newPage)
}