"use client"

import TextBlock from "./blocks/textblock";

export default function Block({id, data, type}: {id: number, data: any, type: string}){

    // if(type === "text"){
    //     return <TextBlock id={id} data={data}/>
    // }

    return <span>Unknown block</span>
}