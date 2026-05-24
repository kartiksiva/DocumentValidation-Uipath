# On Hold

Items pending spec clarification or scoping before they can be added to TODO.md.

---

| # | Item | Context | Waiting On |
|---|------|---------|------------|
| 1 | Rewrite Plan B — C# → Python | Studio Web = Python only. No path to run C# coded workflows in Automation Cloud without desktop Studio. Drop `.xaml` + `.cs` entirely. | Decision to proceed |

## Detail — Item 1: Plan B Stack Replacement

**Dropping:** C# coded workflows + `.xaml` orchestration

**Replacement mapping:**

| Current (C# / Studio) | Replacement (Python / Maestro) |
|---|---|
| `ExtractClauses.cs` | `extractor/main.py` — Python coded agent, UiPath DU SDK |
| `CompareClauses.cs` | `comparator/main.py` — Python coded agent, ContextGroundingRetriever |
| `GenerateReview.cs` | `reviewer/main.py` — Python coded agent, UiPathAzureChatOpenAI |
| `Main.xaml` | `ContractComparisonProcess.flow` — `.flow` JSON, Maestro |
| `GuidelineIndexer/Main.xaml` | `guideline-indexer/main.py` — Python coded agent |

Same logic. Same output schema. Same bucket paths. Python + `.flow` instead of C# + `.xaml`.

**Next step:** Rewrite Plan B with this stack, then update TODO.md Plan B tasks accordingly.
