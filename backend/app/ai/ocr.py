import io
import pytesseract
from PIL import Image
from app.core.logging import logger

# Set path wrapper defensively for local environments if standard path fails
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def is_tesseract_available() -> bool:
    """Utility checking tesseract binaries accessibility in host environment path."""
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        logger.warning("tesseract_ocr_binary_not_found_on_path")
        return False


def perform_ocr_on_image_bytes(image_bytes: bytes) -> str:
    """Loads image streams from payload bytes and computes characters extraction."""
    if not image_bytes:
        return ""
        
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert to grayscale for better OCR results
        image = image.convert("L")
        
        # Execute OCR computation
        extracted_text = pytesseract.image_to_string(image)
        return extracted_text.strip()
    except Exception as e:
        logger.error("ocr_image_extraction_failed", error=str(e))
        return ""


def perform_ocr_on_pil_image(image: Image.Image) -> str:
    """Executes character extraction on a PIL Image object."""
    try:
        # Convert image to grayscale for enhanced OCR accuracy
        gray_image = image.convert("L")
        text = pytesseract.image_to_string(gray_image)
        return text.strip()
    except Exception as e:
        logger.error("ocr_pil_image_extraction_failed", error=str(e))
        return ""
