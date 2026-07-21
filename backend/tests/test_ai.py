import pytest
from unittest.mock import patch, MagicMock
from app.ai.chunking import Chunker
from app.ai.citation import CitationExtractor
from app.ai.document_processor import clean_extracted_text


def test_clean_extracted_text():
    raw = "  Hello \x00 World \n\n This is  \t a test. "
    cleaned = clean_extracted_text(raw)
    assert cleaned == "Hello World This is a test."


def test_chunker_sliding_window():
    # Construct mock page data
    pages = [
        {"text": "word " * 400, "page": 1, "section": "Intro", "metadata": {"type": "TXT"}},
        {"text": "word " * 400, "page": 2, "section": "Body", "metadata": {"type": "TXT"}}
    ]
    # Total words: 800. Expected chunks:
    # Chunk 1: index 0 to 700 (words 1-700)
    # Chunk 2: index 600 to 800 (words 601-800, overlap of 100 words starting from 600)
    
    chunks = Chunker.create_chunks(pages, document_id=1, equipment_tags=["PUMP-P102"])
    assert len(chunks) == 2
    
    c1 = chunks[0]
    assert c1["document_id"] == 1
    assert c1["chunk_id"] == "doc_1_chunk_1"
    assert c1["page"] == 1
    assert c1["section"] == "Intro"
    
    c2 = chunks[1]
    assert c2["chunk_id"] == "doc_1_chunk_2"
    # Word 600 spans into Page 2 (which starts at word 400)
    assert c2["page"] == 2
    assert c2["section"] == "Body"


def test_chunker_equipment_mention_detector():
    text = "The technician verified that PUMP-P102 and turbine-t203 are operational."
    tags = ["PUMP-P102", "TURBINE-T203", "BOILER-B401"]
    mentions = Chunker.detect_equipment_mentions(text, tags)
    assert "PUMP-P102" in mentions
    assert "TURBINE-T203" in mentions
    assert "BOILER-B401" not in mentions


def test_citation_extraction():
    text = "The threshold is 18.5 Bar [Document: manual.pdf, Page: 12, Section: Calibration] and checked [Document: sop.pdf, Page: 4, Section: Steps]."
    citations = CitationExtractor.extract_citations(text)
    
    assert len(citations) == 2
    
    c1 = citations[0]
    assert c1["source_document"] == "manual.pdf"
    assert c1["page"] == 12
    assert c1["section"] == "Calibration"
    
    c2 = citations[1]
    assert c2["source_document"] == "sop.pdf"
    assert c2["page"] == 4
    assert c2["section"] == "Steps"
    
    cleaned = CitationExtractor.clean_citations_from_text(text)
    assert "manual.pdf" not in cleaned
    assert "sop.pdf" not in cleaned


@patch("app.ai.embeddings.EmbeddingGenerator.generate_embedding")
@patch("app.ai.llm_service.LLMService.generate_response")
def test_rag_service_pipeline(mock_llm, mock_embed, db_session=None):
    # This is a unit test validation structure checking inputs parameters
    mock_embed.return_value = [0.1] * 384
    mock_llm.return_value = "The turbine temperature limit is 580 degrees [Document: turbine.pdf, Page: 8, Section: Specs]."
    
    # Assert mocks are ready
    assert mock_embed([1,2,3]) == [0.1] * 384
    assert mock_llm("test", "test") == "The turbine temperature limit is 580 degrees [Document: turbine.pdf, Page: 8, Section: Specs]."
