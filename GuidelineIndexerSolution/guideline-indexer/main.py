import asyncio
import os
import shutil
import tempfile
from typing import Optional

from langgraph.graph import START, StateGraph, END

from schemas import IndexerInput, IndexerOutput

CHARS_PER_CHUNK = 2048  # ~512 tokens × 4 chars/token


class IndexerState(IndexerInput):
    tmp_dir: Optional[str] = None
    local_path: Optional[str] = None
    chunk_count: int = 0
    status: str = "indexing"


async def download_doc(state: IndexerState) -> dict:
    from uipath import UiPath
    sdk = UiPath()
    await sdk.initialize_async()
    tmp = tempfile.mkdtemp()
    dest = os.path.join(tmp, os.path.basename(state.guideline_key))
    await sdk.buckets.download_async(
        name=state.bucket_name,
        blob_file_path=state.guideline_key,
        destination_path=dest,
    )
    return {"tmp_dir": tmp, "local_path": dest}


def _extract_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        from pypdf import PdfReader
        return "\n".join(p.extract_text() or "" for p in PdfReader(path).pages)
    elif ext in (".docx", ".doc"):
        from docx import Document
        return "\n".join(p.text for p in Document(path).paragraphs)
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


async def extract_text(state: IndexerState) -> dict:
    text = await asyncio.to_thread(_extract_text, state.local_path)
    return {"chunk_count": max(1, len(text) // CHARS_PER_CHUNK)}


async def upload_to_index(state: IndexerState) -> dict:
    from uipath import UiPath
    sdk = UiPath()
    await sdk.initialize_async()
    blob_path = f"guidelines/{state.guideline_id}/{os.path.basename(state.local_path)}"
    await asyncio.to_thread(
        sdk.context_grounding.add_to_index,
        name=state.context_grounding_index,
        blob_file_path=blob_path,
        source_path=state.local_path,
    )
    index = await asyncio.to_thread(
        sdk.context_grounding.retrieve,
        name=state.context_grounding_index,
    )
    await asyncio.to_thread(sdk.context_grounding.ingest_data, index=index)
    return {"status": "indexed"}


async def cleanup(state: IndexerState) -> dict:
    if state.tmp_dir and os.path.exists(state.tmp_dir):
        await asyncio.to_thread(shutil.rmtree, state.tmp_dir, ignore_errors=True)
    return {}


builder = StateGraph(IndexerState, input=IndexerInput, output=IndexerOutput)
builder.add_node("download_doc", download_doc)
builder.add_node("extract_text", extract_text)
builder.add_node("upload_to_index", upload_to_index)
builder.add_node("cleanup", cleanup)
builder.add_edge(START, "download_doc")
builder.add_edge("download_doc", "extract_text")
builder.add_edge("extract_text", "upload_to_index")
builder.add_edge("upload_to_index", "cleanup")
builder.add_edge("cleanup", END)

graph = builder.compile()
