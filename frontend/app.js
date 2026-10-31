// Initialize Lucide Icons
lucide.createIcons();

// --- DEMO MODE BYPASS ---
// Automatically provide a dummy API key so all features unlock without user input
if (!localStorage.getItem('geminiApiKey') || localStorage.getItem('geminiApiKey') === '') {
    localStorage.setItem('geminiApiKey', 'demo-mode-active-no-api-key-needed');
}

// --- Global Skill Database ---
const SKILL_DB = [
  'javascript', 'html', 'css', 'react', 'node.js', 'python', 'java', 'c++', 
  'sql', 'nosql', 'mongodb', 'docker', 'kubernetes', 'aws', 'azure', 
  'machine learning', 'nlp', 'data science', 'flask', 'django', 'fastapi', 
  'git', 'agile', 'scrum', 'typescript', 'angular', 'vue', 'rest api', 
  'graphql', 'linux', 'bash', 'communication', 'leadership', 'teamwork', 'cloud', 'ui', 'ux', 'design'
];

let myChart = null; // Store chart instance

// --- Theme Toggle ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
let currentTheme = 'dark';

themeToggleBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  if (currentTheme === 'dark') {
    themeIcon.setAttribute('data-lucide', 'sun');
  } else {
    themeIcon.setAttribute('data-lucide', 'moon');
  }
  lucide.createIcons();
});

// --- Settings Modal ---
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');

// Load saved key on startup
geminiApiKeyInput.value = localStorage.getItem('geminiApiKey') || '';

settingsToggleBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

saveSettingsBtn.addEventListener('click', () => {
  localStorage.setItem('geminiApiKey', geminiApiKeyInput.value.trim());
  settingsModal.style.display = 'none';
  alert("Settings saved!");
});


// --- Page Nav ---
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
    page.classList.remove('active');
  });
  const target = document.getElementById(pageId + '-page');
  target.style.display = 'block';
  setTimeout(() => target.classList.add('active'), 10);
}

// --- Upload Zone ---
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileUpload');
const fileNameDisplay = document.getElementById('fileNameDisplay');
let selectedFile = null;

uploadZone.addEventListener('click', (e) => {
  if (e.target !== fileInput) {
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    selectedFile = e.target.files[0];
    fileNameDisplay.textContent = selectedFile.name;
    fileNameDisplay.style.color = "var(--primary-color)";
  }
});

uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone.classList.remove('dragover'); });
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault(); uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedFile = e.dataTransfer.files[0];
    fileNameDisplay.textContent = selectedFile.name;
    fileNameDisplay.style.color = "var(--primary-color)";
  }
});

// --- Parsers ---
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => item.str).join(' ') + "\n";
  }
  return fullText;
}

async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value || "";
  } catch (err) { return ""; }
}

function extractSkills(text) {
  const cleanedText = text.toLowerCase().replace(/[^a-z0-9#\+\.\s]/g, ' ');
  const foundSkills = new Set();
  for (let skill of SKILL_DB) {
    if (cleanedText.includes(skill)) foundSkills.add(skill);
  }
  return Array.from(foundSkills);
}

// --- Format Checker ---
function checkResumeFormat(text) {
  const lowerText = text.toLowerCase();
  const sections = [
    { name: "Education", keywords: ["education", "university", "college", "degree", "bachelor"] },
    { name: "Experience", keywords: ["experience", "employment", "work history", "career"] },
    { name: "Projects", keywords: ["projects", "portfolio", "personal project"] },
    { name: "Skills", keywords: ["skills", "technologies", "tech stack", "competencies"] },
    { name: "Contact Information", keywords: ["email", "phone", "linkedin", "github", "@", ".com"] }
  ];
  
  const results = [];
  sections.forEach(sec => {
    const found = sec.keywords.some(kw => lowerText.includes(kw));
    results.push({ name: sec.name, found: found });
  });
  return results;
}

// --- Keyword Density ---
function getKeywordDensity(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 4);
  const stopWords = ['about', 'there', 'which', 'their', 'would', 'these', 'other', 'could'];
  const counts = {};
  
  words.forEach(word => {
    if(!stopWords.includes(word)) {
      counts[word] = (counts[word] || 0) + 1;
    }
  });

  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  return sorted.slice(0, 5); // Return top 5
}

// --- Package Estimator ---
function estimatePackage(roles, score) {
  const primaryRole = roles[0] || "";
  let baseUSD = 60000;
  let baseINR = 500000; // 5 LPA base for tech

  if(primaryRole.includes('Senior')) { baseUSD = 120000; baseINR = 1800000; }
  else if(primaryRole.includes('Developer') || primaryRole.includes('Analyst') || primaryRole.includes('Engineer')) { baseUSD = 80000; baseINR = 800000; }
  else if(primaryRole.includes('Junior')) { baseUSD = 50000; baseINR = 400000; }

  // Adjust mathematically by ATS score (quality multiplier)
  const multiplier = Math.max(score / 100, 0.4); // Floor at 0.4 to prevent 0 salary
  
  const minUSD = Math.floor((baseUSD * multiplier) / 1000) * 1000;
  const maxUSD = Math.floor((baseUSD * multiplier * 1.3) / 1000) * 1000;
  
  const minINR = Math.floor((baseINR * multiplier) / 100000) * 100000;
  const maxINR = minINR + 400000 + (score > 80 ? 300000 : 0);

  const formatLPA = (val) => (val / 100000).toFixed(1) + " LPA";

  return {
    usd: `$${Math.max(minUSD, 30000).toLocaleString()} - $${Math.max(maxUSD, 45000).toLocaleString()}`,
    inr: `₹ ${formatLPA(Math.max(minINR, 300000))} - ₹ ${formatLPA(Math.max(maxINR, 500000))}`
  };
}

// --- Interview Questions Generator ---
function generateInterviewQuestions(matchedSkills, missingSkills, role) {
  const questions = [];
  
  if (role.includes('Developer') || role.includes('Engineer')) {
      questions.push("Describe a challenging technical problem you solved recently and how you approached it.");
      questions.push("How do you ensure your code is scalable and maintainable?");
  } else if (role.includes('Data')) {
      questions.push("Explain how you handle missing or corrupt data in a dataset.");
      questions.push("What techniques do you use to validate your analytical models?");
  } else {
      questions.push("Tell me about a time you had to adapt to a significant change at work.");
  }

  if (matchedSkills.includes('javascript') || matchedSkills.includes('typescript')) {
      questions.push("Explain closures in JavaScript and provide a practical use case.");
      questions.push("What is the event loop and how does it handle asynchronous operations?");
  }
  if (matchedSkills.includes('react') || matchedSkills.includes('angular') || matchedSkills.includes('vue')) {
      questions.push("Can you explain the Virtual DOM and how it improves UI rendering performance?");
      questions.push("How do you typically manage complex state in a large frontend application?");
  }
  if (matchedSkills.includes('java') || matchedSkills.includes('c++')) {
      questions.push("Explain the 4 pillars of Object-Oriented Programming (OOP) with examples.");
  }
  if (matchedSkills.includes('python')) {
      questions.push("What are decorators in Python and how do they work?");
      questions.push("Explain the difference between a shallow copy and a deep copy.");
  }
  if (matchedSkills.includes('node.js') || matchedSkills.includes('django') || matchedSkills.includes('flask')) {
      questions.push("How would you design a secure and reliable RESTful API?");
  }
  if (matchedSkills.includes('sql') || matchedSkills.includes('nosql') || matchedSkills.includes('mongodb')) {
      questions.push("How do you optimize a slow-performing database query?");
      questions.push("What are the core differences between SQL and NoSQL, and when do you use each?");
  }
  if (matchedSkills.includes('aws') || matchedSkills.includes('docker') || matchedSkills.includes('cloud')) {
      questions.push("What are the primary benefits and challenges of transitioning to a microservices architecture?");
      questions.push("Explain containerization and its advantages over traditional virtual machines.");
  }
  if (matchedSkills.includes('git')) {
      questions.push("Walk me through your typical Git workflow for branching strategy and resolving merge conflicts.");
  }

  // Handle missing skills dynamically
  if (missingSkills.length > 0) {
      questions.push(`Our tech stack heavily involves ${missingSkills[0].toUpperCase()}. How would you go about getting up to speed quickly?`);
  }
  if (missingSkills.length > 1) {
      questions.push(`If assigned a priority task requiring ${missingSkills[1].toUpperCase()} which you noted as a missing skill, what is your first step to execute it?`);
  }

  return Array.from(new Set(questions)).slice(0, 10);
}

// --- Role Recommendation ---
function recommendRole(skills, score) {
  if (score < 30) return ["Entry Level Intern", "Junior Associate"];
  
  const dsSkills = ['python', 'machine learning', 'data science', 'sql', 'nlp'];
  const webSkills = ['html', 'css', 'javascript', 'react', 'node.js', 'typescript', 'angular', 'vue'];
  const javaDev = ['java', 'sql', 'agile', 'scrum'];
  const design = ['ui', 'ux', 'design', 'css', 'html'];
  const cloud = ['aws', 'azure', 'docker', 'kubernetes', 'linux'];
  
  const countMatch = (arr) => arr.filter(s => skills.includes(s)).length;
  
  let roles = [
    { title: "Data Scientist / Analyst", matches: countMatch(dsSkills) },
    { title: "Frontend / Web Developer", matches: countMatch(webSkills) },
    { title: "Java / Backend Developer", matches: countMatch(javaDev) },
    { title: "UI/UX Designer", matches: countMatch(design) },
    { title: "Cloud / DevOps Engineer", matches: countMatch(cloud) }
  ];
  
  roles.sort((a,b) => b.matches - a.matches);
  if (roles[0].matches === 0) return ["General IT Professional", "Operations"];
  
  const prefix = score > 85 ? "Senior " : "";
  // Return top 3 non-zero matching roles, or just the top 1 if others are 0
  const topRoles = roles.filter(r => r.matches > 0).slice(0, 3).map(r => prefix + r.title);
  if (topRoles.length === 0) topRoles.push("Software Engineer");
  
  return topRoles;
}

// --- Scoring Configuration (Explainable Engine) ---
const SCORING_CONFIG = {
  weights: {
    skillsMatch: 25,
    requiredSkills: 20,
    semanticRelevance: 15,
    experienceRelevance: 15,
    education: 10,
    keywords: 5,
    achievements: 5,
    format: 5
  }
};

// --- JD Priority Analyzer ---
async function analyzeJobDescription(jdText) {
  if (!jdText) return null;
  const prompt = `Analyze this job description and extract requirements. Classify them into EXACTLY 4 categories: "MUST HAVE", "STRONGLY PREFERRED", "PREFERRED", and "NICE TO HAVE". Return the result strictly as a valid JSON object matching this structure: 
  {
    "must_have": ["skill1", "skill2"],
    "strongly_preferred": ["skill3"],
    "preferred": ["skill4"],
    "nice_to_have": ["skill5"]
  }
  Do not include markdown blocks or any other text. Only valid JSON.
  
  Job Description: ${jdText}`;
  
  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
} catch (err) {
    console.error("JD Analysis Error:", err);
    return null;
  }
}

// --- Phase 3: Semantic Skill Matching ---
async function performSemanticMatching(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) return null;
  const prompt = `Perform a semantic skill match between the following Resume and Job Description.
  Do not rely only on exact keyword matching. Recognize related concepts (e.g., Express.js -> Node.js).
  Extract a list of matched skills.
  Return strictly valid JSON in this format:
  [
    { "skill": "Node.js", "status": "Strong semantic match", "evidence": "Used Express.js for backend", "color": "#10b981" },
    { "skill": "AWS", "status": "Related technology", "evidence": "Used Azure cloud", "color": "#f59e0b" }
  ]
  Resume: ${resumeText}
  Job Description: ${jobDescription}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Semantic Match Error:", err);
    return null;
  }
}

// --- Phase 3: Evidence Verification ---
async function verifyClaims(resumeText) {
  if (!resumeText) return null;
  const prompt = `Analyze this resume and verify if the important skills and claims have supporting evidence in the projects or experience sections.
  Look for high-impact claims (like "Improved performance by 40%").
  Return strictly valid JSON in this format:
  [
    { "claim": "AWS", "status": "Unsupported Skill Claim", "message": "This skill appears in your resume but supporting evidence was not detected in your projects.", "is_warning": true },
    { "claim": "Improved performance by 40%", "status": "High-Impact Claim", "message": "Strong metric detected, but lacks context on how it was achieved.", "is_warning": true },
    { "claim": "React", "status": "Verified", "message": "Strong evidence found in Project X.", "is_warning": false }
  ]
  Resume: ${resumeText}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Evidence Verification Error:", err);
    return null;
  }
}

// --- Phase 4: Bullet Point Analyzer ---
async function analyzeBullets(resumeText) {
  if (!resumeText) return null;
  const prompt = `Extract exactly 2 of the most prominent bullet points from the Experience/Projects section of this resume.
  Analyze them for Action verb, Technology, Task, Measurable result, and Business impact.
  Provide an improved version using the format: Action + Task + Technology + Result.
  Return strictly valid JSON in this format:
  [
    {
      "original": "Made a website using React.",
      "score": 42,
      "problems": ["Weak action wording", "No measurable result"],
      "improved": "Developed a responsive React-based web application with reusable components."
    }
  ]
  Resume: ${resumeText}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Bullet Analysis Error:", err);
    return null;
  }
}

// --- Phase 4: Transferable Skills ---
async function detectTransferableSkills(resumeText) {
  if (!resumeText) return null;
  const prompt = `Analyze this resume and detect transferable (soft) skills such as Leadership, Communication, Problem Solving, Project Management, etc., based on the context of the user's experience.
  Return strictly valid JSON in this format:
  [
    { "skill": "Team Leadership", "evidence": "Led a 4-member team during a college hackathon." }
  ]
  Resume: ${resumeText}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Transferable Skills Error:", err);
    return null;
  }
}

// --- Phase 6: Learning Roadmap Generator ---
async function generateLearningRoadmap(missingSkills, resumeText) {
  if (!missingSkills || missingSkills.length === 0) return null;
  
  const prompt = `Based on the following resume, determine the candidate's approximate experience level (e.g., Junior, Mid-level, Senior).
  Then, create a personalized learning roadmap to acquire these missing skills: [${missingSkills.join(', ')}].
  Structure the roadmap as a timeline with 3 to 4 steps. Each step should have a title, duration (e.g. "Week 1", "Month 1"), and a concise description of what to learn, tailored to their existing experience level.
  Return strictly valid JSON in this format:
  [
    { "step": "Week 1", "title": "Fundamentals of AWS", "description": "Since you already know Azure, focus on mapping Azure concepts to AWS (e.g. VMs to EC2)." },
    { "step": "Week 2-3", "title": "Advanced CI/CD", "description": "Learn GitHub Actions to complement your existing Git knowledge." }
  ]
  Resume: ${resumeText}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Roadmap Generation Error:", err);
    return null;
  }
}

// --- Phase 7: Interview Intelligence ---
async function generateInterviewQuestions(resumeText, jobDescription) {
  if (!resumeText) return null;
  const prompt = `Act as a strict hiring manager. Generate exactly 2 technical interview questions and 2 behavioral interview questions that directly challenge specific claims made in the provided resume.
  Do not generate generic questions. Reference specific projects, metrics, or technologies from the resume.
  Return strictly valid JSON in this format:
  [
    { "type": "Technical", "question": "You mentioned optimizing the DB by 40% with Redis. How exactly did you handle cache invalidation?" },
    { "type": "Behavioral", "question": "Your resume states you led a 4-member team. Tell me about a time you had to resolve a conflict within that team." }
  ]
  Resume: ${resumeText}
  Job Description: ${jobDescription || "Not provided"}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Interview Questions Error:", err);
    return null;
  }
}

// --- Phase 8: Job Risk Analysis ---
async function analyzeJobRisk(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) return null;
  const prompt = `Act as an expert technical recruiter. Analyze the candidate's true experience level based purely on their responsibilities in the provided resume, and compare it to the seniority requirements implied by the Job Description.
  Determine the Job Match Risk: 'Low', 'Medium', or 'High'.
  Identify if they are 'Underqualified', 'Overqualified', or 'Appropriate'.
  Provide 2-3 specific reasons for your assessment (e.g., "Applying for Senior role but no system design experience listed").
  
  Return strictly valid JSON in this format:
  {
    "riskLevel": "High",
    "qualificationStatus": "Underqualified",
    "reasons": [
      "Job requires leading a team, but resume only lists individual contributor tasks.",
      "Lacks enterprise architecture experience expected for a Senior title."
    ]
  }
  Resume: ${resumeText}
  Job Description: ${jobDescription}`;

  try {
    const result = await callGeminiAPI(prompt);
    let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Job Risk Error:", err);
    return null;
  }
}

// --- Phase 9: ATS Resume Simulation Viewer ---
function analyzeATSFormat(resumeText) {
    if (!resumeText) return null;
    const lower = resumeText.toLowerCase();
    
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
    const hasPhone = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/.test(resumeText);
    const hasLinkedIn = lower.includes('linkedin.com') || lower.includes('linked.in');
    
    return {
        hasEmail,
        hasPhone,
        hasLinkedIn,
        wordCount: resumeText.split(/\s+/).filter(w => w.length > 0).length,
        rawText: resumeText
    };
}

function suggestRoles(skills, score) {
  if (score < 30) return ["Entry Level Intern", "Junior Associate"];
  
  const dsSkills = ['python', 'machine learning', 'data science', 'sql', 'nlp'];
  const webSkills = ['html', 'css', 'javascript', 'react', 'node.js', 'typescript', 'angular', 'vue'];
  const javaDev = ['java', 'sql', 'agile', 'scrum'];
  const design = ['ui', 'ux', 'design', 'css', 'html'];
  const cloud = ['aws', 'azure', 'docker', 'kubernetes', 'linux'];
  
  const countMatch = (arr) => arr.filter(s => skills.includes(s)).length;
  
  let roles = [
    { title: "Data Scientist / Analyst", matches: countMatch(dsSkills) },
    { title: "Frontend / Web Developer", matches: countMatch(webSkills) },
    { title: "Java / Backend Developer", matches: countMatch(javaDev) },
    { title: "UI/UX Designer", matches: countMatch(design) },
    { title: "Cloud / DevOps Engineer", matches: countMatch(cloud) }
  ];
  
  roles.sort((a,b) => b.matches - a.matches);
  if (roles[0].matches === 0) return ["General IT Professional", "Operations"];
  
  const prefix = score > 85 ? "Senior " : "";
  // Return top 3 non-zero matching roles, or just the top 1 if others are 0
  const topRoles = roles.filter(r => r.matches > 0).slice(0, 3).map(r => prefix + r.title);
  if (topRoles.length === 0) topRoles.push("Software Engineer");
  
  return topRoles;
}

// --- Action Verbs & Impact Score ---
function analyzeImpact(text) {
  const strongVerbs = ['orchestrated', 'spearheaded', 'engineered', 'optimized', 'developed', 'managed', 'led', 'designed', 'implemented', 'achieved', 'increased', 'reduced', 'resolved', 'transformed', 'delivered'];
  const weakVerbs = ['helped', 'worked on', 'responsible for', 'assisted', 'participated', 'did', 'handled', 'was involved in'];
  
  const lowerText = text.toLowerCase();
  
  const foundStrong = strongVerbs.filter(verb => lowerText.includes(verb));
  const foundWeak = weakVerbs.filter(verb => lowerText.includes(verb));
  
  // Check for quantifiable metrics (numbers, percentages, dollar signs)
  const hasMetrics = /\d+%|\$\d+|\d+ (percent|million|billion|k)/.test(lowerText) || (lowerText.match(/\d+/g) || []).length > 2;

  return { foundStrong, foundWeak, hasMetrics };
}

// --- Buzzword Detection ---
function detectBuzzwords(text) {
  const buzzwordsList = ['synergy', 'team player', 'hard worker', 'think outside the box', 'go-getter', 'detail-oriented', 'results-driven', 'dynamic', 'proactive', 'thought leader', 'innovative', 'best of breed'];
  const lowerText = text.toLowerCase();
  return buzzwordsList.filter(word => lowerText.includes(word));
}

// --- Smart Job Links ---
function generateJobLinks(role) {
  const query = encodeURIComponent(role);
  return [
    { title: "LinkedIn Jobs", url: `https://www.linkedin.com/jobs/search/?keywords=${query}` },
    { title: "Google Jobs", url: `https://www.google.com/search?q=${query}+jobs&ibp=htl;jobs` },
    { title: "Indeed", url: `https://www.indeed.com/jobs?q=${query}` }
  ];
}


// --- Submit Phase ---
const analyzeForm = document.getElementById('analyzeForm');
const analyzeBtn = document.getElementById('analyzeBtn');

analyzeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile) return alert("Please upload a resume (PDF/DOCX) first.");

  analyzeBtn.disabled = true;
  document.getElementById('btnText').textContent = "Analyzing deeply with AI...";

  try {
    let resumeText = "";
    if (selectedFile.name.toLowerCase().endsWith('.pdf')) resumeText = await extractTextFromPDF(selectedFile);
    else if (selectedFile.name.toLowerCase().endsWith('.docx')) resumeText = await extractTextFromDocx(selectedFile);
    else throw new Error("Unsupported format");

    const resumeSkills = extractSkills(resumeText);
    const jobDescription = document.getElementById('jobDescInput').value.trim();
    let jobSkills = jobDescription ? extractSkills(jobDescription) : ['javascript', 'html', 'css', 'react', 'python', 'sql', 'git', 'aws', 'java'];

    // Phase 2: JD Analyzer
    let jdData = null;
    let semanticData = null;
    let evidenceData = null;
    let bulletData = null;
    let transferableData = null;

    if (localStorage.getItem('geminiApiKey')) {
       if (jobDescription) {
           document.getElementById('btnText').textContent = "AI Analyzing Job Description...";
           jdData = await analyzeJobDescription(jobDescription);
           
           document.getElementById('btnText').textContent = "Performing Semantic Matching...";
           semanticData = await performSemanticMatching(resumeText, jobDescription);
       }
    }
    
    document.getElementById('btnText').textContent = "Calculating Explainable Score...";

    let matched_skills = Array.from(new Set(resumeSkills.filter(x => jobSkills.includes(x))));
    let missing_skills = Array.from(new Set(jobSkills.filter(x => !resumeSkills.includes(x))));
    
    let roadmapData = null;
    if (localStorage.getItem('geminiApiKey') && missing_skills.length > 0) {
        document.getElementById('btnText').textContent = "Generating AI Learning Roadmap...";
        roadmapData = await generateLearningRoadmap(missing_skills, resumeText);
    }
    
    let interviewData = null;
    if (localStorage.getItem('geminiApiKey')) {
        document.getElementById('btnText').textContent = "Generating Interview Intelligence...";
        interviewData = await generateInterviewQuestions(resumeText, jobDescription);
    }
    
    let riskData = null;
    if (localStorage.getItem('geminiApiKey') && jobDescription) {
        document.getElementById('btnText').textContent = "Analyzing Job Risk Mismatch...";
        riskData = await analyzeJobRisk(resumeText, jobDescription);
    }
    
    const atsSimulationData = analyzeATSFormat(resumeText);

    // Phase 2 & 3: Explainable Scoring Logic
    let breakdown = [];
    let totalScore = 0;
    
    // 1. Skills Match (25%)
    let skillsScore = jobSkills.length > 0 ? (matched_skills.length / jobSkills.length) * SCORING_CONFIG.weights.skillsMatch : SCORING_CONFIG.weights.skillsMatch;
    breakdown.push({ name: "Skills Match", max: SCORING_CONFIG.weights.skillsMatch, score: skillsScore, explanation: `Found ${matched_skills.length} of ${jobSkills.length} requested skills.` });
    totalScore += skillsScore;

    // 2. Required Skills Match (20%)
    let reqScore = SCORING_CONFIG.weights.requiredSkills;
    let reqExplanation = "No strict requirements defined.";
    if (jdData && jdData.must_have && jdData.must_have.length > 0) {
        let matchedReq = jdData.must_have.filter(req => resumeText.toLowerCase().includes(req.toLowerCase()));
        reqScore = (matchedReq.length / jdData.must_have.length) * SCORING_CONFIG.weights.requiredSkills;
        reqExplanation = `Matched ${matchedReq.length} of ${jdData.must_have.length} "Must Have" requirements.`;
    }
    breakdown.push({ name: "Required Skills Match", max: SCORING_CONFIG.weights.requiredSkills, score: reqScore, explanation: reqExplanation });
    totalScore += reqScore;

    // 3. Semantic Relevance (15%) - Powered by Phase 3 Semantic Matching
    let semScore = SCORING_CONFIG.weights.semanticRelevance * 0.5;
    let semExplanation = "No semantic matching performed.";
    if (semanticData && semanticData.length > 0) {
        const strongMatches = semanticData.filter(s => s.status.toLowerCase().includes('strong') || s.color === '#10b981').length;
        semScore = Math.min((strongMatches / Math.max(jobSkills.length || 5, 5)) * SCORING_CONFIG.weights.semanticRelevance, SCORING_CONFIG.weights.semanticRelevance);
        semExplanation = `Found ${strongMatches} strong semantic matches based on context.`;
    } else if (matched_skills.length > 3) {
        semScore = SCORING_CONFIG.weights.semanticRelevance * 0.8;
        semExplanation = "Basic exact match alignment detected.";
    }
    breakdown.push({ name: "Semantic Job Relevance", max: SCORING_CONFIG.weights.semanticRelevance, score: semScore, explanation: semExplanation });
    totalScore += semScore;

    // 4. Experience Relevance (15%)
    let expScore = resumeText.toLowerCase().includes('experience') ? SCORING_CONFIG.weights.experienceRelevance : SCORING_CONFIG.weights.experienceRelevance * 0.5;
    breakdown.push({ name: "Experience Relevance", max: SCORING_CONFIG.weights.experienceRelevance, score: expScore, explanation: expScore === SCORING_CONFIG.weights.experienceRelevance ? "Experience section found." : "Experience section not clearly defined." });
    totalScore += expScore;

    // 5. Education (10%)
    let eduScore = resumeText.toLowerCase().includes('education') || resumeText.toLowerCase().includes('degree') || resumeText.toLowerCase().includes('university') ? SCORING_CONFIG.weights.education : SCORING_CONFIG.weights.education * 0.4;
    breakdown.push({ name: "Education Match", max: SCORING_CONFIG.weights.education, score: eduScore, explanation: eduScore === SCORING_CONFIG.weights.education ? "Education credentials found." : "Education section missing." });
    totalScore += eduScore;

    // 6. Keywords (5%)
    const kwDensity = getKeywordDensity(resumeText);
    let kwScore = kwDensity.length >= 3 ? SCORING_CONFIG.weights.keywords : SCORING_CONFIG.weights.keywords * 0.5;
    breakdown.push({ name: "Keyword Relevance", max: SCORING_CONFIG.weights.keywords, score: kwScore, explanation: "Top keywords adequately distributed." });
    totalScore += kwScore;

    // 7. Achievements (5%)
    const impact = analyzeImpact(resumeText);
    let achScore = impact.hasMetrics ? SCORING_CONFIG.weights.achievements : SCORING_CONFIG.weights.achievements * 0.2;
    breakdown.push({ name: "Achievement Strength", max: SCORING_CONFIG.weights.achievements, score: achScore, explanation: impact.hasMetrics ? "Quantifiable metrics detected." : "Missing measurable achievements." });
    totalScore += achScore;

    // 8. Format (5%)
    const formatCheck = checkResumeFormat(resumeText);
    const formatPassed = formatCheck.filter(f => f.found).length;
    let fmtScore = (formatPassed / formatCheck.length) * SCORING_CONFIG.weights.format;
    breakdown.push({ name: "Resume Structure", max: SCORING_CONFIG.weights.format, score: fmtScore, explanation: `Passed ${formatPassed} of ${formatCheck.length} format checks.` });
    totalScore += fmtScore;

    let ats_score = Math.min(Math.round(totalScore), 100);

    const rolesArray = recommendRole(resumeSkills, ats_score);

    // Save resume globally for Gemini API
    window.lastAnalyzedResume = resumeText;
    window.lastAnalyzedJobDesc = jobDescription;

    const payload = {
      ats_score,
      resume_rating: ats_score >= 80 ? "Excellent" : (ats_score >= 60 ? "Good" : (ats_score >= 40 ? "Average" : "Poor")),
      score_breakdown: breakdown,
      jd_data: jdData,
      semantic_data: semanticData,
      evidence_data: evidenceData,
      bullet_data: bulletData,
      transferable_data: transferableData,
      roadmap_data: roadmapData,
      interview_data: interviewData,
      risk_data: riskData,
      ats_simulation_data: atsSimulationData,
      resume_text_lower: resumeText.toLowerCase(),
      matched_skills,
      missing_skills,
      roles: rolesArray,
      packages: estimatePackage(rolesArray, ats_score),
      interview_questions: generateInterviewQuestions(matched_skills, missing_skills, rolesArray[0] || ""),
      formatResults: formatCheck,
      keywordDensity: kwDensity,
      impactData: impact,
      buzzwords: detectBuzzwords(resumeText),
      jobLinks: generateJobLinks(rolesArray[0] || "Software Engineer"),
      grammar_feedback: [],
      courses: missing_skills.slice(0, 3).map(s => ({ title: `Mastering ${s.toUpperCase()} from scratch`, link: `https://www.youtube.com/results?search_query=${s}+tutorial` }))
    };

    if (resumeText.split(" ").length < 100) {
         payload.grammar_feedback.push({"issue": "Resume content is too short.", "suggestion": "Add deeper context about your previous responsibilities."});
    }

    populateDashboard(payload);
    
    // Phase 5: Save to IndexedDB history
    await saveAnalysisVersion(payload);
    
    // Save to PlacementOS Backend (ResumeProfile)
    try {
        await fetch('/api/resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                skills: payload.matched_skills.concat(payload.missing_skills),
                education: [], // Can be extracted if needed
                projects: [],
                experience: [],
                certifications: [],
                keywords: payload.keywordDensity.map(k => k[0]),
                preferredRoles: payload.roles,
                rawText: payload.resume_text_lower
            })
        });
    } catch (e) {
        console.error("Failed to save to backend", e);
    }
    
    analyzeBtn.disabled = false;
    document.getElementById('btnText').textContent = "Analyze Resume";
    showPage('dashboard');

  } catch (error) {
    console.error(error);
    analyzeBtn.disabled = false;
    document.getElementById('btnText').textContent = "Analyze Resume";
    alert("Error parsing: " + error.message);
  }
});

function populateDashboard(data) {
  let color = '#ef4444'; 
  if (data.ats_score >= 80) color = '#10b981'; 
  else if (data.ats_score > 40) color = '#f59e0b';

  // ATS SCORE Widget
  document.getElementById('scoreText').textContent = data.ats_score + '%';
  document.getElementById('scoreText').style.color = color;
  document.getElementById('scoreCircle').style.background = `conic-gradient(${color} ${data.ats_score}%, transparent 0)`;
  const ratingEl = document.getElementById('ratingText');
  ratingEl.textContent = data.resume_rating;
  ratingEl.style.color = color;
  
  document.getElementById('packageTextUSD').textContent = data.packages.usd;
  document.getElementById('packageTextINR').textContent = data.packages.inr;

  // EXPLAINABLE SCORE BREAKDOWN
  const breakdownC = document.getElementById('explainableScoreBreakdown');
  breakdownC.innerHTML = '';
  data.score_breakdown.forEach(item => {
     const pct = Math.round((item.score / item.max) * 100);
     const barColor = pct >= 80 ? '#10b981' : (pct >= 50 ? '#f59e0b' : '#ef4444');
     breakdownC.innerHTML += `
        <div style="margin-bottom: 0.5rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:600;">
             <span>${item.name}</span>
             <span style="color: ${barColor};">${Math.round(item.score)}/${item.max}</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; margin: 0.3rem 0;">
             <div style="height:100%; width:${pct}%; background:${barColor};"></div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary);"><i data-lucide="${pct>=80 ? 'check' : (pct>=50 ? 'info' : 'alert-circle')}" width="12" style="display:inline-block; vertical-align:middle; margin-right:4px;"></i>${item.explanation}</div>
        </div>
     `;
  });

  // JD PRIORITY ANALYZER
  const jdSection = document.getElementById('jdPrioritySection');
  const jdContainer = document.getElementById('jdPriorityContainer');
  jdContainer.innerHTML = '';
  
  if (data.jd_data) {
     jdSection.style.display = 'block';
     
     const renderCategory = (title, items, color) => {
        if (!items || items.length === 0) return '';
        let html = `<div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-sm); border-top: 3px solid ${color};">
                      <h4 style="margin-bottom: 0.5rem; color: ${color};">${title}</h4>
                      <ul style="list-style: none; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem;">`;
        items.forEach(req => {
           const found = data.resume_text_lower.includes(req.toLowerCase());
           html += `<li style="display: flex; align-items: start; gap: 0.5rem;">
                      <i data-lucide="${found ? 'check-circle' : 'x-circle'}" color="${found ? '#10b981' : '#ef4444'}" width="14" style="margin-top: 2px;"></i>
                      <span>${req}</span>
                    </li>`;
        });
        html += `</ul></div>`;
        return html;
     };

     jdContainer.innerHTML += renderCategory('🔴 Must Have', data.jd_data.must_have, '#ef4444');
     jdContainer.innerHTML += renderCategory('🟠 Strongly Preferred', data.jd_data.strongly_preferred, '#f97316');
     jdContainer.innerHTML += renderCategory('🟡 Preferred', data.jd_data.preferred, '#f59e0b');
     jdContainer.innerHTML += renderCategory('🟢 Nice to Have', data.jd_data.nice_to_have, '#10b981');
  } else {
     jdSection.style.display = 'none';
  }

  // Phase 9: ATS SIMULATION
  const atsSimSection = document.getElementById('atsSimulationSection');
  if (atsSimSection) {
      const rawTextEl = document.getElementById('atsRawText');
      const wordCountEl = document.getElementById('wordCountBadge');
      const flagsList = document.getElementById('atsFlagsList');
      
      if (rawTextEl && data.ats_simulation_data) {
          const ats = data.ats_simulation_data;
          rawTextEl.textContent = ats.rawText;
          wordCountEl.textContent = `${ats.wordCount} words`;
          
          flagsList.innerHTML = `
              <li style="display:flex; justify-content:space-between; align-items:center; font-size: 0.85rem; color: ${ats.hasEmail ? '#10b981' : '#ef4444'}; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                 <span>Email Address</span>
                 <i data-lucide="${ats.hasEmail ? 'check-circle' : 'x-circle'}" width="16"></i>
              </li>
              <li style="display:flex; justify-content:space-between; align-items:center; font-size: 0.85rem; color: ${ats.hasPhone ? '#10b981' : '#ef4444'}; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                 <span>Phone Number</span>
                 <i data-lucide="${ats.hasPhone ? 'check-circle' : 'x-circle'}" width="16"></i>
              </li>
              <li style="display:flex; justify-content:space-between; align-items:center; font-size: 0.85rem; color: ${ats.hasLinkedIn ? '#10b981' : '#f59e0b'}; padding: 0.5rem 0;">
                 <span>LinkedIn URL</span>
                 <i data-lucide="${ats.hasLinkedIn ? 'check-circle' : 'alert-triangle'}" width="16"></i>
              </li>
          `;
      }
  }

  // ROLES
  const rolesContainer = document.getElementById('rolesContainer');
  rolesContainer.innerHTML = '';
  data.roles.forEach((r, idx) => {
    const div = document.createElement('div');
    div.style.cssText = `background: ${idx === 0 ? 'var(--primary-color)' : 'rgba(99,102,241,0.1)'}; color: ${idx === 0 ? 'white' : 'var(--primary-color)'}; padding: 0.75rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 1rem;`;
    div.innerHTML = `<i data-lucide="${idx===0 ? 'check-circle' : 'chevron-right'}" width="16" style="margin-right:0.5rem; vertical-align:middle;"></i> ${r}`;
    rolesContainer.appendChild(div);
  });

  // FORMAT CHECKER
  const frmList = document.getElementById('formatList');
  frmList.innerHTML = '';
  data.formatResults.forEach(item => {
    const li = document.createElement('li');
    li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center';
    li.style.padding = '0.5rem'; li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    li.innerHTML = `<span>${item.name}</span> <span style="display:flex; align-items:center; color:${item.found ? '#10b981' : '#ef4444'}; gap:0.5rem;"> 
       <i data-lucide="${item.found ? 'check-circle' : 'x-circle'}" width="16" height="16"></i> ${item.found ? 'Found' : 'Missing'}</span>`;
    frmList.appendChild(li);
  });

  // KEYWORD DENSITY
  const kwList = document.getElementById('keywordDensityList');
  kwList.innerHTML = '';
  if (data.keywordDensity.length === 0) kwList.innerHTML = '<span class="text-secondary">Not enough words found.</span>';
  
  const maxKw = data.keywordDensity.length > 0 ? data.keywordDensity[0][1] : 1;
  data.keywordDensity.forEach(([word, count]) => {
     const pct = Math.floor((count / maxKw) * 100);
     const wrap = document.createElement('div');
     wrap.style.marginBottom = '0.5rem';
     wrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.2rem;">
            <span style="text-transform: capitalize;">${word}</span> <span>${count} times</span>
        </div>
        <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:var(--accent-color);"></div>
        </div>
     `;
     kwList.appendChild(wrap);
  });

  // Phase 3: SEMANTIC SKILLS
  const semContainer = document.getElementById('semanticSkillsContainer');
  semContainer.innerHTML = '';
  if (data.semantic_data && data.semantic_data.length > 0) {
      data.semantic_data.forEach(item => {
          semContainer.innerHTML += `
             <div style="background: rgba(255,255,255,0.05); border-left: 3px solid ${item.color || '#10b981'}; padding: 0.75rem; border-radius: var(--radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <strong style="font-size: 1rem;">${item.skill}</strong>
                    <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: ${item.color ? item.color+'20' : 'rgba(16,185,129,0.2)'}; color: ${item.color || '#10b981'}; border-radius: 12px; font-weight: 600;">${item.status}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);"><i data-lucide="info" width="12" style="vertical-align: middle; margin-right: 4px;"></i>${item.evidence}</div>
             </div>
          `;
      });
  } else {
      semContainer.innerHTML = '<span class="text-secondary">Provide an API Key and Job Description to enable Semantic Skill Matching.</span>';
  }


  const missC = document.getElementById('missingSkills');
  missC.innerHTML = data.missing_skills.length===0 ? '<span class="text-secondary">Excellent! No missing skills.</span>' : '';
  data.missing_skills.forEach(skill => {
    missC.innerHTML += `<span style="padding: 0.4rem 0.8rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 4px; font-size: 0.9rem; font-weight: 500; text-transform: capitalize;">${skill}</span>`;
  });

  // GRAMMAR OUT
  const grOut = document.getElementById('grammarList');
  grOut.innerHTML = data.grammar_feedback.length===0 ? '<p class="text-secondary">No major grammar/formatting issues found. Great job!</p>' : '';
  data.grammar_feedback.forEach(item => {
    grOut.innerHTML += `<li style="padding: 1rem; border-bottom: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 0.5rem;">
          <span style="color: #f59e0b; font-weight: 600; font-size: 0.9rem;">Issue: ${item.issue}</span>
          <span style="color: #10b981; font-size: 0.9rem;">Suggestion: ${item.suggestion}</span>
        </li>`;
  });

  // Phase 6: LEARNING ROADMAP
  const rmapC = document.getElementById('roadmapContainer');
  if(rmapC) {
      rmapC.innerHTML = '';
      if (data.roadmap_data && data.roadmap_data.length > 0) {
          rmapC.innerHTML = '<div style="position:absolute; left:24px; top:10px; bottom:10px; width:2px; background:rgba(255,255,255,0.1);"></div>';
          data.roadmap_data.forEach((step, idx) => {
              rmapC.innerHTML += `
                 <div style="position: relative; padding-left: 60px; margin-bottom: 1.5rem;">
                    <div style="position: absolute; left: 14px; top: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; color: white; border: 4px solid var(--card-bg); z-index: 2;">${idx+1}</div>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-sm);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                           <strong style="color: var(--primary-color); font-size: 1rem;">${step.title}</strong>
                           <span style="font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${step.step}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${step.description}</div>
                    </div>
                 </div>
              `;
          });
      } else if (data.missing_skills && data.missing_skills.length === 0) {
          rmapC.innerHTML = '<span class="text-secondary">Excellent! You have all the required skills. No roadmap needed.</span>';
      } else {
          rmapC.innerHTML = '<span class="text-secondary">Provide an API Key to generate a personalized AI Learning Roadmap.</span>';
      }
  }

  // Phase 8: JOB RISK
  const riskC = document.getElementById('jobRiskContainer');
  if (riskC) {
      if (data.risk_data) {
          const r = data.risk_data;
          let color = '#10b981'; // low
          if (r.riskLevel.toLowerCase() === 'medium') color = '#f59e0b';
          if (r.riskLevel.toLowerCase() === 'high') color = '#ef4444';
          
          let html = `
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
               <div style="padding: 0.5rem 1rem; border-radius: var(--radius-sm); background: ${color}20; color: ${color}; font-weight: bold; border: 1px solid ${color};">
                  Risk Level: ${r.riskLevel.toUpperCase()}
               </div>
               <div style="font-weight: 600; font-size: 1.1rem;">Status: ${r.qualificationStatus}</div>
            </div>
            <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem;">
          `;
          r.reasons.forEach(reason => {
             html += `<li style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.95rem; color: var(--text-secondary);"><i data-lucide="info" width="16" color="${color}" style="margin-top:2px;"></i> ${reason}</li>`;
          });
          html += `</ul>`;
          riskC.innerHTML = html;
      } else {
          riskC.innerHTML = '<span class="text-secondary">Provide an API Key and Job Description to enable Job Risk Assessment.</span>';
      }
  }

  // Phase 7: INTERVIEW QUESTIONS
  const iqList = document.getElementById('interviewQuestionsList');
  if (iqList) {
      iqList.innerHTML = '';
      if (data.interview_data && data.interview_data.length > 0) {
          data.interview_data.forEach((q, idx) => {
              const color = q.type.toLowerCase() === 'technical' ? '#10b981' : '#f59e0b';
              iqList.innerHTML += `
                 <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-sm); border-left: 3px solid ${color};">
                    <div style="font-weight: 600; font-size: 0.8rem; color: ${color}; margin-bottom: 0.5rem; text-transform: uppercase;">${q.type}</div>
                    <div style="font-size: 0.95rem; line-height: 1.5;">${q.question}</div>
                 </div>
              `;
          });
      } else {
          iqList.innerHTML = '<span class="text-secondary">Provide an API Key to generate tailored interview questions.</span>';
      }
  }

  // IMPACT METRICS
  const impactC = document.getElementById('impactMetrics');
  impactC.innerHTML = `
    <div style="margin-bottom: 0.5rem;"><span style="color: #10b981; font-weight: bold;">Strong Verbs:</span> ${data.impactData.foundStrong.length > 0 ? data.impactData.foundStrong.join(', ') : 'None detected'}</div>
    <div style="margin-bottom: 0.5rem;"><span style="color: #ef4444; font-weight: bold;">Weak Verbs:</span> ${data.impactData.foundWeak.length > 0 ? data.impactData.foundWeak.join(', ') : 'None detected (Great!)'}</div>
    <div><span style="color: #3b82f6; font-weight: bold;">Quantifiable Metrics Found:</span> ${data.impactData.hasMetrics ? 'Yes ✅' : 'No ❌ (Add numbers!)'}</div>
  `;

  // BUZZWORDS
  const buzzC = document.getElementById('buzzwordList');
  buzzC.innerHTML = data.buzzwords.length === 0 ? '<span class="text-secondary">No clichés detected. Excellent!</span>' : '';
  data.buzzwords.forEach(word => {
    buzzC.innerHTML += `<span style="padding: 0.4rem 0.8rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 4px; font-size: 0.9rem; font-weight: 500; text-transform: capitalize;">${word}</span>`;
  });

  // JOB LINKS
  const jobLinksC = document.getElementById('jobLinksContainer');
  jobLinksC.innerHTML = '';
  data.jobLinks.forEach(link => {
     jobLinksC.innerHTML += `<a href="${link.url}" target="_blank" class="btn btn-secondary" style="text-decoration: none;">${link.title} <i data-lucide="arrow-up-right" width="16"></i></a>`;
  });

  lucide.createIcons();
}

// --- Gemini AI Handlers (MOCK DEMO MODE) ---
async function callGeminiAPI(promptText) {
  return new Promise((resolve) => {
    setTimeout(() => {
        const lower = promptText.toLowerCase();
        
        // Phase 9: Cover Letter
        if (lower.includes("cover letter")) {
            resolve("Dear Hiring Manager,\n\nI am writing to express my strong interest in the open position. With my background in software development and a proven ability to deliver high-quality solutions, I am confident I would be a great fit for your team. In my previous roles, I successfully spearheaded projects that optimized performance and drove business growth. Thank you for your consideration.\n\nBest regards,\n[Your Name]");
            return;
        }
        // Phase 9: Bullet Rewriter
        if (lower.includes("star format")) {
            resolve("Rewritten using the STAR method:\n• **Situation:** The application was experiencing slow load times.\n• **Task:** I was tasked with optimizing database queries and frontend performance.\n• **Action:** I implemented Redis caching and restructured SQL indices.\n• **Result:** Page load speed increased by 40%, significantly improving user retention.");
            return;
        }
        // History Comparison Summary
        if (lower.includes("compare these two resume analysis versions")) {
            resolve("Version 2 shows a significant improvement in ATS Score and matched skills. The addition of measurable metrics and specific keywords directly aligned with the job description has increased the overall ranking of this resume.");
            return;
        }
        // Phase 8: Job Risk Assessment
        if (lower.includes("job match risk")) {
            resolve(`{
                "riskLevel": "Low",
                "qualificationStatus": "Appropriate",
                "reasons": ["The candidate's responsibilities perfectly align with the required seniority.", "Solid track record of relevant projects and technical leadership."]
            }`);
            return;
        }
        // Phase 7: Interview Intelligence
        if (lower.includes("interview questions")) {
            resolve(`[
                { "type": "Technical", "question": "Can you explain the specifics of how you optimized the database in your previous role?" },
                { "type": "Behavioral", "question": "Tell me about a time you had to learn a new technology stack quickly to meet a deadline." },
                { "type": "Technical", "question": "How do you handle scaling issues in complex cloud architectures?" },
                { "type": "Behavioral", "question": "Describe a conflict you had with a team member and how you successfully resolved it." }
            ]`);
            return;
        }
        // Phase 6: Learning Roadmap
        if (lower.includes("learning roadmap")) {
            resolve(`[
                { "step": "Month 1", "title": "Master the Fundamentals", "description": "Start by mastering the basic concepts of the missing skills and setting up your local environment." },
                { "step": "Month 2", "title": "Advanced Application", "description": "Build a hands-on project to apply these new concepts practically and add it to your portfolio." },
                { "step": "Month 3", "title": "Best Practices & Optimization", "description": "Learn industry standards, CI/CD integration, and optimize your implementation." }
            ]`);
            return;
        }
        // Phase 4: Transferable Skills
        if (lower.includes("transferable soft skills")) {
            resolve(`{ "skills": ["Effective Communication", "Complex Problem Solving", "Cross-functional Leadership", "Agile Adaptability"] }`);
            return;
        }
        // Phase 4: Bullet Analyzer
        if (lower.includes("evaluate the following bullet points")) {
            resolve(`{
                "analysis": [
                    { "original": "Worked on the main project.", "improved": "Engineered scalable web applications using React, improving performance by 20%.", "hasMetrics": true, "hasActionVerb": true },
                    { "original": "Helped the team.", "improved": "Collaborated with a cross-functional team of 5 to deliver the MVP two weeks ahead of schedule.", "hasMetrics": true, "hasActionVerb": true }
                ]
            }`);
            return;
        }
        // Phase 3: Evidence Verification
        if (lower.includes("evidence in the experience section")) {
            resolve(`{
                "verified": ["javascript", "react", "html", "css", "node.js"],
                "missing_evidence": ["kubernetes", "aws"]
            }`);
            return;
        }
        // Phase 3: Semantic Skills
        if (lower.includes("meaning-based mapping")) {
            resolve(`{
                "matched": ["javascript", "frontend development", "ui/ux", "web programming", "problem solving"],
                "missing": ["cloud architecture", "kubernetes"]
            }`);
            return;
        }
        // Phase 1.5: JD Priority Analyzer
        if (lower.includes("exactly 4 categories")) {
            resolve(`{
                "must_have": ["JavaScript", "React", "Node.js"],
                "strongly_preferred": ["TypeScript", "Agile Methodology"],
                "preferred": ["Docker", "AWS/Azure"],
                "nice_to_have": ["GraphQL", "Figma"]
            }`);
            return;
        }
        
        // Fallback for anything else that expects JSON
        resolve("{}");
    }, 1500); // Simulate realistic 1.5 second AI thinking time
  });
}

document.getElementById('generateCoverLetterBtn').addEventListener('click', async () => {
  const resultDiv = document.getElementById('coverLetterResult');
  try {
    resultDiv.style.display = 'block';
    resultDiv.textContent = "Writing your cover letter with AI... Please wait.";
    const prompt = `Write a professional cover letter based on this resume: ${window.lastAnalyzedResume || ''}. Target Job Description: ${window.lastAnalyzedJobDesc || ''}. Keep it under 300 words and highly tailored. If resume is empty, mention that you need a resume.`;
    const result = await callGeminiAPI(prompt);
    resultDiv.textContent = result;
  } catch (err) {
    resultDiv.textContent = `Error: ${err.message}`;
  }
});

document.getElementById('rewriteBulletBtn').addEventListener('click', async () => {
  const input = document.getElementById('bulletInput').value;
  const resultDiv = document.getElementById('rewriteResult');
  if (!input.trim()) return alert("Please paste a bullet point first.");
  
  try {
    resultDiv.style.display = 'block';
    resultDiv.textContent = "Rewriting with STAR method...";
    const prompt = `Rewrite this resume bullet point to make it much stronger, using the STAR method and strong action verbs. Highlight quantifiable impact if possible: "${input}"`;
    const result = await callGeminiAPI(prompt);
    resultDiv.textContent = result;
  } catch (err) {
    resultDiv.textContent = `Error: ${err.message}`;
  }
});

showPage('home');

// --- Phase 5: IndexedDB Wrapper & Version History ---
const DB_NAME = "SmartResumeDB";
const DB_VERSION = 1;
const STORE_NAME = "resumeHistory";

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveAnalysisVersion(payload) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        
        const record = {
            timestamp: new Date().toISOString(),
            jobTitle: payload.roles && payload.roles[0] ? payload.roles[0] : "General Analysis",
            ats_score: payload.ats_score,
            payload: payload
        };
        
        store.add(record);
        console.log("Analysis saved to history.");
    } catch (err) {
        console.error("Failed to save to IndexedDB:", err);
    }
}

async function getAnalysisVersions() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result.reverse()); // Newest first
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("Failed to fetch from IndexedDB:", err);
        return [];
    }
}

// History UI Logic
let selectedHistoryIds = [];

async function renderHistoryList() {
    const listC = document.getElementById('historyListContainer');
    if (!listC) return;
    const records = await getAnalysisVersions();
    
    if (records.length === 0) {
        listC.innerHTML = '<span class="text-secondary">No history found. Run an analysis first.</span>';
        return;
    }
    
    listC.innerHTML = '';
    selectedHistoryIds = [];
    document.getElementById('compareBtn').disabled = true;
    document.getElementById('compareBtn').innerText = "Compare Selected (0/2)";
    
    records.forEach(rec => {
        const date = new Date(rec.timestamp).toLocaleString();
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.padding = '0.75rem';
        div.style.background = 'rgba(255,255,255,0.05)';
        div.style.borderRadius = 'var(--radius-sm)';
        div.style.cursor = 'pointer';
        div.style.border = '1px solid transparent';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.transition = 'all 0.2s';
        div.style.marginBottom = '0.5rem';
        
        div.innerHTML = `
            <div>
               <div style="font-weight: 600; font-size: 0.9rem;">${rec.jobTitle}</div>
               <div style="font-size: 0.75rem; color: var(--text-secondary);">${date}</div>
            </div>
            <div style="font-weight: bold; color: ${rec.ats_score >= 70 ? '#10b981' : (rec.ats_score >= 40 ? '#f59e0b' : '#ef4444')};">
               ${rec.ats_score}%
            </div>
        `;
        
        div.onclick = () => {
            const idx = selectedHistoryIds.indexOf(rec.id);
            if (idx > -1) {
                selectedHistoryIds.splice(idx, 1);
                div.style.border = '1px solid transparent';
                div.style.background = 'rgba(255,255,255,0.05)';
            } else {
                if (selectedHistoryIds.length >= 2) return; // Max 2
                selectedHistoryIds.push(rec.id);
                div.style.border = '1px solid var(--accent-color)';
                div.style.background = 'rgba(139, 92, 246, 0.1)';
            }
            
            const btn = document.getElementById('compareBtn');
            btn.innerText = `Compare Selected (${selectedHistoryIds.length}/2)`;
            btn.disabled = selectedHistoryIds.length !== 2;
        };
        
        listC.appendChild(div);
    });
}

// Hook into showPage to refresh history
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    if (pageId === 'history') {
        renderHistoryList();
        const compC = document.getElementById('comparisonContainer');
        if (compC) compC.innerHTML = '<div class="text-secondary text-center" style="padding: 3rem 0;">Select exactly two versions from the left panel and click Compare.</div>';
    }
    originalShowPage(pageId);
}

document.getElementById('compareBtn')?.addEventListener('click', async () => {
    if (selectedHistoryIds.length !== 2) return;
    
    const records = await getAnalysisVersions();
    const v1 = records.find(r => r.id === selectedHistoryIds[1]); // Older
    const v2 = records.find(r => r.id === selectedHistoryIds[0]); // Newer
    
    const compC = document.getElementById('comparisonContainer');
    compC.innerHTML = '<div class="text-center text-secondary" style="padding: 2rem 0;">Generating A/B comparison...</div>';
    
    // A/B Table UI
    let html = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <thead>
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <th style="padding: 0.5rem; text-align: left;">Metric</th>
                    <th style="padding: 0.5rem; text-align: center;">Version 1<br><span style="font-weight:normal;font-size:0.75rem">${new Date(v1.timestamp).toLocaleDateString()}</span></th>
                    <th style="padding: 0.5rem; text-align: center;">Version 2<br><span style="font-weight:normal;font-size:0.75rem">${new Date(v2.timestamp).toLocaleDateString()}</span></th>
                    <th style="padding: 0.5rem; text-align: center;">Trend</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <td style="padding: 0.75rem;">ATS Score</td>
                    <td style="padding: 0.75rem; text-align: center; font-weight: bold;">${v1.ats_score}%</td>
                    <td style="padding: 0.75rem; text-align: center; font-weight: bold;">${v2.ats_score}%</td>
                    <td style="padding: 0.75rem; text-align: center;">${getTrendIcon(v1.ats_score, v2.ats_score)}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <td style="padding: 0.75rem;">Skills Matched</td>
                    <td style="padding: 0.75rem; text-align: center;">${v1.payload.matched_skills.length}</td>
                    <td style="padding: 0.75rem; text-align: center;">${v2.payload.matched_skills.length}</td>
                    <td style="padding: 0.75rem; text-align: center;">${getTrendIcon(v1.payload.matched_skills.length, v2.payload.matched_skills.length)}</td>
                </tr>
            </tbody>
        </table>
        <div id="aiCompareSummary">
            <span class="text-secondary">AI analyzing changes...</span>
        </div>
    `;
    compC.innerHTML = html;
    
    // AI Summary
    if (localStorage.getItem('geminiApiKey')) {
        const prompt = `Compare these two resume analysis versions. Tell me what changed, what improved, and what got worse between Version 1 and Version 2. Keep it concise (2 paragraphs max).
        Version 1: ATS Score ${v1.ats_score}%, Skills: ${v1.payload.matched_skills.join(', ')}
        Version 2: ATS Score ${v2.ats_score}%, Skills: ${v2.payload.matched_skills.join(', ')}`;
        
        try {
            const summary = await callGeminiAPI(prompt);
            document.getElementById('aiCompareSummary').innerHTML = `
                <div style="background: rgba(16,185,129,0.05); padding: 1rem; border-radius: var(--radius-sm); border-left: 3px solid #10b981;">
                    <h4 style="margin-bottom: 0.5rem; color: #10b981;">AI Comparison Summary</h4>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${summary}</p>
                </div>
            `;
        } catch (err) {
            document.getElementById('aiCompareSummary').innerHTML = '<span class="text-secondary">Failed to generate AI summary.</span>';
        }
    } else {
        document.getElementById('aiCompareSummary').innerHTML = '<span class="text-secondary">Provide an API Key for AI summary.</span>';
    }
});

function getTrendIcon(v1, v2) {
    if (v2 > v1) return '<span style="color: #10b981; font-weight:bold;">▲ +'+(v2-v1)+'</span>';
    if (v2 < v1) return '<span style="color: #ef4444; font-weight:bold;">▼ '+(v2-v1)+'</span>';
    return '<span style="color: var(--text-secondary);">-</span>';
}
