/**
 * Rajstitching Hub - Core Engine
 * 1. Customer verification login (Full Name + Email + Mobile Number)
 * 2. 7-Day Auto-Expiry Engine (Students 7 days, Owner permanent)
 * 3. Daily Live Batch Join Link synchronization (10:30 AM India / 9:00 AM UAE)
 * 4. Anti-Piracy DRM, dynamic moving watermark, and blackout defense
 * 5. Instagram (@rajstitchinghub • 10K+) & YouTube (Rajstitching Hub • 450+)
 */

// Storage Keys
const STORAGE_KEYS = {
    STUDENTS: 'rsh_students_v3',
    ADMIN_PASS: 'rsh_admin_password',
    VIDEO_URL: 'rsh_session_video_url',
    LIVE_MEETING_URL: 'rsh_live_meeting_url',
    INSTAGRAM_URL: 'rsh_instagram_url',
    YOUTUBE_URL: 'rsh_youtube_url'
};

// Default Configuration
const DEFAULT_CONFIG = {
    VIDEO_URL: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    LIVE_MEETING_URL: 'https://meet.google.com', // Replace with owner's Zoom/Meet/YouTube Live link
    INSTAGRAM_URL: 'https://www.instagram.com/rajstitchinghub?stkn=YmRhODZyZ2NyMmVr',
    YOUTUBE_URL: 'https://www.youtube.com/@rajstitchinghub'
};

// State Variables
let currentSessionUser = null; // null, { role: 'owner' }, or { role: 'student', data: {...} }
let watermarkIntervalId = null;
let liveTimeIntervalId = null;

// =============================================================================
// INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    initDefaultData();
    setupSecurityListeners();
    renderStudentTable();
});

function initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.VIDEO_URL)) {
        localStorage.setItem(STORAGE_KEYS.VIDEO_URL, DEFAULT_CONFIG.VIDEO_URL);
    }

    if (!localStorage.getItem(STORAGE_KEYS.LIVE_MEETING_URL)) {
        localStorage.setItem(STORAGE_KEYS.LIVE_MEETING_URL, DEFAULT_CONFIG.LIVE_MEETING_URL);
    }

    // Seed realistic sample students if empty
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        const sampleStudents = [
            {
                id: 'rsh_' + Math.random().toString(36).substr(2, 9),
                name: 'Shabana Bano',
                email: 'shabana@gmail.com',
                mobile: '+91 98201 54321',
                country: 'India',
                enrolledAt: new Date(now - (2 * oneDay)).toISOString(), // Enrolled 2 days ago (Active, 5 days left)
                expiresAt: new Date(now + (5 * oneDay)).toISOString()
            },
            {
                id: 'rsh_' + Math.random().toString(36).substr(2, 9),
                name: 'Mariam Al-Husseini',
                email: 'mariam@dubai.ae',
                mobile: '+971 50 123 4567',
                country: 'United Arab Emirates',
                enrolledAt: new Date(now - (8 * oneDay)).toISOString(), // Enrolled 8 days ago (Expired)
                expiresAt: new Date(now - (1 * oneDay)).toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(sampleStudents));
    }
}

// =============================================================================
// STUDENT VERIFICATION LOGIN (Requires: Name + Email + Mobile Number)
// =============================================================================
function handleStudentLogin(e) {
    e.preventDefault();
    const nameInput = document.getElementById('loginName').value.trim().toLowerCase();
    const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
    const mobileInput = document.getElementById('loginMobile').value.trim().replace(/\D/g, '');
    const errorEl = document.getElementById('loginErrorMsg');

    errorEl.classList.add('hidden');

    const students = getStoredStudents();

    // Verify all 3: Name, Email, and Mobile
    const student = students.find(s => {
        const matchName = s.name.trim().toLowerCase() === nameInput;
        const matchEmail = s.email.trim().toLowerCase() === emailInput;
        const cleanStudentMobile = s.mobile.replace(/\D/g, '');
        // Allow mobile match either full or matching last 10 digits
        const matchMobile = cleanStudentMobile.includes(mobileInput) || mobileInput.includes(cleanStudentMobile);

        return matchName && matchEmail && matchMobile;
    });

    if (!student) {
        errorEl.textContent = 'Verification failed. Please ensure your Name, Email, and Mobile Number match your registered record exactly.';
        errorEl.classList.remove('hidden');
        return;
    }

    // Success! Launch classroom
    closeStudentLoginModal();
    launchStudentClassroom(student);
}

function launchStudentClassroom(student) {
    currentSessionUser = { role: 'student', data: student };

    const classroomModal = document.getElementById('videoClassroomModal');
    const userNameEl = document.getElementById('classroomUserName');
    const expiryCountdownEl = document.getElementById('classroomExpiryCountdown');
    const expiryDaysEl = document.getElementById('classroomExpiryDays');
    const lockScreen = document.getElementById('expiredLockScreen');
    const video = document.getElementById('masterVideoPlayer');
    const videoSource = document.getElementById('videoSource');
    const liveJoinBtn = document.getElementById('classroomLiveJoinBtn');

    // Configure Video Source & Live Meeting URL
    const configuredVideo = localStorage.getItem(STORAGE_KEYS.VIDEO_URL) || DEFAULT_CONFIG.VIDEO_URL;
    const configuredLiveLink = localStorage.getItem(STORAGE_KEYS.LIVE_MEETING_URL) || DEFAULT_CONFIG.LIVE_MEETING_URL;

    videoSource.src = configuredVideo;
    video.load();

    if (liveJoinBtn) {
        liveJoinBtn.href = configuredLiveLink;
    }

    // Calculate 7-Day Expiry
    const now = Date.now();
    const expiryTime = new Date(student.expiresAt).getTime();
    const msRemaining = expiryTime - now;
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    userNameEl.textContent = `${student.name} (${student.country})`;
    classroomModal.classList.remove('hidden');
    classroomModal.classList.add('flex');

    if (daysRemaining <= 0) {
        // 1 MONTH EXPIRED!
        expiryCountdownEl.classList.add('hidden');
        lockScreen.classList.remove('hidden');
        lockScreen.classList.add('flex');
        video.pause();
        stopWatermark();
        document.getElementById('dynamicWatermark').classList.add('hidden');
    } else {
        // ACTIVE (Within 7 Days)
        lockScreen.classList.add('hidden');
        lockScreen.classList.remove('flex');
        expiryCountdownEl.classList.remove('hidden');
        expiryDaysEl.textContent = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in 7-day pass`;

        // Start Moving Watermark with student's exact registered details
        document.getElementById('dynamicWatermark').classList.remove('hidden');
        const watermarkText = `${student.name} • ${student.email} • ${student.mobile}`;
        startWatermark(watermarkText);
    }

    if (window.lucide) lucide.createIcons();
}

function launchOwnerClassroom() {
    closeAdminModal();
    currentSessionUser = { role: 'owner' };

    const classroomModal = document.getElementById('videoClassroomModal');
    const userNameEl = document.getElementById('classroomUserName');
    const expiryCountdownEl = document.getElementById('classroomExpiryCountdown');
    const lockScreen = document.getElementById('expiredLockScreen');
    const video = document.getElementById('masterVideoPlayer');
    const videoSource = document.getElementById('videoSource');
    const liveJoinBtn = document.getElementById('classroomLiveJoinBtn');

    // Set Video & Live Link
    const configuredVideo = localStorage.getItem(STORAGE_KEYS.VIDEO_URL) || DEFAULT_CONFIG.VIDEO_URL;
    const configuredLiveLink = localStorage.getItem(STORAGE_KEYS.LIVE_MEETING_URL) || DEFAULT_CONFIG.LIVE_MEETING_URL;

    videoSource.src = configuredVideo;
    video.load();

    if (liveJoinBtn) {
        liveJoinBtn.href = configuredLiveLink;
    }

    // Owner access NEVER EXPIRES
    userNameEl.textContent = 'Owner Master Vault';
    expiryCountdownEl.classList.remove('hidden');
    document.getElementById('classroomExpiryDays').textContent = 'Owner: Unlimited Access';
    lockScreen.classList.add('hidden');
    lockScreen.classList.remove('flex');

    classroomModal.classList.remove('hidden');
    classroomModal.classList.add('flex');

    // Owner watermark
    document.getElementById('dynamicWatermark').classList.remove('hidden');
    startWatermark('Rajstitching Hub • Master Owner Vault');

    if (window.lucide) lucide.createIcons();
}

function exitClassroom() {
    pauseVideo();
    stopWatermark();
    currentSessionUser = null;
    const classroomModal = document.getElementById('videoClassroomModal');
    classroomModal.classList.add('hidden');
    classroomModal.classList.remove('flex');
}

// =============================================================================
// DYNAMIC MOVING WATERMARK (Bounces randomly to prevent phone/screen leaks)
// =============================================================================
function startWatermark(userText) {
    const watermark = document.getElementById('dynamicWatermark');
    const content = document.getElementById('watermarkContent');
    if (!watermark || !content) return;

    content.innerHTML = `
        <div class="font-bold text-gold-400">RAJSHAHI HUB • LICENSED STREAM</div>
        <div>${userText}</div>
        <div class="text-[9px] text-slate-300 font-mono tracking-wider" id="watermarkLiveTimestamp"></div>
    `;

    function move() {
        const minX = 5;
        const maxX = 65;
        const minY = 8;
        const maxY = 75;

        const randomX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

        watermark.style.left = `${randomX}%`;
        watermark.style.top = `${randomY}%`;
    }

    function updateClock() {
        const clockEl = document.getElementById('watermarkLiveTimestamp');
        if (clockEl) {
            clockEl.textContent = new Date().toUTCString();
        }
    }

    move();
    updateClock();

    if (watermarkIntervalId) clearInterval(watermarkIntervalId);
    watermarkIntervalId = setInterval(move, 3500);

    if (liveTimeIntervalId) clearInterval(liveTimeIntervalId);
    liveTimeIntervalId = setInterval(updateClock, 1000);
}

function stopWatermark() {
    if (watermarkIntervalId) {
        clearInterval(watermarkIntervalId);
        watermarkIntervalId = null;
    }
    if (liveTimeIntervalId) {
        clearInterval(liveTimeIntervalId);
        liveTimeIntervalId = null;
    }
}

// =============================================================================
// ANTI-PIRACY & SCREENSHOT LOCKDOWN ENGINE
// =============================================================================
function setupSecurityListeners() {
    // 1. Disable Right Click Everywhere
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 2. Intercept Screenshot & DevTools Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // PrintScreen
        if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
            triggerSecurityShield();
            e.preventDefault();
            return false;
        }

        // F12 (DevTools)
        if (e.key === 'F12' || e.keyCode === 123) {
            triggerSecurityShield();
            e.preventDefault();
            return false;
        }

        // Ctrl / Cmd + Shift + I/J/C
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
            triggerSecurityShield();
            e.preventDefault();
            return false;
        }

        // View Source (Ctrl/Cmd + U)
        if ((e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key)) {
            triggerSecurityShield();
            e.preventDefault();
            return false;
        }

        // Save Page (Ctrl/Cmd + S)
        if ((e.ctrlKey || e.metaKey) && ['S', 's'].includes(e.key)) {
            e.preventDefault();
            return false;
        }

        // Print Page (Ctrl/Cmd + P)
        if ((e.ctrlKey || e.metaKey) && ['P', 'p'].includes(e.key)) {
            triggerSecurityShield();
            e.preventDefault();
            return false;
        }

        // Mac Screenshot Shortcuts: Cmd + Shift + 3 / 4 / 5
        if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
            triggerSecurityShield();
            e.preventDefault();
            return false;
        }
    });

    // 3. Blackout video when Window loses focus or switching apps
    window.addEventListener('blur', () => {
        if (currentSessionUser) {
            pauseVideo();
            triggerSecurityShield();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && currentSessionUser) {
            pauseVideo();
            triggerSecurityShield();
        }
    });
}

function triggerSecurityShield() {
    const shield = document.getElementById('securityShield');
    if (shield) {
        shield.classList.remove('hidden');
        shield.classList.add('flex');
    }
    pauseVideo();
}

function dismissShield() {
    const shield = document.getElementById('securityShield');
    if (shield) {
        shield.classList.remove('flex');
        shield.classList.add('hidden');
    }
}

function pauseVideo() {
    const video = document.getElementById('masterVideoPlayer');
    if (video && !video.paused) {
        video.pause();
    }
}

// =============================================================================
// OWNER / ADMIN CONTROL PANEL (Secured with Cryptographic SHA-256 Hash)
// =============================================================================
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleAdminAuth(e) {
    e.preventDefault();
    const inputPass = document.getElementById('adminPasswordInput').value;
    const errorEl = document.getElementById('adminAuthError');

    const inputHash = await sha256(inputPass);
    // Hash of your master password (Alihusain@1234)
    const targetHash = 'c123fac71eb8614832980ead68de0c8e86816f68708d5d4a924ffbcbd7f981f1';

    if (inputHash === targetHash) {
        errorEl.classList.add('hidden');
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('adminDashboardSection').classList.remove('hidden');
        loadAdminSettings();
        renderStudentTable();
        if (window.lucide) lucide.createIcons();
    } else {
        errorEl.classList.remove('hidden');
    }
}

function loadAdminSettings() {
    document.getElementById('adminLiveMeetingUrlInput').value = localStorage.getItem(STORAGE_KEYS.LIVE_MEETING_URL) || DEFAULT_CONFIG.LIVE_MEETING_URL;
    document.getElementById('adminVideoUrlInput').value = localStorage.getItem(STORAGE_KEYS.VIDEO_URL) || DEFAULT_CONFIG.VIDEO_URL;
}

function saveLiveMeetingUrl() {
    const newUrl = document.getElementById('adminLiveMeetingUrlInput').value.trim();
    if (newUrl) {
        localStorage.setItem(STORAGE_KEYS.LIVE_MEETING_URL, newUrl);
        alert("Today's Live Batch link updated! Students will see this upon login.");
    }
}

function ownerJoinLiveMeeting() {
    const liveUrl = localStorage.getItem(STORAGE_KEYS.LIVE_MEETING_URL) || DEFAULT_CONFIG.LIVE_MEETING_URL;
    if (liveUrl) {
        window.open(liveUrl, '_blank');
    } else {
        alert('Please enter and save a live batch link first.');
    }
}

function saveVideoUrl() {
    const newUrl = document.getElementById('adminVideoUrlInput').value.trim();
    if (newUrl) {
        localStorage.setItem(STORAGE_KEYS.VIDEO_URL, newUrl);
        alert('Live Recording video file URL updated successfully!');
    }
}

function logoutAdmin() {
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('adminDashboardSection').classList.add('hidden');
    document.getElementById('adminPasswordInput').value = '';
    closeAdminModal();
}

// =============================================================================
// CUSTOMER MANAGEMENT (Full Name, Email, Mobile, Country + 7-Day Expiry)
// =============================================================================
function handleAddStudent(e) {
    e.preventDefault();
    const name = document.getElementById('newStudentName').value.trim();
    const email = document.getElementById('newStudentEmail').value.trim();
    const mobile = document.getElementById('newStudentMobile').value.trim();
    const country = document.getElementById('newStudentCountry').value.trim();

    if (!name || !email || !mobile || !country) {
        alert('Please fill out all 4 required fields.');
        return;
    }

    const students = getStoredStudents();

    // Check duplicate email
    if (students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        alert('A customer with this email address is already registered.');
        return;
    }

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const newStudent = {
        id: 'rsh_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        mobile,
        country,
        enrolledAt: new Date(now).toISOString(),
        expiresAt: new Date(now + sevenDaysMs).toISOString() // Exact 7-day expiry
    };

    students.unshift(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    document.getElementById('addStudentForm').reset();
    renderStudentTable();
    alert(`Customer "${name}" registered successfully!\n7-Day pass valid until ${new Date(newStudent.expiresAt).toLocaleDateString()}.`);
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const totalCountEl = document.getElementById('totalStudentsCount');
    if (!tbody) return;

    const students = getStoredStudents();
    if (totalCountEl) totalCountEl.textContent = students.length;

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-6 text-center text-slate-400">
                    No customers registered yet. Use the form above to add a customer.
                </td>
            </tr>
        `;
        return;
    }

    const now = Date.now();

    tbody.innerHTML = students.map(student => {
        const enrolledDate = new Date(student.enrolledAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const expiryDate = new Date(student.expiresAt);
        const daysLeft = Math.ceil((expiryDate.getTime() - now) / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft <= 0;

        const statusBadge = isExpired
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                 <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> Expired
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ${daysLeft} days active
               </span>`;

        return `
            <tr class="hover:bg-white/[0.02] transition-colors">
                <td class="p-3">
                    <div class="font-bold text-white">${escapeHtml(student.name)}</div>
                    <div class="text-[10px] text-slate-400 font-mono">ID: ${student.id}</div>
                </td>
                <td class="p-3">
                    <div class="text-slate-200">${escapeHtml(student.email)}</div>
                    <div class="text-[11px] text-slate-400">${escapeHtml(student.mobile)}</div>
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-slate-300">
                        ${escapeHtml(student.country)}
                    </span>
                </td>
                <td class="p-3">
                    <div class="text-slate-300 text-xs">${enrolledDate}</div>
                    <div class="text-[10px] text-slate-400">Expires: ${expiryDate.toLocaleDateString()}</div>
                </td>
                <td class="p-3">
                    ${statusBadge}
                </td>
                <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="extendStudentAccess('${student.id}')" title="Extend +7 Days" class="px-2 py-1 rounded bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 text-[11px] border border-gold-500/20">
                            +7 Days
                        </button>
                        <button onclick="testLoginAsStudent('${student.id}')" title="Test View" class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] border border-white/10">
                            View
                        </button>
                        <button onclick="deleteStudent('${student.id}')" title="Delete Record" class="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function extendStudentAccess(id) {
    const students = getStoredStudents();
    const student = students.find(s => s.id === id);
    if (!student) return;

    const currentExpiry = new Date(student.expiresAt).getTime();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    student.expiresAt = new Date(baseTime + sevenDaysMs).toISOString();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    renderStudentTable();
    alert(`Access extended by 7 days for ${student.name}!`);
}

function testLoginAsStudent(id) {
    const students = getStoredStudents();
    const student = students.find(s => s.id === id);
    if (!student) return;
    closeAdminModal();
    launchStudentClassroom(student);
}

function deleteStudent(id) {
    if (!confirm('Are you sure you want to remove this customer record?')) return;
    let students = getStoredStudents();
    students = students.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    renderStudentTable();
}

function exportStudentData() {
    const students = getStoredStudents();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `raw_stitching_hub_students_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importStudentData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(imported));
                renderStudentTable();
                alert(`Successfully imported ${imported.length} student records!`);
            } else {
                alert('Invalid file format. JSON array expected.');
            }
        } catch (err) {
            alert('Failed to parse JSON file.');
        }
    };
    reader.readAsText(file);
}

function getStoredStudents() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    } catch {
        return [];
    }
}

// =============================================================================
// MODAL CONTROLLERS
// =============================================================================
function openStudentLoginModal() {
    document.getElementById('studentLoginModal').classList.remove('hidden');
    document.getElementById('studentLoginModal').classList.add('flex');
    document.getElementById('loginName').focus();
    if (window.lucide) lucide.createIcons();
}

function closeStudentLoginModal() {
    document.getElementById('studentLoginModal').classList.remove('flex');
    document.getElementById('studentLoginModal').classList.add('hidden');
}

function openAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');
    document.getElementById('adminModal').classList.add('flex');
    if (window.lucide) lucide.createIcons();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('flex');
    document.getElementById('adminModal').classList.add('hidden');
}

// Helper: Escape HTML to prevent injection
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
