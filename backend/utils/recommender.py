def infer_rating(score):
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Average"
    else:
        return "Poor"

def find_missing_skills(resume_skills, job_skills):
    """Returns skills that are in job_skills but not in resume_skills."""
    return list(set(job_skills) - set(resume_skills))

def recommend_courses(missing_skills):
    """Mock recommendation logic mapping missing skills to courses."""
    course_catalog = {
        'docker': {"title": "Docker Mastery", "link": "https://example.com/docker"},
        'kubernetes': {"title": "Kubernetes for Beginners", "link": "https://example.com/k8s"},
        'python': {"title": "Complete Python Bootcamp", "link": "https://example.com/python"},
        'react': {"title": "React - The Complete Guide", "link": "https://example.com/react"},
        'aws': {"title": "AWS Certified Solutions Architect", "link": "https://example.com/aws"},
    }
    
    recommendations = []
    for skill in missing_skills:
        if skill in course_catalog:
            recommendations.append(course_catalog[skill])
            
    if not recommendations:
        recommendations.append({"title": "General Full Stack Developer Course", "link": "https://example.com/fullstack"})
        
    return recommendations

def check_grammar(text):
    """Mock grammar checking using language_tool_python style output."""
    # In a real app:
    # import language_tool_python
    # tool = language_tool_python.LanguageTool('en-US')
    # matches = tool.check(text)
    
    feedback = []
    if "responsable" in text.lower():
        feedback.append({"issue": "Spelling mistake: 'responsable'", "suggestion": "responsible"})
    if len(text.split('.')) < 5:
        feedback.append({"issue": "Content is too brief", "suggestion": "Add more complete sentences with full stops."})
        
    return feedback

def recommend_job_role(resume_skills):
    """Naive role recommendation based on skill presence."""
    if 'react' in resume_skills and 'css' in resume_skills:
        return "Frontend Developer"
    if 'python' in resume_skills and 'flask' in resume_skills:
        return "Backend Developer"
    if 'docker' in resume_skills or 'aws' in resume_skills:
        return "DevOps Engineer"
    
    return "Software Engineer"
