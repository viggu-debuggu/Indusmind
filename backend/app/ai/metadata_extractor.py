import re
import json
from typing import Dict, Any, Optional
from app.ai.llm_service import LLMService
from app.core.logging import logger

class MetadataExtractor:
    """Uses LLM processing or regex fallbacks to extract industrial metadata from document text."""

    @classmethod
    def extract_metadata(cls, text: str) -> Dict[str, Any]:
        """
        Parses metadata from text. Runs LLM extraction if keys are present,
        otherwise falls back to rule-based parsing.
        """
        logger.info("initiating_ai_metadata_extraction")
        
        # Check if LLM keys are configured, if so use LLM
        import os
        has_llm_key = any(os.getenv(k) for k in ["GEMINI_API_KEY", "OPENAI_API_KEY", "AZURE_OPENAI_API_KEY"])
        
        if has_llm_key:
            try:
                return cls._extract_via_llm(text[:3000])
            except Exception as e:
                logger.warning("llm_metadata_extraction_failed_falling_back_to_rules", error=str(e))
                
        return cls._extract_via_rules(text)

    @classmethod
    def _extract_via_llm(cls, snippet: str) -> Dict[str, Any]:
        """Queries LLM with structured output instructions."""
        system_prompt = (
            "You are an industrial document analyzer. Extract metadata values from the document text. "
            "Return a clean JSON block (no markdown code blocks, just raw JSON text) matching the schema:\n"
            "{\n"
            "  \"asset_tag\": \"Equipment tag like PUMP-P102 or turbine-t203 or null\",\n"
            "  \"equipment_name\": \"Name of equipment or null\",\n"
            "  \"equipment_type\": \"Type (Pump, Turbine, Boiler, etc.) or null\",\n"
            "  \"manufacturer\": \"Name of manufacturer or null\",\n"
            "  \"model_number\": \"Model number or null\",\n"
            "  \"plant\": \"Plant name or null\",\n"
            "  \"department\": \"Department name or null\",\n"
            "  \"revision\": \"Revision number/version or null\",\n"
            "  \"document_type\": \"SOP, Manual, Drawing, Report, etc.\",\n"
            "  \"date\": \"Document date or null\",\n"
            "  \"criticality\": \"High, Medium, Low or null\",\n"
            "  \"keywords\": \"Comma-separated keywords or null\"\n"
            "}"
        )
        prompt = f"DOCUMENT SNIPPET:\n{snippet}\n\nJSON output:"
        
        resp = LLMService.generate_response(prompt=prompt, system_prompt=system_prompt)
        
        # Clean any markdown block wrap
        resp = resp.replace("```json", "").replace("```", "").strip()
        try:
            data = json.loads(resp)
            return data
        except Exception:
            logger.error("failed_to_parse_llm_metadata_json", response_preview=resp[:200])
            raise ValueError("Invalid JSON response from LLM")

    @classmethod
    def _extract_via_rules(cls, text: str) -> Dict[str, Any]:
        """Applies rule-based regex checks for offline validation."""
        text_lower = text.lower()
        
        # 1. Asset Tag extraction
        asset_tag = None
        tag_match = re.search(r"\b(PUMP|TURBINE|BOILER|COMP|SUBSTATION|VALVE|GEN)-[A-Z0-9]+\b", text, re.IGNORECASE)
        if tag_match:
            asset_tag = tag_match.group(0).upper()

        # 2. Equipment Name
        equipment_name = None
        if "pump" in text_lower:
            equipment_name = "Centrifugal Fluid Pump"
        elif "turbine" in text_lower:
            equipment_name = "Superheated Gas Turbine"
        elif "boiler" in text_lower:
            equipment_name = "Utility Heat Exchange Boiler"
        elif "compressor" in text_lower:
            equipment_name = "Air Compressor Feed"
        elif "substation" in text_lower:
            equipment_name = "Grid Feed Control Substation"
            
        # 3. Equipment Type
        equipment_type = None
        if asset_tag:
            prefix = asset_tag.split("-")[0]
            equipment_type = prefix.title()

        # 4. Manufacturer
        manufacturer = None
        mfg_matches = ["Sulzer", "Siemens", "Babcock", "Atlas Copco", "ABB", "General Electric", "Honeywell"]
        for mfg in mfg_matches:
            if mfg.lower() in text_lower:
                manufacturer = mfg
                break

        # 5. Model Number
        model_number = None
        model_match = re.search(r"model\s*[:#-]?\s*([A-Z0-9-]+)", text, re.IGNORECASE)
        if model_match:
            model_number = model_match.group(1).strip()

        # 6. Plant & Department
        plant = "Fluid Processing Facility A" if "facility a" in text_lower or "plant a" in text_lower else "Power Generation Block B"
        department = "Hydraulics Operations" if "hydraulic" in text_lower else "Thermal Generation"

        # 7. Document Type
        doc_type = "Manual"
        if "sop" in text_lower or "standard operating" in text_lower:
            doc_type = "SOP"
        elif "drawing" in text_lower or "schematic" in text_lower:
            doc_type = "Drawing"
        elif "inspection" in text_lower or "audit" in text_lower:
            doc_type = "Inspection"

        # 8. Revision & Criticality
        revision = "Rev 1.0"
        rev_match = re.search(r"rev(?:ision)?\s*[:#-]?\s*([0-9.]+)", text, re.IGNORECASE)
        if rev_match:
            revision = f"Rev {rev_match.group(1)}"
            
        criticality = "Medium"
        if "critical" in text_lower or "danger" in text_lower or "safety first" in text_lower:
            criticality = "High"

        # 9. Keywords
        keywords = "safety, operational guidelines"
        if asset_tag:
            keywords += f", {asset_tag.lower()}"

        return {
            "asset_tag": asset_tag,
            "equipment_name": equipment_name,
            "equipment_type": equipment_type,
            "manufacturer": manufacturer,
            "model_number": model_number,
            "plant": plant,
            "department": department,
            "revision": revision,
            "document_type": doc_type,
            "date": "2026-01-15",
            "criticality": criticality,
            "keywords": keywords
        }
