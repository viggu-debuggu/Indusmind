# INDUSMIND AI — Live Platform Demonstration Scripts

This document outlines the detailed narration and on-screen navigation paths for the INDUSMIND AI video demonstration walkthroughs.

---

## 1. 7-Minute Full Platform Demonstration Script

### **⏱️ [0:00 - 1:00] Introduction & Executive Center**
*   **On-Screen Action**: Open the dashboard home page `/dashboard/executive`.
*   **Speaker Script**:
    > *"Welcome to the INDUSMIND AI platform walkthrough. We begin our demonstration at the Executive AI Command Center. Here, plant operations managers gain high-level, real-time visibility into overall performance index indices. 
    > 
    > Notice the Plant Health Score at 94.6%, showing active operations metrics across our corporate plant hierarchy. The dashboard calculates a financial impact ROI of $1.25M saved by preventing unplanned downtime, giving plant executives immediate insight into operational readiness and risk summaries."*

---

### **⏱️ [1:00 - 2:30] Telemetry Logs & AI Copilot RAG**
*   **On-Screen Action**: Navigate to `/dashboard/equipment`, select asset ID `PUMP-P102`, and then switch to the AI Copilot terminal `/dashboard/copilot`.
*   **On-Screen Action**: Input this natural language query in the chat box:
    ```text
    What is the standard procedure for replacing the mechanical seal on Pump P102 if vibration exceeds 7.5 mm/s?
    ```
*   **Speaker Script**:
    > *"When technicians receive telemetry warnings on the field, they can query our grounded AI Copilot. The system automatically triggers a hybrid RAG retrieval, running dense vector searches on pgvector combined with sparse BM25 keyword matching. 
    > 
    > The AI returns a step-by-step repair instruction, completely grounded in the uploaded operations manual. Most importantly, it includes page-level citations. Clicking a citation opens the exact source PDF page, ensuring field operators trace factual guidelines without risking hallucination."*

---

### **⏱️ [2:30 - 4:00] 360° Knowledge Graph Traversal**
*   **On-Screen Action**: Navigate to `/dashboard/graph`. Search for asset tag `PUMP-P102` and double-click the node to expand connections.
*   **Speaker Script**:
    > *"To bridge textual procedures with structural plant context, we trace our 360° interactive Knowledge Graph. Standard search tools look at words, but our graph maps how physical plant components link together. 
    > 
    > Here, Pump P102 is mapped to its bearing assembly, which links to the overheating failure mode, caused by a lubrication depletion root cause, governed by specific OSHA safety standards. In under 18ms, the graph extracts a localized context block to enrich the AI Copilot's prompt logic."*

---

### **⏱️ [4:00 - 5:30] Autonomous Multi-Agent Failure Investigation**
*   **On-Screen Action**: Navigate to `/dashboard/agents` and launch the cooperative diagnostic task:
    ```text
    Investigate root cause of Boiler 101 pressure surge.
    ```
*   **Speaker Script**:
    > *"When complex, multi-variable anomalies are detected, a single prompt is insufficient. We trigger our autonomous Multi-Agent AI system. 
    > 
    > Here, 8 specialized AI agents (Maintenance, Safety, Compliance, RCA, Quality, Graph, Doc, Coordinator) collaborate in real time. The Maintenance Agent reviews pressure trends, the Compliance Agent verifies safety standards, the RCA Agent traverses failure trees, and the Coordinator Agent synthesizes their debate into a single, cohesive incident report."*

---

### **⏱️ [5:30 - 7:00] Enterprise Production Center & Data Export**
*   **On-Screen Action**: Navigate to `/dashboard/enterprise`. Hover over the Subsystem Health panel showing database connection pools and P95 latency (45ms). Click the *Export PDF Summary* button.
*   **Speaker Script**:
    > *"Lastly, we visit the Enterprise Production Center. Here, we track system telemetry across our Docker-containerized microservices, ensuring all 10 engine subsystems respond within our strict 45ms P95 SLA. 
    > 
    > Using Docker Compose allows us to spin up the Next.js, FastAPI, and Postgres database stack instantly with a single command. With one click, the platform generates a complete compliance audit evidence package or PDF report. Thank you for your time."*


---

## 2. 5-Minute Executive Summary Script

*   **[0:00 - 1:00] Executive Dashboard KPIs**: Focus on the overall financial savings, active alert counts, and plant health indices.
*   **[1:00 - 2:30] RAG Ingestion & Citation**: Demonstrate uploading a PDF manual and asking the AI Copilot for page-level citations.
*   **[2:30 - 3:30] Multi-Objective Decision Engine**: Showcase cost vs. downtime vs. safety trade-off recommendations.
*   **[3:30 - 5:00] Enterprise Performance Monitor**: Review system health metrics and download a generated PDF summary.

---

## 3. 3-Minute Rapid Pitch Script

*   **[0:00 - 0:45] The Problem**: High downtime costs ($260k/hour) and lost engineering tribal knowledge as senior operators retire.
*   **[0:45 - 2:00] The Solution**: Unifying physical sensor telemetry, vector RAG database chunks, and 360° Knowledge Graph context with Multi-Agent collaboration.
*   **[2:00 - 3:00] The Verification**: Demonstrating sub-45ms latencies, 98.4% cache hit rates, and exporting audit-ready evidence sheets.
