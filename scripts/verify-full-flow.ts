const API_URL = "http://localhost:4000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(method: string, path: string, body?: any) {
  const headers = { "Content-Type": "application/json" };
  const url = `${API_URL}${path}`;
  console.log(`\ncalling ${method} ${url}...`);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error ${res.status}: ${text}`);
      throw new Error(`API Error: ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

async function verifyFlow() {
  console.log("Starting End-to-End Verification Flow...");

  // 1. Ingest Text
  console.log("\n--- 1. Ingest Text ---");
  const ingestRes = await api("POST", "/ingest/text", {
    content:
      "Mind Stack is a personal knowledge management system. It uses vector search for retrieval.",
    title: "Test Document",
  });
  console.log("Ingest Response:", ingestRes);
  const documentId = ingestRes.documentId; // Adjust based on actual response structure
  if (!documentId) throw new Error("No documentId returned from ingest");

  // 2. Poll Status
  console.log("\n--- 2. Poll Status ---");
  let indexed = false;
  for (let i = 0; i < 20; i++) {
    const doc = await api("GET", `/knowledge/documents/${documentId}`);
    console.log("Poll Response:", doc);
    console.log(`Poll ${i + 1}: Status = ${doc.status}`);
    if (doc.status === "indexed" || doc.status === "completed") {
      indexed = true;
      break;
    }
    await sleep(2000);
  }
  if (!indexed) throw new Error("Document authentication failed or timed out");

  // 3. Search
  console.log("\n--- 3. Search ---");
  await sleep(2000); // Allow chroma to commit?
  const searchRes = await api("POST", "/query/search", {
    query: "vector search",
  });
  console.log("Search Results:", JSON.stringify(searchRes, null, 2));
  if (!Array.isArray(searchRes) || searchRes.length === 0) {
    console.warn(
      "Search returned no results. Indexing might be slow or failed silently.",
    );
  }

  // 4. RAG Question
  console.log("\n--- 4. RAG Question ---");
  const ragRes = await api("POST", "/query/ask", {
    query: "What does Mind Stack use?",
  });
  console.log("RAG Response:", ragRes);
  if (!ragRes.answer) console.warn("RAG returned no answer");

  // 5. Graph Neighborhood
  console.log("\n--- 5. Graph Neighborhood ---");
  try {
    const graphRes = await api("GET", `/graph/document/${documentId}`);
    console.log("Graph Response:", JSON.stringify(graphRes, null, 2));
  } catch (e) {
    console.warn("Graph endpoint might not be ready or failed", e);
  }

  // 6. Export
  console.log("\n--- 6. Export ---");
  const exportRes = await api("GET", `/export/markdown/${documentId}`);
  console.log("Export Length:", exportRes.length);
  if (!exportRes.includes("Mind Stack"))
    throw new Error("Export content mismatch");

  console.log("\n--- Verification Complete ---");
}

verifyFlow().catch((err) => {
  console.error("Verification Failed:", err);
  process.exit(1);
});
