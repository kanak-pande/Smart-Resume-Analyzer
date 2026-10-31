# Project Report: Smart Resume Analyzer

## INDEX
1. Introduction
   1.1 Aims & Objective
2. Need of system
3. System study analysis
   3.1 Information Gathering
4. Scope of proposed project
5. Feasibility Study
   5.1 Three types of feasibility study
6. System Development
   6.1 Operating Environment
   6.2 Introduction of HTML, CSS
7. Detail Design of Proposed system
   7.1 Use case Diagram
   7.2 Data Flow Diagram
8. DataBase Design
   8.1 Screen Layout
9. Testing and Implementation
   9.1 Testing
       9.1.1 White Box Testing
       9.1.2 Black Box Testing
       9.1.3 Performance Testing
10. Bibliography

---

## 1. Introduction
The **Smart Resume Analyzer** is an advanced, AI-powered web application designed to bridge the gap between job seekers and Applicant Tracking Systems (ATS). In today's highly competitive job market, an overwhelming majority of resumes are discarded by automated ATS software before a human recruiter ever sees them. This project leverages generative artificial intelligence (Google Gemini API) to deeply analyze resumes against specific job descriptions, providing candidates with actionable feedback, explainable scoring, and strategic insights.

### 1.1 Aims & Objective
* **Primary Aim:** To empower job seekers by simulating an enterprise-grade Applicant Tracking System, allowing them to optimize their resumes before submission.
* **Objective 1:** Provide an explainable "ATS Match Score" based on keyword density, semantic matching, and required skills.
* **Objective 2:** Generate personalized learning roadmaps and tailored interview questions using AI.
* **Objective 3:** Ensure complete client-side data privacy by processing sensitive documents locally in the browser.
* **Objective 4:** Provide historical A/B testing of different resume iterations using local database storage.

## 2. Need of system
The modern recruitment lifecycle heavily relies on automation. Candidates often face a "black box" where they apply for dozens of jobs without knowing why they were rejected. Existing tools are either expensive, require extensive sign-ups, or compromise user data privacy by uploading resumes to cloud servers. There is a critical need for a free, entirely local, and highly intelligent tool that not only scores a resume but practically assists the user in improving it (e.g., rewriting bullet points, generating cover letters, and detecting transferable skills).

## 3. System study analysis
The current systems in the market were studied and evaluated to identify gaps in functionality. Most competitors provide basic keyword-matching without understanding the semantic context of a user's experience.

### 3.1 Information Gathering
Information for the project was gathered through:
* **Market Research:** Analyzing existing ATS platforms (e.g., Taleo, Workday) to understand how they parse and score PDF/DOCX files.
* **Technical Documentation:** Studying Google's Gemini API documentation for natural language processing, and IndexedDB for local storage solutions.
* **User Feedback Requirements:** Understanding the struggles of graduating students and professionals in getting shortlisted for technical interviews.

## 4. Scope of proposed project
The scope of the Smart Resume Analyzer encompasses a full suite of career-prep tools bundled into a Single Page Application (SPA). The project includes:
1. Multi-format document parsing (PDF and DOCX).
2. Advanced AI integrations including Cover Letter Generation, Bullet Point Rewriting (STAR Method), and Semantic Job Match Analysis.
3. A strictly client-side architecture where no user data is stored on remote servers.
4. Future scope includes extending the tool into a browser extension and adding multi-language support.

## 5. Feasibility Study
Before initiating the development phase, a comprehensive feasibility study was conducted to ensure the project's viability.

### 5.1 Three types of feasibility study
1. **Technical Feasibility:** The project relies on Vanilla JavaScript, HTML, and CSS, paired with robust external libraries (`pdf.js` and `mammoth.js`) and the Google Gemini API. Since these technologies are well-documented and highly supported by modern browsers, the project is highly technically feasible.
2. **Economic Feasibility:** The system requires zero infrastructure cost. By utilizing the browser's local storage (IndexedDB) and the free tier of the Gemini API, server hosting and database costs are entirely eliminated. Thus, it is highly economically feasible.
3. **Operational Feasibility:** The user interface is designed to be intuitive, resembling modern premium dashboards (glassmorphism design). Users simply upload a file and click "Analyze," making it highly operationally feasible for non-technical users.

## 6. System Development
The system was developed following an Agile methodology, allowing iterative development of dashboard modules, UI refinement, and AI integration.

### 6.1 Operating Environment
* **Platform:** Web Browser (Google Chrome, Mozilla Firefox, Edge)
* **Frontend Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Libraries:** `pdf.js` (for PDF parsing), `mammoth.js` (for DOCX parsing), `lucide.js` (for iconography).
* **Storage:** IndexedDB API (Local Browser Storage)
* **External Services:** Google Gemini API (REST)

### 6.2 Introduction of HTML, CSS
* **HTML5:** Used for the semantic structuring of the application. It provides the skeleton of the dashboard, dividing the UI into logical grids, cards, and interactive sections.
* **CSS3:** Used for the visual aesthetics. The project heavily utilizes CSS Variables (Custom Properties), CSS Grid, and Flexbox for a responsive layout. A "Glassmorphism" aesthetic was achieved using `backdrop-filter` and semi-transparent backgrounds to create a premium, modern feel.

## 7. Detail Design of Proposed system

### 7.1 Use case Diagram
* **Actor:** Job Seeker (User)
* **Use Cases:** 
  1. Upload Resume (PDF/DOCX)
  2. Input Target Job Description
  3. View ATS Match Score & Breakdown
  4. Generate AI Cover Letter
  5. Rewrite Bullet Points
  6. View AI Learning Roadmap
  7. Save & Compare Analysis History

### 7.2 Data Flow Diagram
1. **Input Stage:** User uploads a file -> `FileReader API` converts it to an ArrayBuffer.
2. **Parsing Stage:** ArrayBuffer is sent to `pdf.js` or `mammoth.js` -> Extracts raw text.
3. **Analysis Stage:** Raw text and Job Description are sent to `callGeminiAPI()` -> HTTP POST request to Google Servers.
4. **Output Stage:** JSON response is returned -> Parsed by JavaScript -> DOM is updated (`innerHTML`) to display actionable metrics.
5. **Storage Stage:** The results object is serialized and saved to `SmartResumeDB` (IndexedDB) for future A/B testing.

## 8. DataBase Design
Unlike traditional web applications, this system does not use a relational database like MySQL. To enforce strict user privacy, it uses **IndexedDB**, a low-level API for client-side storage of significant amounts of structured data.
* **Database Name:** `SmartResumeDB`
* **Object Store:** `history`
* **Schema/Keys:**
  * `id`: Auto-incrementing primary key.
  * `timestamp`: Date and time of the analysis.
  * `job_title`: Extracted title for reference.
  * `score`: The calculated ATS match score.
  * `data`: A complete JSON blob containing all analysis metrics.

### 8.1 Screen Layout
The screen layout is built on a responsive CSS Grid system:
* **Header:** Logo, Title, and a Settings modal trigger (for API key configuration).
* **Sidebar/Top Panel:** File upload zone, Job description input, and the primary "Analyze" action button.
* **Main Dashboard:** A multi-row grid layout featuring cards for:
  1. ATS Match Score (Circular Progress)
  2. Explainable Score Breakdown
  3. Semantic Skills & Keyword Density
  4. AI Learning Roadmap & Interview Intelligence
  5. AI Copilot (Cover Letter & Rewriter)

## 9. Testing and Implementation

### 9.1 Testing
The system underwent rigorous testing to ensure reliability and accuracy.

#### 9.1.1 White Box Testing
Internal logic testing focused on the parsing algorithms and data flow.
* **API Validation:** Ensuring `callGeminiAPI()` correctly handles malformed responses or network timeouts using `try...catch` blocks.
* **Scoring Algorithm:** Verifying that the weighted scoring mathematical model correctly calculates the total out of 100 based on exact keyword matches.

#### 9.1.2 Black Box Testing
Testing the software from a user's perspective without knowing internal code structure.
* **File Uploads:** Attempting to upload unsupported files (e.g., `.jpg`, `.txt`) to verify that the UI correctly throws an "Unsupported format" alert.
* **UI Interactions:** Ensuring that clicking "Analyze" correctly disables the button and updates the loading text to prevent duplicate submissions.

#### 9.1.3 Performance Testing
* **Parsing Speed:** Ensuring that large, multi-page PDFs are parsed in under 2 seconds.
* **API Latency:** Simulating network delays to ensure the UI gracefully handles asynchronous AI responses using loading placeholders.

## 10. Bibliography
1. Mozilla Developer Network (MDN) Web Docs - *IndexedDB API, FileReader API, ES6 Promises*.
2. Google AI Developer Documentation - *Gemini API Integration and Prompt Engineering*.
3. PDF.js Documentation (Mozilla) - *Client-side PDF rendering and text extraction*.
4. Mammoth.js GitHub Repository - *Converting DOCX to raw text in JavaScript*.
5. Lucide Icons - *Open-source SVG iconography*.
