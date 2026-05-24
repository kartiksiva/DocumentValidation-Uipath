# Project Overview
This is a UiPath Coded App project utilizing the UiPath TypeScript SDK. Its primary objective is to implement a **Contract Comparison Agent** that allows business users to compare legal contracts (e.g., Buyer vs. Seller versions or against standard templates) using AI. The application leverages UiPath Maestro for orchestration, Document Understanding for extraction, and an LLM pipeline for comparison and review. 

The architecture separates the UI (a swappable React + Vite app) from the backend logic (Maestro Processes and Agents) to ensure maximum flexibility and maintainability.

# Building and Running
The project is set up as a TypeScript/Node.js application.

- **Install Dependencies:** `npm install`
- **Build/Compile:** Currently relies on `typescript` and `ts-node` for execution. (No explicit build command is set in `package.json` yet; add a `build` script mapping to `tsc` if needed).
- **Testing:** `npm test` (Currently a placeholder; needs to be implemented).
- **Run (TODO):** Add commands to start the Coded App and deploy Maestro processes when the application structure is further developed.

# Development Conventions
- **SDK Usage:** Use the `@uipath/uipath-typescript` SDK for interactions with UiPath Platform Services (Buckets, Entities, Tasks, MaestroProcesses).
- **Architecture Adherence:** Strictly follow the 5-layer decoupled architecture defined in `docs/superpowers/specs/2026-05-23-contract-comparison-agent-design.md`. Maintain clear separation between the UI Layer, UiPath Platform Services, Maestro Orchestrator, Agent Pipeline, and Storage/Knowledge base.
- **AI Agent Modularity:** Implement AI logic into distinct agents as specified (Extractor, Comparator, Reviewer) rather than a monolith, to allow independent scaling, easier prompting, and debugging.
- **State Management:** Keep state and long-running process context in UiPath Buckets and Entities, orchestrating state transitions via Maestro, not in the UI layer.
- **Human-in-the-Loop:** All automated decisions requiring business approval must integrate with UiPath Tasks (Action Center) via Maestro.
