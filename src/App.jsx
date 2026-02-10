
import React, { useState, useEffect } from 'react';
import {
    AlertCircle, CheckCircle, Clock, ChevronRight, Send,
    LogOut, User, Shield, BookOpen, CreditCard, Activity,
    ArrowRight, Users, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const COURSES = ['B.Tech', 'M.Tech', 'Ph.D'];
const DEPARTMENTS = ['CSE', 'ECE', 'CSIT', 'AIDS', 'EEE', 'MECH', 'CIVIL'];
// Coordinator (Local) Scope
const COORD_DEPARTMENTS = [
    'Faculty Issue', 'Lab Maintenance', 'Timetable', 'Department Library', 'Attendance', 'Internal Marks'
];

const EMERGENCY_DEPARTMENTS = ['Exam Cell', 'Finance', 'ERP'];

// Admin (Central) Scope
const ADMIN_DEPARTMENTS = [
    'IT Support (ERP)', 'Finance (Payments)', 'Exam Cell (Hall Ticket)', 'Registrar Office',
    'Hostel Warden', 'Sports Committee', 'Transportation', 'Library (Central)',
    'Plumbing', 'Carpentry', 'Electrical/Utility', 'Stationary', 'Housekeeping', 'Security', 'Other'
];

const CATEGORIES = [
    { id: 'hallticket', label: 'Hall Ticket Issue', priority: 'high' },
    { id: 'fee', label: 'Fee Payment/Update', priority: 'high' },
    { id: 'erp', label: 'ERP Login/Access', priority: 'medium' },
    { id: 'timetable', label: 'Time Table Discrepancy', priority: 'medium' },
    { id: 'marks', label: 'Marks/Evaluation', priority: 'medium' },
    { id: 'hostel', label: 'Hostel Facilities', priority: 'low' },
    { id: 'sports', label: 'Sports Equipment', priority: 'low' },
    { id: 'plumbing', label: 'Plumbing/Water', priority: 'low' },
    { id: 'infrastructure', label: 'Infrastructure/Furniture', priority: 'low' },
    { id: 'other', label: 'Other', priority: 'low' },
];

const INITIAL_GRIEVANCES = [
    {
        id: 'G-1001', studentId: '2300039011', studentEmail: 'rahul.cse@kluniversity.in', studentDept: 'CSE',
        category: 'hallticket', description: 'My hall ticket for the upcoming semester exams has not been generated yet.',
        status: 'urgent', timestamp: new Date().toISOString(), forwardedTo: null, history: []
    },
    {
        id: 'G-1002', studentId: '2300039012', studentEmail: 'priya.ece@kluniversity.in', studentDept: 'ECE',
        category: 'fee', description: 'Payment made but not reflected in ERP.',
        status: 'forwarded_admin', timestamp: new Date(Date.now() - 86400000).toISOString(), forwardedTo: 'Finance', history: []
    },
    {
        id: 'G-1003', studentId: '2300039013', studentEmail: 'kiran.cse@kluniversity.in', studentDept: 'CSE',
        category: 'plumbing', description: 'Tap leaking in Boys Washroom, 2nd Floor.',
        status: 'pending', timestamp: new Date(Date.now() - 172800000).toISOString(), forwardedTo: null, history: []
    },
    {
        id: 'G-1004', studentId: '2300039014', studentEmail: 'arun.mech@kluniversity.in', studentDept: 'MECH',
        category: 'timetable', description: 'Clash in elective subjects.',
        status: 'resolved', timestamp: new Date(Date.now() - 259200000).toISOString(), forwardedTo: null, history: []
    }
];

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    let className = "badge ";
    let label = status;
    if (status === 'urgent') className += "badge-urgent";
    else if (status === 'resolved') className += "badge-resolved";
    else if (status === 'reviewed') { className += "badge-forwarded"; label = "Reviewed"; }
    else if (status === 'forwarded_admin') { className += "badge-pending"; label = "At Admin"; }
    else if (status.startsWith('forwarded')) className += "badge-forwarded";
    else className += "badge-pending";
    return <span className={className}>{label}</span>;
}

const CalendarSidebar = ({ onDateSelect, onFilterSelect, activeFilter }) => {
    const [isHovered, setIsHovered] = useState(false);
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    });

    return (
        <motion.div
            className="glass-panel"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ width: '68px' }}
            animate={{ width: isHovered ? '240px' : '68px' }}
            style={{
                padding: '2rem 0.75rem', height: '100vh', position: 'fixed', top: 0, left: 0,
                display: 'flex', flexDirection: 'column', gap: '2rem', overflow: 'hidden',
                zIndex: 100, transition: 'width 0.3s ease', borderRadius: 0, borderLeft: 'none', borderTop: 'none', borderBottom: 'none'
            }}
        >
            {/* Quick Actions */}
            <div>
                <motion.h4 animate={{ opacity: isHovered ? 0.7 : 0 }} style={{ marginBottom: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap', paddingLeft: '0.5rem' }}>
                    {isHovered ? 'Quick Filters' : ''}
                </motion.h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button onClick={() => onFilterSelect('all')} className={`nav-btn ${activeFilter === 'all' ? 'active' : ''}`} title="All Issues">
                        <BookOpen size={20} /> <motion.span animate={{ opacity: isHovered ? 1 : 0, width: isHovered ? 'auto' : 0 }} style={{ overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: '10px', fontSize: '0.9rem' }}>All Issues</motion.span>
                    </button>
                    <button onClick={() => onFilterSelect('forwarded')} className={`nav-btn ${activeFilter === 'forwarded' ? 'active' : ''}`} title="Forwarded">
                        <ArrowRight size={20} /> <motion.span animate={{ opacity: isHovered ? 1 : 0, width: isHovered ? 'auto' : 0 }} style={{ overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: '10px', fontSize: '0.9rem' }}>Forwarded</motion.span>
                    </button>
                    <button onClick={() => onFilterSelect('reverted')} className={`nav-btn ${activeFilter === 'reverted' ? 'active' : ''}`} title="Reverted">
                        <Activity size={20} /> <motion.span animate={{ opacity: isHovered ? 1 : 0, width: isHovered ? 'auto' : 0 }} style={{ overflow: 'hidden', whiteSpace: 'nowrap', marginLeft: '10px', fontSize: '0.9rem' }}>Reverted</motion.span>
                    </button>
                </div>
            </div>

            {/* Date Calendar */}
            <div>
                <motion.h4 animate={{ opacity: isHovered ? 0.7 : 0 }} style={{ marginBottom: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap', paddingLeft: '0.5rem' }}>
                    {isHovered ? 'Timeline' : ''}
                </motion.h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {dates.map(date => {
                        const dateStr = date.toLocaleDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <motion.div
                                key={dateStr}
                                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                onClick={() => onDateSelect(date)}
                                title={dateStr}
                                style={{
                                    padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    borderLeft: activeFilter === dateStr ? '3px solid #818cf8' : '3px solid transparent',
                                    display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: isHovered ? 'flex-start' : 'center'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{date.getDate()}</div>
                                <motion.span animate={{ opacity: isHovered ? 1 : 0, width: isHovered ? 'auto' : 0 }} style={{ fontSize: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })}
                                </motion.span>
                                {isToday && isHovered && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginLeft: 'auto' }}></div>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Application ---
function App() {
    const [user, setUser] = useState(null);
    const [grievances, setGrievances] = useState(INITIAL_GRIEVANCES);
    const [view, setView] = useState('auth');

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        if (userData.role === 'admin') setView('admin');
        else if (userData.role === 'coordinator') setView('coordinator');
        else setView('student');
    };

    const handleLogout = () => { setUser(null); setView('auth'); };

    const raiseGrievance = (formData) => {
        const categoryObj = CATEGORIES.find(c => c.id === formData.category);
        const params = {
            id: `G-${1000 + grievances.length + 1}`,
            studentId: user.id,
            studentEmail: user.email,
            studentDept: user.department || 'CSE', // Fallback for old/mock users
            category: formData.category,
            description: formData.description,
            status: categoryObj.priority === 'high' ? 'urgent' : 'pending',
            timestamp: new Date().toISOString(),
            forwardedTo: null,
            history: [{ action: 'raised', date: new Date().toISOString() }]
        };
        setGrievances([params, ...grievances]);
        alert("Grievance Token Raised Successfully!");
    };

    const updateStatus = (id, newStatus, extra = {}) => {
        setGrievances(prev => prev.map(g => {
            if (g.id === id) {
                return {
                    ...g, status: newStatus, ...extra,
                    history: [...g.history, { action: newStatus, ...extra, date: new Date().toISOString() }]
                };
            }
            return g;
        }));
    };

    const BackgroundShapes = () => (
        <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
        </div>
    );

    return (
        <div className="page-container">
            <BackgroundShapes />

            {view === 'auth' ? (
                <div className="center-screen">
                    <AuthScreen onLogin={handleLoginSuccess} />
                </div>
            ) : (
                <>
                    <header className="glass-header" style={{
                        marginLeft: user?.role === 'student' ? 0 : '68px',
                        width: user?.role === 'student' ? '100%' : 'calc(100% - 68px)',
                        transition: 'all 0.3s ease'
                    }}>
                        <div className="content-wrapper" style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '0.5rem 2rem', maxWidth: 'none', width: '100%' }}>
                            <div className="flex items-center gap-4">
                                <div style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                    <Shield size={24} color="white" />
                                </div>
                                <div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>UniGrievance</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                        {user.role === 'student' ? 'STUDENT PORTAL' : user.role === 'coordinator' ? `${user.department} COORDINATOR` : 'ADMIN CONSOLE'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden-sm" style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 600 }}>{user.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#cbd5e1', textTransform: 'uppercase' }}>{user.role}</p>
                                </div>
                                <button onClick={handleLogout} className="btn-icon">
                                    <LogOut size={24} />
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="content-wrapper" style={{
                        maxWidth: 'none',
                        width: '100%',
                        padding: 0
                    }}>
                        {view === 'student' && <StudentDashboard user={user} grievances={grievances} onRaise={raiseGrievance} />}
                        {view === 'coordinator' && <CoordinatorDashboard user={user} grievances={grievances} onUpdateStatus={updateStatus} />}
                        {view === 'admin' && <AdminDashboard grievances={grievances} onUpdateStatus={updateStatus} />}
                    </main>
                </>
            )}
        </div>
    );
}

// --- Auth Component ---
const AuthScreen = ({ onLogin }) => {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        email: '', stdId: '', course: '', department: ''
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
    };

    const submitLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const loginInput = formData.email.trim();
        const passwordInput = formData.stdId.trim();

        // 1. Admin Bypass
        if (loginInput === 'admin' && passwordInput === 'admin123') {
            onLogin({ email: 'admin@kluniversity.in', id: 'ADMIN', role: 'admin', name: "System Administrator" });
            setLoading(false); return;
        }

        // 2. Coordinator Bypass 
        if (loginInput.endsWith('_coord') && passwordInput === 'coord123') {
            const dept = loginInput.split('_')[0].toUpperCase();
            const isValidDept = DEPARTMENTS.includes(dept) || ADMIN_DEPARTMENTS.includes(dept) || ['IT', 'FINANCE', 'EXAM', 'REGISTRAR'].includes(dept);

            if (isValidDept || true) {
                onLogin({ email: `${dept.toLowerCase()}.coord@kluniversity.in`, id: 'COORD', role: 'coordinator', name: `${dept} Coordinator`, department: dept });
                setLoading(false); return;
            }
        }

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST', body: JSON.stringify({ login_id: loginInput, password: passwordInput }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) onLogin(data.user);
            else alert(data.message || "Login Failed");
        } catch (err) { alert("Login Error: Verify backend is running."); }
        setLoading(false);
    };

    const submitRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_BASE}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    student_id: formData.stdId,
                    password: formData.password, // Added
                    course: formData.course,
                    department: formData.department
                })
            });
            const data = await res.json();
            if (res.ok) { setMode('otp'); setTimer(60); alert(data.message); }
            else alert(data.message);
        } catch (err) { alert("Registration Error"); }
        setLoading(false);
    };

    // ... (verifyOtp remains same)

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel">
            <div className="text-center mb-6">
                <div style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={40} color="white" />
                </div>
                <h1>University Portal</h1>
                <p>Official Grievance Redressal System</p>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'login' && (
                    <motion.form key="login" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={submitLogin}>
                        <h2 className="text-center">Welcome Back</h2>
                        <div className="mb-6 space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input name="email" value={formData.email} onChange={handleInputChange} placeholder="University Email / Username" className="input-field" required />
                            <input name="stdId" type="password" value={formData.stdId} onChange={handleInputChange} placeholder="Password" className="input-field" required />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary mb-4">
                            {loading ? "Verifying..." : "Login to Portal"}
                        </button>
                        <div className="text-center" style={{ fontSize: '0.9rem' }}>
                            New Student? <span onClick={() => setMode('register')} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>Register Here</span>
                        </div>
                    </motion.form>
                )}

                {mode === 'register' && (
                    <motion.form key="register" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={submitRegister}>
                        <h2 className="text-center">Student Registration</h2>
                        <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input name="email" value={formData.email} onChange={handleInputChange} placeholder="University Email" className="input-field" required />
                            <input name="stdId" value={formData.stdId} onChange={handleInputChange} placeholder="Student ID (10 Digits)" maxLength={10} className="input-field" required />
                            <input name="password" type="password" value={formData.password || ''} onChange={handleInputChange} placeholder="Create Password" className="input-field" required minLength={6} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select name="course" onChange={handleInputChange} className="input-field" required style={{ color: 'black' }}>
                                    <option value="">Select Course</option>
                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select name="department" onChange={handleInputChange} className="input-field" required style={{ color: 'black' }}>
                                    <option value="">Select Dept</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary mb-4">
                            {loading ? "Processing..." : "Send Verification Code"}
                        </button>
                        <div className="text-center" style={{ fontSize: '0.9rem' }}>
                            Already Verified? <span onClick={() => setMode('login')} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>Login</span>
                        </div>
                    </motion.form>
                )}
                {mode === 'otp' && (
                    <motion.form key="otp" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={verifyOtp}>
                        <h2 className="text-center">Verify Email</h2>
                        <p className="text-center mb-6">Code sent to <b>{formData.email}</b></p>
                        <div className="otp-container">
                            {otp.map((digit, idx) => (
                                <input key={idx} id={`otp-${idx}`} className="otp-input" type="text" maxLength="1"
                                    value={digit} onChange={(e) => handleOtpChange(idx, e.target.value)}
                                />
                            ))}
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary mb-4">{loading ? "Checking..." : "Verify & Register"}</button>
                    </motion.form>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- Student View ---
const StudentDashboard = ({ user, grievances, onRaise }) => {
    const [activeTab, setActiveTab] = useState('raise');
    const myGrievances = grievances.filter(g => g.studentId === user.id);

    return (
        <div className="w-full">
            <div className="glass-card text-center mb-6">
                <h2>Welcome, {user.name}</h2>
                <p>{user.email}</p>
                <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#818cf8' }}>
                    {user.course} • {user.department}
                </div>
            </div>
            {/* ... tabs ... */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setActiveTab('raise')} className={`nav-btn ${activeTab === 'raise' ? 'active' : ''}`}>Raise Issue</button>
                <button onClick={() => setActiveTab('history')} className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}>Track Status</button>
            </div>
            {activeTab === 'raise' ? (
                <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        onRaise({ category: e.target.category.value, description: e.target.description.value });
                        e.target.reset();
                        setActiveTab('history');
                    }}>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
                            <select name="category" className="input-field" required style={{ color: 'black' }}>
                                <option value="">Select Category</option>
                                <option value="" disabled>Select Category</option>
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                            <textarea name="description" rows="4" className="input-field" required></textarea>
                        </div>
                        <button type="submit" className="btn-primary">Submit</button>
                    </form>
                </div>
            ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
                    {myGrievances.map(g => (
                        <div key={g.id} className="glass-card" style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold' }}>{CATEGORIES.find(c => c.id === g.category)?.label}</span>
                                <StatusBadge status={g.status} />
                            </div>
                            <p style={{ marginTop: '0.5rem' }}>{g.description}</p>
                            {g.forwardedTo && <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '0.5rem' }}>With: {g.forwardedTo}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Coordinator View ---
const CoordinatorDashboard = ({ user, grievances, onUpdateStatus }) => {
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(null);

    // Refresh Mock
    const handleRefresh = () => {
        setFilter('all');
        setDateFilter(null);
        alert("Dashboard Refreshed");
    };

    // Filter Logic
    const filteredGrievances = grievances.filter(g => {
        // 1. Dept Check
        if (g.studentDept !== user.department) return false;

        // 2. Date Check
        if (dateFilter) {
            return new Date(g.timestamp).toDateString() === dateFilter.toDateString();
        }

        // 3. Status/Type Check
        if (filter === 'forwarded') return ['forwarded_admin', 'forwarded'].includes(g.status) || g.forwardedTo;
        if (filter === 'reverted') return g.status === 'pending' && g.history.some(h => h.action === 'reverted');

        return true;
    }).sort((a, b) => b.id.localeCompare(a.id));

    // Groups
    const urgent = filteredGrievances.filter(g => g.status === 'urgent');
    const others = filteredGrievances.filter(g => g.status !== 'urgent');

    return (
        <div className="flex w-full min-h-screen">
            <CalendarSidebar
                activeFilter={dateFilter ? dateFilter.toLocaleDateString() : filter}
                onDateSelect={(d) => { setDateFilter(d); setFilter('date'); }}
                onFilterSelect={(f) => { setFilter(f); setDateFilter(null); }}
            />

            <div className="flex-1" style={{ marginLeft: '240px', padding: '2rem', transition: 'all 0.3s ease' }}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{user.department} Console</h1>
                        <p className="opacity-70">Manage Department Issues</p>
                    </div>
                    <button onClick={handleRefresh} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                        ⟳ Refresh
                    </button>
                </div>

                {/* Urgent Section */}
                {urgent.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
                            <AlertCircle size={20} /> High Priority / Urgent
                        </h3>
                        <div className="grid gap-4">
                            {urgent.map(g => <GrievanceCard key={g.id} g={g} onUpdateStatus={onUpdateStatus} role="coordinator" />)}
                        </div>
                    </div>
                )}

                {/* Other Issues */}
                <div>
                    <h3 className="text-lg font-bold mb-4 opacity-80">
                        {filter === 'all' ? 'Recent Issues' : filter === 'forwarded' ? 'Forwarded Issues' : 'Filtered Results'}
                    </h3>
                    {others.length === 0 ? (
                        <div className="glass-card text-center opacity-60 py-10">No items found in this section.</div>
                    ) : (
                        <div className="grid gap-3">
                            {others.map(g => <GrievanceCard key={g.id} g={g} onUpdateStatus={onUpdateStatus} role="coordinator" />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Admin View ---
const AdminDashboard = ({ grievances, onUpdateStatus }) => {
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(null);

    const handleRefresh = () => { setFilter('all'); setDateFilter(null); alert("Data Refreshed"); };

    const filteredGrievances = grievances.filter(g => {
        if (dateFilter) return new Date(g.timestamp).toDateString() === dateFilter.toDateString();
        if (filter === 'forwarded') return g.status === 'forwarded_admin' || g.status.startsWith('forwarded');
        if (filter === 'reverted') return false;
        return true;
    }).sort((a, b) => { // Sort by Urgency then Date
        if (a.status === 'urgent' && b.status !== 'urgent') return -1;
        if (a.status !== 'urgent' && b.status === 'urgent') return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const urgent = filteredGrievances.filter(g => g.status === 'urgent');
    const pending = filteredGrievances.filter(g => g.status === 'pending' || g.status === 'forwarded_admin');
    const resolved = filteredGrievances.filter(g => g.status === 'resolved');

    return (
        <div className="flex w-full min-h-screen">
            <CalendarSidebar
                activeFilter={dateFilter ? dateFilter.toLocaleDateString() : filter}
                onDateSelect={(d) => { setDateFilter(d); setFilter('date'); }}
                onFilterSelect={(f) => { setFilter(f); setDateFilter(null); }}
            />

            <div className="flex-1" style={{ marginLeft: '240px', padding: '2rem', transition: 'all 0.3s ease' }}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Central Admin Console</h1>
                        <p className="opacity-70">Oversee All University Grievances</p>
                    </div>
                    <button onClick={handleRefresh} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                        ⟳ Refresh
                    </button>
                </div>

                {/* Urgent Section */}
                {urgent.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
                            <AlertCircle size={20} /> Critical Attention Needed
                        </h3>
                        <div className="grid gap-3">
                            {urgent.map(g => <GrievanceCard key={g.id} g={g} onUpdateStatus={onUpdateStatus} role="admin" />)}
                        </div>
                    </div>
                )}

                {/* Middle Section: Pending / Forwarded */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-300">
                        <Activity size={20} /> Active & Forwarded
                    </h3>
                    <div className="grid gap-3">
                        {pending.map(g => <GrievanceCard key={g.id} g={g} onUpdateStatus={onUpdateStatus} role="admin" />)}
                    </div>
                </div>

                {/* Resolved History - Collapsed or Bottom */}
                <div>
                    <h3 className="text-lg font-bold mb-4 opacity-70">Resolved History</h3>
                    <div className="grid gap-3 opacity-70">
                        {resolved.map(g => <GrievanceCard key={g.id} g={g} onUpdateStatus={onUpdateStatus} role="admin" />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Card Component
const GrievanceCard = ({ g, onUpdateStatus, role }) => {
    const cat = CATEGORIES.find(c => c.id === g.category);
    const [remarks, setRemarks] = useState('');

    const handleAction = (status, extra = {}) => {
        if (role !== 'student') {
            onUpdateStatus(g.id, status, { ...extra, remarks: remarks ? `${role}: ${remarks}` : null });
            setRemarks('');
        }
    };

    return (
        <div className="glass-card" style={{ textAlign: 'left', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: g.status === 'urgent' ? '4px solid #ef4444' : g.status === 'forwarded_admin' ? '4px solid #6366f1' : '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{cat?.label}</span>
                        <StatusBadge status={g.status} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                        #{g.id} • {g.studentEmail} • {g.studentDept}
                    </div>
                    {g.forwardedTo && <div className="text-xs mt-1 bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded w-fit">➦ To: {g.forwardedTo}</div>}
                    {g.status === 'forwarded_admin' && <div className="text-xs mt-1 text-indigo-300 font-bold">⚠ From Coordinator</div>}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(g.timestamp).toLocaleDateString()}</div>
            </div>

            <p style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', margin: 0, fontSize: '0.9rem' }}>{g.description}</p>

            {/* Remarks History */}
            {g.history && g.history.filter(h => h.remarks).length > 0 && (
                <div className="text-xs mt-1 p-2 bg-white/5 rounded">
                    <strong>Updates:</strong>
                    {g.history.filter(h => h.remarks).map((h, i) => (
                        <div key={i} className="text-xs text-gray-300 border-l-2 border-gray-500 pl-2 mt-1">
                            {h.remarks} <span className="opacity-50">({new Date(h.date).toLocaleDateString()})</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions Toolbar */}
            {!['resolved'].includes(g.status) && role !== 'student' && (
                <div style={{ marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <input
                        type="text"
                        value={remarks} onChange={e => setRemarks(e.target.value)}
                        placeholder="Remarks..."
                        className="input-field"
                        style={{ marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.5rem' }}
                    />

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button onClick={() => handleAction('resolved')} className="btn-primary" style={{ background: '#10b981', flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>Resolve</button>

                        {role === 'coordinator' && !g.status.includes('forwarded') && (
                            <>
                                <select onChange={(e) => { if (e.target.value) handleAction('forwarded', { forwardedTo: e.target.value }); }} className="input-field" style={{ width: 'auto', padding: '0.5rem', flex: 2, marginBottom: 0, color: 'black', fontSize: '0.8rem' }} defaultValue="">
                                    <option value="" disabled>Internal Assign...</option>
                                    {COORD_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    <option value="forwarded_admin" style={{ fontWeight: 'bold', color: 'blue' }}>➔ Admin</option>
                                </select>
                                {/* Quick Emergency Forwards */}
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {EMERGENCY_DEPARTMENTS.map(d => (
                                        <button key={d} onClick={() => handleAction('forwarded', { forwardedTo: d })} className="btn-primary" style={{ background: '#ef4444', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} title={`Forward to ${d}`}>
                                            ➔ {d}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Admin Revert/Forward */}
                        {role === 'admin' && g.status === 'forwarded_admin' && (
                            <button onClick={() => handleAction('pending')} className="btn-primary" style={{ background: '#f59e0b', flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>↩ Revert</button>
                        )}

                        {role === 'admin' && (
                            <select onChange={(e) => { if (e.target.value) handleAction('forwarded', { forwardedTo: e.target.value }); }} className="input-field" style={{ width: 'auto', padding: '0.5rem', flex: 2, marginBottom: 0, color: 'black', fontSize: '0.8rem' }} defaultValue="">
                                <option value="" disabled>Forward To...</option>
                                {ADMIN_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
