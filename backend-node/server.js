require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-placementos-key';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// --- Auth API ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, roleName, firstName, lastName, companyName } = req.body;
        
        let role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            role = await prisma.role.create({ data: { name: roleName } });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const passwordHash = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                roleId: role.id
            }
        });

        if (roleName === 'STUDENT') {
            await prisma.studentProfile.create({
                data: { userId: user.id, firstName: firstName || 'Student', lastName: lastName || '' }
            });
        } else if (roleName === 'RECRUITER') {
            await prisma.recruiterProfile.create({
                data: { userId: user.id, companyName: companyName || 'Unknown Company', position: '' }
            });
        } else if (roleName === 'COLLEGE_ADMIN') {
            let college = await prisma.college.findFirst();
            if (!college) {
                college = await prisma.college.create({ data: { name: 'Default College' } });
            }
            await prisma.collegeAdmin.create({
                data: { userId: user.id, collegeId: college.id }
            });
        }

        const token = jwt.sign({ userId: user.id, role: role.name }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ message: 'Registration successful', role: role.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
        
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ userId: user.id, role: user.role.name }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ message: 'Login successful', role: user.role.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

// --- Middleware for Protected Routes ---
const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
};

const requireRole = (roleName) => {
    return (req, res, next) => {
        if (req.user.role !== roleName) {
            return res.status(403).send('Forbidden: Incorrect Role');
        }
        next();
    };
};

// --- API Routes for PlacementOS ---

// Resume Profile
app.post('/api/resume', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const { skills, education, projects, experience, certifications, keywords, preferredRoles, rawText } = req.body;
        
        const profile = await prisma.resumeProfile.upsert({
            where: { studentId: student.id },
            update: {
                skills: JSON.stringify(skills),
                education: JSON.stringify(education),
                projects: JSON.stringify(projects),
                experience: JSON.stringify(experience),
                certifications: JSON.stringify(certifications),
                keywords: JSON.stringify(keywords),
                preferredRoles: JSON.stringify(preferredRoles),
                rawText
            },
            create: {
                studentId: student.id,
                skills: JSON.stringify(skills),
                education: JSON.stringify(education),
                projects: JSON.stringify(projects),
                experience: JSON.stringify(experience),
                certifications: JSON.stringify(certifications),
                keywords: JSON.stringify(keywords),
                preferredRoles: JSON.stringify(preferredRoles),
                rawText
            }
        });
        res.json({ message: 'Resume profile saved successfully', profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/resume', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const profile = await prisma.resumeProfile.findUnique({ where: { studentId: student.id } });
        if (!profile) return res.json(null);
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Jobs
app.post('/api/jobs', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        const { title, company, description, requiredSkills, preferredSkills, experienceRequired, location, employmentType, salary } = req.body;
        const job = await prisma.job.create({
            data: {
                recruiterId: recruiter.id,
                title, company, description,
                requiredSkills: JSON.stringify(requiredSkills),
                preferredSkills: JSON.stringify(preferredSkills),
                experienceRequired, location, employmentType, salary
            }
        });
        res.json({ message: 'Job created', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/jobs', requireAuth, async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/jobs/:id', requireAuth, async (req, res) => {
    try {
        const job = await prisma.job.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Applications API ---
app.post('/api/jobs/:id/apply', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) return res.status(400).json({ error: 'Invalid Job ID' });
        
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const app = await prisma.jobApplication.create({
            data: {
                studentId: student.id,
                jobId: jobId,
                status: 'APPLIED'
            }
        });
        res.json({ message: 'Applied successfully', application: app });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/applications', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const apps = await prisma.jobApplication.findMany({ 
            where: { studentId: student.id },
            include: { job: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(apps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/applications/stats', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const apps = await prisma.jobApplication.findMany({ where: { studentId: student.id } });
        
        let stats = { total: apps.length, active: 0, interviews: 0, selected: 0, rejected: 0 };
        apps.forEach(app => {
            if (['APPLIED', 'ASSESSMENT'].includes(app.status)) stats.active++;
            if (app.status === 'INTERVIEW') stats.interviews++;
            if (app.status === 'SELECTED') stats.selected++;
            if (app.status === 'REJECTED') stats.rejected++;
        });
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/applications/:id', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const { status, notes, interviewDate } = req.body;
        
        // Prevent IDOR: Ensure the application belongs to this student
        const app = await prisma.jobApplication.updateMany({
            where: { id: parseInt(req.params.id), studentId: student.id },
            data: { status, notes, interviewDate: interviewDate ? new Date(interviewDate) : null }
        });
        
        if (app.count === 0) return res.status(404).json({ error: 'Application not found or unauthorized' });
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/applications/:id', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const app = await prisma.jobApplication.deleteMany({ 
            where: { id: parseInt(req.params.id), studentId: student.id } 
        });
        
        if (app.count === 0) return res.status(404).json({ error: 'Application not found or unauthorized' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Roadmap API
app.get('/api/roadmap', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const items = await prisma.roadmapItem.findMany({ where: { studentId: student.id } });
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/roadmap', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const { targetRole, items } = req.body;
        await prisma.roadmapItem.deleteMany({ where: { studentId: student.id } });
        const saved = await Promise.all(items.map(item => 
            prisma.roadmapItem.create({
                data: {
                    studentId: student.id,
                    targetRole,
                    title: item.title,
                    description: item.description,
                    priority: item.priority || 'MEDIUM',
                    category: item.category || 'Programming'
                }
            })
        ));
        res.json(saved);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/roadmap/:id/status', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const { status } = req.body;
        const item = await prisma.roadmapItem.updateMany({
            where: { id: parseInt(req.params.id), studentId: student.id },
            data: { status }
        });
        
        if (item.count === 0) return res.status(404).json({ error: 'Roadmap item not found or unauthorized' });
        res.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Interview API ---
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo');
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/interview/generate', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const resume = await prisma.resumeProfile.findUnique({ where: { studentId: student.id } });
        
        const { targetJob, type, difficulty, numQuestions } = req.body;
        
        let prompt = `Act as an expert technical and HR interviewer. 
        Generate exactly ${numQuestions} interview questions for a ${targetJob} role.
        Interview Type: ${type}
        Difficulty: ${difficulty}
        
        Candidate's Resume Context: 
        Skills: ${resume ? resume.skills : 'Not provided'}
        Experience/Projects: ${resume ? resume.rawText?.substring(0, 500) : 'Not provided'}
        
        Return STRICTLY a JSON array of strings, where each string is a question. Example: ["Q1?", "Q2?"]`;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo') {
            const result = await model.generateContent(prompt);
            let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            res.json(JSON.parse(text));
        } else {
            // Mock questions if no API key
            res.json([
                `Can you explain your experience with the skills listed on your resume?`,
                `Describe a challenging project you worked on recently.`,
                `How do you handle technical disagreements within a team?`
            ].slice(0, numQuestions));
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate questions.' });
    }
});

app.post('/api/interview/evaluate', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const { question, answer } = req.body;
        
        const prompt = `Evaluate the candidate's answer to the following interview question.
        Question: ${question}
        Answer: ${answer}
        
        Return STRICTLY a JSON object with these exact keys:
        - relevance: (number 0-100)
        - correctness: (number 0-100)
        - completeness: (number 0-100)
        - clarity: (number 0-100)
        - missingPoints: (string) short paragraph of what they missed
        - improvements: (string) short paragraph on how to improve
        
        IMPORTANT: Do not evaluate protected or sensitive personal characteristics. Focus solely on professional and technical merit.`;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo') {
            const result = await model.generateContent(prompt);
            let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            res.json(JSON.parse(text));
        } else {
            res.json({
                relevance: 80, correctness: 85, completeness: 70, clarity: 90,
                missingPoints: "You could have added more specific technical metrics.",
                improvements: "Try using the STAR method to structure your answer."
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to evaluate answer.' });
    }
});

app.post('/api/interview/save', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
        const { type, difficulty, totalScore, summary, questions } = req.body;
        
        const interview = await prisma.mockInterview.create({
            data: {
                studentId: student.id,
                type, difficulty, totalScore, summary,
                questions: {
                    create: questions.map(q => ({
                        question: q.question,
                        studentAnswer: q.answer,
                        aiFeedback: JSON.stringify(q.feedback),
                        score: q.feedback.relevance
                    }))
                }
            }
        });
        res.json({ message: 'Interview saved', id: interview.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save interview.' });
    }
});


// --- Recruiter API ---

app.get('/api/recruiter/profile', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        let profile = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        res.json(profile || {});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/recruiter/profile', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const { company, designation, contact } = req.body;
        const profile = await prisma.recruiterProfile.upsert({
            where: { userId: req.user.userId },
            update: { companyName: company, position: designation },
            create: { userId: req.user.userId, companyName: company, position: designation }
        });
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/recruiter/jobs', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const profile = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        if (!profile) return res.json([]);
        const jobs = await prisma.job.findMany({
            where: { recruiterId: profile.id },
            include: { applications: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/recruiter/jobs', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const profile = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        if (!profile) return res.status(400).json({ error: 'Complete your profile first' });
        
        const dataToSave = { ...req.body };
        if (dataToSave.requiredSkills) dataToSave.requiredSkills = JSON.stringify(dataToSave.requiredSkills);
        if (dataToSave.preferredSkills) dataToSave.preferredSkills = JSON.stringify(dataToSave.preferredSkills);

        const job = await prisma.job.create({
            data: {
                ...dataToSave,
                recruiterId: profile.id,
                company: profile.companyName
            }
        });
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/recruiter/jobs/:id', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const profile = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        const dataToUpdate = { ...req.body };
        if (dataToUpdate.requiredSkills) dataToUpdate.requiredSkills = JSON.stringify(dataToUpdate.requiredSkills);
        if (dataToUpdate.preferredSkills) dataToUpdate.preferredSkills = JSON.stringify(dataToUpdate.preferredSkills);

        const job = await prisma.job.update({
            where: { id: parseInt(req.params.id), recruiterId: profile.id },
            data: dataToUpdate
        });
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/recruiter/jobs/:id/candidates', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) return res.status(400).json({ error: 'Invalid Job ID' });
        
        const profile = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        const job = await prisma.job.findFirst({ where: { id: jobId, recruiterId: profile.id } });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        
        const applications = await prisma.jobApplication.findMany({
            where: { jobId: job.id },
            include: {
                student: { 
                    include: { 
                        user: { select: { id: true, email: true } }, 
                        resumeProfile: true 
                    } 
                }
            }
        });
        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/recruiter/applications/:id/status', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const profile = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.userId } });
        const { status } = req.body;
        
        // IDOR Prevention: Ensure the application's job belongs to this recruiter
        const application = await prisma.jobApplication.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { job: true }
        });
        
        if (!application || application.job.recruiterId !== profile.id) {
            return res.status(403).json({ error: 'Unauthorized to modify this application' });
        }

        const updatedApp = await prisma.jobApplication.update({
            where: { id: parseInt(req.params.id) },
            data: { status }
        });
        res.json(updatedApp);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/recruiter/candidates/:appId/match', requireAuth, requireRole('RECRUITER'), async (req, res) => {
    try {
        const application = await prisma.jobApplication.findUnique({
            where: { id: parseInt(req.params.appId) },
            include: { job: true, student: { include: { resumeProfile: true } } }
        });
        if (!application) return res.status(404).json({ error: 'Application not found' });

        const job = application.job;
        const resume = application.student.resumeProfile;

        const prompt = `As an AI assistant to a recruiter, compare this candidate's resume with the job requirements.
        Job Title: ${job.title}
        Job Required Skills: ${job.requiredSkills}
        Job Description: ${job.description}
        
        Candidate Skills: ${resume ? resume.skills : 'None'}
        Candidate Resume: ${resume ? resume.rawText : 'None'}
        
        Return exactly a JSON object with these keys:
        - score: (number 0-100 representing raw match)
        - matchedReqs: (array of strings, requirements the candidate meets)
        - missingReqs: (array of strings, requirements missing)
        - relevantExp: (string, brief summary of relevant experience/projects)
        
        Do not make hiring decisions. Just provide objective matching data.`;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo') {
            const result = await model.generateContent(prompt);
            let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            res.json(JSON.parse(text));
        } else {
            res.json({
                score: 75,
                matchedReqs: ["JavaScript", "React"],
                missingReqs: ["Docker"],
                relevantExp: "Candidate has 2 years of frontend experience in React."
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate match data' });
    }
});


// --- Page Routes ---
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

// Student Protected Routes
app.get('/student', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.redirect('/student/dashboard');
});

app.get('/student/dashboard', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'student_dashboard.html'));
});

app.get('/student/resume', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'resume.html'));
});

app.get('/student/jobs', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'student_jobs.html'));
});

app.get('/student/jobs/:id', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'job_match.html'));
});

app.get('/student/skills', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'student_skills.html'));
});

const { calculateReadiness } = require('./readinessService');

app.get('/api/student/readiness', requireAuth, requireRole('STUDENT'), async (req, res) => {
    try {
        const student = await prisma.studentProfile.findUnique({ 
            where: { userId: req.user.userId },
            include: { resumeProfile: true }
        });
        const applications = await prisma.jobApplication.findMany({ where: { studentId: student.id } });
        const interviews = await prisma.mockInterview.findMany({ where: { studentId: student.id } });
        const roadmapItems = await prisma.roadmapItem.findMany({ where: { studentId: student.id } });

        const readiness = calculateReadiness(student, applications, interviews, roadmapItems);
        res.json(readiness);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to calculate readiness' });
    }
});

app.get('/student/interview', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'student_interview.html'));
});

app.get('/student/applications', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'student_applications.html'));
});

app.get('/student/readiness', requireAuth, requireRole('STUDENT'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'student_readiness.html'));
});

// Recruiter Protected Routes
app.get('/recruiter', requireAuth, requireRole('RECRUITER'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'recruiter_dashboard.html'));
});

// Admin Protected Routes
app.get('/admin', requireAuth, requireRole('COLLEGE_ADMIN'), (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin_dashboard.html'));
});

// Fallback logic for old URL
app.get('/index.html', (req, res) => {
    res.redirect('/login');
});

// --- Admin APIs ---

app.get('/api/admin/stats', requireAuth, requireRole('COLLEGE_ADMIN'), async (req, res) => {
    try {
        const students = await prisma.studentProfile.count();
        const drives = await prisma.placementDrive.count({ where: { status: 'ACTIVE' } });
        const apps = await prisma.jobApplication.findMany();
        
        let stats = { students, drives, applications: apps.length, interviews: 0, selected: 0, rejected: 0 };
        apps.forEach(a => {
            if (a.status === 'INTERVIEW') stats.interviews++;
            if (a.status === 'SELECTED') stats.selected++;
            if (a.status === 'REJECTED') stats.rejected++;
        });
        res.json(stats);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/skill-gaps', requireAuth, requireRole('COLLEGE_ADMIN'), async (req, res) => {
    try {
        const roadmapItems = await prisma.roadmapItem.findMany({ where: { status: 'PENDING' } });
        const skillsCount = {};
        const roleCount = {};
        
        roadmapItems.forEach(item => {
            let skillWords = item.title.replace(/Learn /i, '').replace(/ Basics/i, '').split(' ');
            let skill = skillWords[0] || 'Unknown';
            if(skill.length < 3 && skillWords[1]) skill += ' ' + skillWords[1];
            skillsCount[skill] = (skillsCount[skill] || 0) + 1;
            roleCount[item.targetRole] = (roleCount[item.targetRole] || 0) + 1;
        });

        const sortedSkills = Object.keys(skillsCount).map(k => ({ name: k, count: skillsCount[k] })).sort((a,b) => b.count - a.count).slice(0,5);
        const sortedRoles = Object.keys(roleCount).map(k => ({ name: k, count: roleCount[k] })).sort((a,b) => b.count - a.count).slice(0,5);

        res.json({ skills: sortedSkills, roles: sortedRoles });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/drives', requireAuth, requireRole('COLLEGE_ADMIN'), async (req, res) => {
    try {
        const admin = await prisma.collegeAdmin.findUnique({ where: { userId: req.user.userId } });
        const drives = await prisma.placementDrive.findMany({
            where: { adminId: admin.id },
            include: { job: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(drives);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/drives', requireAuth, requireRole('COLLEGE_ADMIN'), async (req, res) => {
    try {
        const admin = await prisma.collegeAdmin.findUnique({ where: { userId: req.user.userId } });
        const drive = await prisma.placementDrive.create({
            data: {
                ...req.body,
                adminId: admin.id,
                eligibilityCgpa: req.body.eligibilityCgpa ? parseFloat(req.body.eligibilityCgpa) : null,
                deadline: req.body.deadline ? new Date(req.body.deadline) : null
            }
        });
        res.json(drive);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/students', requireAuth, requireRole('COLLEGE_ADMIN'), async (req, res) => {
    try {
        const admin = await prisma.collegeAdmin.findUnique({ where: { userId: req.user.userId } });
        const students = await prisma.studentProfile.findMany({
            where: { collegeId: admin.collegeId },
            include: { 
                user: { select: { id: true, email: true } }, 
                applications: true, 
                resumeProfile: true 
            }
        });
        res.json(students);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`PlacementOS Server running on http://localhost:${PORT}`);
});
