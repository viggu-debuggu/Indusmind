from typing import List, Dict, Any

class PromptBuilder:
    """Formulates prompts and contextual anchors for RAG engineering pipelines."""

    @staticmethod
    def build_system_prompt() -> str:
        """Returns the core system constraints for industrial engineering assistants."""
        return (
            "You are an industrial engineering assistant named Indusmind AI Copilot.\n"
            "For general greetings (like 'hi', 'hello', 'who are you', 'how are you'), respond friendly, introduce yourself, and state that you help with manuals and SOPs.\n"
            "For all technical, engineering, equipment, and operations questions, answer ONLY from the retrieved context.\n"
            "If technical answer is unavailable, you must output the exact fallback phrase:\n"
            "'I could not find this information in the uploaded documents.'\n\n"
            "Always include page references.\n"
            "Always include document names.\n"
            "Never hallucinate.\n\n"
            "Formatting Rules:\n"
            "1. Ground every statement or paragraph with inline citations. \n"
            "   Use the format: [Document: <filename>, Page: <page_no>, Section: <section_title>]\n"
            "   Example: The high pressure limits should not exceed 18.5 Bar [Document: pump_operating_manual.pdf, Page: 14, Section: Pressure Thresholds].\n"
            "2. If multiple sources back a statement, include multiple citation tags.\n"
            "3. Do not formulate technical answers from external training data. If context is missing, output the exact fallback phrase."
        )

    @staticmethod
    def build_user_prompt(question: str, chunks_data: List[Dict[str, Any]]) -> str:
        """Assembles context injection mapping context blocks above the user's question."""
        context_blocks = []
        for idx, chunk in enumerate(chunks_data):
            doc_name = chunk["document_name"]
            page_no = chunk["page"]
            section = chunk["section"]
            text_content = chunk["text"]
            
            block = (
                f"--- CONTEXT BLOCK {idx + 1} ---\n"
                f"Document: {doc_name}\n"
                f"Page: {page_no}\n"
                f"Section: {section}\n"
                f"Text:\n{text_content}\n"
            )
            context_blocks.append(block)
            
        context_str = "\n".join(context_blocks)
        
        user_prompt = (
            f"Retrieved Document Context:\n"
            f"=========================================\n"
            f"{context_str}\n"
            f"=========================================\n\n"
            f"User Question: {question}\n\n"
            f"Provide a clear, citation-backed engineering answer following the system rules:"
        )
        return user_prompt
