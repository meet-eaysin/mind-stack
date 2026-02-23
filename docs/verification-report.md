# Verification Report (WIP)

Date: 2026-02-23

## 1) Feature checklist

Legend:

- PASS: implemented and covered by API/UI/tests in this repo.
- PARTIAL: implemented with known gaps.
- MISSING: no complete implementation found.
- BLOCKED: requires runtime infra not available in this environment.

### A. Knowledge & Document Core

- A1 ingestion: PARTIAL
  - PASS: paste text (`POST /ingest/text`), URL (`POST /ingest/url`), transcript path via YouTube (`POST /ingest/youtube`), uploaded file via PDF (`POST /ingest/pdf`), clip/extension entry (`POST /ingest/clip`).
  - PASS: ingestion now has real queue processor path (`URL_EXTRACTION -> CHUNKING -> EMBEDDING -> CONCEPT_EXTRACTION`).
  - BLOCKED: end-to-end runtime verification requires Postgres/Redis/Chroma/Ollama.
- A2 document model: PARTIAL
  - PASS: title/type/content/source/language/createdAt/addedByUserAt fields exist.
  - GAP: `publishedAt`/author/publisher ingestion extraction is not automated in ingestion workers.
- A3 lifecycle: PASS
  - list/read/update/delete endpoints exist, with document delete cleaning chunks + embeddings.
- A4 learning status: PARTIAL
  - PASS: enum and history table exist, update flow records history on document metadata updates and ingestion transitions.
  - GAP: strict transition policy matrix is not centrally enforced.

### B. Chunking & Embeddings

- B1 chunking pipeline: PASS
- B2 embedding pipeline: PASS
- B3 vector consistency: PARTIAL
  - PASS: document delete cleans chunk rows + vector ids.
  - GAP: orphan diagnostics endpoint still reports existing drift from historical data.

### C. Search & Retrieval

- C1 normal search returns documents only: PASS
- C2 AI search/Q&A with citations: PASS

### D. RAG / AI answering

- D grounded generation/context/citations: PARTIAL
  - PASS: Q&A retrieves chunks and returns citations mapped to documents.
  - PASS: weak context flag surfaced.
  - GAP: hard guarantee of “answer only from chunks” depends on LLM behavior, not cryptographically enforced.

### E. Tagging

- PASS

### F. Annotation / Personal layer

- PARTIAL
  - PASS: note API and document/chunk-linked note storage.
  - PASS: web UI now supports explicit annotation types (`HIGHLIGHT`, `NOTE`, `QUESTION`, `INSIGHT`) in both selection notes and quick notes.
  - GAP: searchable/linkable/graph-linkable behaviors for annotations need deeper end-to-end validation.

### G. Knowledge Graph

- G1 root node: PASS (enforced by graph build flow)
- G2 structure/no orphan: PASS/PARTIAL
  - PASS: orphan concepts are attached to root in build flow.
  - GAP: cross-module repairs for legacy orphan states rely on cleanup endpoint.
- G3 relation types: PARTIAL
  - PASS: directional relations and enums supported.
  - GAP: not all requested naming variants match exactly one-to-one.
- G4 constraints: PASS
  - hierarchy cycles blocked/downgraded.
- G5 graph API: PASS
- G6 graph UI: PASS

### H. Collections / Courses

- PASS (collections + ordering + prerequisites + derived progress present)

### I. Review & Resurfacing

- PARTIAL
  - PASS: daily review generation, feedback, scheduling fields/history.
  - GAP: difficulty tuning and stale-important weighting need deeper validation under production data.

### J. Related knowledge suggestions

- PARTIAL
  - PASS: related suggestions endpoint and UI section exist.
  - PASS: UI now provides explicit in-app navigation action (`Open document`) for related suggestions and optional `Open source` link.
  - GAP: no backend contract exists to accept arbitrary external suggestions into a new document and auto-create a document-level relation in one call.

### K. Productivity / integration adapters

- PARTIAL
  - PASS: productivity goal/mastery UI + API exist.
  - GAP: pluggable external adapters (Notion/Obsidian style abstraction) not fully formalized.

### L. Export & ownership

- PASS (full export + markdown/notion payload endpoints and UI trigger)

### M. Health & diagnostics

- PASS (missing embeddings, orphans, failed docs, queue metrics)

### N. Learning productivity

- PASS/PARTIAL
  - PASS: learning goals, progress, topic mastery, weak areas.
  - PARTIAL: advanced mastery calibration needs runtime data validation.

### O. UI features

- PARTIAL
  - PASS: ingestion, document list/detail, search, AI Q&A with citations, tagging/notes, collection, course page, review, graph, related knowledge, goals/productivity, export trigger, diagnostics.
  - GAP: citation/related-resource acceptance still depends on existing endpoints; full "accept resource -> ingest + relation" requires backend contract support.

## 2) Backend endpoint -> feature mapping

- `POST /ingest/url|text|pdf|youtube|clip`, `POST /ingest/retry/:documentId`, `GET /ingest/job/:jobId`, `GET /ingest/status/:documentId`
  - Features: A1, A3, B1, B2, B3, M.
- `GET /knowledge/documents`, `GET /knowledge/documents/:id/details`, `POST /knowledge/documents/:id`, `DELETE /knowledge/documents/:id`, `GET /knowledge/documents/:id/status`
  - Features: A2, A3, A4.
- `POST /knowledge/tags/add`, `POST /knowledge/tags/remove`
  - Features: E.
- `POST /knowledge/notes/add`, `POST /knowledge/notes/update/:id`, `GET /knowledge/documents/:id/notes`
  - Features: F.
- `GET /knowledge/documents/:id/related`
  - Features: J.
- `POST /query/search`, `POST /query/search/filtered`
  - Features: C1.
- `POST /query/ask`, `GET /query/ask/stream`, `POST /query/retrieve`
  - Features: C2, D.
- `GET /graph`, `POST /graph/build`, `POST /graph/neighborhood`, `POST /graph/relations`, `DELETE /graph/relations/:id`
  - Features: G.
- `POST|GET|PUT|DELETE /collections...`, add/remove/reorder items
  - Features: H.
- `GET /review/daily`, `POST /review/feedback`
  - Features: I.
- `POST /export/markdown`, `POST /export/notion`, `GET /export/full`, `POST /export/import`
  - Features: L (+ A1 import path).
- `GET /admin/jobs`, `POST /admin/cleanup`, `GET /admin/health/missing-embeddings`, `GET /admin/health/orphans`, `GET /admin/health/failed-documents`
  - Features: M.
- `GET /analysis/mastery`
  - Features: N2.
- `POST|GET|PUT|DELETE /learning-goals...`, add/remove items
  - Features: N1.

## 3) Backend test coverage per feature

- Coverage status: `60/60` suites passing, `155/155` tests passing.
- Controller coverage present for all controller files under `apps/api/src/modules/*/presentation/__tests__`.
- Application/domain coverage present for ingestion/query/graph/review/collections/goals/export/analysis.
- Newly added/fixed backend behavior:
  - search aggregation to documents only.
  - filtered search excluding non-READY docs.
  - graph relation validation and cycle handling.
  - export import real ingestion path.
  - ingestion worker execution pipeline implemented.

## 4) Client module -> feature mapping

- `features/ingestion`: A1
- `features/documents`: A2, A3, A4, E, F, J
- `features/search`: C, D
- `features/graph`: G
- `features/collections`: H
- `features/review`: I
- `features/productivity`: N
- `features/export`: L
- `features/health`: M

Routes wired in `apps/web/src/app`: `/documents`, `/search`, `/graph`, `/collections`, `/courses`, `/review`, `/productivity`, `/health`.

## 5) Client test coverage per feature

- Coverage status: `14/14` files passing, `48/48` tests passing.
- Includes behavior tests with MSW for:
  - documents, search, graph, collections, courses, review, productivity, health.
- Network-only mocking used (MSW handlers), no hook/API function mocking in behavior tests.

## 6) Contract mismatches

- Fixed:
  - document search now returns documents only (no chunk payload leakage).
  - no-content responses handled by shared API client and void schemas.
  - health schema includes `orphanEmbeddings`.
  - productivity deadline typing mismatch addressed in tests and schemas.
- Remaining risks:
  - some API endpoints still use broad `{ success: boolean }` style responses where richer contracts may be expected by product requirements.

## 7) Multi-store consistency risks

- Historical drift may exist (`orphanEmbeddings`) and is observable via diagnostics.
- Ingestion retries/reprocessing now clear existing chunk ids from vector store before re-chunking for that document, reducing new drift risk.
- Runtime verification of Redis/Chroma connectivity is blocked in this environment.

## 8) UI flows missing or broken

- Missing or partial:
  - richer annotation type UX (highlight/question/insight specific workflows).
  - explicit “accept suggestion -> create graph relation” UX automation for related resources.
  - some flows still navigate via `window.location.href` and need full app-router polish.

## 9) Concrete fixes required

- Completed in this pass:
  - Added ingestion worker processor and status/history transitions.
  - Fixed document rawContent persistence on updates.
  - Added courses page and graph relation create/delete UI wiring.
  - Added related resources UI in document details.
  - Added explicit annotation type UX and behavior test coverage in document detail.
  - Added API empty-body handling and aligned schemas.
- Still required:
  - full manual end-to-end verification with running Postgres + Redis + Chroma + Ollama.
  - broaden annotation UI types and related-resource acceptance workflow.
  - finalize strict transition policy for learning status if product requires hard constraints.

## Manual verification observations (2026-02-23)

- Environment used:
  - `docker compose` services running for Postgres, Redis, Chroma, Ollama.
  - API required explicit model overrides for this machine:
    - `OLLAMA_MODEL=tinyllama`
    - `OLLAMA_EMBED_MODEL=all-minilm`
- Ingestion and processing:
  - `POST /ingest/text` succeeded.
  - document transitioned to `READY` (one observed run: `READY` after 76 polling iterations).
  - chunk persisted and retrievable via `GET /knowledge/documents/:id/details`.
- Search rule validation:
  - `POST /query/search` returned top-level `documents` key.
  - response did not expose top-level `chunks` key.
- Q&A:
  - `POST /query/ask` generally returned valid JSON with `answer`, `citations`, `weakContext`.
  - one manual run produced JSON parse issues in shell tooling during ask response extraction; follow-up focused check returned valid JSON shape.
- Tagging/annotation:
  - tag add and chunk-linked note creation succeeded.
- Collections/goals/review:
  - collection creation and item add succeeded.
  - learning goal creation and collection linkage succeeded.
  - review daily endpoint returned scheduled items.
- Graph:
  - graph returned real node/edge counts (`graph_nodes=13`, `graph_edges=11` in observed run).
  - relation creation works with API contract payload (`fromId`, `toId`, `type`) and returns `{ "slug": "ok" }`.
  - earlier null `slug` observation came from an invalid manual payload shape (`fromConceptId`, `toConceptId`, `relationType`), not a backend contract bug.
- Export/deletion consistency:
  - full export endpoint returned expected top-level keys.
  - document deletion succeeded.
  - orphan embeddings remained non-zero (`orphan_embeddings=136`) indicating existing multi-store drift that predated this verification.
