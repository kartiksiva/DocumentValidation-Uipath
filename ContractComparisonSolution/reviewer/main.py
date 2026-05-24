from langgraph.graph import START, StateGraph, END

from schemas import ReviewerInput, ReviewPayload


async def review(state: ReviewerInput) -> ReviewPayload:
    raise NotImplementedError("Implement in PB-T5")


builder = StateGraph(ReviewerInput, output=ReviewPayload)

builder.add_node("review", review)

builder.add_edge(START, "review")
builder.add_edge("review", END)

graph = builder.compile()
