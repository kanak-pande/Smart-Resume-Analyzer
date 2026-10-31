from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os

from utils.parser import extract_text
from utils.nlp_engine import extract_skills, calculate_ats_score
from utils.recommender import infer_rating, find_missing_skills, recommend_courses, check_grammar, recommend_job_role
from utils.db import save_analysis

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    job_description = request.form.get('job_description', '')
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        # Step 1: Parsing
        with open(filepath, 'rb') as f:
            resume_text = extract_text(f, filename)
            
        # Step 2: NLP Entities & Skill Extraction
        resume_skills = extract_skills(resume_text)
        job_skills = extract_skills(job_description) if job_description else []
        
        # Step 3: Match & Score
        ats_score = calculate_ats_score(resume_text, job_description)
        rating = infer_rating(ats_score)
        
        # Step 4: Recommender engines
        missing_skills = find_missing_skills(resume_skills, job_skills) if job_skills else []
        matched_skills = list(set(resume_skills).intersection(set(job_skills))) if job_skills else resume_skills
        
        courses = recommend_courses(missing_skills)
        grammar_issues = check_grammar(resume_text)
        role_recommended = recommend_job_role(resume_skills)
        
        response_data = {
            "ats_score": ats_score,
            "resume_rating": rating,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "grammar_feedback": grammar_issues,
            "recommended_courses": courses,
            "job_role_recommendation": role_recommended
        }
        
        # Save to DB asynchronously or wait
        save_analysis(response_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
