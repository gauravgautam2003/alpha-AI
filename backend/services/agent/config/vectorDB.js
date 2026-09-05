import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings";
import dotenv from "dotenv";
dotenv.config({ quiet: true })

export const vectorStore = async (docs, collectionName) => {
    return await QdrantVectorStore.fromExistingCollection(docs, embeddings, {
        url: process.env.QDRANT_URL,
        collectionName
    });
}