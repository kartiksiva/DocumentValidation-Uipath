# Contract Comparison Agent — Implementation Plan (Plan B: Maestro + Agents)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the UiPath Studio backend for the Contract Comparison Agent — a `ContractComparisonProcess` Maestro workflow that orchestrates three agents (Extractor, Comparator, Reviewer) to produce a `ReviewPayload` stored to Buckets and surfaced as a Human Task in the Coded App (Plan A).

**Architecture:** Two UiPath Studio projects — `ContractComparisonAgent` (main process + 3 agents) and `GuidelineIndexer` (separate Maestro process for guideline ingestion). All agents use C# Coded Workflows for complex logic. Azure AI Search provides RAG retrieval via direct REST. Human tasks route through UiPath Persistence/Maestro.

**Tech Stack:** UiPath Studio (Windows-compatibility target), C# Coded Workflows, UiPath.Storage.Activities, UiPath.DocumentUnderstanding.Activities, UiPath.Genai.Activities, UiPath.WebAPI.Activities, UiPath.Persistence.Activities (Human Tasks), Newtonsoft.Json, Azure AI Search REST API

**Spec:** `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md`
**Plan A (Coded App):** `docs/superpowers/plans/2026-05-24-coded-app-plan.md`

---

## Critical Contract with Plan A

Plan B output MUST match Plan A's TypeScript types exactly. Any deviation breaks the Coded App.

**Process name Plan A calls:**
```typescript
await sdk.MaestroProcesses.start({
  processName: 'ContractComparisonProcess',   // ← exact string match required
  inputArguments: {
    workspaceId, bucketName, docAKey, docBKey,
    mode, templateId, includeVersionHistory, comparisonId
  }
});
```

**Bucket path Plan A downloads from:**
```
workspaces/{workspaceId}/comparisons/{comparisonId}/review.json
```

**ReviewPayload schema Plan A deserializes:**
```json
{
  "comparisonId": "string",
  "workspaceId": "string",
  "mode": "buyer-seller-diff | template-compliance",
  "scorecard": [{ "name": "string", "status": "HIGH|MEDIUM|OK|MISSING|MODIFIED|EXTRA", "summary": "string" }],
  "compliancePercent": 85,
  "findings": [{
    "id": "string",
    "clauseRef": "string",
    "deviationType": "high-risk|medium-risk|aligned|missing|modified|extra",
    "snippetA": "string",
    "snippetB": "string (optional)",
    "explanation": "string",
    "guidelineCitation": "string (optional)",
    "insertAfterClause": "string (optional — for missing clauses only)"
  }],
  "narrative": "string",
  "taskId": "string"
}
```

**Human Task data Plan A reads:**
```json
{ "comparisonId": "string", "workspaceId": "string" }
```

---

## File Map

```
ContractComparisonAgent/           ← Studio project root
  project.json
  Main.xaml                        # Maestro process entry point
  workflows/
    LoadTemplateAndGuidelines.xaml # Fetch template entity + guideline keys
    StoreResults.xaml              # Write review.json + audit.json to Buckets
    UpdateWorkspaceStatus.xaml     # Patch ContractWorkspace entity status
  coded-workflows/
    ExtractClauses.cs              # Agent 1: DU + LLM fallback clause extractor
    CompareClauses.cs              # Agent 2: batch LLM comparator + RAG
    GenerateReview.cs              # Agent 3: scorecard + narrative generator
    AzureSearchClient.cs           # Azure AI Search REST helpers
    BucketClient.cs                # Bucket download/upload helpers
    LlmClient.cs                   # GenAI prompt helpers
  data/
    ClauseJSON.schema.json         # Internal: extracted clause structure
    FindingsJSON.schema.json       # Internal: raw comparator output
    ReviewPayload.schema.json      # External: must match Plan A types exactly
  tests/
    ExtractClausesTests.xaml       # Unit test workflow for Agent 1
    CompareClausesTests.xaml       # Unit test workflow for Agent 2
    GenerateReviewTests.xaml       # Unit test workflow for Agent 3

GuidelineIndexer/                  ← Separate Studio project
  project.json
  Main.xaml                        # GuidelineIndexingProcess entry point
  coded-workflows/
    ChunkAndEmbed.cs               # DU extract → 512-token chunks → embed → index
    AzureSearchIndexer.cs          # Push chunks to Azure AI Search
```

---

## Task 1: Studio Project Setup

**Files:**
- Create: `ContractComparisonAgent/project.json`
- Create: `GuidelineIndexer/project.json`

- [ ] **Step 1: Create `ContractComparisonAgent` Studio project**

In UiPath Studio: File → New → Process → Name: `ContractComparisonAgent`, target: Windows.

After creation, `project.json` will be auto-generated. Confirm it exists:
```bash
ls ContractComparisonAgent/project.json
```

- [ ] **Step 2: Add required NuGet packages**

In Studio: Manage Packages → add each:

| Package | Version |
|---------|---------|
| `UiPath.Storage.Activities` | latest |
| `UiPath.DocumentUnderstanding.Activities` | latest |
| `UiPath.Genai.Activities` | latest |
| `UiPath.WebAPI.Activities` | latest |
| `UiPath.Persistence.Activities` | latest |
| `UiPath.Testing.Activities` | latest |
| `Newtonsoft.Json` | 13.x |

After adding, verify `project.json` `dependencies` section contains all packages.

- [ ] **Step 3: Create folder structure**

```bash
mkdir -p ContractComparisonAgent/workflows
mkdir -p ContractComparisonAgent/coded-workflows
mkdir -p ContractComparisonAgent/data
mkdir -p ContractComparisonAgent/tests
mkdir -p GuidelineIndexer/coded-workflows
```

- [ ] **Step 4: Create `GuidelineIndexer` Studio project**

In UiPath Studio: File → New → Process → Name: `GuidelineIndexer`, target: Windows. Same package additions as Step 2 (skip `UiPath.Persistence.Activities`, keep rest).

- [ ] **Step 5: Commit**

```bash
git add ContractComparisonAgent/ GuidelineIndexer/
git commit -m "feat: create Studio project scaffolds"
```

---

## Task 2: UiPath Assets + Orchestrator Configuration

**Prerequisite:** Access to UiPath Orchestrator with Admin role.

Assets required (set in Orchestrator → Tenant → Assets):

- [ ] **Step 1: Create string Assets in Orchestrator**

Navigate to: Orchestrator → Tenant → Assets → Add Asset

| Asset Name | Type | Value |
|------------|------|-------|
| `VECTOR_STORE_ENDPOINT` | Text | `https://<name>.search.windows.net` |
| `VECTOR_STORE_KEY` | Credential | (API key from Azure AI Search) |
| `VECTOR_STORE_INDEX_NAME` | Text | `contract-guidelines` |
| `LLM_MODEL` | Text | `gpt-4o` (or `claude-sonnet-20240229`) |
| `RISK_THRESHOLD_HIGH` | Text | `0.7` |
| `RISK_THRESHOLD_MEDIUM` | Text | `0.4` |
| `RAG_TOP_K` | Text | `5` |
| `COMPARATOR_BATCH_SIZE` | Text | `7` |
| `DU_HIERARCHY_CONFIDENCE_THRESHOLD` | Text | `0.75` |
| `BUCKET_NAME` | Text | `contract-ai` |

- [ ] **Step 2: Set up AI Center LLM Connection**

Orchestrator → AI Center → LLM Connections → Add:
- Provider: Azure OpenAI (or OpenAI / Anthropic)
- Model: `gpt-4o`
- Connection name: `ContractAI-LLM`
- Scope this connection to the `ContractComparisonAgent` process.

- [ ] **Step 3: Create Buckets**

Orchestrator → Storage → Buckets → Add:
- Name: `contract-ai`
- Provider: UiPath (or Azure Blob Storage if higher limits needed)

- [ ] **Step 4: Verify all Assets readable**

In Studio, create a temporary test workflow:
```xml
<!-- TestAssets.xaml -->
<GetAsset>
  <AssetName>BUCKET_NAME</AssetName>
  <Value>bucketName</Value>
</GetAsset>
<LogMessage Text="'Bucket: ' + bucketName" Level="Info"/>
```
Run it. Confirm log shows `Bucket: contract-ai`. Delete test workflow after verification.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: document assets and orchestrator configuration"
```

---

## Task 3: Azure AI Search Index Setup

**Prerequisite:** Azure subscription, Azure AI Search resource created (Standard tier recommended for vector search).

- [ ] **Step 1: Create index via Azure AI Search REST API**

Run this `curl` command (replace `<endpoint>` and `<api-key>`):

```bash
curl -X PUT \
  "https://<endpoint>.search.windows.net/indexes/contract-guidelines?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: <api-key>" \
  -d '{
    "name": "contract-guidelines",
    "fields": [
      { "name": "id", "type": "Edm.String", "key": true, "filterable": true },
      { "name": "guidelineId", "type": "Edm.String", "filterable": true },
      { "name": "guidelineName", "type": "Edm.String", "retrievable": true },
      { "name": "text", "type": "Edm.String", "retrievable": true, "searchable": true },
      { "name": "pageNumber", "type": "Edm.Int32", "retrievable": true },
      { "name": "chunkIndex", "type": "Edm.Int32", "retrievable": true },
      {
        "name": "embedding",
        "type": "Collection(Edm.Single)",
        "dimensions": 1536,
        "vectorSearchProfile": "default-vector-profile",
        "retrievable": false
      }
    ],
    "vectorSearch": {
      "profiles": [{ "name": "default-vector-profile", "algorithm": "default-hnsw" }],
      "algorithms": [{ "name": "default-hnsw", "kind": "hnsw", "parameters": { "m": 4, "efSearch": 500 } }]
    }
  }'
```

Expected response: `201 Created` with index definition JSON.

- [ ] **Step 2: Verify index exists**

```bash
curl -X GET \
  "https://<endpoint>.search.windows.net/indexes/contract-guidelines?api-version=2024-07-01" \
  -H "api-key: <api-key>"
```

Expected: 200 OK with index fields listed.

- [ ] **Step 3: Save index config as reference doc**

Create `ContractComparisonAgent/data/azure-search-index.json` with the index definition from Step 1. This documents the schema for future reference.

- [ ] **Step 4: Commit**

```bash
git add ContractComparisonAgent/data/azure-search-index.json
git commit -m "feat: Azure AI Search index schema for guideline RAG"
```

---

## Task 4: BucketClient + AzureSearchClient Helpers

**Files:**
- Create: `ContractComparisonAgent/coded-workflows/BucketClient.cs`
- Create: `ContractComparisonAgent/coded-workflows/AzureSearchClient.cs`

These helpers are called by all three agents. Write them first so agent code compiles.

- [ ] **Step 1: Create `BucketClient.cs`**

```csharp
// ContractComparisonAgent/coded-workflows/BucketClient.cs
using System;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using UiPath.CodedWorkflows;
using UiPath.Storage.Activities.Api;

namespace ContractComparisonAgent
{
    public class BucketClient : CodedWorkflow
    {
        // Downloads a file from UiPath Buckets to a local temp path. Returns temp file path.
        public string DownloadToTemp(string bucketName, string key)
        {
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + Path.GetExtension(key));
            var storageApi = GetService<IStorageActivitiesApi>();
            storageApi.DownloadStorageFile(
                bucketName: bucketName,
                key: key,
                localFilePath: tempPath
            );
            return tempPath;
        }

        // Uploads a local file to UiPath Buckets.
        public void UploadFromPath(string bucketName, string key, string localPath)
        {
            var storageApi = GetService<IStorageActivitiesApi>();
            storageApi.UploadStorageFile(
                bucketName: bucketName,
                key: key,
                localFilePath: localPath
            );
        }

        // Serializes an object to JSON and uploads it to Buckets.
        public void UploadJson(string bucketName, string key, object data)
        {
            var json = JsonConvert.SerializeObject(data, Formatting.Indented);
            var tempPath = Path.GetTempFileName();
            File.WriteAllText(tempPath, json, Encoding.UTF8);
            try { UploadFromPath(bucketName, key, tempPath); }
            finally { File.Delete(tempPath); }
        }

        // Downloads a JSON file from Buckets and deserializes it.
        public T DownloadJson<T>(string bucketName, string key)
        {
            var tempPath = DownloadToTemp(bucketName, key);
            try
            {
                var json = File.ReadAllText(tempPath, Encoding.UTF8);
                return JsonConvert.DeserializeObject<T>(json)!;
            }
            finally { File.Delete(tempPath); }
        }

        // Builds the bucket key for a comparison artifact.
        // key = workspaces/{workspaceId}/comparisons/{comparisonId}/{artifact}
        public static string ComparisonKey(string workspaceId, string comparisonId, string artifact)
            => $"workspaces/{workspaceId}/comparisons/{comparisonId}/{artifact}";
    }
}
```

- [ ] **Step 2: Create `AzureSearchClient.cs`**

```csharp
// ContractComparisonAgent/coded-workflows/AzureSearchClient.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UiPath.CodedWorkflows;

namespace ContractComparisonAgent
{
    public class GuidelineChunk
    {
        public string Id { get; set; } = "";
        public string GuidelineId { get; set; } = "";
        public string GuidelineName { get; set; } = "";
        public string Text { get; set; } = "";
        public int PageNumber { get; set; }
        public int ChunkIndex { get; set; }
    }

    public class AzureSearchClient : CodedWorkflow
    {
        private readonly string _endpoint;
        private readonly string _apiKey;
        private readonly string _indexName;
        private static readonly HttpClient _http = new HttpClient();

        public AzureSearchClient(string endpoint, string apiKey, string indexName)
        {
            _endpoint = endpoint.TrimEnd('/');
            _apiKey = apiKey;
            _indexName = indexName;
        }

        // Vector similarity search — embeds query text, retrieves top-K chunks from specified guidelines.
        public List<GuidelineChunk> Search(string queryText, List<string> guidelineIds, int topK,
            float[] queryEmbedding)
        {
            // Build vector query with guideline filter
            var guidelineFilter = string.Join(" or ", guidelineIds.Select(id => $"guidelineId eq '{id}'"));
            var body = new
            {
                count = true,
                vectorQueries = new[] {
                    new { kind = "vector", vector = queryEmbedding, exhaustive = true,
                          fields = "embedding", k = topK }
                },
                filter = guidelineFilter,
                select = "id,guidelineId,guidelineName,text,pageNumber,chunkIndex",
                top = topK
            };

            var json = JsonConvert.SerializeObject(body);
            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{_endpoint}/indexes/{_indexName}/docs/search?api-version=2024-07-01");
            request.Headers.Add("api-key", _apiKey);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = _http.SendAsync(request).Result;
            response.EnsureSuccessStatusCode();

            var result = JObject.Parse(response.Content.ReadAsStringAsync().Result);
            return result["value"]!
                .Select(t => t.ToObject<GuidelineChunk>()!)
                .ToList();
        }

        // Uploads a batch of chunks to the index (used by GuidelineIndexer).
        public void IndexChunks(List<GuidelineChunk> chunks)
        {
            var docs = chunks.Select(c => new
            {
                id = c.Id, guidelineId = c.GuidelineId,
                guidelineName = c.GuidelineName, text = c.Text,
                pageNumber = c.PageNumber, chunkIndex = c.ChunkIndex
            }).ToList();

            var body = new { value = docs.Select(d => new { _objectType = "upload" }.MergeWith(d)) };
            // Note: use merge helper below for @search.action field
            var raw = JObject.FromObject(new
            {
                value = docs.Select(d => JObject.FromObject(d).WithAction("upload")).ToList()
            });

            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{_endpoint}/indexes/{_indexName}/docs/index?api-version=2024-07-01");
            request.Headers.Add("api-key", _apiKey);
            request.Content = new StringContent(raw.ToString(), Encoding.UTF8, "application/json");
            _http.SendAsync(request).Result.EnsureSuccessStatusCode();
        }
    }

    // Extension to add @search.action field to JObject
    internal static class JObjectExtensions
    {
        public static JObject WithAction(this JObject obj, string action)
        {
            obj["@search.action"] = action;
            return obj;
        }
        public static JObject MergeWith(this object a, object b)
        {
            var ja = JObject.FromObject(a);
            ja.Merge(JObject.FromObject(b));
            return ja;
        }
    }
}
```

- [ ] **Step 3: Create `LlmClient.cs`**

```csharp
// ContractComparisonAgent/coded-workflows/LlmClient.cs
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UiPath.CodedWorkflows;

namespace ContractComparisonAgent
{
    public class LlmClient : CodedWorkflow
    {
        private readonly string _endpoint;
        private readonly string _apiKey;
        private readonly string _model;
        private static readonly HttpClient _http = new HttpClient();

        public LlmClient(string endpoint, string apiKey, string model)
        {
            _endpoint = endpoint.TrimEnd('/');
            _apiKey = apiKey;
            _model = model;
        }

        // Sends a system + user prompt to the LLM. Returns the raw string response.
        public string Complete(string systemPrompt, string userMessage, int maxTokens = 4096)
        {
            var body = new
            {
                model = _model,
                max_tokens = maxTokens,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{_endpoint}/chat/completions");
            request.Headers.Add("api-key", _apiKey);
            request.Content = new StringContent(
                JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

            var response = _http.SendAsync(request).Result;
            response.EnsureSuccessStatusCode();
            var result = JObject.Parse(response.Content.ReadAsStringAsync().Result);
            return result["choices"]![0]!["message"]!["content"]!.ToString();
        }

        // Generates a text embedding vector for a string. Returns float[].
        public float[] Embed(string text, string embeddingEndpoint, string embeddingModel = "text-embedding-3-small")
        {
            var body = new { model = embeddingModel, input = text };
            var request = new HttpRequestMessage(HttpMethod.Post, $"{embeddingEndpoint}/embeddings");
            request.Headers.Add("api-key", _apiKey);
            request.Content = new StringContent(
                JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

            var response = _http.SendAsync(request).Result;
            response.EnsureSuccessStatusCode();
            var result = JObject.Parse(response.Content.ReadAsStringAsync().Result);
            return result["data"]![0]!["embedding"]!.ToObject<float[]>()!;
        }
    }
}
```

- [ ] **Step 4: Build project in Studio — expect 0 errors**

Studio: Build → Build Project. Fix any compile errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add ContractComparisonAgent/coded-workflows/
git commit -m "feat: BucketClient, AzureSearchClient, LlmClient helpers"
```

---

## Task 5: Internal JSON Schemas

**Files:**
- Create: `ContractComparisonAgent/data/ClauseJSON.schema.json`
- Create: `ContractComparisonAgent/data/FindingsJSON.schema.json`
- Create: `ContractComparisonAgent/data/ReviewPayload.schema.json`

These schemas document the data contracts between agents and serve as validation references.

- [ ] **Step 1: Create `ClauseJSON.schema.json`** — Agent 1 output / Agent 2 input

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "title": "ClauseJSON",
  "description": "Structured clause extraction output from Agent 1",
  "type": "object",
  "required": ["docA", "docB"],
  "properties": {
    "docA": { "$ref": "#/definitions/clauseDoc" },
    "docB": { "$ref": "#/definitions/clauseDoc" },
    "history": {
      "type": "array",
      "items": { "$ref": "#/definitions/clauseDoc" },
      "description": "Prior versions — only populated if includeVersionHistory=true"
    }
  },
  "definitions": {
    "clauseDoc": {
      "type": "object",
      "required": ["documentKey", "clauses"],
      "properties": {
        "documentKey": { "type": "string" },
        "clauses": {
          "type": "array",
          "items": { "$ref": "#/definitions/clause" }
        }
      }
    },
    "clause": {
      "type": "object",
      "required": ["id", "heading", "text"],
      "properties": {
        "id": { "type": "string", "description": "e.g. '1', '2.1', '3.4.2'" },
        "heading": { "type": "string" },
        "text": { "type": "string" },
        "subClauses": {
          "type": "array",
          "items": { "$ref": "#/definitions/clause" }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create `FindingsJSON.schema.json`** — Agent 2 output / Agent 3 input

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "title": "FindingsJSON",
  "description": "Raw comparator output from Agent 2",
  "type": "object",
  "required": ["comparisonId", "mode", "findings"],
  "properties": {
    "comparisonId": { "type": "string" },
    "workspaceId": { "type": "string" },
    "mode": { "enum": ["buyer-seller-diff", "template-compliance"] },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "clauseRef", "deviationType", "snippetA", "explanation"],
        "properties": {
          "id": { "type": "string" },
          "clauseRef": { "type": "string" },
          "deviationType": {
            "enum": ["high-risk", "medium-risk", "aligned", "missing", "modified", "extra"]
          },
          "snippetA": { "type": "string", "description": "Exact text from doc A for fuzzy highlight matching" },
          "snippetB": { "type": "string", "description": "Exact text from doc B (optional)" },
          "explanation": { "type": "string" },
          "guidelineCitation": { "type": "string" },
          "insertAfterClause": { "type": "string", "description": "For missing clauses: the clause ID this gap follows" }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Create `ReviewPayload.schema.json`** — Agent 3 output stored to Buckets, deserialized by Plan A

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "title": "ReviewPayload",
  "description": "Final review output. MUST match Plan A src/types/review.ts exactly.",
  "type": "object",
  "required": ["comparisonId", "workspaceId", "mode", "scorecard", "findings", "narrative", "taskId"],
  "properties": {
    "comparisonId": { "type": "string" },
    "workspaceId": { "type": "string" },
    "mode": { "type": "string" },
    "scorecard": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "status", "summary"],
        "properties": {
          "name": { "type": "string" },
          "status": { "enum": ["HIGH", "MEDIUM", "OK", "MISSING", "MODIFIED", "EXTRA"] },
          "summary": { "type": "string" }
        }
      }
    },
    "compliancePercent": {
      "type": "number",
      "description": "Only present in template-compliance mode"
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "clauseRef", "deviationType", "snippetA", "explanation"],
        "properties": {
          "id": { "type": "string" },
          "clauseRef": { "type": "string" },
          "deviationType": {
            "enum": ["high-risk", "medium-risk", "aligned", "missing", "modified", "extra"]
          },
          "snippetA": { "type": "string" },
          "snippetB": { "type": "string" },
          "explanation": { "type": "string" },
          "guidelineCitation": { "type": "string" },
          "insertAfterClause": { "type": "string" }
        }
      }
    },
    "narrative": { "type": "string" },
    "taskId": { "type": "string" }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add ContractComparisonAgent/data/
git commit -m "feat: internal JSON schemas for agent data contracts"
```

---

## Task 6: Agent 1 — Extractor

**Files:**
- Create: `ContractComparisonAgent/coded-workflows/ExtractClauses.cs`

- [ ] **Step 1: Create `ExtractClauses.cs`**

```csharp
// ContractComparisonAgent/coded-workflows/ExtractClauses.cs
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UiPath.CodedWorkflows;
using UiPath.DocumentUnderstanding.Activities.Api;

namespace ContractComparisonAgent
{
    public class Clause
    {
        public string Id { get; set; } = "";
        public string Heading { get; set; } = "";
        public string Text { get; set; } = "";
        public List<Clause> SubClauses { get; set; } = new();
    }

    public class ClauseDoc
    {
        public string DocumentKey { get; set; } = "";
        public List<Clause> Clauses { get; set; } = new();
    }

    public class ClauseJSON
    {
        public ClauseDoc DocA { get; set; } = new();
        public ClauseDoc DocB { get; set; } = new();
        public List<ClauseDoc>? History { get; set; }
    }

    public class ExtractClauses : CodedWorkflow
    {
        // Main entry: extracts clauses from both documents. Returns ClauseJSON.
        public ClauseJSON Execute(
            string bucketName,
            string docAKey,
            string docBKey,
            string llmEndpoint,
            string llmApiKey,
            string llmModel,
            double duConfidenceThreshold,
            bool includeVersionHistory,
            string workspaceId)
        {
            var bucket = new BucketClient();
            var llm = new LlmClient(llmEndpoint, llmApiKey, llmModel);

            return new ClauseJSON
            {
                DocA = ExtractSingleDoc(bucket, llm, bucketName, docAKey, duConfidenceThreshold),
                DocB = ExtractSingleDoc(bucket, llm, bucketName, docBKey, duConfidenceThreshold),
                History = null // v1: version history not implemented
            };
        }

        private ClauseDoc ExtractSingleDoc(
            BucketClient bucket, LlmClient llm,
            string bucketName, string key, double threshold)
        {
            var localPath = bucket.DownloadToTemp(bucketName, key);
            string rawText;

            try
            {
                rawText = key.EndsWith(".docx", StringComparison.OrdinalIgnoreCase)
                    ? ExtractDocx(localPath)
                    : ExtractPdf(localPath);
            }
            finally { File.Delete(localPath); }

            var clauses = TryDuExtract(rawText, threshold);
            if (clauses == null)
            {
                // DU confidence below threshold — fall back to LLM structuring
                clauses = LlmStructure(llm, rawText);
            }

            return new ClauseDoc { DocumentKey = key, Clauses = clauses };
        }

        private string ExtractDocx(string path)
        {
            // Use DocumentUnderstanding mammoth-equivalent: read DOCX as plain text
            // In Studio, use DocumentUnderstanding's DOCX reader or read via OpenXml
            var du = GetService<IDocumentUnderstandingActivitiesApi>();
            var result = du.DigitizeDocument(path, documentType: "docx");
            return result.DocumentText ?? "";
        }

        private string ExtractPdf(string path)
        {
            var du = GetService<IDocumentUnderstandingActivitiesApi>();
            var result = du.DigitizeDocument(path, documentType: "pdf");
            return result.DocumentText ?? "";
        }

        // Attempts to extract clause hierarchy using DU. Returns null if confidence < threshold.
        private List<Clause>? TryDuExtract(string rawText, double threshold)
        {
            // Simplified: in production, use DU ML Extractor trained on clause hierarchy
            // For PoC: heuristic-based extraction on numbered headings
            var clauses = ParseByNumberedHeadings(rawText);
            var confidence = EstimateHierarchyConfidence(clauses);
            return confidence >= threshold ? clauses : null;
        }

        private double EstimateHierarchyConfidence(List<Clause> clauses)
        {
            if (clauses.Count == 0) return 0.0;
            // Confidence heuristic: ratio of clauses with numbered headings
            int numbered = 0;
            foreach (var c in clauses)
                if (System.Text.RegularExpressions.Regex.IsMatch(c.Id, @"^\d+(\.\d+)*$"))
                    numbered++;
            return (double)numbered / clauses.Count;
        }

        // Heuristic: split on lines matching numbered heading patterns (1., 2., 1.1, etc.)
        private List<Clause> ParseByNumberedHeadings(string text)
        {
            var clauses = new List<Clause>();
            var pattern = new System.Text.RegularExpressions.Regex(
                @"^(\d+(?:\.\d+)*)\s+(.+)$", System.Text.RegularExpressions.RegexOptions.Multiline);

            var matches = pattern.Matches(text);
            for (int i = 0; i < matches.Count; i++)
            {
                var m = matches[i];
                var id = m.Groups[1].Value;
                var heading = m.Groups[2].Value.Trim();
                var start = m.Index + m.Length;
                var end = i + 1 < matches.Count ? matches[i + 1].Index : text.Length;
                var body = text.Substring(start, end - start).Trim();

                var clause = new Clause { Id = id, Heading = heading, Text = body };
                // Attach sub-clauses (id has dot = sub-clause)
                if (id.Contains('.') && clauses.Count > 0)
                    clauses[^1].SubClauses.Add(clause);
                else
                    clauses.Add(clause);
            }
            return clauses;
        }

        // LLM fallback: structure raw text into clause JSON
        private List<Clause> LlmStructure(LlmClient llm, string rawText)
        {
            var systemPrompt = @"You are a legal document analyst. Extract the clause structure from the contract text below.
Output ONLY valid JSON matching this schema:
{
  ""clauses"": [
    { ""id"": ""1"", ""heading"": ""Clause heading"", ""text"": ""full clause text"",
      ""subClauses"": [{ ""id"": ""1.1"", ""heading"": ""Sub-heading"", ""text"": ""..."", ""subClauses"": [] }] }
  ]
}
Do not include any text outside the JSON block.";

            var prompt = $"Contract text:\n\n{rawText.Substring(0, Math.Min(rawText.Length, 12000))}";
            var response = llm.Complete(systemPrompt, prompt, maxTokens: 4096);

            // Parse LLM output — strip markdown fences if present
            var json = response.Trim();
            if (json.StartsWith("```")) json = json.Substring(json.IndexOf('\n') + 1);
            if (json.EndsWith("```")) json = json.Substring(0, json.LastIndexOf("```"));

            var obj = JObject.Parse(json);
            return obj["clauses"]!.ToObject<List<Clause>>() ?? new List<Clause>();
        }
    }
}
```

- [ ] **Step 2: Create `Agent1_Extractor.xaml`** — thin wrapper that calls `ExtractClauses`

In Studio, create `ContractComparisonAgent/workflows/Agent1_Extractor.xaml`:

```
[Sequence]
  Input arguments: in_WorkspaceId, in_ComparisonId, in_BucketName, in_DocAKey, in_DocBKey,
                   in_IncludeVersionHistory, in_LlmEndpoint, in_LlmApiKey, in_LlmModel,
                   in_DuThreshold (Double)

  [GetAsset] AssetName="BUCKET_NAME" → out_Bucket (just for logging)
  [InvokeCodedWorkflow] Workflow=ExtractClauses
    Input: BucketName=in_BucketName, DocAKey=in_DocAKey, DocBKey=in_DocBKey,
           LlmEndpoint=in_LlmEndpoint, LlmApiKey=in_LlmApiKey, LlmModel=in_LlmModel,
           DuConfidenceThreshold=in_DuThreshold, IncludeVersionHistory=in_IncludeVersionHistory
    Output: out_ClauseJSON (ClauseJSON type)
  [InvokeCodedWorkflow] Workflow=BucketClient.UploadJson
    Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "extracted.json")
    Data: out_ClauseJSON
  [LogMessage] Text="Agent 1 complete: " + out_ClauseJSON.DocA.Clauses.Count + " clauses in Doc A"
```

- [ ] **Step 3: Build project — expect 0 errors**

- [ ] **Step 4: Commit**

```bash
git add ContractComparisonAgent/coded-workflows/ExtractClauses.cs
git add ContractComparisonAgent/workflows/Agent1_Extractor.xaml
git commit -m "feat: Agent 1 Extractor — DU + LLM fallback clause extraction"
```

---

## Task 7: Agent 2 — Comparator (Batched LLM + RAG)

**Files:**
- Create: `ContractComparisonAgent/coded-workflows/CompareClauses.cs`
- Create: `ContractComparisonAgent/workflows/Agent2_Comparator.xaml`

- [ ] **Step 1: Create `CompareClauses.cs`**

```csharp
// ContractComparisonAgent/coded-workflows/CompareClauses.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UiPath.CodedWorkflows;

namespace ContractComparisonAgent
{
    public class Finding
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public string ClauseRef { get; set; } = "";
        public string DeviationType { get; set; } = "";   // high-risk|medium-risk|aligned|missing|modified|extra
        public string SnippetA { get; set; } = "";
        public string? SnippetB { get; set; }
        public string Explanation { get; set; } = "";
        public string? GuidelineCitation { get; set; }
        public string? InsertAfterClause { get; set; }
    }

    public class FindingsJSON
    {
        public string ComparisonId { get; set; } = "";
        public string WorkspaceId { get; set; } = "";
        public string Mode { get; set; } = "";
        public List<Finding> Findings { get; set; } = new();
    }

    public class CompareClauses : CodedWorkflow
    {
        // Main entry: compares clause pairs in batches, returns FindingsJSON.
        public FindingsJSON Execute(
            ClauseJSON clauseJson,
            string comparisonId,
            string workspaceId,
            string mode,
            string templateSystemMessage,
            List<string> linkedGuidelineIds,
            int batchSize,
            int ragTopK,
            string searchEndpoint,
            string searchApiKey,
            string searchIndexName,
            string llmEndpoint,
            string llmApiKey,
            string llmModel,
            string embeddingEndpoint)
        {
            var llm = new LlmClient(llmEndpoint, llmApiKey, llmModel);
            var search = new AzureSearchClient(searchEndpoint, searchApiKey, searchIndexName);

            var allClauses = FlattenClauses(clauseJson.DocA.Clauses);
            var bClauses = FlattenClauseMap(clauseJson.DocB.Clauses);
            var allFindings = new List<Finding>();

            // Process in batches
            var batches = allClauses
                .Select((c, i) => new { Clause = c, Index = i })
                .GroupBy(x => x.Index / batchSize)
                .Select(g => g.Select(x => x.Clause).ToList())
                .ToList();

            foreach (var batch in batches)
            {
                // Retrieve guideline context for the batch collectively
                var batchText = string.Join(" ", batch.Select(c => $"{c.Heading}: {c.Text.Substring(0, Math.Min(c.Text.Length, 200))}"));
                List<GuidelineChunk> chunks = new();
                if (linkedGuidelineIds.Count > 0)
                {
                    var embedding = llm.Embed(batchText, embeddingEndpoint);
                    chunks = search.Search(batchText, linkedGuidelineIds, ragTopK, embedding);
                }

                // Build guideline context string
                var guidelineContext = chunks.Count > 0
                    ? string.Join("\n\n", chunks.Select(c => $"[{c.GuidelineName} p.{c.PageNumber}]: {c.Text}"))
                    : "No guideline context available.";

                // Find counterpart clauses in DocB
                var bBatch = batch.Select(c => bClauses.GetValueOrDefault(c.Id) ?? new Clause { Id = c.Id, Heading = "(not present)", Text = "" }).ToList();

                // LLM comparison call
                var batchFindings = CompareBatch(llm, templateSystemMessage, guidelineContext, batch, bBatch, mode);
                allFindings.AddRange(batchFindings);
            }

            // Also find clauses in DocB not present in DocA (extra clauses)
            var aIds = new HashSet<string>(allClauses.Select(c => c.Id));
            var extraClauses = FlattenClauses(clauseJson.DocB.Clauses).Where(c => !aIds.Contains(c.Id)).ToList();
            foreach (var extra in extraClauses)
            {
                allFindings.Add(new Finding
                {
                    ClauseRef = extra.Id,
                    DeviationType = "extra",
                    SnippetA = "",
                    SnippetB = extra.Text.Substring(0, Math.Min(extra.Text.Length, 300)),
                    Explanation = $"Clause {extra.Id} '{extra.Heading}' exists in Document B but not in Document A."
                });
            }

            return new FindingsJSON
            {
                ComparisonId = comparisonId,
                WorkspaceId = workspaceId,
                Mode = mode,
                Findings = allFindings
            };
        }

        private List<Finding> CompareBatch(
            LlmClient llm, string systemMessage, string guidelineContext,
            List<Clause> batchA, List<Clause> batchB, string mode)
        {
            var systemPrompt = $@"{systemMessage}

You are a contract comparison specialist. For each clause pair below, output a JSON array of findings.
Each finding must match this schema exactly:
{{
  ""id"": ""<unique 8-char string>"",
  ""clauseRef"": ""<clause id>"",
  ""deviationType"": ""high-risk"" | ""medium-risk"" | ""aligned"" | ""missing"" | ""modified"" | ""extra"",
  ""snippetA"": ""<exact verbatim text from Document A relevant to this finding — must be findable by fuzzy search>"",
  ""snippetB"": ""<exact verbatim text from Document B if applicable>"",
  ""explanation"": ""<plain English explanation of the deviation and its commercial/legal impact>"",
  ""guidelineCitation"": ""<guideline reference if applicable, e.g. 'GAFTA 100 clause 22'>"",
  ""insertAfterClause"": ""<for missing clauses only: the clause ID this gap should follow>""
}}

Guideline context:
{guidelineContext}

Output ONLY a valid JSON array. No other text.";

            var aJson = JsonConvert.SerializeObject(batchA.Select(c => new { c.Id, c.Heading, c.Text }));
            var bJson = JsonConvert.SerializeObject(batchB.Select(c => new { c.Id, c.Heading, c.Text }));
            var userMsg = $"Document A clauses:\n{aJson}\n\nDocument B clauses:\n{bJson}";

            var response = llm.Complete(systemPrompt, userMsg, maxTokens: 4096);

            // Strip markdown fences
            var json = response.Trim();
            if (json.StartsWith("```")) json = json.Substring(json.IndexOf('\n') + 1);
            if (json.EndsWith("```")) json = json.Substring(0, json.LastIndexOf("```"));

            try
            {
                return JArray.Parse(json).ToObject<List<Finding>>() ?? new List<Finding>();
            }
            catch (Exception ex)
            {
                // Log parse error, return empty batch rather than crash
                Console.WriteLine($"[Agent2] Batch parse error: {ex.Message}. Raw: {json.Substring(0, Math.Min(json.Length, 200))}");
                return new List<Finding>();
            }
        }

        private List<Clause> FlattenClauses(List<Clause> clauses)
        {
            var result = new List<Clause>();
            foreach (var c in clauses)
            {
                result.Add(c);
                result.AddRange(FlattenClauses(c.SubClauses));
            }
            return result;
        }

        private Dictionary<string, Clause> FlattenClauseMap(List<Clause> clauses)
            => FlattenClauses(clauses).ToDictionary(c => c.Id, c => c);
    }
}
```

- [ ] **Step 2: Create `Agent2_Comparator.xaml`** — wrapper workflow

In Studio, create `ContractComparisonAgent/workflows/Agent2_Comparator.xaml`:

```
[Sequence]
  Input arguments: in_WorkspaceId, in_ComparisonId, in_BucketName, in_Mode, in_TemplateSystemMessage,
                   in_LinkedGuidelineIds (List<String>), in_BatchSize (Int32, default=7),
                   in_RagTopK (Int32, default=5), in_SearchEndpoint, in_SearchApiKey, in_SearchIndexName,
                   in_LlmEndpoint, in_LlmApiKey, in_LlmModel, in_EmbeddingEndpoint

  [InvokeCodedWorkflow] Workflow=BucketClient.DownloadJson<ClauseJSON>
    Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "extracted.json")
    Output: clauseJson

  [InvokeCodedWorkflow] Workflow=CompareClauses.Execute
    Input: all in_* arguments + clauseJson
    Output: findingsJson

  [InvokeCodedWorkflow] Workflow=BucketClient.UploadJson
    Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "findings.json")
    Data: findingsJson

  [LogMessage] Text="Agent 2 complete: " + findingsJson.Findings.Count + " findings"
```

- [ ] **Step 3: Build project — expect 0 errors**

- [ ] **Step 4: Commit**

```bash
git add ContractComparisonAgent/coded-workflows/CompareClauses.cs
git add ContractComparisonAgent/workflows/Agent2_Comparator.xaml
git commit -m "feat: Agent 2 Comparator — batched LLM + Azure AI Search RAG"
```

---

## Task 8: Agent 3 — Reviewer

**Files:**
- Create: `ContractComparisonAgent/coded-workflows/GenerateReview.cs`
- Create: `ContractComparisonAgent/workflows/Agent3_Reviewer.xaml`

- [ ] **Step 1: Create `GenerateReview.cs`**

```csharp
// ContractComparisonAgent/coded-workflows/GenerateReview.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UiPath.CodedWorkflows;

namespace ContractComparisonAgent
{
    public class ScorecardCategory
    {
        public string Name { get; set; } = "";
        public string Status { get; set; } = "";   // HIGH|MEDIUM|OK|MISSING|MODIFIED|EXTRA
        public string Summary { get; set; } = "";
    }

    public class ReviewPayload
    {
        public string ComparisonId { get; set; } = "";
        public string WorkspaceId { get; set; } = "";
        public string Mode { get; set; } = "";
        public List<ScorecardCategory> Scorecard { get; set; } = new();
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public int? CompliancePercent { get; set; }
        public List<Finding> Findings { get; set; } = new();
        public string Narrative { get; set; } = "";
        public string TaskId { get; set; } = "";  // Set by Main.xaml after human task creation
    }

    public class GenerateReview : CodedWorkflow
    {
        private static readonly string[] Categories =
            { "Liability", "Intellectual Property", "Payment", "Termination", "Confidentiality" };

        // Main entry: generates scorecard, compliance %, and narrative from findings.
        public ReviewPayload Execute(
            FindingsJSON findingsJson,
            string templateSystemMessage,
            string llmEndpoint,
            string llmApiKey,
            string llmModel,
            double riskThresholdHigh,
            double riskThresholdMedium)
        {
            var llm = new LlmClient(llmEndpoint, llmApiKey, llmModel);

            var (scorecard, compliancePercent) = GenerateScorecard(llm, findingsJson, templateSystemMessage,
                riskThresholdHigh, riskThresholdMedium);
            var narrative = GenerateNarrative(llm, findingsJson, templateSystemMessage);

            var payload = new ReviewPayload
            {
                ComparisonId = findingsJson.ComparisonId,
                WorkspaceId = findingsJson.WorkspaceId,
                Mode = findingsJson.Mode,
                Scorecard = scorecard,
                Findings = findingsJson.Findings,
                Narrative = narrative,
                TaskId = ""  // Populated in Main.xaml after CreateHumanTask
            };

            if (findingsJson.Mode == "template-compliance")
                payload.CompliancePercent = compliancePercent;

            return payload;
        }

        private (List<ScorecardCategory>, int) GenerateScorecard(
            LlmClient llm, FindingsJSON findingsJson, string systemMessage,
            double thresholdHigh, double thresholdMedium)
        {
            var systemPrompt = $@"{systemMessage}

You are reviewing contract findings. Produce a risk scorecard with exactly these 5 categories:
Liability, Intellectual Property, Payment, Termination, Confidentiality.

For each category output:
- status: ""HIGH"" (critical risk), ""MEDIUM"" (review needed), ""OK"" (acceptable)
  For template-compliance mode also use: ""MISSING"" (required clause absent), ""MODIFIED"" (clause changed), ""EXTRA"" (unexpected clause)
- summary: 1 sentence plain English for business user

Also output compliancePercent (0-100) for template-compliance mode only.

Output ONLY valid JSON:
{{
  ""scorecard"": [{{ ""name"": ""Liability"", ""status"": ""HIGH"", ""summary"": ""..."" }}, ...],
  ""compliancePercent"": 85
}}";

            var findingsCompact = JsonConvert.SerializeObject(findingsJson.Findings.Select(f =>
                new { f.ClauseRef, f.DeviationType, f.Explanation }));
            var response = llm.Complete(systemPrompt, $"Findings:\n{findingsCompact}", maxTokens: 2048);

            var json = CleanJson(response);
            var obj = JObject.Parse(json);
            var scorecard = obj["scorecard"]!.ToObject<List<ScorecardCategory>>() ?? new List<ScorecardCategory>();
            var pct = obj["compliancePercent"]?.Value<int>() ?? CalculateFallbackCompliance(findingsJson.Findings);

            return (scorecard, pct);
        }

        private string GenerateNarrative(LlmClient llm, FindingsJSON findingsJson, string systemMessage)
        {
            var systemPrompt = $@"{systemMessage}

Write a clear, concise narrative summary of the contract comparison for a business user.
3-5 paragraphs. No bullet points. Plain English. Focus on commercial impact, not legal jargon.
Highlight the 2-3 highest-risk issues first, then give an overall assessment.";

            var findingsCompact = JsonConvert.SerializeObject(findingsJson.Findings
                .Where(f => f.DeviationType is "high-risk" or "medium-risk" or "missing")
                .Take(15)
                .Select(f => new { f.ClauseRef, f.DeviationType, f.Explanation }));

            return llm.Complete(systemPrompt, $"Mode: {findingsJson.Mode}\n\nFindings:\n{findingsCompact}",
                maxTokens: 1500);
        }

        private int CalculateFallbackCompliance(List<Finding> findings)
        {
            if (findings.Count == 0) return 100;
            var aligned = findings.Count(f => f.DeviationType == "aligned");
            return (int)Math.Round((double)aligned / findings.Count * 100);
        }

        private string CleanJson(string raw)
        {
            var s = raw.Trim();
            if (s.StartsWith("```")) s = s.Substring(s.IndexOf('\n') + 1);
            if (s.EndsWith("```")) s = s.Substring(0, s.LastIndexOf("```"));
            return s.Trim();
        }
    }
}
```

- [ ] **Step 2: Create `Agent3_Reviewer.xaml`** — wrapper workflow

In Studio, create `ContractComparisonAgent/workflows/Agent3_Reviewer.xaml`:

```
[Sequence]
  Input arguments: in_WorkspaceId, in_ComparisonId, in_BucketName, in_TemplateSystemMessage,
                   in_LlmEndpoint, in_LlmApiKey, in_LlmModel,
                   in_RiskThresholdHigh (Double, default=0.7), in_RiskThresholdMedium (Double, default=0.4)
  Output arguments: out_ReviewPayload (ReviewPayload)

  [InvokeCodedWorkflow] Workflow=BucketClient.DownloadJson<FindingsJSON>
    Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "findings.json")
    Output: findingsJson

  [InvokeCodedWorkflow] Workflow=GenerateReview.Execute
    Input: findingsJson, all in_* arguments
    Output: out_ReviewPayload

  [LogMessage] Text="Agent 3 complete. Scorecard categories: " + out_ReviewPayload.Scorecard.Count
```

- [ ] **Step 3: Build project — expect 0 errors**

- [ ] **Step 4: Commit**

```bash
git add ContractComparisonAgent/coded-workflows/GenerateReview.cs
git add ContractComparisonAgent/workflows/Agent3_Reviewer.xaml
git commit -m "feat: Agent 3 Reviewer — scorecard, compliance %, narrative"
```

---

## Task 9: Main Orchestration — ContractComparisonProcess

**Files:**
- Create: `ContractComparisonAgent/Main.xaml`
- Create: `ContractComparisonAgent/workflows/LoadTemplateAndGuidelines.xaml`
- Create: `ContractComparisonAgent/workflows/StoreResults.xaml`
- Create: `ContractComparisonAgent/workflows/UpdateWorkspaceStatus.xaml`

This is the Maestro process that the Coded App triggers. Process name **must** be `ContractComparisonProcess`.

- [ ] **Step 1: Create `LoadTemplateAndGuidelines.xaml`**

In Studio, create `ContractComparisonAgent/workflows/LoadTemplateAndGuidelines.xaml`:

```
[Sequence]
  Input: in_TemplateId (String)
  Output: out_SystemMessage (String), out_LinkedGuidelineIds (List<String>)

  [GetEntityRecord] EntityName="Template" Filter="id eq '" + in_TemplateId + "'"
    Output: templateRecord

  [Assign] out_SystemMessage = templateRecord("systemMessage").ToString()
  [Assign] out_LinkedGuidelineIds = templateRecord("linkedGuidelineIds").ToObject<List<String>>()
  [LogMessage] Text="Loaded template: " + templateRecord("name") + ", guidelines: " + out_LinkedGuidelineIds.Count
```

- [ ] **Step 2: Create `UpdateWorkspaceStatus.xaml`**

In Studio, create `ContractComparisonAgent/workflows/UpdateWorkspaceStatus.xaml`:

Updates the `WorkspaceComparison` status field in the `ContractWorkspace` entity.

```
[Sequence]
  Input: in_WorkspaceId, in_ComparisonId, in_Status (String),
         in_ConfirmedBy (String, optional), in_RejectionNote (String, optional)

  [GetEntityRecord] EntityName="ContractWorkspace" Filter="id eq '" + in_WorkspaceId + "'"
    Output: wsRecord

  [Assign] comparisons = wsRecord("comparisons").ToObject<JArray>()
  [ForEach] item in comparisons:
    [If] item("comparisonId").ToString() = in_ComparisonId:
      [Assign] item("status") = in_Status
      [If] in_ConfirmedBy ≠ "": item("confirmedBy") = in_ConfirmedBy; item("confirmedAt") = DateTime.UtcNow.ToString("o")
      [If] in_RejectionNote ≠ "": item("rejectionNote") = in_RejectionNote

  [UpdateEntityRecord] EntityName="ContractWorkspace" Id=in_WorkspaceId
    Fields: comparisons = comparisons
```

- [ ] **Step 3: Create `StoreResults.xaml`**

```
[Sequence]
  Input: in_WorkspaceId, in_ComparisonId, in_BucketName, in_ReviewPayload (ReviewPayload)

  [InvokeCodedWorkflow] Workflow=BucketClient.UploadJson
    Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "review.json")
    Data: in_ReviewPayload
  [LogMessage] Text="review.json stored to Buckets"

  [Assign] auditRecord = new { comparisonId=in_ComparisonId, storedAt=DateTime.UtcNow.ToString("o"),
                                findingsCount=in_ReviewPayload.Findings.Count }
  [InvokeCodedWorkflow] Workflow=BucketClient.UploadJson
    Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "audit.json")
    Data: auditRecord
```

- [ ] **Step 4: Create `Main.xaml`** — the full orchestration

In Studio, create `ContractComparisonAgent/Main.xaml`. This is the Maestro process entry point.

**Process name in Orchestrator must be:** `ContractComparisonProcess`

```
[Sequence — ContractComparisonProcess]

  Input Arguments (must match Plan A StartComparisonInput):
    in_WorkspaceId   (String)
    in_BucketName    (String)
    in_DocAKey       (String)
    in_DocBKey       (String)
    in_Mode          (String)   "buyer-seller-diff" | "template-compliance"
    in_TemplateId    (String)
    in_IncludeVersionHistory (Boolean)
    in_ComparisonId  (String)

  [TryCatch]
    [Try]
      // --- 0. Update status to 'running' ---
      [InvokeWorkflow] UpdateWorkspaceStatus.xaml
        in_WorkspaceId=in_WorkspaceId, in_ComparisonId=in_ComparisonId, in_Status="running"

      // --- 1. Load Assets ---
      [GetAsset] "LLM_ENDPOINT"      → llmEndpoint
      [GetAsset] "LLM_API_KEY"       → llmApiKey
      [GetAsset] "LLM_MODEL"         → llmModel
      [GetAsset] "VECTOR_STORE_ENDPOINT" → searchEndpoint
      [GetAsset] "VECTOR_STORE_KEY"  → searchApiKey
      [GetAsset] "VECTOR_STORE_INDEX_NAME" → searchIndex
      [GetAsset] "COMPARATOR_BATCH_SIZE" → batchSizeStr
      [GetAsset] "RAG_TOP_K"         → ragTopKStr
      [GetAsset] "DU_HIERARCHY_CONFIDENCE_THRESHOLD" → duThresholdStr
      [GetAsset] "RISK_THRESHOLD_HIGH"   → riskHighStr
      [GetAsset] "RISK_THRESHOLD_MEDIUM" → riskMedStr
      [Assign]   batchSize = Int32.Parse(batchSizeStr)
      [Assign]   ragTopK   = Int32.Parse(ragTopKStr)
      [Assign]   duThreshold = Double.Parse(duThresholdStr)

      // --- 2. Load Template + Guideline config ---
      [InvokeWorkflow] LoadTemplateAndGuidelines.xaml
        in_TemplateId=in_TemplateId
        out_SystemMessage → templateSystemMessage
        out_LinkedGuidelineIds → linkedGuidelineIds

      // --- 3. Agent 1 — Extract clauses ---
      [LogMessage] "Starting Agent 1: Extractor"
      [InvokeWorkflow] Agent1_Extractor.xaml
        (pass all relevant inputs)

      // --- 4. Agent 2 — Compare clauses ---
      [LogMessage] "Starting Agent 2: Comparator"
      [InvokeWorkflow] Agent2_Comparator.xaml
        (pass all relevant inputs)

      // --- 5. Agent 3 — Generate review ---
      [LogMessage] "Starting Agent 3: Reviewer"
      [InvokeWorkflow] Agent3_Reviewer.xaml
        in_WorkspaceId=in_WorkspaceId, in_ComparisonId=in_ComparisonId,
        in_BucketName=in_BucketName, in_TemplateSystemMessage=templateSystemMessage,
        in_LlmEndpoint=llmEndpoint, in_LlmApiKey=llmApiKey, in_LlmModel=llmModel,
        in_RiskThresholdHigh=Double.Parse(riskHighStr), in_RiskThresholdMedium=Double.Parse(riskMedStr)
        Output: reviewPayload

      // --- 6. Create Human Task ---
      [LogMessage] "Creating Human Task"
      [CreateHumanTask]
        TaskCatalogName: "ContractReviewTask"
        Data: { "comparisonId": in_ComparisonId, "workspaceId": in_WorkspaceId }
        Output: taskId (String)

      // Update reviewPayload.TaskId with actual task ID
      [Assign] reviewPayload.TaskId = taskId

      // --- 7. Store review.json to Buckets (with taskId populated) ---
      [InvokeWorkflow] StoreResults.xaml
        in_WorkspaceId=in_WorkspaceId, in_ComparisonId=in_ComparisonId,
        in_BucketName=in_BucketName, in_ReviewPayload=reviewPayload

      // --- 8. Update workspace status → 'awaiting-review' ---
      [InvokeWorkflow] UpdateWorkspaceStatus.xaml
        in_WorkspaceId=in_WorkspaceId, in_ComparisonId=in_ComparisonId,
        in_Status="awaiting-review"

      // --- 9. Wait for Human Task ---
      [WaitForHumanTask] TaskId=taskId
        Output: taskResult (action="Confirm"|"Reject", data={note})

      // --- 10. Finalize based on human decision ---
      [Switch on taskResult.Action]
        "Confirm":
          [InvokeWorkflow] UpdateWorkspaceStatus.xaml
            in_Status="confirmed", in_ConfirmedBy=taskResult.Data("assignedUser")
        "Reject":
          [InvokeWorkflow] UpdateWorkspaceStatus.xaml
            in_Status="rejected", in_RejectionNote=taskResult.Data("note")

      // --- 11. Append decision to audit.json ---
      [InvokeCodedWorkflow] BucketClient.DownloadJson<JObject>
        Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "audit.json")
        Output: auditRecord
      [Assign] auditRecord("decision") = taskResult.Action
      [Assign] auditRecord("decidedAt") = DateTime.UtcNow.ToString("o")
      [InvokeCodedWorkflow] BucketClient.UploadJson
        Key: BucketClient.ComparisonKey(in_WorkspaceId, in_ComparisonId, "audit.json")
        Data: auditRecord

      [LogMessage] "ContractComparisonProcess complete: " + taskResult.Action

    [Catch Exception as ex]
      [LogMessage] "Process failed: " + ex.Message Level=Error
      [InvokeWorkflow] UpdateWorkspaceStatus.xaml
        in_Status="rejected", in_RejectionNote="Process error: " + ex.Message
      [Rethrow]
```

- [ ] **Step 5: Register process in Orchestrator**

Publish project from Studio → Orchestrator → Processes → Add:
- Name (must match exactly): `ContractComparisonProcess`
- Package: `ContractComparisonAgent`
- Robot: unattended robot with access to all configured Assets

- [ ] **Step 6: Create Human Task Catalog in Orchestrator**

Orchestrator → Action Center → Task Catalogs → Add:
- Name: `ContractReviewTask`
- Form: Simple data pass-through (no custom form needed — Coded App renders the review)
- Data schema: `{ comparisonId: string, workspaceId: string }`

- [ ] **Step 7: Build + publish from Studio**

```
Studio: Build → Publish
Target: Orchestrator
Confirm: version appears in Orchestrator → Packages → ContractComparisonAgent
```

- [ ] **Step 8: Commit**

```bash
git add ContractComparisonAgent/workflows/
git add ContractComparisonAgent/Main.xaml
git commit -m "feat: ContractComparisonProcess main orchestration workflow"
```

---

## Task 10: Guideline Indexer Process

**Files:**
- Create: `GuidelineIndexer/coded-workflows/ChunkAndEmbed.cs`
- Create: `GuidelineIndexer/Main.xaml`

Triggered by the Coded App's admin UI when a new guideline is uploaded. Updates the `Guideline` entity status from `indexing` → `indexed`.

- [ ] **Step 1: Create `ChunkAndEmbed.cs`**

```csharp
// GuidelineIndexer/coded-workflows/ChunkAndEmbed.cs
using System;
using System.Collections.Generic;
using System.Linq;
using UiPath.CodedWorkflows;

namespace GuidelineIndexer
{
    public class ChunkAndEmbed : CodedWorkflow
    {
        // Splits text into overlapping 512-token chunks and generates embeddings.
        // Returns list of GuidelineChunk ready for indexing.
        public List<ContractComparisonAgent.GuidelineChunk> Execute(
            string text, string guidelineId, string guidelineName,
            string embeddingEndpoint, string apiKey, string embeddingModel = "text-embedding-3-small")
        {
            var llm = new ContractComparisonAgent.LlmClient(embeddingEndpoint, apiKey, embeddingModel);
            var chunks = SplitIntoChunks(text, maxTokens: 512, overlapPercent: 0.10);
            var result = new List<ContractComparisonAgent.GuidelineChunk>();

            for (int i = 0; i < chunks.Count; i++)
            {
                var chunk = chunks[i];
                var embedding = llm.Embed(chunk.Text, embeddingEndpoint, embeddingModel);
                result.Add(new ContractComparisonAgent.GuidelineChunk
                {
                    Id = $"{guidelineId}-chunk-{i:D4}",
                    GuidelineId = guidelineId,
                    GuidelineName = guidelineName,
                    Text = chunk.Text,
                    PageNumber = chunk.EstimatedPage,
                    ChunkIndex = i
                });
                // Note: embedding is stored separately; Azure Search indexer call includes it
            }
            return result;
        }

        private record TextChunk(string Text, int EstimatedPage);

        // Splits by estimated token count (1 token ≈ 4 chars). Overlaps last 10% of each chunk.
        private List<TextChunk> SplitIntoChunks(string text, int maxTokens, double overlapPercent)
        {
            int charsPerToken = 4;
            int maxChars = maxTokens * charsPerToken;
            int overlapChars = (int)(maxChars * overlapPercent);

            var chunks = new List<TextChunk>();
            int pos = 0;
            int pageEstimate = 1;

            while (pos < text.Length)
            {
                int end = Math.Min(pos + maxChars, text.Length);
                // Try to break at sentence boundary
                if (end < text.Length)
                {
                    int breakAt = text.LastIndexOf('.', end, Math.Min(50, end - pos));
                    if (breakAt > pos) end = breakAt + 1;
                }
                var chunkText = text.Substring(pos, end - pos).Trim();
                if (chunkText.Length > 0)
                    chunks.Add(new TextChunk(chunkText, pageEstimate));

                pageEstimate += Math.Max(1, chunkText.Split('\n').Length / 40); // ~40 lines/page
                pos = end - overlapChars;
                if (pos <= 0) break;
            }
            return chunks;
        }
    }
}
```

- [ ] **Step 2: Create `GuidelineIndexer/Main.xaml`**

Process name in Orchestrator: `GuidelineIndexingProcess`

```
[Sequence — GuidelineIndexingProcess]

  Input Arguments:
    in_GuidelineId   (String)
    in_GuidelineName (String)
    in_BucketKey     (String)   "guidelines/{guidelineId}/source.pdf"
    in_BucketName    (String)

  [TryCatch]
    [Try]
      // --- Load Assets ---
      [GetAsset] "LLM_ENDPOINT"          → llmEndpoint
      [GetAsset] "LLM_API_KEY"           → apiKey
      [GetAsset] "VECTOR_STORE_ENDPOINT" → searchEndpoint
      [GetAsset] "VECTOR_STORE_KEY"      → searchApiKey
      [GetAsset] "VECTOR_STORE_INDEX_NAME" → searchIndex

      // --- Download guideline file ---
      [InvokeCodedWorkflow] BucketClient.DownloadToTemp
        BucketName=in_BucketName, Key=in_BucketKey
        Output: localPath

      // --- Extract text via DU ---
      [DocumentUnderstanding: DigitizeDocument]
        FilePath=localPath
        Output: rawText

      // --- Chunk + embed + index ---
      [InvokeCodedWorkflow] ChunkAndEmbed.Execute
        Text=rawText, GuidelineId=in_GuidelineId, GuidelineName=in_GuidelineName,
        EmbeddingEndpoint=llmEndpoint, ApiKey=apiKey
        Output: chunks

      [InvokeCodedWorkflow] AzureSearchClient.IndexChunks
        Endpoint=searchEndpoint, ApiKey=searchApiKey, IndexName=searchIndex
        Chunks=chunks

      // --- Update Guideline entity status → 'indexed' ---
      [UpdateEntityRecord] EntityName="Guideline" Id=in_GuidelineId
        Fields: indexingStatus="indexed", chunkCount=chunks.Count

      [LogMessage] "Guideline indexed: " + in_GuidelineName + " — " + chunks.Count + " chunks"

    [Catch Exception as ex]
      [LogMessage] "Indexing failed: " + ex.Message Level=Error
      [UpdateEntityRecord] EntityName="Guideline" Id=in_GuidelineId
        Fields: indexingStatus="error"
      [Rethrow]
```

- [ ] **Step 3: Publish GuidelineIndexer to Orchestrator**

Process name: `GuidelineIndexingProcess`

- [ ] **Step 4: Commit**

```bash
git add GuidelineIndexer/
git commit -m "feat: GuidelineIndexingProcess — DU extract, chunk, embed, index to Azure AI Search"
```

---

## Task 11: End-to-End Verification

- [ ] **Step 1: Smoke test — Agent 1 in isolation**

Create a test workflow `ContractComparisonAgent/tests/ExtractClausesTests.xaml`:
- Use a sample 5-page contract PDF stored in Buckets
- Invoke Agent1_Extractor.xaml with a known docAKey
- Assert: `extracted.json` appears in Buckets at correct path
- Assert: clauses count > 0
- Run: Studio → Debug → Run File

- [ ] **Step 2: Smoke test — Agent 2 in isolation**

Prerequisite: Step 1 produced `extracted.json`. Create `CompareClausesTests.xaml`:
- Use the `extracted.json` from Step 1 (ensure DocA ≠ DocB by uploading two different contracts)
- Invoke Agent2_Comparator.xaml
- Assert: `findings.json` appears in Buckets
- Assert: at least one finding has a non-empty `snippetA`
- Assert: all `deviationType` values are one of the 6 valid enum strings

- [ ] **Step 3: Smoke test — Agent 3 in isolation**

Create `GenerateReviewTests.xaml`:
- Use `findings.json` from Step 2
- Invoke Agent3_Reviewer.xaml
- Assert: `review.json` stored to Buckets at `workspaces/{id}/comparisons/{id}/review.json`
- Assert: `taskId` field is empty string (will be set by Main.xaml)
- Assert: `scorecard` has exactly 5 categories
- Assert: all scorecard `status` values are valid enum strings (`HIGH`/`MEDIUM`/`OK`/`MISSING`/`MODIFIED`/`EXTRA`)
- Assert: `narrative` length > 100 chars

- [ ] **Step 4: Full end-to-end test — trigger from Plan A Coded App**

Prerequisite: Plan A Coded App running (`npm run dev`).

1. Open Coded App at `http://localhost:5173`
2. Upload two contract versions to a test workspace
3. Run a "Buyer / Seller Diff" comparison — confirm `running` status in Comparison History
4. Wait ~3 minutes — confirm status changes to `awaiting-review`
5. Open Review Workspace — confirm:
   - Both documents render in side-by-side panels
   - Findings appear in sidebar
   - At least one finding has a highlighted snippet visible in document text
   - Scorecard shows RAG statuses
6. Click "Confirm Review ✓" — confirm status changes to `confirmed`
7. Check Buckets `audit.json` for `decision: "Confirm"` and `decidedAt` timestamp

- [ ] **Step 5: Template compliance test**

1. Upload a GAFTA-style contract + GAFTA 100 template
2. Run a "Template Compliance" comparison
3. Confirm `compliancePercent` appears in sidebar
4. Confirm at least one finding has `deviationType: "missing"` with `insertAfterClause` populated
5. Confirm Plan A renders a dashed placeholder gap for missing clause

- [ ] **Step 6: Final commit**

```bash
git add ContractComparisonAgent/tests/
git commit -m "feat: ContractComparisonAgent + GuidelineIndexer — end-to-end complete"
```

---

## Verification Checklist (from spec §12)

- [ ] Guideline indexing: upload PDF → `indexingStatus` transitions `indexing → indexed`, chunk count > 0
- [ ] RAG grounding: `finding.guidelineCitation` contains guideline name when guidelines linked to template
- [ ] Buyer/Seller diff: scorecard shows correct RAG, `snippetA` matches text visible in rendered doc
- [ ] Template compliance: missing clause → `insertAfterClause` populated, `compliancePercent` in payload
- [ ] Human task flow: task created → Plan A badge shows pending → Confirm → `review.json` has `taskId`, `audit.json` has `decision`
- [ ] UI swap: trigger `ContractComparisonProcess` via raw Orchestrator API (bypassing Coded App) → produces valid `review.json`
- [ ] Error path: corrupt document → process catches error, sets status `rejected`, message in `rejectionNote`
