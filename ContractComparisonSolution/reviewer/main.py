import json
import os
import tempfile
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from uipath.platform import UiPath
from uipath_langchain.chat.models import UiPathAzureChatOpenAI

from schemas import (
    Finding,
    RawFinding,
    ReviewerInput,
    ReviewerOutput,
    ReviewPayload,
    ScorecardCategory,
)

_SCORECARD_CATEGORIES = ["Liability", "Intellectual Property", "Payment", "Termination", "Confidentiality"]

_SCORECARD_SYS = """\
You are a legal risk analyst. Given a list of contract findings, score these categories:
{categories}

For each category, assign a status:
- HIGH: significant risk deviation found
- MEDIUM: moderate deviation found
- OK: no material deviations found
- MISSING: clause entirely absent
- MODIFIED: clause present but meaningfully changed
- EXTRA: unexpected clause not in reference document

Respond with JSON: {{"scorecard": [{{"name": "...", "status": "...", "summary": "one sentence"}}]}}
Include all {n} categories in the response."""

_NARRATIVE_SYS = """\
{system_message}

You are reviewing a contract comparison report for a business stakeholder.
Write a concise executive summary (3-5 sentences) of the comparison findings.
Focus on the most significant risks and key action items. Plain English only — no legal jargon."""


class _ScorecardResponse(BaseModel):
    scorecard: list[ScorecardCategory]


class ReviewerState(ReviewerInput):
    scorecard: list[ScorecardCategory] = Field(default_factory=list)
    compliance_percent: Optional[float] = None
    narrative: str = ""
    payload: Optional[ReviewPayload] = None


def _findings_summary(findings: list[RawFinding]) -> str:
    lines = []
    for f in findings[:40]:  # cap to avoid context overflow
        lines.append(
            f"[{f.clause_ref}] {f.deviation_type}: {f.explanation[:200]}"
        )
    return "\n".join(lines)


async def generate_scorecard(state: ReviewerState) -> dict:
    llm = UiPathAzureChatOpenAI()
    structured = llm.with_structured_output(_ScorecardResponse)
    cats = ", ".join(_SCORECARD_CATEGORIES)
    sys_prompt = _SCORECARD_SYS.format(categories=cats, n=len(_SCORECARD_CATEGORIES))
    result: _ScorecardResponse = await structured.ainvoke([
        SystemMessage(sys_prompt),
        HumanMessage(f"Findings:\n{_findings_summary(state.findings)}"),
    ])
    return {"scorecard": result.scorecard}


async def compute_compliance(state: ReviewerState) -> dict:
    if state.mode != "template-compliance" or not state.findings:
        return {"compliance_percent": None}
    aligned = sum(1 for f in state.findings if f.deviation_type == "aligned")
    pct = round(aligned / len(state.findings) * 100, 1)
    return {"compliance_percent": pct}


async def generate_narrative(state: ReviewerState) -> dict:
    llm = UiPathAzureChatOpenAI()
    scorecard_text = "\n".join(
        f"- {s.name}: {s.status} — {s.summary}" for s in state.scorecard
    )
    compliance_line = (
        f"\nCompliance score: {state.compliance_percent}%"
        if state.compliance_percent is not None
        else ""
    )
    sys_prompt = _NARRATIVE_SYS.format(system_message=state.template_system_message)
    response = await llm.ainvoke([
        SystemMessage(sys_prompt),
        HumanMessage(
            f"Scorecard:\n{scorecard_text}{compliance_line}\n\n"
            f"Top findings:\n{_findings_summary(state.findings)}"
        ),
    ])
    return {"narrative": response.content}


async def assemble_payload(state: ReviewerState) -> dict:
    findings = [
        Finding(
            id=f.id,
            clause_ref=f.clause_ref,
            deviation_type=f.deviation_type,
            snippet_a=f.snippet_a,
            snippet_b=f.snippet_b,
            explanation=f.explanation,
            guideline_citation=f.guideline_citation,
            insert_after_clause=f.insert_after_clause,
        )
        for f in state.findings
    ]
    payload = ReviewPayload(
        comparison_id=state.comparison_id,
        workspace_id=state.workspace_id,
        mode=state.mode,
        scorecard=state.scorecard,
        compliance_percent=state.compliance_percent,
        findings=findings,
        narrative=state.narrative,
        task_id=0,  # Maestro patches this after CreateHumanTask
    )
    return {"payload": payload}


async def write_to_bucket(state: ReviewerState) -> dict:
    bucket_key = (
        f"workspaces/{state.workspace_id}/comparisons/{state.comparison_id}/review.json"
    )
    payload_json = state.payload.model_dump(by_alias=True)  # type: ignore[union-attr]

    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as f:
            json.dump(payload_json, f, ensure_ascii=False, indent=2)
            tmp_path = f.name

        sdk = UiPath()
        await sdk.buckets.upload_async(
            name=state.bucket_name,
            blob_file_path=bucket_key,
            file_path=tmp_path,
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return {
        "comparison_id": state.comparison_id,
        "bucket_key": bucket_key,
    }


builder = StateGraph(ReviewerState, input=ReviewerInput, output=ReviewerOutput)

builder.add_node("generate_scorecard", generate_scorecard)
builder.add_node("compute_compliance", compute_compliance)
builder.add_node("generate_narrative", generate_narrative)
builder.add_node("assemble_payload", assemble_payload)
builder.add_node("write_to_bucket", write_to_bucket)

builder.add_edge(START, "generate_scorecard")
builder.add_edge("generate_scorecard", "compute_compliance")
builder.add_edge("compute_compliance", "generate_narrative")
builder.add_edge("generate_narrative", "assemble_payload")
builder.add_edge("assemble_payload", "write_to_bucket")
builder.add_edge("write_to_bucket", END)

graph = builder.compile()

