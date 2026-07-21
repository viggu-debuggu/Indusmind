import re
from typing import List, Dict, Any

class CitationExtractor:
    """Parses generated text blocks to locate and structure inline source document references."""
    
    # Matches: [Document: pump_operating_manual.pdf, Page: 14, Section: Pressure Thresholds]
    CITATION_PATTERN = r'\[Document:\s*([^,\]\n]+),\s*Page:\s*([^,\]\n]+),\s*Section:\s*([^,\]\n]+)\]'

    @classmethod
    def extract_citations(cls, text: str) -> List[Dict[str, Any]]:
        """Scans the text and extracts a list of unique structured citation mappings."""
        if not text:
            return []
            
        matches = re.findall(cls.CITATION_PATTERN, text)
        citations = []
        seen = set()
        
        for doc_name, page_str, section in matches:
            doc_name = doc_name.strip()
            page_str = page_str.strip()
            section = section.strip()
            
            # Form key for uniqueness checks
            key = (doc_name, page_str, section)
            if key not in seen:
                seen.add(key)
                
                # Parse page as integer if possible
                page_val = None
                try:
                    page_val = int(page_str)
                except ValueError:
                    pass
                    
                citations.append({
                    "source_document": doc_name,
                    "page": page_val,
                    "section": section,
                    "snippet": f"Reference inside section '{section}' of {doc_name} (Page {page_str})"
                })
                
        return citations

    @classmethod
    def clean_citations_from_text(cls, text: str) -> str:
        """Removes the raw brackets inline citation tags for alternative clean layouts."""
        if not text:
            return ""
        # Substitutes matching citation tags with empty string or simplified references like [1]
        cleaned = re.sub(cls.CITATION_PATTERN, "", text)
        # Normalize double spacing caused by removals
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip()
