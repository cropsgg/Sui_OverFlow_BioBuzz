from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BiomedicalNER:
    def __init__(self):
        """Initialize the biomedical NER model"""
        self.model_name = "d4data/biomedical-ner-all"
        self.tokenizer = None
        self.model = None
        self.nlp = None
        self.load_model()
    
    def load_model(self):
        """Load the pre-trained NER model for biomedical diseases"""
        try:
            logger.info(f"Loading model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForTokenClassification.from_pretrained(self.model_name)
            self.nlp = pipeline("ner", model=self.model, tokenizer=self.tokenizer, aggregation_strategy="simple")
            logger.info("Model loaded successfully!")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise e
    
    def extract_entities(self, text: str):
        """
        Extract named entities from biomedical text
        
        Args:
            text (str): Input biomedical text
            
        Returns:
            list: List of extracted entities with their labels and confidence scores
        """
        try:
            if not self.nlp:
                raise ValueError("Model not loaded properly")
            
            # Run the NER
            results = self.nlp(text)
            
            # Format results
            entities = []
            for entity in results:
                entities.append({
                    "word": entity['word'],
                    "entity_group": entity['entity_group'],
                    "score": round(entity['score'], 2),
                    "start": entity.get('start', 0),
                    "end": entity.get('end', 0)
                })
            
            return entities
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            raise e
    
    def print_entities(self, text: str):
        """
        Print named entities in a formatted way
        
        Args:
            text (str): Input biomedical text
        """
        entities = self.extract_entities(text)
        
        print(f"\nInput text: {text}")
        print("\nNamed Entities:")
        for entity in entities:
            print(f"{entity['word']} -> {entity['entity_group']} (score: {entity['score']:.2f})")
        
        return entities

# Example usage
if __name__ == "__main__":
    # Initialize the NER model
    ner_model = BiomedicalNER()
    
    # Sample biomedical sentence
    text = "Patients suffering from diabetes and Alzheimer's disease are at risk."
    
    # Extract and print entities
    ner_model.print_entities(text) 