import pytest
from unittest.mock import patch, MagicMock
from app.ai.rag_service import RAGService
from app.services.agent_orchestrator import AgentOrchestrator

@patch("os.getenv")
@patch("app.ai.llm_service.LLMService.generate_response")
def test_rag_service_intent_classification(mock_llm, mock_getenv):
    # Force LLM_PROVIDER to be non-mock during testing
    mock_getenv.side_effect = lambda key, default=None: "groq" if key == "LLM_PROVIDER" else default

    # Test case 1: LLM returns twin intent
    mock_llm.return_value = "twin"
    intent = RAGService.classify_intent("tell me about the compressor history")
    assert intent == "twin"
    
    # Test case 2: LLM returns discovery intent
    mock_llm.return_value = "discovery"
    intent = RAGService.classify_intent("do we have missing compliance logs?")
    assert intent == "discovery"

    # Test case 3: LLM returns invalid category (should fallback to general_rag)
    mock_llm.return_value = "invalid_category"
    intent = RAGService.classify_intent("some query")
    assert intent == "general_rag"
    
    # Test case 4: LLM throws exception (should fallback to general_rag)
    mock_llm.side_effect = RuntimeError("Service offline")
    intent = RAGService.classify_intent("some query")
    assert intent == "general_rag"


@patch("os.getenv")
@patch("app.ai.llm_service.LLMService.generate_response")
def test_agent_orchestrator_routing(mock_llm, mock_getenv):
    # Force LLM_PROVIDER to be non-mock during testing
    mock_getenv.side_effect = lambda key, default=None: "groq" if key == "LLM_PROVIDER" else default

    # Test case 1: LLM returns decision intent
    mock_llm.side_effect = None
    mock_llm.return_value = "decision"
    intent = AgentOrchestrator.classify_intent("what action should I take next?")
    assert intent == "decision"
    
    # Test case 2: LLM returns executive intent
    mock_llm.return_value = "executive"
    intent = AgentOrchestrator.classify_intent("plant health strategic view")
    assert intent == "executive"
