#!/usr/bin/env python3
"""
Test script for the Biomedical NER & Summarization API
"""

import requests
import json
import time
import sys

# API base URL
BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint: {data['message']}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_extract_entities():
    """Test the extract entities endpoint"""
    test_text = "Patients suffering from diabetes and Alzheimer's disease are at risk. The doctor prescribed metformin for blood sugar control."
    
    payload = {"text": test_text}
    
    try:
        response = requests.post(f"{BASE_URL}/extract-entities", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Extract entities endpoint working")
            print(f"   Input: {data['input_text'][:50]}...")
            print(f"   Found {data['total_entities']} entities:")
            
            for entity in data['entities']:
                print(f"   - {entity['word']} → {entity['entity_group']} (score: {entity['score']:.2f})")
            return True
        else:
            print(f"❌ Extract entities failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Extract entities error: {e}")
        return False

def test_analyze_endpoint():
    """Test the simple analyze endpoint"""
    test_text = "Patient has hypertension and chronic metformin medication."
    
    payload = {"text": test_text}
    
    try:
        response = requests.post(f"{BASE_URL}/analyze", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analyze endpoint working")
            print(f"   Found {data['count']} entities")
            
            for entity in data['entities']:
                print(f"   - {entity['word']} → {entity['entity_group']} (score: {entity['score']:.2f})")
            return True
        else:
            print(f"❌ Analyze endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Analyze endpoint error: {e}")
        return False

def test_summarization_endpoint():
    """Test the summarization endpoint"""
    test_text = """
    Chronic obstructive pulmonary disease (COPD) is a common, preventable, and treatable disease characterized by persistent respiratory symptoms and airflow limitation 
    that is due to airway and/or alveolar abnormalities usually caused by significant exposure to noxious particles or gases. The most common symptoms include 
    dyspnea, chronic cough, and sputum production. COPD is associated with significant morbidity and mortality worldwide, leading to a substantial economic and social burden. 
    Early diagnosis and management can improve quality of life, reduce hospitalizations, and slow disease progression. Current therapies include smoking cessation, 
    pharmacologic treatments such as bronchodilators and corticosteroids, pulmonary rehabilitation, and oxygen therapy in advanced cases.
    """
    
    payload = {
        "text": test_text.strip(),
        "max_length": 60,
        "min_length": 20,
        "do_sample": False
    }
    
    try:
        response = requests.post(f"{BASE_URL}/summarize", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Summarization endpoint working")
            print(f"   Original length: {data['original_length']} words")
            print(f"   Summary length: {data['summary_length']} words")
            print(f"   Compression ratio: {data['compression_ratio']}")
            print(f"   Summary: {data['summary'][:100]}...")
            return True
        else:
            print(f"❌ Summarization endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Summarization endpoint error: {e}")
        return False

def test_combined_endpoint():
    """Test the combined extract and summarize endpoint"""
    test_text = "Patients with diabetes and hypertension require careful monitoring. COPD is a chronic condition that affects breathing."
    
    payload = {
        "text": test_text,
        "max_length": 30,
        "min_length": 10
    }
    
    try:
        response = requests.post(f"{BASE_URL}/extract-and-summarize", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Combined endpoint working")
            print(f"   Found {data['total_entities']} entities")
            print(f"   Summary: {data['summary']}")
            print(f"   Compression ratio: {data['compression_ratio']}")
            return True
        else:
            print(f"❌ Combined endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Combined endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Biomedical NER & Summarization API")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    print("Waiting for server to be ready...")
    time.sleep(2)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Root Endpoint", test_root_endpoint),
        ("Extract Entities", test_extract_entities),
        ("Analyze Endpoint", test_analyze_endpoint),
        ("Summarization Endpoint", test_summarization_endpoint),
        ("Combined Endpoint", test_combined_endpoint)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("😞 Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 