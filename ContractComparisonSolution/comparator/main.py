from langgraph.graph import START, StateGraph, END

from schemas import ComparatorInput, ComparatorOutput


async def compare(state: ComparatorInput) -> ComparatorOutput:
    raise NotImplementedError("Implement in PB-T4")


builder = StateGraph(ComparatorInput, output=ComparatorOutput)

builder.add_node("compare", compare)

builder.add_edge(START, "compare")
builder.add_edge("compare", END)

graph = builder.compile()
