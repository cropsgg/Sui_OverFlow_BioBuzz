from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from biomedical_ner import BiomedicalNER
from biomedical_summarizer import BiomedicalSummarizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Biomedical NER & Summarization API",
    description="API for biomedical Named Entity Recognition and Text Summarization using transformer models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the models
ner_model = None
summarizer_model = None

# Pydantic models for request/response
class TextInput(BaseModel):
    text: str

class EntityResponse(BaseModel):
    word: str
    entity_group: str
    score: float
    start: int
    end: int

class NERResponse(BaseModel):
    input_text: str
    entities: List[EntityResponse]
    total_entities: int

class SummarizationInput(BaseModel):
    text: str
    max_length: Optional[int] = 60
    min_length: Optional[int] = 20
    do_sample: Optional[bool] = False

class SummarizationResponse(BaseModel):
    original_text: str
    summary: str
    original_length: int
    summary_length: int
    compression_ratio: float
    max_length: int
    min_length: int

@app.on_event("startup")
async def startup_event():
    """Initialize the models on startup"""
    global ner_model, summarizer_model
    try:
        logger.info("Initializing biomedical NER model...")
        ner_model = BiomedicalNER()
        logger.info("NER model initialized successfully!")
        
        logger.info("Initializing biomedical summarization model...")
        summarizer_model = BiomedicalSummarizer()
        logger.info("Summarization model initialized successfully!")
        
        logger.info("All models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to initialize models: {str(e)}")
        raise e

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Biomedical NER & Summarization API", 
        "status": "active",
        "models": {
            "ner": "d4data/biomedical-ner-all",
            "summarization": "facebook/bart-large-cnn"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": {
            "ner": ner_model is not None,
            "summarizer": summarizer_model is not None
        }
    }

@app.post("/extract-entities", response_model=NERResponse)
async def extract_entities(input_data: TextInput):
    """
    Extract biomedical entities from text
    
    Args:
        input_data: TextInput containing the text to analyze
        
    Returns:
        NERResponse: Extracted entities with metadata
    """
    try:
        if not ner_model:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        if not input_data.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty")
        
        # Extract entities
        entities = ner_model.extract_entities(input_data.text)
        
        # Format response
        entity_responses = [
            EntityResponse(
                word=entity["word"],
                entity_group=entity["entity_group"],
                score=entity["score"],
                start=entity["start"],
                end=entity["end"]
            )
            for entity in entities
        ]
        
        return NERResponse(
            input_text=input_data.text,
            entities=entity_responses,
            total_entities=len(entity_responses)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/analyze")
async def analyze_text(input_data: TextInput):
    """
    Simplified endpoint for text analysis
    
    Args:
        input_data: TextInput containing the text to analyze
        
    Returns:
        dict: Simple response with entities
    """
    try:
        if not ner_model:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        entities = ner_model.extract_entities(input_data.text)
        
        return {
            "text": input_data.text,
            "entities": entities,
            "count": len(entities)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize", response_model=SummarizationResponse)
async def summarize_text(input_data: SummarizationInput):
    """
    Summarize biomedical text
    
    Args:
        input_data: SummarizationInput containing the text and parameters
        
    Returns:
        SummarizationResponse: Summary with metadata
    """
    try:
        if not summarizer_model:
            raise HTTPException(status_code=503, detail="Summarization model not loaded")
        
        if not input_data.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty")
        
        # Generate summary
        result = summarizer_model.summarize_text(
            text=input_data.text,
            max_length=input_data.max_length,
            min_length=input_data.min_length,
            do_sample=input_data.do_sample
        )
        
        return SummarizationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing summarization request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/summarize-simple")
async def summarize_simple(input_data: TextInput):
    """
    Simple summarization endpoint with default parameters
    
    Args:
        input_data: TextInput containing the text to summarize
        
    Returns:
        dict: Simple response with summary
    """
    try:
        if not summarizer_model:
            raise HTTPException(status_code=503, detail="Summarization model not loaded")
        
        if not input_data.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty")
        
        result = summarizer_model.summarize_text(input_data.text)
        
        return {
            "original_text": result["original_text"],
            "summary": result["summary"],
            "compression_ratio": result["compression_ratio"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simple summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-and-summarize")
async def extract_and_summarize(input_data: SummarizationInput):
    """
    Combined endpoint: Extract entities and summarize text
    
    Args:
        input_data: SummarizationInput containing the text and parameters
        
    Returns:
        dict: Combined response with entities and summary
    """
    try:
        if not ner_model or not summarizer_model:
            raise HTTPException(status_code=503, detail="One or more models not loaded")
        
        if not input_data.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty")
        
        # Extract entities
        entities = ner_model.extract_entities(input_data.text)
        
        # Generate summary
        summary_result = summarizer_model.summarize_text(
            text=input_data.text,
            max_length=input_data.max_length,
            min_length=input_data.min_length,
            do_sample=input_data.do_sample
        )
        
        return {
            "original_text": input_data.text,
            "summary": summary_result["summary"],
            "entities": entities,
            "total_entities": len(entities),
            "compression_ratio": summary_result["compression_ratio"],
            "original_length": summary_result["original_length"],
            "summary_length": summary_result["summary_length"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in combined processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 