import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# In a real scenario, this would load 'en_core_web_sm'
# try:
#     nlp = spacy.load("en_core_web_sm")
# except:
#     import spacy.cli
#     spacy.cli.download("en_core_web_sm")
#     nlp = spacy.load("en_core_web_sm")

# Hardcoded skill database for demonstration
SKILL_DB = [
    'python', 'java', 'c++', 'javascript', 'react', 'node.js', 'sql', 'nosql',
    'docker', 'kubernetes', 'aws', 'azure', 'machine learning', 'nlp', 'data science',
    'html', 'css', 'flask', 'django', 'fastapi', 'git', 'agile', 'scrum'
]

def clean_text(text):
    """Basic text cleaning."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return text

def extract_skills(text):
    """Extracts skills from text based on predefined SKILL_DB."""
    cleaned = clean_text(text)
    words = set(cleaned.split())
    
    found_skills = set()
    for skill in SKILL_DB:
        # Simple exact matching for demonstration
        if skill in cleaned:
            found_skills.add(skill)
            
    return list(found_skills)

def calculate_ats_score(resume_text, job_desc_text):
    """
    Calculates the ATS match score using Cosine Similarity on TF-IDF vectors.
    """
    if not resume_text or not job_desc_text:
        return 0.0
        
    documents = [resume_text, job_desc_text]
    vectorizer = TfidfVectorizer(stop_words='english')
    
    try:
        tfidf_matrix = vectorizer.fit_transform(documents)
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        score = similarity[0][0] * 100
        return round(score, 2)
    except:
        return 0.0
