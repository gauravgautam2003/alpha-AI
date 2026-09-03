import { searchTool } from "../config/tavilySearch.js"
import { deductCredits } from "../utils/deductCredits.js";

export const searchAgent = async (state) => {
    try {
        const results = await searchTool.invoke({
            query: state.prompt
        })
        await deductCredits(state.userId, "search")
        
        return {
            ...state,
            searchResults: results,
            images: results.images
        }
    } catch (error) {
        return {
            ...state,
            searchResults: [],
            images: []
        }
    }   
}