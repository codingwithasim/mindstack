import { Block } from "@/components/editor/types"
import { create } from "zustand"



type EditorState = {
    blocksById: Record<string, Block>
    rootIds: string[]
    childrenByParentId: Record<string, string[]>

    setBlock: (blocks: Block[]) => void

    updateBlock: (
        id: string,
        update: Partial<Block>
    ) => void

    insertBlock: (block: Block) => void

    deleteBlock: (blockId: string) => void

    getBlock: (blockId: string) => Block
}


const useEditorStore = create<EditorState>((set, get) => ({
    blocksById: {},
    rootIds: [],
    childrenByParentId: {},

    setBlock: (blocks) => {
        const blocksById: Record<string, Block> = {}
        const rootIds : string[] = []
        const childrenByParentId: Record<string,  string[]> = {}

        for(const block of blocks){
            blocksById[block.id] = block

            if(!block.parentBlockId){
                rootIds.push(block.id)
                continue
            }

            const children = childrenByParentId[block.parentBlockId] ?? []
            children.push(block.id)
            childrenByParentId[block.parentBlockId] = children
        }

        set({
            blocksById,
            rootIds,
            childrenByParentId
        })
    },

    updateBlock: (id, update) => {

        set(state => ({
            blocksById: {
                ...state.blocksById,

                [id]: {
                    ...state.blocksById[id],
                    ...update
                }
            }
        }))
    },
    insertBlock: (block) => {
        set(state => {
            const blocksById =  {
                ...state.blocksById,
                [block.id]: block
            }

            const rootIds = [...state.rootIds]
            const childrenByParentId = {...state.childrenByParentId}

            const sortByOrder = (a: string, b: string) => {
                return parseFloat(blocksById[a].order) - parseFloat(blocksById[b].order)
            }

            if(!block.parentBlockId){
                rootIds.push(block.id)
                rootIds.sort(sortByOrder)
            }
            else{
                const parentId = block.parentBlockId

                const children = [
                    ...(state.childrenByParentId[parentId] ?? []),
                    block.id
                ]


                children.sort((sortByOrder))

                childrenByParentId[parentId] = children
            }

            return {
                blocksById,
                rootIds,
                childrenByParentId
            }
        })
    },

    deleteBlock: (blockId) => {
        set(state => {

            const blocksById = {...state.blocksById}
            const rootIds = [...state.rootIds]
            const childrenByParentId = {...state.childrenByParentId}

            const parentId = blocksById[blockId].parentBlockId

            delete blocksById[blockId]
            
            const index = rootIds.findIndex(id => id == blockId)
            
            if(index != -1){
                rootIds.splice(index, 1)
            }
            
            if(parentId){
                childrenByParentId[parentId].splice(childrenByParentId[parentId].findIndex(id => id === blockId), 1)
            }

            return{
                blocksById,
                rootIds,
                childrenByParentId
            }
        })
    },

    getBlock: (blockId) => {
        return get().blocksById[blockId]
    }
}))


export default useEditorStore