/**
 * Readiness Scoring Service
 * Provides transparent, algorithmic scoring for student placement readiness.
 * Does NOT predict employment chances. Focuses strictly on preparation indicators.
 */

function calculateReadiness(student, applications, interviews, roadmapItems) {
    const scores = [];
    const strengths = [];
    const improvements = [];
    const nextActions = [];

    // 1. Resume Quality (Based on ATS parsing and presence of key sections)
    let resumeScore = 0;
    let resumeReason = "No resume profile found. Please upload a resume.";
    if (student.resumeProfile) {
        resumeScore = Math.min(100, Math.round((student.resumeProfile.skills?.length > 10 ? 40 : 20) + 
                                     (student.resumeProfile.projects?.length > 10 ? 30 : 10) + 
                                     (student.resumeProfile.experience?.length > 5 ? 30 : 10)));
        if (resumeScore > 75) {
            resumeReason = "Resume contains well-structured skills, projects, and experience sections.";
            strengths.push("Strong resume foundation.");
        } else {
            resumeReason = "Resume is missing detailed project descriptions or quantified experience.";
            improvements.push("Enhance resume with quantified achievements.");
            nextActions.push("Update your resume using the Resume Intelligence tool.");
        }
    } else {
        improvements.push("Upload your resume to start tracking readiness.");
        nextActions.push("Upload a resume.");
    }
    scores.push({ name: "Resume Quality", score: resumeScore, reason: resumeReason });

    // 2. Interview Practice (Based on number and scores of mock interviews)
    let interviewScore = 0;
    let interviewReason = "No mock interviews completed.";
    if (interviews.length > 0) {
        const avgScore = interviews.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / interviews.length;
        // Cap at 100 based on formula: (number of interviews * 10) + (avgScore * 0.7)
        interviewScore = Math.min(100, Math.round((interviews.length * 10) + (avgScore * 0.7)));
        interviewReason = `Student has completed ${interviews.length} mock interview(s) with an average technical score of ${Math.round(avgScore)}/100.`;
        if (interviewScore > 70) {
            strengths.push("Consistent interview practice.");
        } else {
            improvements.push("Increase mock interview frequency.");
            nextActions.push("Schedule a Technical Mock Interview.");
        }
    } else {
        improvements.push("No interview practice recorded.");
        nextActions.push("Start your first AI Mock Interview.");
    }
    scores.push({ name: "Interview Practice", score: interviewScore, reason: interviewReason });

    // 3. Technical Preparation (Based on completed Roadmap Items)
    let techScore = 0;
    let techReason = "No skill roadmap generated yet.";
    if (roadmapItems.length > 0) {
        const completed = roadmapItems.filter(r => r.status === 'COMPLETED').length;
        techScore = Math.min(100, Math.round((completed / roadmapItems.length) * 100));
        techReason = `Completed ${completed} out of ${roadmapItems.length} personalized technical roadmap goals.`;
        if (techScore > 75) {
            strengths.push("Excellent progress on technical skill gaps.");
        } else if (techScore > 0) {
            improvements.push("Complete more pending skill roadmap items.");
            nextActions.push("Check off pending items in the Skill Gap module.");
        } else {
            improvements.push("Start working on your skill gap roadmap.");
            nextActions.push("Complete your first roadmap item.");
        }
    } else {
        improvements.push("Generate a skill roadmap to guide your learning.");
        nextActions.push("Generate a Skill Roadmap targeting your desired role.");
    }
    scores.push({ name: "Technical Preparation", score: techScore, reason: techReason });

    // 4. Application Activity
    let appScore = 0;
    let appReason = "No job applications tracked.";
    if (applications.length > 0) {
        // Simple metric: 10 points per application, max 100
        appScore = Math.min(100, applications.length * 10);
        appReason = `Student is actively tracking ${applications.length} job applications.`;
        if (appScore >= 50) {
            strengths.push("Active engagement with job market.");
        } else {
            improvements.push("Increase application volume.");
            nextActions.push("Apply for recommended jobs in the Job Matches tab.");
        }
    } else {
        improvements.push("No active applications.");
        nextActions.push("Explore Job Matches and start applying.");
    }
    scores.push({ name: "Application Activity", score: appScore, reason: appReason });

    // Overall Readiness Calculation
    const totalWeights = scores.length;
    const overallScore = Math.round(scores.reduce((acc, curr) => acc + curr.score, 0) / totalWeights);

    // Fallbacks
    if (strengths.length === 0) strengths.push("Begin using PlacementOS tools to discover your strengths.");
    if (improvements.length === 0) improvements.push("Maintain current momentum.");
    if (nextActions.length === 0) nextActions.push("Keep practicing and applying.");

    return {
        overallScore,
        components: scores,
        strengths: [...new Set(strengths)].slice(0, 3), // max 3 unique
        improvements: [...new Set(improvements)].slice(0, 3),
        nextActions: [...new Set(nextActions)].slice(0, 3)
    };
}

module.exports = { calculateReadiness };
