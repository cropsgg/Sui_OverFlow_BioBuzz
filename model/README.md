# Biomedical NER & Summarization API

A FastAPI-based REST API for biomedical Named Entity Recognition (NER) and Text Summarization using transformer models:
- **NER**: `d4data/biomedical-ner-all` 
- **Summarization**: `facebook/bart-large-cnn`

## Features

- **Biomedical NER**: Extract entities like diseases, medications, and medical conditions from text
- **Text Summarization**: Generate concise summaries of biomedical literature and documents
- **Combined Processing**: Extract entities AND summarize text in a single API call
- **REST API**: Easy-to-use HTTP endpoints
- **Automatic Model Loading**: Downloads and caches models automatically
- **CORS Support**: Cross-origin requests enabled
- **API Documentation**: Automatic Swagger/OpenAPI docs

## Quick Start

### 1. Using the Shell Script (Recommended)

```bash
./start_server.sh
```

This script will:
- Create a virtual environment
- Install all dependencies
- Start the FastAPI server

### 2. Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python3 server.py
```

## API Endpoints

Once the server is running (default: `http://localhost:8000`):

### 1. Root Endpoint
```
GET /
```
Returns basic API information.

### 2. Health Check
```
GET /health
```
Check if the API and model are ready.

### 3. Extract Entities (Detailed)
```
POST /extract-entities
Content-Type: application/json

{
    "text": "Patients suffering from diabetes and Alzheimer's disease are at risk."
}
```

**Response:**
```json
{
    "input_text": "Patients suffering from diabetes and Alzheimer's disease are at risk.",
    "entities": [
        {
            "word": "diabetes",
            "entity_group": "Disease_disorder",
            "score": 0.99,
            "start": 24,
            "end": 32
        },
        {
            "word": "Alzheimer's disease",
            "entity_group": "Disease_disorder",
            "score": 0.76,
            "start": 37,
            "end": 56
        }
    ],
    "total_entities": 2
}
```

### 4. Analyze Text (Simple NER)
```
POST /analyze
Content-Type: application/json

{
    "text": "Patient has hypertension and chronic metformin medication."
}
```

### 5. Summarize Text
```
POST /summarize
Content-Type: application/json

{
    "text": "Chronic obstructive pulmonary disease (COPD) is a common, preventable, and treatable disease...",
    "max_length": 60,
    "min_length": 20,
    "do_sample": false
}
```

**Response:**
```json
{
    "original_text": "Chronic obstructive pulmonary disease (COPD) is a common...",
    "summary": "COPD is a preventable disease characterized by respiratory symptoms and airflow limitation.",
    "original_length": 95,
    "summary_length": 12,
    "compression_ratio": 0.13,
    "max_length": 60,
    "min_length": 20
}
```

### 6. Simple Summarization
```
POST /summarize-simple
Content-Type: application/json

{
    "text": "Long biomedical text to summarize..."
}
```

### 7. Combined NER + Summarization
```
POST /extract-and-summarize
Content-Type: application/json

{
    "text": "Patients with diabetes and COPD require specialized care...",
    "max_length": 30,
    "min_length": 10
}
```

**Response includes both entities and summary:**
```json
{
    "original_text": "Patients with diabetes and COPD require specialized care...",
    "summary": "Patients with diabetes and COPD need specialized care.",
    "entities": [
        {"word": "diabetes", "entity_group": "Disease_disorder", "score": 0.99},
        {"word": "COPD", "entity_group": "Disease_disorder", "score": 0.95}
    ],
    "total_entities": 2,
    "compression_ratio": 0.75
}
```

## Interactive API Documentation

Visit `http://localhost:8000/docs` for the interactive Swagger UI documentation.

## Example Usage

### Python Client
```python
import requests

# API endpoint
url = "http://localhost:8000/extract-entities"

# Sample text
data = {
    "text": "The patient was diagnosed with diabetes and prescribed metformin."
}

# Make request
response = requests.post(url, json=data)
result = response.json()

print("Entities found:")
for entity in result["entities"]:
    print(f"- {entity['word']} ({entity['entity_group']}: {entity['score']:.2f})")
```

### cURL
```bash
curl -X POST "http://localhost:8000/extract-entities" \
     -H "Content-Type: application/json" \
     -d '{"text": "Patient has diabetes and takes metformin daily."}'
```

## Supported Entity Types

The model can identify various biomedical entities including:
- **Disease_disorder**: Medical conditions, diseases
- **Chemical**: Medications, drugs, chemical compounds
- **Anatomy**: Body parts, organs
- **Gene_protein**: Genes and proteins
- And more...

## Model Information

- **Model**: `d4data/biomedical-ner-all`
- **Type**: BERT-based token classification
- **Domain**: Biomedical text
- **License**: Check model page for licensing information

## Requirements

- Python 3.8+
- Internet connection (for initial model download)
- ~2GB disk space (for model storage)

## Troubleshooting

### Model Download Issues
The model (~1.3GB) downloads automatically on first use. Ensure you have:
- Stable internet connection
- Sufficient disk space
- Hugging Face access (usually no authentication needed)

### Memory Issues
If you encounter memory issues:
- Ensure at least 4GB RAM available
- Close unnecessary applications
- Consider using a smaller model for testing

## Development

### Project Structure
```
model/
├── biomedical_ner.py    # Core NER model class
├── server.py            # FastAPI application
├── requirements.txt     # Python dependencies
├── start_server.sh      # Setup and start script
└── README.md           # This file
```

### Adding New Features
1. Modify `biomedical_ner.py` for model-related changes
2. Update `server.py` for new API endpoints
3. Update `requirements.txt` for new dependencies 