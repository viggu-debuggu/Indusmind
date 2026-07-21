import re
from typing import List, Dict, Any

class Chunker:
    """Splits document text payloads into semantic vector chunks with overlapping sliding windows."""

    @staticmethod
    def detect_equipment_mentions(text: str, equipment_tags: List[str]) -> List[str]:
        """Scans text for occurrences of registered industrial machinery equipment tags."""
        if not equipment_tags or not text:
            return []
        
        mentions = []
        lower_text = text.lower()
        
        for tag in equipment_tags:
            # Match case-insensitively, e.g. pump-p102 or PUMP-P102
            # Use regex word boundaries or search substring
            if tag.lower() in lower_text:
                mentions.append(tag)
        return mentions

    @classmethod
    def create_chunks(
        cls,
        pages_data: List[Dict[str, Any]],
        document_id: int,
        equipment_tags: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Chunks pages list into segments of 700 words with a 100-word overlap.
        Preserves page reference bounds and scans for equipment mentions.
        """
        chunks = []
        chunk_index = 1
        
        # Consolidate all page texts into a continuous stream of words,
        # but map each word to its original page, section, and archive metadata.
        flat_words_with_mapping = []
        
        for page in pages_data:
            text = page["text"]
            page_num = page["page"]
            section = page["section"]
            meta = page["metadata"]
            archive_filename = meta.get("archive_filename", "")
            
            # Simple space splitting, keeping track of original word strings
            words = text.split(" ")
            for w in words:
                if w.strip():
                    flat_words_with_mapping.append({
                        "word": w,
                        "page": page_num,
                        "section": section,
                        "archive_filename": archive_filename
                    })
                    
        total_words = len(flat_words_with_mapping)
        if total_words == 0:
            return []

        chunk_size = 700
        overlap = 100
        step = chunk_size - overlap  # 600 words advancement

        start_idx = 0
        while start_idx < total_words:
            end_idx = min(start_idx + chunk_size, total_words)
            
            # Extract words for this chunk
            chunk_elements = flat_words_with_mapping[start_idx:end_idx]
            chunk_words = [el["word"] for el in chunk_elements]
            chunk_text = " ".join(chunk_words)
            
            # Determine pages spanned by this chunk
            pages_spanned = sorted(list(set(el["page"] for el in chunk_elements)))
            primary_page = pages_spanned[0] if pages_spanned else 1
            
            # Determine sections spanned (preserving order)
            sections_spanned = []
            for el in chunk_elements:
                sec = el["section"]
                if sec not in sections_spanned:
                    sections_spanned.append(sec)
            primary_section = sections_spanned[0] if sections_spanned else "General"
            
            # Determine nested archive files
            archive_files = sorted(list(set(el["archive_filename"] for el in chunk_elements if el["archive_filename"])))
            
            # Match equipment tags
            mentions = cls.detect_equipment_mentions(chunk_text, equipment_tags)
            
            chunk_id = f"doc_{document_id}_chunk_{chunk_index}"
            
            chunks.append({
                "document_id": document_id,
                "chunk_id": chunk_id,
                "text": chunk_text,
                "page": primary_page,
                "section": primary_section,
                "equipment_mentioned": mentions,
                "chunk_metadata": {
                    "pages_spanned": pages_spanned,
                    "sections_spanned": sections_spanned,
                    "archive_files": archive_files,
                    "word_count": len(chunk_words)
                }
            })
            
            chunk_index += 1
            start_idx += step
            
            # Prevent infinite loop if step size becomes non-positive
            if step <= 0 or start_idx >= total_words:
                break
                
        return chunks
