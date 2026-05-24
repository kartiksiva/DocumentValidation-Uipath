from langgraph.graph import START, StateGraph, END

from schemas import ReviewerInput, ReviewerOutput


async def review(state: ReviewerInput) -> ReviewerOutput:
    raise NotImplementedError("Implement in PB-T5")


builder = StateGraph(ReviewerInput, output=ReviewerOutput)

builder.add_node("review", review)

builder.add_edge(START, "review")
builder.add_edge("review", END)

graph = builder.compile()
