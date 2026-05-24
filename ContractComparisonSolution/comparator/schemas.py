from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

DeviationType = Literal["high-risk", "medium-risk", "aligned", "missing", "modified", "extra"]
RagStatus = Literal["HIGH", "MEDIUM", "OK", "MISSING", "MODIFIED", "EXTRA"]


# --- Clause extraction types ---

class ClauseBlock(BaseModel):
    clause_ref: str
    heading: str
    text: str
    page_number: int


class DocumentClauses(BaseModel):
    doc_key: str
    clauses: list[ClauseBlock]
    extraction_method: str  # "du" | "llm-fallback"


# --- Extractor agent I/O ---

class ExtractorInput(BaseModel):
    bucket_name: str
    doc_a_key: str
    doc_b_key: str
    workspace_id: str
    comparison_id: str
    include_version_history: bool = False
    prior_version_keys: list[str] = Field(default_factory=list)


class ExtractorOutput(BaseModel):
    doc_a: DocumentClauses
    doc_b: DocumentClauses
    history: list[DocumentClauses] = Field(default_factory=list)


# --- Comparator agent I/O ---

class RawFinding(BaseModel):
    id: str
    clause_ref: str
    deviation_type: DeviationType
    snippet_a: str
    snippet_b: str = ""
    explanation: str
    guideline_citation: str = ""
    insert_after_clause: str = ""


class ComparatorInput(BaseModel):
    doc_a: DocumentClauses
    doc_b: DocumentClauses
    mode: str
    template_system_message: str
    linked_guideline_ids: list[str] = Field(default_factory=list)
    batch_size: int = 7


class ComparatorOutput(BaseModel):
    findings: list[RawFinding]
    mode: str


# --- Reviewer agent I/O ---

class ReviewerInput(BaseModel):
    workspace_id: str
    comparison_id: str
    bucket_name: str
    mode: str
    findings: list[RawFinding]
    template_system_message: str
    task_id: int = 0


class ReviewerOutput(BaseModel):
    comparison_id: str
    bucket_key: str  # path to review.json written to bucket


# --- Guideline indexer I/O ---

class IndexerInput(BaseModel):
    bucket_name: str
    guideline_key: str
    guideline_id: str
    guideline_name: str
    context_grounding_index: str


class IndexerOutput(BaseModel):
    guideline_id: str
    chunk_count: int
    status: str


# --- Plan A wire types — must match src/types/review.ts exactly ---
# Serialise with model.model_dump(by_alias=True) to produce camelCase JSON.

class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class Finding(_CamelModel):
    id: str
    clause_ref: str
    deviation_type: DeviationType
    snippet_a: str
    snippet_b: str = ""
    explanation: str
    guideline_citation: str = ""
    insert_after_clause: str = ""


class ScorecardCategory(_CamelModel):
    name: str
    status: RagStatus
    summary: str


class ReviewPayload(_CamelModel):
    comparison_id: str
    workspace_id: str
    mode: str
    scorecard: list[ScorecardCategory]
    compliance_percent: Optional[float] = None
    findings: list[Finding]
    narrative: str
    task_id: int = 0
