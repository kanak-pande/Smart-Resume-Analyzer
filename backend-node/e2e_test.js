const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function fetchAPI(path, options = {}, cookies = '') {
    const url = new URL(path, BASE_URL);
    
    const fetchOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(cookies ? { 'Cookie': cookies } : {}),
            ...options.headers
        }
    };

    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    // Using node's native fetch (Node 18+)
    const response = await fetch(url, fetchOptions);
    
    let setCookie = response.headers.get('set-cookie');
    let cookie = cookies;
    if (setCookie) {
        cookie = setCookie.split(';')[0];
    }

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    return { status: response.status, data, cookie };
}

async function runTests() {
    console.log('--- STARTING E2E TESTS ---');
    let studentCookie, recruiterCookie, adminCookie;
    let jobId, appId;

    try {
        // 1. Register Users
        console.log('1. Registering users...');
        const sReg = await fetchAPI('/api/auth/register', { method: 'POST', body: { email: 'student1@test.com', password: 'password', roleName: 'STUDENT', firstName: 'John', lastName: 'Doe' }});
        console.log('Student Register:', sReg.status);
        
        const rReg = await fetchAPI('/api/auth/register', { method: 'POST', body: { email: 'recruiter1@test.com', password: 'password', roleName: 'RECRUITER', companyName: 'Tech Corp' }});
        console.log('Recruiter Register:', rReg.status);
        
        const aReg = await fetchAPI('/api/auth/register', { method: 'POST', body: { email: 'admin1@test.com', password: 'password', roleName: 'COLLEGE_ADMIN' }});
        console.log('Admin Register:', aReg.status);

        // 2. Login Users
        console.log('\n2. Logging in...');
        const sLog = await fetchAPI('/api/auth/login', { method: 'POST', body: { email: 'student1@test.com', password: 'password' }});
        studentCookie = sLog.cookie;
        console.log('Student Login:', sLog.status);

        const rLog = await fetchAPI('/api/auth/login', { method: 'POST', body: { email: 'recruiter1@test.com', password: 'password' }});
        recruiterCookie = rLog.cookie;
        console.log('Recruiter Login:', rLog.status);

        const aLog = await fetchAPI('/api/auth/login', { method: 'POST', body: { email: 'admin1@test.com', password: 'password' }});
        adminCookie = aLog.cookie;
        console.log('Admin Login:', aLog.status);

        // 3. Recruiter Flow (Create Job)
        console.log('\n3. Recruiter Flow...');
        await fetchAPI('/api/recruiter/profile', { method: 'POST', body: { company: 'Tech Corp', designation: 'HR', contact: '123' }}, recruiterCookie);
        const jobRes = await fetchAPI('/api/recruiter/jobs', { method: 'POST', body: {
            title: 'Software Engineer', company: 'Tech Corp', description: 'Good job', requiredSkills: ['React', 'Node'], preferredSkills: ['AWS'], experienceRequired: '0-2', location: 'Remote', employmentType: 'Full-time', salary: '100k'
        }}, recruiterCookie);
        jobId = jobRes.data.id;
        console.log('Job Created, ID:', jobId);

        // 4. Student Flow
        console.log('\n4. Student Flow...');
        const resProf = await fetchAPI('/api/resume', { method: 'POST', body: {
            skills: ['React', 'Node'], education: [], projects: [], experience: [], certifications: [], keywords: [], preferredRoles: ['Software Engineer'], rawText: 'I know React and Node.'
        }}, studentCookie);
        console.log('Resume Saved:', resProf.status);

        const jobsList = await fetchAPI('/api/jobs', {}, studentCookie);
        console.log('Jobs Fetched:', jobsList.data.length);

        const applyRes = await fetchAPI(`/api/jobs/${jobId}/apply`, { method: 'POST' }, studentCookie);
        appId = applyRes.data.application?.id || applyRes.data.id; 
        console.log('Applied for Job:', applyRes.status, 'App ID:', appId);
        
        const roadmapRes = await fetchAPI('/api/roadmap', { method: 'POST', body: { targetRole: 'Software Engineer', items: [{ title: 'Learn AWS', description: 'AWS Basics', priority: 'HIGH', category: 'Cloud'}] }}, studentCookie);
        const roadmapId = roadmapRes.data[0]?.id;
        console.log('Roadmap Generated:', roadmapRes.status, 'Roadmap ID:', roadmapId);
        
        if (roadmapId) {
            const rdUpd = await fetchAPI(`/api/roadmap/${roadmapId}/status`, { method: 'PUT', body: { status: 'COMPLETED' }}, studentCookie);
            console.log('Roadmap Item Completed:', rdUpd.status);
        }

        const intGen = await fetchAPI('/api/interview/generate', { method: 'POST', body: { targetJob: 'Software Engineer', type: 'Technical', difficulty: 'Medium', numQuestions: 2 }}, studentCookie);
        console.log('Interview Generated:', intGen.status, 'Count:', intGen.data.length);
        
        const intEval = await fetchAPI('/api/interview/evaluate', { method: 'POST', body: { question: 'What is React?', answer: 'A UI library.' }}, studentCookie);
        console.log('Interview Evaluated:', intEval.status, 'Score:', intEval.data?.relevance);
        
        const intSave = await fetchAPI('/api/interview/save', { method: 'POST', body: { type: 'Technical', difficulty: 'Medium', totalScore: 80, summary: 'Good', questions: [{question: 'Q1', answer: 'A1', feedback: intEval.data}] }}, studentCookie);
        console.log('Interview Saved:', intSave.status);
        
        const readRes = await fetchAPI('/api/student/readiness', {}, studentCookie);
        console.log('Readiness Score:', readRes.status, 'Overall:', readRes.data?.overallScore);

        // 5. Recruiter Application Management
        console.log('\n5. Recruiter Candidate Management...');
        const candRes = await fetchAPI(`/api/recruiter/jobs/${jobId}/candidates`, {}, recruiterCookie);
        console.log('Candidates Fetched:', candRes.status, 'Count:', candRes.data.length);
        
        if (appId) {
            const appUpd = await fetchAPI(`/api/recruiter/applications/${appId}/status`, { method: 'PUT', body: { status: 'INTERVIEW' }}, recruiterCookie);
            console.log('Application Status Updated to INTERVIEW:', appUpd.status);
            
            const matchRes = await fetchAPI(`/api/recruiter/candidates/${appId}/match`, { method: 'POST' }, recruiterCookie);
            console.log('AI Candidate Match:', matchRes.status);
        }

        // 6. Admin Flow
        console.log('\n6. Admin Flow...');
        const statRes = await fetchAPI('/api/admin/stats', {}, adminCookie);
        console.log('Admin Stats:', statRes.status, 'Data:', statRes.data);
        
        const gapsRes = await fetchAPI('/api/admin/skill-gaps', {}, adminCookie);
        console.log('Skill Gaps:', gapsRes.status);

        console.log('\n--- TESTS COMPLETED SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- TEST FAILED ---');
        console.error(err);
    }
}

runTests();
