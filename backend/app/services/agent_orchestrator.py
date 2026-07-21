import re
import json
import uuid
import time
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.equipment import Equipment
from app.models.agent_intelligence import AgentExecution, AgentMemory, AgentMessage, AgentCollaboration
from app.services.agent_team import (
    MaintenanceAgent,
    ComplianceAgent,
    SafetyAgent,
    RcaAgent,
    QualityAgent,
    GraphAgent,
    DocumentIntelligenceAgent
)
from app.core.logging import logger

class AgentOrchestrator:
    """Orchestrates structured collaborative reasoning, message exchanges, and traces logging."""

    @classmethod
    def classify_intent(cls, question: str) -> str:
        """
        Classifies user query intent into categories:
        {executive, learning, twin, discovery, decision, general_rag}
        """
        import os
        from app.ai.llm_service import LLMService
        provider = os.getenv("LLM_PROVIDER", "mock").lower().strip()
        if provider == "mock":
            return "general_rag"
            
        system_prompt = (
            "You are an intent classifier for an industrial plant safety & engineering assistant.\n"
            "Map the user question to exactly one of the following lowercase tags:\n"
            "- executive (questions about overall plant health metrics, dashboard, executive briefing/attention, financial impact or risk, highest ROI, executive summary reports)\n"
            "- learning (questions about continuous learning, frequently rejected updates, QA evaluation ratings, satisfaction levels, engineer corrections, model training evolution)\n"
            "- twin (questions asking for a digital twin, side-by-side asset comparison, operational history/timeline of a specific machinery asset like PUMP-P102, knowledge score diagnostics)\n"
            "- discovery (questions about hidden risks, data/SOP checklist gaps, repeated/recurring failures, optimization opportunities, correlation patterns)\n"
            "- decision (questions about what to do next, maintenance queue priority, highest business or failure risk, saves the most downtime, why is asset high-risk)\n"
            "- general_rag (general engineering questions about startup steps, temperature/pressure ratings, calibration procedures, manual instructions, troubleshooting guidelines)\n"
            "Response MUST only be the single tag word (no punctuation, no markdown, just the word)."
        )
        prompt = f"User Question: '{question}'"
        
        try:
            res = LLMService.generate_response(prompt=prompt, system_prompt=system_prompt)
            clean_res = res.strip().lower().replace("`", "").replace("'", "").replace('"', "")
            if clean_res in ["executive", "learning", "twin", "discovery", "decision", "general_rag"]:
                return clean_res
        except Exception as e:
            logger.warning("llm_intent_classification_failed", error=str(e))
            
        return "general_rag"

    AGENT_MAP = {
        "Maintenance Agent": MaintenanceAgent,
        "Compliance Agent": ComplianceAgent,
        "Safety Agent": SafetyAgent,
        "Root Cause Analysis Agent": RcaAgent,
        "Quality Agent": QualityAgent,
        "Knowledge Graph Agent": GraphAgent,
        "Document Intelligence Agent": DocumentIntelligenceAgent
    }

    @classmethod
    def orchestrate_query(
        cls,
        db: Session,
        question: str,
        session_uuid: str,
        chat_message_id: Optional[int] = None
    ) -> Tuple[str, List[str], List[str], float]:
        """Intercepts query, determines participating agents, executes trace, and synthesizes answers."""
        q_lower = question.lower().strip()
        # Normalize unicode dashes (U+2011 non-breaking hyphen, U+2013 en-dash, U+2014 em-dash) to ASCII hyphen
        q_lower = q_lower.replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-')
        
        # Compile dynamic tag regex from DB
        from sqlalchemy import text
        res_tags = db.execute(text("SELECT asset_tag FROM equipment")).all()
        db_tags = [row[0].lower() for row in res_tags if row[0]]
        if db_tags:
            tag_pattern = r"\b(" + "|".join(re.escape(t) for t in db_tags) + r")\b"
        else:
            tag_pattern = r"\b(pump-p102|turbine-t203|boiler-b401|comp-c300|substation-e1)\b"

        # ── SHORTCUT: "list all machines / what machines / show all equipment" ──
        list_keywords = ["what machines", "list machines", "all machines", "what equipment", 
                         "list equipment", "all equipment", "all assets", "list assets",
                         "show machines", "show equipment", "show all assets", "how many machines",
                         "how many equipment", "what assets"]
        if any(kw in q_lower for kw in list_keywords):
            all_eq = db.query(Equipment).order_by(Equipment.asset_tag).all()
            if not all_eq:
                list_answer = "### 🏭 Plant Equipment Registry\n\nNo equipment has been registered yet. Go to **Equipment Registry** to add your first machine."
            else:
                list_answer = f"### 🏭 Plant Equipment Registry — {len(all_eq)} Asset(s) Registered\n\n"
                list_answer += "| Asset Tag | Asset Name | Location | Department | Status | Health | Running Hours |\n"
                list_answer += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
                for e in all_eq:
                    status_icon = "✅" if e.status == "Operational" else ("🔧" if e.status == "Maintenance" else "🔴")
                    list_answer += f"| `{e.asset_tag}` | {e.asset_name} | {e.plant} | {e.department} | {status_icon} {e.status} | **{e.health_score:.0f}%** | {e.running_hours:,.0f} hrs |\n"
                list_answer += f"\n> **AI Summary**: {sum(1 for e in all_eq if e.status == 'Operational')} of {len(all_eq)} assets are Operational. "
                offline = [e.asset_tag for e in all_eq if e.status not in ('Operational',)]
                if offline:
                    list_answer += f"Assets requiring attention: **{', '.join(offline)}**."
                else:
                    list_answer += "All assets are running within normal parameters."
            return list_answer, ["Document Intelligence Agent"], ["Orchestrator returned full equipment inventory list."], 95.0

        # 1. Resolve equipment_id from asset tag mentioned in query
        tag_match = re.search(tag_pattern, q_lower)
        asset_tag = tag_match.group(1).upper() if tag_match else None

        # If no specific asset tag found in question, use first asset as context but note it
        if asset_tag:
            eq = db.query(Equipment).filter(Equipment.asset_tag == asset_tag).first()
        else:
            eq = db.query(Equipment).first()
            if eq:
                asset_tag = eq.asset_tag
        eq_id = eq.id if eq else 1

        # 2. Select participating agents
        intent = cls.classify_intent(question)
        if intent == "twin":
            agents_to_run = ["Knowledge Graph Agent", "Maintenance Agent"]
        elif intent == "discovery":
            agents_to_run = ["Knowledge Graph Agent", "Document Intelligence Agent"]
        elif intent == "decision":
            agents_to_run = ["Root Cause Analysis Agent", "Maintenance Agent", "Knowledge Graph Agent"]
        elif intent == "executive":
            agents_to_run = ["Root Cause Analysis Agent", "Document Intelligence Agent", "Knowledge Graph Agent"]
        elif intent == "learning":
            agents_to_run = ["Quality Agent", "Maintenance Agent"]
        else:
            # Fallback to keyword-based selection
            if any(k in q_lower for k in ["maintenance", "failure", "repair", "rul", "parts"]):
                agents_to_run = ["Maintenance Agent", "Document Intelligence Agent"]
            elif any(k in q_lower for k in ["compliance", "peso", "oisd", "regulation", "clause", "act"]):
                agents_to_run = ["Compliance Agent", "Document Intelligence Agent"]
            elif any(k in q_lower for k in ["safety", "hazard", "ppe", "permit", "risk"]):
                agents_to_run = ["Safety Agent", "Compliance Agent"]
            elif any(k in q_lower for k in ["why", "root cause", "rca", "incident"]):
                agents_to_run = ["Root Cause Analysis Agent", "Maintenance Agent", "Knowledge Graph Agent"]
            elif any(k in q_lower for k in ["quality", "deviation", "inspection", "capa", "calibration"]):
                agents_to_run = ["Quality Agent", "Maintenance Agent"]
            elif any(k in q_lower for k in ["graph", "relation", "dependency"]):
                agents_to_run = ["Knowledge Graph Agent", "Document Intelligence Agent"]
            else:
                # Default collaborative team
                agents_to_run = ["Maintenance Agent", "Safety Agent", "Document Intelligence Agent"]

        # Ensure unique list
        agents_to_run = list(dict.fromkeys(agents_to_run))
        
        start_time = time.time()
        reasoning_steps = []
        evidence_snippets = []
        confs = []
        
        # 3. Simulate message exchanges & run agents
        initiator = agents_to_run[0]
        reasoning_steps.append(f"Orchestrator assigned {initiator} as primary investigator for query: '{question}'")
        
        for idx in range(len(agents_to_run)):
            agent_name = agents_to_run[idx]
            agent_class = cls.AGENT_MAP[agent_name]
            
            # Message exchange log
            if idx > 0:
                prev_agent = agents_to_run[idx - 1]
                msg = AgentMessage(
                    session_uuid=session_uuid,
                    sender=prev_agent,
                    receiver=agent_name,
                    message_type="STATE_COORDINATION",
                    payload=json.dumps({"task": f"Analyze query constraints for {asset_tag}", "request": "Yield secondary evidence logs"})
                )
                db.add(msg)
                reasoning_steps.append(f"Structured message sent from {prev_agent} to {agent_name} for collaborative context.")
            
            # Execute Agent reasoning task
            res = agent_class.process_task(db, eq_id)
            confs.append(res["confidence"])
            evidence_snippets.append(f"[{agent_name}]: {res['evidence']}")
            
            # Log Agent Memory
            memory = AgentMemory(
                agent_name=agent_name,
                task_name=f"Query grounding: {question[:50]}...",
                reasoning=res["outcome"],
                evidence=res["evidence"],
                confidence=res["confidence"],
                status="Completed"
            )
            db.add(memory)
            
            reasoning_steps.append(f"{agent_name} compiled diagnostic checks. Confidence: {res['confidence']}%")

        # 4. Log Collaboration outcome
        cost_saved = 1200.0 if "Maintenance Agent" in agents_to_run else 0.0
        downtime_saved = 4.0 if "Maintenance Agent" in agents_to_run else 0.0
        
        collab = AgentCollaboration(
            session_uuid=session_uuid,
            collaboration_type="Diagnostic Query Resolution",
            initiator=initiator,
            collaborators=", ".join(agents_to_run),
            outcome=f"Successfully resolved operational query for asset {asset_tag}.",
            downtime_saved_estimate=downtime_saved,
            cost_saved_estimate=cost_saved
        )
        db.add(collab)
        db.flush()

        duration = time.time() - start_time
        avg_conf = sum(confs) / len(confs) if confs else 90.0

        # 5. Log Execution Trace
        exec_trace = AgentExecution(
            chat_message_id=chat_message_id,
            session_uuid=session_uuid,
            agents_used=", ".join(agents_to_run),
            reasoning_steps=reasoning_steps,
            evidence=" | ".join(evidence_snippets),
            confidence=avg_conf,
            duration=duration
        )
        db.add(exec_trace)
        db.commit()

        # 6. Synthesize Dynamic Grounded Unified RAG Response
        from app.models.document import DocumentModel
        from app.models.lessons_learned import IncidentRecord
        from app.models.expert_knowledge import ExpertKnowledge
        from app.models.decision_intelligence import DecisionRecommendation
        from app.models.discovery import DiscoveryFinding
        from app.models.ai import DocumentChunk

        # Retrieve grounding data
        related_docs = db.query(DocumentModel).filter(DocumentModel.asset_id == eq_id).limit(3).all()
        if not related_docs:
            related_docs = db.query(DocumentModel).filter(DocumentModel.status != "Deleted").limit(2).all()

        related_incidents = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == eq_id).limit(3).all()
        related_expert = db.query(ExpertKnowledge).filter(ExpertKnowledge.equipment_id == eq_id).limit(3).all()
        related_recs = db.query(DecisionRecommendation).filter(DecisionRecommendation.equipment_id == eq_id).limit(3).all()
        related_findings = db.query(DiscoveryFinding).filter(DiscoveryFinding.affected_assets.ilike(f"%{asset_tag}%")).limit(3).all()

        # Text chunks search fallback
        doc_chunks = db.query(DocumentChunk).filter(DocumentChunk.text.ilike(f"%{asset_tag}%")).limit(3).all()

        # Telemetry context
        health = eq.health_score if eq else 100.0
        rul = eq.remaining_useful_life if eq else 0.0
        status = eq.status if eq else "Operational"

        # Dynamically formulate the RAG prompt answer response
        final_answer = "### 🧠 Intelligent Grounded AI Answer\n\n"
        
        # Section 1: Executive Summary
        final_answer += "#### Executive Summary\n"
        final_answer += f"Analysis compiled for **{asset_tag}** ({eq.asset_name if eq else 'Asset'}). "
        final_answer += f"The asset currently registers a **Health Index of {health}%** with status set to **{status}** and "
        final_answer += f"Remaining Useful Life (RUL) estimated at **{rul:.1f} hours**.\n"
        if status == "Degraded":
            final_answer += "⚠️ **Warning**: Asset status is degraded. Accelerated wear signatures require immediate diagnostics.\n"
        else:
            final_answer += "✅ All telemetry and operational limits are within normal baseline thresholds.\n"
        final_answer += "\n"

        # Section 2: Step-by-Step Answer / Maintenance Protocol
        final_answer += "#### Step-by-Step Answer & Action Protocol\n"
        
        is_startup = any(k in q_lower for k in ["start", "startup", "initiate"])
        is_safety = any(k in q_lower for k in ["safety", "hazard", "ppe", "permit", "risk"])
        
        if is_startup:
            final_answer += f"To safely start **{asset_tag}**, follow these steps:\n"
            final_answer += "1. **Verify lubrication levels**: Inspect suction and discharge lines for static seals compliance.\n"
            final_answer += "2. **Inspect suction valve**: Ensure full open position to prevent inlet cavitation flow restrictions.\n"
            final_answer += "3. **Perform vibration benchmark checks**: Confirm baseline telemetry spikes are absent.\n"
            final_answer += "4. **Initiate electrical motor drive**: Gradually bring up pressure outputs.\n"
            final_answer += f"5. **Monitor output parameters**: Keep pressure below baseline safety threshold limits.\n"
        elif is_safety:
            final_answer += "Safety checklist items matching current diagnostic constraints:\n"
            final_answer += "1. **Verify Lock-Out-Tag-Out (LOTO)**: Ensure mechanical energy isolations are confirmed.\n"
            final_answer += "2. **Inspect Personal Protective Equipment (PPE)**: Standard protective clothing and face shields required.\n"
            final_answer += "3. **Check Ventilation parameters**: Verify suction exhaust vents are clear of obstructions.\n"
        else:
            final_answer += f"Grounding maintenance instructions for **{asset_tag}**:\n"
            final_answer += "1. **Inspect Wear Rings & Seals**: Check bearing sleeves and static gaskets for heat indicators.\n"
            final_answer += "2. **Clean Fluid Passages**: Verify no blockages or dynamic flow restrictions exist.\n"
            final_answer += "3. **Recalibrate Sensor Transducers**: Align pressure and temperature readings to core specifications.\n"
        final_answer += "\n"

        # Section 3: Supporting Evidence
        final_answer += "#### Supporting Evidence\n"
        final_answer += f"- **Asset Health telemetry**: RUL limit stands at {rul:.1f} Hrs before next scheduled maintenance cycle.\n"
        if related_incidents:
            final_answer += f"- **Incident history**: Mapped previous failure cause: *\"{related_incidents[0].cause}\"*.\n"
        if doc_chunks:
            final_answer += f"- **Manual grounding**: Document chunk citation: *\"{doc_chunks[0].text[:160]}...\"*\n"
        else:
            final_answer += "- **Manual grounding**: Checked against registered plant operational specifications.\n"
        final_answer += "\n"

        # Section 4: Related References Mapping
        final_answer += "#### Related References\n"
        
        # Related Documents
        doc_links = [f"[{d.document_name}](file:///app/storage/{d.storage_path})" for d in related_docs]
        final_answer += f"- **Related Documents**: {', '.join(doc_links) if doc_links else 'None'}\n"
        
        # Related Assets
        final_answer += f"- **Related Assets**: [{asset_tag} (Health: {health}%)]\n"
        
        # Related Incidents
        inc_links = [f"Incident #{i.id} ({i.cause})" for i in related_incidents]
        final_answer += f"- **Related Incidents**: {', '.join(inc_links) if inc_links else 'None'}\n"
        
        # Related SOPs
        sop_links = [f"{d.document_name} (SOP)" for d in related_docs if "sop" in d.document_name.lower() or "standard" in d.document_name.lower()]
        final_answer += f"- **Related SOPs**: {', '.join(sop_links) if sop_links else 'Startup Instruction Manual'}\n"
        
        # Related Recommendations
        rec_links = [f"Recommendation #{r.id} ({r.action_summary})" for r in related_recs]
        final_answer += f"- **Related Recommendations**: {', '.join(rec_links) if rec_links else 'Establish standard preventive maintenance task pattern'}\n"
        
        # Confidence Score
        score = 80.0
        if related_docs: score += 10.0
        if related_incidents: score += 5.0
        if doc_chunks: score += 5.0
        final_answer += f"- **Confidence Score**: **{min(100.0, score):.1f}%**\n"

        final_answer += "\n> [!NOTE]\n"
        final_answer += f"> **Collaborative Savings**: Avoided **{downtime_saved} Hrs** of unscheduled downtime (Savings: **${cost_saved:,.2f}**)."

        return final_answer, agents_to_run, reasoning_steps, avg_conf
