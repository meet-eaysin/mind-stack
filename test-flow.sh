#!/bin/bash
set -e

API_URL="http://localhost:4000/api"
echo "Starting Full Flow Verification..."

# 1. Ingest Text
echo "Step 1: Ingesting Text..."
INGEST_RESPONSE=$(curl -s -X POST "$API_URL/ingest/text" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TypeScript and Monorepos",
    "content": "TypeScript is a strongly typed programming language that builds on JavaScript. In a monorepo, you can share code across multiple packages efficiently using tools like Turborepo. Proper configuration of tsconfig.json is essential for a good developer experience."
  }')

DOCUMENT_ID=$(echo $INGEST_RESPONSE | jq -r '.documentId')
echo "Document Ingested: $DOCUMENT_ID"

# 2. Polling for READY status
echo "Step 2: Polling for READY status..."
MAX_RETRIES=300
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  DOC_STATUS_RESPONSE=$(curl -s -X GET "$API_URL/knowledge/documents/$DOCUMENT_ID/status")
  STATUS=$(echo $DOC_STATUS_RESPONSE | jq -r '.status')
  
  if [ "$STATUS" == "READY" ]; then
    echo "Status: READY (after $RETRY_COUNT seconds)"
    break
  fi
  
  if [ "$STATUS" == "FAILED" ]; then
    REASON=$(echo $DOC_STATUS_RESPONSE | jq -r '.errorReason')
    echo "Processing FAILED: $REASON"
    exit 1
  fi
  
  echo "Current Status: $STATUS (waiting...)"
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Timed out waiting for document to be READY"
  exit 1
fi

# 3. Check Document Detail (Verify wrapping)
echo "Step 3: Verifying Document Details..."
DOC_DETAIL=$(curl -s -X GET "$API_URL/knowledge/documents/$DOCUMENT_ID")
# Should be wrapped in { "document": ... }
TITLE=$(echo $DOC_DETAIL | jq -r '.document.title')
echo "Document Title: $TITLE"

# 4. Semantic Search
echo "Step 4: Performing Semantic Search..."
SEARCH_RESPONSE=$(curl -s -X POST "$API_URL/query/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is TypeScript?",
    "topK": 3
  }')

echo "Search Results (top 1):"
echo $SEARCH_RESPONSE | jq -r '.chunks[0].content'

# 5. Ask Question (RAG)
echo "Step 5: Asking Question..."
ASK_RESPONSE=$(curl -s -X POST "$API_URL/query/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do monorepos help with TypeScript?",
    "topK": 3
  }')

echo "Answer:"
echo $ASK_RESPONSE | jq -r '.answer'

# 6. Graph Verification
echo "Step 6: Checking Graph..."
GRAPH_JSON=$(curl -s http://localhost:4000/api/graph)
NODE_COUNT=$(echo $GRAPH_JSON | jq '.nodes | length')
echo "Nodes in graph: $NODE_COUNT"

# 7. Metadata (TagGING)
echo "Step 7: Adding Tag..."
CHUNK_ID=$(echo $SEARCH_RESPONSE | jq -r '.chunks[0].chunkId')
curl -s -X POST "$API_URL/knowledge/tags" \
  -H "Content-Type: application/json" \
  -d "{ \"chunkId\": \"$CHUNK_ID\", \"tagName\": \"typescript-core\" }"
echo ""
echo "Tag 'typescript-core' added."

# 8. Filtered Search
echo "Step 8: Filtered Search (Expected to find tagged content)..."
FILTERED_RESPONSE=$(curl -s -X POST "$API_URL/query/search/filtered" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tsconfig configuration",
    "tags": ["typescript-core"],
    "topK": 5
  }')

if echo "$FILTERED_RESPONSE" | jq -e '.chunks' > /dev/null; then
  COUNT=$(echo $FILTERED_RESPONSE | jq '.chunks | length')
  echo "Filtered Results Count: $COUNT"
  if [ "$COUNT" -gt 0 ]; then
     echo "Top Match Content: $(echo $FILTERED_RESPONSE | jq -r '.chunks[0].content[:50]')"
  fi
else
  echo "Filtered Search Failed: $FILTERED_RESPONSE"
  exit 1
fi

echo "-----------------------------------"
echo "Flow Verification Complete!"
