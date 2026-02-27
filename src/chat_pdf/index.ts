import "dotenv/config"
import { MistralAI, MistralAIEmbeddings } from "@langchain/mistralai"
import { PDFParse } from "pdf-parse"
import { Pinecone } from '@pinecone-database/pinecone';

const llm = new MistralAI({
    apiKey: process.env.MISTRAL_API_KEY,
    model: "codestral-latest",
    temperature: 0.9,
})

const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY!,
    model: "mistral-embed",
});

const pc = new Pinecone({
    apiKey: process.env.PINECONE_KEY!!
});
// Use the current, non-deprecated index accessor (host is configured in Pinecone project settings or env)
const index = pc.index("pdf-chat");

async function getText() {
    const parser = new PDFParse({ url: 'https://drive.usercontent.google.com/download?id=1DoqIv-ZNhkE0yhibPQOQ_rIktAclUxGq&export=download&authuser=1&confirm=t&uuid=f3d463ec-e612-449c-959e-368358731ee0&at=APcXIO051SFRYqUKLqdCPfM98YFN:1771902341164' });

    const result = await parser.getText();
    return result.text;
}

async function chunkTXTS(chunkSize: number = 1000): Promise<string[]> {
    const text = await getText();
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }

    return chunks;
}

async function embedPDFToPinecone() {
    const chunks = await chunkTXTS(1000);

    const vectors = await embeddings.embedDocuments(chunks);

    const pineconeRecords = vectors.map((values, i) => ({
        id: `doc-${i}`,
        values,
        metadata: {
            text: chunks[i],
        },
    }));

    await index.namespace("pdf-docs").upsert({
        records: pineconeRecords
    });

    console.log("✅ Stored", pineconeRecords.length, "chunks in Pinecone");
}

async function askResume(question: string) {
    const queryVector = await embeddings.embedQuery(question);

    const results = await index.namespace("pdf-docs").query({
        vector: queryVector,
        topK: 3,
        includeMetadata: true,
    });

    const context = results.matches
        ?.map(m => m.metadata?.text)
        .join("\n\n");

    const response = await llm.invoke(`
You are a resume assistant.
Answer using ONLY the context below.

Context:
${context}

Question: ${question}
`);

    return response;
}
export async function Call_LLM() {
    const res = await askResume("give me the summary of saif's capabilities, does it good for a frontend intern role ?. How much do u rate him on scale of 1 to 5")
console.log(res);

    //   const completion = await llm.invoke("MistralAI is an AI company that ")
    //   console.log(completion)
}