from langgraph.graph import START, StateGraph, END

from schemas import ExtractorInput, ExtractorOutput


async def extract(state: ExtractorInput) -> ExtractorOutput:
    raise NotImplementedError("Implement in PB-T3")


builder = StateGraph(ExtractorInput, output=ExtractorOutput)

builder.add_node("extract", extract)

builder.add_edge(START, "extract")
builder.add_edge("extract", END)

graph = builder.compile()
