from typing import List
from sentence_transformers import SentenceTransformer
from app.core.logging import logger

class EmbeddingGenerator:
    """Singleton wrapper for local sentence-transformers vector embedding generation."""
    _model_instance = None
    MODEL_NAME = "BAAI/bge-small-en-v1.5"

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Retrieves or lazy-loads the model instance using CPU configurations."""
        if cls._model_instance is None:
            logger.info("loading_sentence_transformer_model", model=cls.MODEL_NAME)
            try:
                # Load sentence transformer model, force CPU usage for standard containers
                cls._model_instance = SentenceTransformer(cls.MODEL_NAME, device="cpu")
                logger.info("sentence_transformer_model_loaded_successfully")
            except Exception as e:
                logger.error("failed_to_load_sentence_transformer_model", error=str(e))
                raise RuntimeError(f"Could not initialize embedding transformer: {str(e)}")
        return cls._model_instance

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """Generates a dense vector embedding for a single text block (384 dimensions)."""
        model = cls.get_model()
        # Ensure input is simple string
        text_input = str(text).strip()
        embedding = model.encode(text_input, normalize_embeddings=True)
        return embedding.tolist()

    @classmethod
    def generate_embeddings_batch(cls, texts: List[str]) -> List[List[float]]:
        """Generates dense vector embeddings for a batch of text blocks."""
        if not texts:
            return []
        model = cls.get_model()
        cleaned_texts = [str(t).strip() for t in texts]
        embeddings = model.encode(cleaned_texts, normalize_embeddings=True)
        return embeddings.tolist()
