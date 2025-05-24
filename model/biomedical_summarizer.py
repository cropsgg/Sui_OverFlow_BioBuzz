from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BiomedicalSummarizer:
    def __init__(self):
        """Initialize the biomedical text summarization model"""
        self.model_name = "facebook/bart-large-cnn"
        self.tokenizer = None
        self.model = None
        self.summarizer = None
        self.load_model()
    
    def load_model(self):
        """Load the pre-trained BART model for text summarization"""
        try:
            logger.info(f"Loading summarization model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            self.summarizer = pipeline("summarization", model=self.model, tokenizer=self.tokenizer)
            logger.info("Summarization model loaded successfully!")
        except Exception as e:
            logger.error(f"Error loading summarization model: {str(e)}")
            raise e
    
    def summarize_text(self, text: str, max_length: int = 60, min_length: int = 20, do_sample: bool = False):
        """
        Summarize biomedical text
        
        Args:
            text (str): Input biomedical text to summarize
            max_length (int): Maximum length of summary
            min_length (int): Minimum length of summary
            do_sample (bool): Whether to use sampling for generation
            
        Returns:
            dict: Summary with metadata
        """
        try:
            if not self.summarizer:
                raise ValueError("Summarization model not loaded properly")
            
            if not text.strip():
                raise ValueError("Text input cannot be empty")
            
            # Generate summary
            summary_result = self.summarizer(
                text, 
                max_length=max_length, 
                min_length=min_length, 
                do_sample=do_sample
            )
            
            # Extract summary text
            summary_text = summary_result[0]['summary_text']
            
            return {
                "original_text": text,
                "summary": summary_text,
                "original_length": len(text.split()),
                "summary_length": len(summary_text.split()),
                "compression_ratio": round(len(summary_text.split()) / len(text.split()), 2),
                "max_length": max_length,
                "min_length": min_length
            }
        except Exception as e:
            logger.error(f"Error summarizing text: {str(e)}")
            raise e
    
    def print_summary(self, text: str, **kwargs):
        """
        Print summary in a formatted way
        
        Args:
            text (str): Input biomedical text to summarize
            **kwargs: Additional arguments for summarization
        """
        result = self.summarize_text(text, **kwargs)
        
        print(f"\n{'='*50}")
        print("BIOMEDICAL TEXT SUMMARIZATION")
        print(f"{'='*50}")
        print(f"Original text ({result['original_length']} words):")
        print(f"{result['original_text'][:200]}...")
        print(f"\nSummary ({result['summary_length']} words):")
        print(f"{result['summary']}")
        print(f"\nCompression ratio: {result['compression_ratio']}")
        print(f"{'='*50}")
        
        return result

# Example usage
if __name__ == "__main__":
    # Initialize the summarization model
    summarizer_model = BiomedicalSummarizer()
    
    # Sample biomedical text
    biomedical_text = """
    Chronic obstructive pulmonary disease (COPD) is a common, preventable, and treatable disease characterized by persistent respiratory symptoms and airflow limitation 
    that is due to airway and/or alveolar abnormalities usually caused by significant exposure to noxious particles or gases. The most common symptoms include 
    dyspnea, chronic cough, and sputum production. COPD is associated with significant morbidity and mortality worldwide, leading to a substantial economic and social burden. 
    Early diagnosis and management can improve quality of life, reduce hospitalizations, and slow disease progression. Current therapies include smoking cessation, 
    pharmacologic treatments such as bronchodilators and corticosteroids, pulmonary rehabilitation, and oxygen therapy in advanced cases.
    """
    
    # Generate and print summary
    summarizer_model.print_summary(biomedical_text, max_length=60, min_length=20, do_sample=False) 