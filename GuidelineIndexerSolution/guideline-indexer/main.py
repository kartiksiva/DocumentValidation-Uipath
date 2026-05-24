from langgraph.graph import START, StateGraph, END

from schemas import IndexerInput, IndexerOutput


async def index(state: IndexerInput) -> IndexerOutput:
    raise NotImplementedError("Implement in PB-T7")


builder = StateGraph(IndexerInput, output=IndexerOutput)

builder.add_node("index", index)

builder.add_edge(START, "index")
builder.add_edge("index", END)

graph = builder.compile()
