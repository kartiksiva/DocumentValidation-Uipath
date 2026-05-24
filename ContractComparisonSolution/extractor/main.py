import os
import shutil
import tempfile
import uuid
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from uipath.platform import UiPath
from uipath_langchain.chat.models import UiPathAzureChatOpenAI

from schemas import ClauseBlock, DocumentClauses, ExtractorInput, ExtractorOutput

_EXTRACT_PROMPT = (
    "You are a legal document parser. Extract every numbered or lettered clause "
    "from the contract. For each clause return: clause_ref (e.g. '§1.1' or "
    "'Article 3'), heading (title or empty string), text (full clause body), "
    "page_number (integer, 1-based estimate). "
    "Respond with JSON: {\"clauses\": [...]}"
)


class _ClauseListResponse(BaseModel):
    clauses: list[ClauseBlock]


class ExtractorState(ExtractorInput):
    tmpdir: str = ""
    doc_a_path: str = ""
    doc_b_path: str = ""
    history_paths: list[str] = Field(default_factory=list)
    doc_a: Optional[DocumentClauses] = None
    doc_b: Optional[DocumentClauses] = None
    history: list[DocumentClauses] = Field(default_factory=list)


def _read_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        from pypdf import PdfReader
        return "\n\n".join(p.extract_text() or "" for p in PdfReader(path).pages)
    if ext == ".docx":
        from docx import Document
        return "\n\n".join(p.text for p in Document(path).paragraphs if p.text.strip())
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


def _parse_du_to_clauses(extraction) -> list[ClauseBlock]:
    # DU extraction fields vary by project; returns [] if structure is unrecognised
    try:
        clauses = []
        for i, field in enumerate(extraction.document_fields or [], 1):
            if getattr(field, "value", None):
                clauses.append(ClauseBlock(
                    clause_ref=getattr(field, "field_id", f"§{i}"),
                    heading=getattr(field, "display_name", ""),
                    text=str(field.value),
                    page_number=(getattr(field, "page_range", None) or {}).get("start", 1),
                ))
        return clauses
    except Exception:
        return []


async def _extract_from_path(path: str, key: str) -> DocumentClauses:
    sdk = UiPath()
    # DU attempt — falls back to LLM if project not configured or low-confidence result
    try:
        extraction = await sdk.documents.extract_async(
            project_name="ContractExtraction", tag="contract", file_path=path
        )
        clauses = _parse_du_to_clauses(extraction)
        if clauses:
            return DocumentClauses(doc_key=key, clauses=clauses, extraction_method="du")
    except Exception:
        pass

    text = _read_text(path)
    llm = UiPathAzureChatOpenAI()
    structured = llm.with_structured_output(_ClauseListResponse)
    result: _ClauseListResponse = await structured.ainvoke([
        SystemMessage(_EXTRACT_PROMPT),
        HumanMessage(text[:14000]),
    ])
    return DocumentClauses(doc_key=key, clauses=result.clauses, extraction_method="llm-fallback")


async def download_docs(state: ExtractorState) -> dict:
    sdk = UiPath()
    tmpdir = tempfile.mkdtemp(prefix="extractor_")

    async def _dl(key: str, subdir: str) -> str:
        dest = os.path.join(tmpdir, subdir)
        os.makedirs(dest)
        await sdk.buckets.download_async(
            name=state.bucket_name, blob_file_path=key, destination_path=dest
        )
        return os.path.join(dest, os.path.basename(key))

    doc_a_path = await _dl(state.doc_a_key, "a")
    doc_b_path = await _dl(state.doc_b_key, "b")

    history_paths: list[str] = []
    if state.include_version_history:
        for i, key in enumerate(state.prior_version_keys):
            history_paths.append(await _dl(key, f"h{i}"))

    return {
        "tmpdir": tmpdir,
        "doc_a_path": doc_a_path,
        "doc_b_path": doc_b_path,
        "history_paths": history_paths,
    }


async def extract_clauses(state: ExtractorState) -> dict:
    doc_a = await _extract_from_path(state.doc_a_path, state.doc_a_key)
    doc_b = await _extract_from_path(state.doc_b_path, state.doc_b_key)
    history: list[DocumentClauses] = []
    for path, key in zip(state.history_paths, state.prior_version_keys):
        history.append(await _extract_from_path(path, key))
    return {"doc_a": doc_a, "doc_b": doc_b, "history": history}


async def cleanup(state: ExtractorState) -> dict:
    if state.tmpdir and os.path.exists(state.tmpdir):
        shutil.rmtree(state.tmpdir, ignore_errors=True)
    return {}


builder = StateGraph(ExtractorState, input=ExtractorInput, output=ExtractorOutput)

builder.add_node("download_docs", download_docs)
builder.add_node("extract_clauses", extract_clauses)
builder.add_node("cleanup", cleanup)

builder.add_edge(START, "download_docs")
builder.add_edge("download_docs", "extract_clauses")
builder.add_edge("extract_clauses", "cleanup")
builder.add_edge("cleanup", END)

graph = builder.compile()

