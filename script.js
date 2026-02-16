// Data Management
const db = {
    users: [
        { id: 1, name: 'Parth Student', email: 'student@demo.com', role: 'student', password: 'password' },
        { id: 2, name: 'Admin User', email: 'admin@demo.com', role: 'admin', password: 'password' }
    ],
    activities: [
        { id: 1, userId: 1, title: 'Web Development Bootcamp', type: 'Workshop', startDate: '2023-01-15', endDate: '2023-01-20', description: 'Learned HTML, CSS, JS basics.', status: 'Completed' },
        { id: 2, userId: 1, title: 'Google Cloud Internship', type: 'Internship', startDate: '2023-06-01', endDate: '2023-08-31', description: 'Worked on cloud infrastructure.', status: 'Completed' },
        { id: 3, userId: 1, title: 'Python for Data Science', type: 'Training', startDate: '2023-11-01', endDate: '2023-11-30', description: 'Data analysis with Pandas.', status: 'Ongoing' }
    ],
    opportunities: [
        { id: 1, title: 'Summer Intern 2024', company: 'Tech Corp', type: 'Internship', deadline: '2024-04-30' },
        { id: 2, title: 'Junior Dev', company: 'StartUp Inc', type: 'Job', deadline: '2024-05-15' }
    ]
};

// State
let currentUser = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkAuth();
    setupEventListeners();
});

function loadData() {
    if (!localStorage.getItem('iet_users')) {
        localStorage.setItem('iet_users', JSON.stringify(db.users));
        localStorage.setItem('iet_activities', JSON.stringify(db.activities));
        localStorage.setItem('iet_opportunities', JSON.stringify(db.opportunities));
    }
}

function getData(key) {
    return JSON.parse(localStorage.getItem(`iet_${key}`)) || [];
}

function setData(key, data) {
    localStorage.setItem(`iet_${key}`, JSON.stringify(data));
}

// Authentication
function checkAuth() {
    const sessionUser = JSON.parse(sessionStorage.getItem('iet_current_user'));
    if (sessionUser) {
        currentUser = sessionUser;
        showDashboard(currentUser.role);
    } else {
        showView('login-view');
    }
}

function login(email, password) {
    const users = getData('users');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        sessionStorage.setItem('iet_current_user', JSON.stringify(user));
        showToast(`Welcome back, ${user.name}!`);
        showDashboard(user.role);
    } else {
        showToast('Invalid email or password.');
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('iet_current_user');
    showView('login-view');
    showToast('Logged out successfully.');
}

// Navigation
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function showDashboard(role) {
    if (role === 'student') {
        showView('student-view');
        updateStudentDashboard();
        showSubSection('student-dashboard');
        document.getElementById('student-name').textContent = currentUser.name;
    } else if (role === 'admin') {
        showView('admin-view');
        updateAdminDashboard();
        showSubSection('admin-dashboard');
    }
}

function showSubSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Update sidebar active state
    const sidebar = document.querySelector(currentUser.role === 'student' ? '#student-view .sidebar-nav' : '#admin-view .sidebar-nav');
    sidebar.querySelectorAll('li').forEach(li => li.classList.remove('active'));

    // Simple logic to highlight based on onclick attribute match (can be improved)
    const activeLink = Array.from(sidebar.querySelectorAll('li')).find(li => li.getAttribute('onclick').includes(sectionId));
    if (activeLink) activeLink.classList.add('active');

    // Refresh data if needed
    if (sectionId === 'view-activities' && currentUser.role === 'student') renderStudentActivities();
    if (sectionId === 'student-records' && currentUser.role === 'admin') renderStudentRecords();
    if (sectionId === 'manage-opps' && currentUser.role === 'admin') renderOpportunities();
}

// Student Handlers
function updateStudentDashboard() {
    const activities = getData('activities').filter(a => a.userId === currentUser.id);

    const counts = {
        Internship: 0,
        Training: 0,
        Workshop: 0,
        Total: activities.length
    };

    activities.forEach(a => {
        if (counts[a.type] !== undefined) counts[a.type]++;
    });

    document.getElementById('count-internship').textContent = counts.Internship;
    document.getElementById('count-training').textContent = counts.Training;
    document.getElementById('count-workshop').textContent = counts.Workshop;
    document.getElementById('count-total').textContent = counts.Total;

    // Recent Table
    const recentBody = document.getElementById('student-recent-activities-body');
    recentBody.innerHTML = '';
    const recent = activities.slice(-5).reverse();

    if (recent.length === 0) {
        recentBody.innerHTML = '<tr><td colspan="4" class="empty-state">No activities found.</td></tr>';
    } else {
        recent.forEach(a => {
            const row = `<tr>
                <td>${a.title}</td>
                <td><span class="badge badge-${a.type.toLowerCase()}">${a.type}</span></td>
                <td>${a.startDate}</td>
                <td>${a.status}</td>
            </tr>`;
            recentBody.innerHTML += row;
        });
    }
}

function handleActivitySubmit(e) {
    e.preventDefault();
    const newActivity = {
        id: Date.now(),
        userId: currentUser.id,
        title: document.getElementById('act-title').value,
        type: document.getElementById('act-type').value,
        startDate: document.getElementById('act-start').value,
        endDate: document.getElementById('act-end').value,
        description: document.getElementById('act-description')?.value || '', // Fixed ID
        status: document.getElementById('act-status').value
    };

    const activities = getData('activities');
    activities.push(newActivity);
    setData('activities', activities);

    showToast('Activity logged successfully!');
    e.target.reset();
    updateStudentDashboard();
    showSubSection('student-dashboard');
}

function renderStudentActivities() {
    const filter = document.getElementById('filter-type').value;
    const search = document.getElementById('search-activities').value.toLowerCase();

    const activities = getData('activities').filter(a => a.userId === currentUser.id);
    const filtered = activities.filter(a => {
        const matchesType = filter === 'All' || a.type === filter;
        const matchesSearch = a.title.toLowerCase().includes(search);
        return matchesType && matchesSearch;
    });

    const tbody = document.getElementById('all-activities-body');
    tbody.innerHTML = '';

    filtered.forEach(a => {
        tbody.innerHTML += `<tr>
            <td>${a.title}</td>
            <td>${a.type}</td>
            <td>${a.startDate} to ${a.endDate}</td>
            <td>${a.status}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteActivity(${a.id})">Delete</button></td>
        </tr>`;
    });
}

function deleteActivity(id) {
    if (confirm('Are you sure?')) {
        let activities = getData('activities');
        activities = activities.filter(a => a.id !== id);
        setData('activities', activities);
        renderStudentActivities();
        updateStudentDashboard();
        showToast('Activity deleted.');
    }
}

// Admin Handlers
function updateAdminDashboard() {
    const users = getData('users').filter(u => u.role === 'student');
    const activities = getData('activities');
    const opps = getData('opportunities');

    document.getElementById('admin-total-students').textContent = users.length;
    document.getElementById('admin-total-activities').textContent = activities.length;
    document.getElementById('admin-active-opps').textContent = opps.length;

    // Recent All Activities
    const recentBody = document.getElementById('admin-recent-activities-body');
    recentBody.innerHTML = '';
    const recent = activities.slice(-5).reverse();

    recent.forEach(a => {
        const student = getData('users').find(u => u.id === a.userId)?.name || 'Unknown';
        recentBody.innerHTML += `<tr>
            <td>${student}</td>
            <td>${a.title}</td>
            <td>${a.type}</td>
            <td>${a.startDate}</td>
        </tr>`;
    });
}

function renderStudentRecords() {
    const students = getData('users').filter(u => u.role === 'student');
    const activities = getData('activities');
    const tbody = document.getElementById('student-records-body');
    tbody.innerHTML = '';

    students.forEach(s => {
        const count = activities.filter(a => a.userId === s.id).length;
        tbody.innerHTML += `<tr>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${count} Activities</td>
            <td><button class="btn btn-sm btn-primary">View Details</button></td>
        </tr>`;
    });
}

function renderOpportunities() {
    const opps = getData('opportunities');
    const tbody = document.getElementById('opps-body');
    tbody.innerHTML = '';

    opps.forEach(o => {
        tbody.innerHTML += `<tr>
            <td>${o.title}</td>
            <td>${o.company}</td>
            <td>${o.type}</td>
            <td>${o.deadline}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteOpp(${o.id})">Remove</button>
            </td>
        </tr>`;
    });
}

function deleteOpp(id) {
    if (confirm('Remove this opportunity?')) {
        let opps = getData('opportunities');
        opps = opps.filter(o => o.id !== id);
        setData('opportunities', opps);
        renderOpportunities();
        updateAdminDashboard();
    }
}

// Modal Handlers
function showAddOppModal() {
    document.getElementById('opp-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('opp-modal').style.display = 'none';
}

function handleOppSubmit(e) {
    e.preventDefault();
    const newOpp = {
        id: Date.now(),
        title: document.getElementById('opp-title').value,
        company: document.getElementById('opp-company').value,
        type: document.getElementById('opp-type').value,
        deadline: document.getElementById('opp-deadline').value
    };

    const opps = getData('opportunities');
    opps.push(newOpp);
    setData('opportunities', opps);

    showToast('Opportunity Posted!');
    e.target.reset();
    closeModal();
    renderOpportunities();
    updateAdminDashboard();
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });

    document.getElementById('activity-form').addEventListener('submit', handleActivitySubmit);

    document.getElementById('opp-form')?.addEventListener('submit', handleOppSubmit);

    // Close modal on outside click
    window.onclick = function (event) {
        if (event.target == document.getElementById('opp-modal')) {
            closeModal();
        }
    }
}

// Utilities
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}
