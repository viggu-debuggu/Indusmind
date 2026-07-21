# INDUSMIND AI - Knowledge Graph Specification

## Graph Architecture
The Knowledge Graph in INDUSMIND AI constructs semantic relationships between equipment assets, failure modes, root causes, standard operating procedures (SOPs), maintenance logs, regulations, and historical incidents.

---

## Entity Types & Relationships
- **Entities**:
  - `Equipment` (e.g., Boiler-101, Centrifugal Pump P-402)
  - `Component` (e.g., Mechanical Seal, Bearing B-22)
  - `FailureMode` (e.g., Thermal Overload, Cavitation)
  - `RootCause` (e.g., Lubrication Degradation)
  - `SOP` (e.g., SOP-MAINT-882)
  - `Regulation` (e.g., OSHA 1910.119)
- **Predicates**:
  - `HAS_COMPONENT`, `EXHIBITS_FAILURE_MODE`, `CAUSED_BY`, `RESOLVED_BY`, `GOVERNED_BY`, `DEPENDS_ON`.

---

## Query & Traversal Performance
- Graph queries use `knowledge_graph_cache` (10-minute TTL) to guarantee < 50ms traversal speeds.
- Supports graph path extraction, sub-graph visualizer exports, and graph-augmented RAG context generation.
