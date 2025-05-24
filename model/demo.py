#!/usr/bin/env python3
"""
Demo script showcasing Biomedical NER & Summarization capabilities
"""

from biomedical_ner import BiomedicalNER
from biomedical_summarizer import BiomedicalSummarizer
import time

def main():
    print("🧬 Biomedical NER & Summarization Demo")
    print("=" * 50)
    
    # Sample biomedical text
    biomedical_text = """
    Chronic obstructive pulmonary disease (COPD) is a common, preventable, and treatable disease characterized by persistent respiratory symptoms and airflow limitation 
    that is due to airway and/or alveolar abnormalities usually caused by significant exposure to noxious particles or gases. The most common symptoms include 
    dyspnea, chronic cough, and sputum production. COPD is associated with significant morbidity and mortality worldwide, leading to a substantial economic and social burden. 
    Early diagnosis and management can improve quality of life, reduce hospitalizations, and slow disease progression. Current therapies include smoking cessation, 
    pharmacologic treatments such as bronchodilators and corticosteroids, pulmonary rehabilitation, and oxygen therapy in advanced cases. Patient education about the disease, 
    self-management strategies, and adherence to treatment regimens are crucial for optimal outcomes. Healthcare providers should conduct regular assessments to monitor 
    disease progression and adjust treatment plans accordingly.
    """
    
    print("📄 Original Text:")
    print("-" * 30)
    print(biomedical_text.strip())
    print()
    
    # Initialize models
    print("🔄 Loading models...")
    ner_model = BiomedicalNER()
    summarizer_model = BiomedicalSummarizer()
    print("✅ Models loaded successfully!")
    print()
    
    # Extract entities
    print("🏷️  NAMED ENTITY RECOGNITION")
    print("-" * 30)
    entities = ner_model.extract_entities(biomedical_text)
    print(f"Found {len(entities)} biomedical entities:")
    for entity in entities:
        print(f"  • {entity['word']} → {entity['entity_group']} (confidence: {entity['score']:.2f})")
    print()
    
    # Generate summary
    print("📋 TEXT SUMMARIZATION")
    print("-" * 30)
    summary_result = summarizer_model.summarize_text(biomedical_text, max_length=80, min_length=30)
    print(f"Original length: {summary_result['original_length']} words")
    print(f"Summary length: {summary_result['summary_length']} words")
    print(f"Compression ratio: {summary_result['compression_ratio']}")
    print()
    print("Summary:")
    print(f"  {summary_result['summary']}")
    print()
    
    # Combined analysis
    print("🔬 COMBINED ANALYSIS")
    print("-" * 30)
    print("Key medical entities found in the summary:")
    summary_entities = ner_model.extract_entities(summary_result['summary'])
    if summary_entities:
        for entity in summary_entities:
            print(f"  • {entity['word']} ({entity['entity_group']})")
    else:
        print("  No specific medical entities found in the summary")
    
    print()
    print("=" * 50)
    print("🎉 Demo completed! Both models are working correctly.")
    print("🚀 You can now start the FastAPI server with: ./start_server.sh")

if __name__ == "__main__":
    main() 