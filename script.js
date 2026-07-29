document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentLogs = [];
    let currentTheme = localStorage.getItem('theme') || 'dark';
    
    // --- DOM Elements ---
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const pageTitle = document.getElementById('page-title');
    
    // Theme
    const themeToggle = document.getElementById('themeToggle');
    
    // Form
    const callLogForm = document.getElementById('callLogForm');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const editCallId = document.getElementById('editCallId');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const durationInput = document.getElementById('duration');
    const callTypeInput = document.getElementById('callType');
    
    // Table & Filters
    const callTableBody = document.getElementById('callTableBody');
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const emptyTableState = document.getElementById('emptyTableState');
    const callTable = document.getElementById('callTable');
    
    // Dashboard Filter
    const dashTimeFilter = document.getElementById('dashTimeFilter');
    
    // Leaderboard/Stats Search
    const personSearchInput = document.getElementById('personSearchInput');
    
    // Export
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdownContent = document.getElementById('exportDropdownContent');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportExcelBtn = document.getElementById('exportExcel');
    const printDashBtn = document.getElementById('printDash');
    
    const importJioBtn = document.getElementById('importJioBtn');
    const jioPdfInput = document.getElementById('jioPdfInput');
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    
    // Toast
    const toast = document.getElementById('notificationToast');

    // --- Initialization ---
    init();

    function init() {
        // Set Theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
        
        // Load Data
        currentLogs = storage.getCallLogs();
        
        // Generate mock data if empty (for demonstration)
        // if (currentLogs.length === 0) {
        //    generateMockData();
        //    currentLogs = storage.getCallLogs();
        // }

        // Setup listeners FIRST so UI buttons work even if charts fail
        setupEventListeners();

        // Initialize UI
        try {
            updateAllViews();
        } catch (e) {
            console.error('Failed to update views on load:', e);
            showToast('Warning: Some dashboard elements failed to load.', 'error');
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Navigation
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active nav
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Update title
                pageTitle.textContent = item.querySelector('span').textContent;
                
                // Show section
                const targetId = item.getAttribute('data-target');
                sections.forEach(section => {
                    section.classList.remove('active');
                    section.classList.add('hidden');
                });
                
                const targetSection = document.getElementById(targetId);
                targetSection.classList.remove('hidden');
                
                // Trigger reflow for animation
                void targetSection.offsetWidth; 
                targetSection.classList.add('active');
                
                // Special actions on section load
                if (targetId === 'analytics-section') {
                    chartManager.updateAnalyticsCharts(dashboardManager.personStats);
                }
                
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });

        // Sidebar Toggle (Mobile)
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });

        // Theme Toggle
        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            updateThemeIcon();
            chartManager.updateTheme(currentTheme === 'dark');
        });

        // Form Logic
        callTypeInput.addEventListener('change', calculateDuration);
        startTimeInput.addEventListener('change', calculateDuration);
        endTimeInput.addEventListener('change', calculateDuration);
        
        callLogForm.addEventListener('submit', handleFormSubmit);
        resetFormBtn.addEventListener('click', resetForm);

        // Table Filtering & Sorting
        searchInput.addEventListener('input', renderTable);
        filterType.addEventListener('change', renderTable);
        
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => handleSort(th));
        });

        // Dashboard Filters
        dashTimeFilter.addEventListener('change', () => {
            updateDashboardView();
        });

        // Person Stats Search
        personSearchInput.addEventListener('input', (e) => {
            dashboardManager.renderPersonStats(e.target.value);
        });

        // Export Dropdown Toggle
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdownContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', () => {
            if (exportDropdownContent.classList.contains('show')) {
                exportDropdownContent.classList.remove('show');
            }
        });

        // Export Actions
        exportCSVBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportManager.exportToCSV(currentLogs);
        });

        exportExcelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportManager.exportToExcel(currentLogs);
        });

        printDashBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportManager.printDashboard();
        });

        // Custom Events
        window.addEventListener('show-toast', (e) => {
            showToast(e.detail.message, e.detail.type);
        });

        // Jio PDF Import
        if (importJioBtn && jioPdfInput) {
            importJioBtn.addEventListener('click', () => {
                jioPdfInput.click();
            });

            jioPdfInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                showLoading();
                try {
                    const calls = await jioParser.parsePDF(file);
                    
                    if (calls.length === 0) {
                        showToast('No calls found in this PDF.', 'error');
                    } else {
                        // Add calls to storage
                        calls.forEach(call => {
                            // Check if contact name already exists for this number in previous logs
                            const existingContact = currentLogs.find(l => l.mobileNumber === call.mobileNumber && l.personName !== l.mobileNumber);
                            if (existingContact) {
                                call.personName = existingContact.personName;
                            }
                            storage.addCallLog(call);
                        });
                        
                        currentLogs = storage.getCallLogs();
                        updateAllViews();
                        showToast(`Successfully imported ${calls.length} calls!`);
                        document.querySelector('[data-target="dashboard-section"]').click();
                    }
                } catch (error) {
                    showToast('Failed to parse PDF', 'error');
                } finally {
                    hideLoading();
                    jioPdfInput.value = ''; // Reset input
                }
            });
        }

        // Download Screenshot
        if (downloadImageBtn) {
            downloadImageBtn.addEventListener('click', async () => {
                showToast('Generating screenshot... please wait.');
                try {
                    const dashboard = document.querySelector('.main-content');
                    const canvas = await html2canvas(dashboard, {
                        backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f172a' : '#f0f2f5',
                        scale: 2, // High quality
                        onclone: (clonedDoc) => {
                            clonedDoc.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme'));
                            clonedDoc.body.setAttribute('data-theme', document.documentElement.getAttribute('data-theme'));
                        }
                    });
                    
                    const link = document.createElement('a');
                    link.download = `call-flow-dashboard-${new Date().toISOString().split('T')[0]}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    
                    showToast('Screenshot downloaded!');
                } catch (err) {
                    console.error('Error generating screenshot:', err);
                    showToast('Failed to download screenshot', 'error');
                }
            });
        }
    }

    // --- Core Functions ---

    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (currentTheme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    function calculateDuration() {
        const type = callTypeInput.value;
        const start = startTimeInput.value;
        const end = endTimeInput.value;

        if (type === 'missed') {
            durationInput.value = 0;
            return;
        }

        if (start && end) {
            const startDate = new Date(`1970-01-01T${start}`);
            let endDate = new Date(`1970-01-01T${end}`);
            
            // Handle cross-midnight calls
            if (endDate < startDate) {
                endDate = new Date(`1970-01-02T${end}`);
            }
            
            const diffMs = endDate - startDate;
            const diffSecs = Math.round(diffMs / 1000);
            durationInput.value = diffSecs > 0 ? diffSecs : 0;
        } else {
            durationInput.value = '';
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        // If not missed and duration is empty, force calculation
        if (callTypeInput.value !== 'missed' && !durationInput.value) {
            calculateDuration();
            if (!durationInput.value) {
                showToast('Please provide valid Start and End times', 'error');
                return;
            }
        }
        
        let pName = document.getElementById('personName').value.trim();
        let mNum = document.getElementById('mobileNumber').value.trim();
        
        // Use mobile number if name is empty
        if (!pName) pName = mNum;

        const logData = {
            personName: pName,
            mobileNumber: mNum,
            date: document.getElementById('callDate').value,
            type: callTypeInput.value,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            duration: parseInt(durationInput.value) || 0,
            notes: document.getElementById('notes').value.trim()
        };

        const id = editCallId.value;

        showLoading();

        setTimeout(() => {
            if (id) {
                storage.updateCallLog(id, logData);
                showToast('Call log updated successfully');
            } else {
                storage.addCallLog(logData);
                showToast('Call log added successfully');
            }

            // Refresh data & UI
            currentLogs = storage.getCallLogs();
            updateAllViews();
            resetForm();
            
            // Navigate to Call History
            document.querySelector('[data-target="call-history-section"]').click();
            
            hideLoading();
        }, 500); // Simulate processing time for smooth UX
    }

    function handleEdit(id) {
        const log = storage.getCallLogById(id);
        if (log) {
            editCallId.value = log.id;
            document.getElementById('personName').value = log.personName;
            document.getElementById('mobileNumber').value = log.mobileNumber;
            document.getElementById('callDate').value = log.date;
            callTypeInput.value = log.type;
            startTimeInput.value = log.startTime;
            endTimeInput.value = log.endTime;
            durationInput.value = log.duration;
            document.getElementById('notes').value = log.notes;
            
            // Change submit button text
            document.getElementById('saveCallBtn').innerHTML = '<i class="fa-solid fa-save"></i> Update Call Log';
            
            // Navigate to Add form
            document.querySelector('[data-target="add-call-section"]').click();
            pageTitle.textContent = "Edit Call";
        }
    }

    function handleDelete(id) {
        if (confirm('Are you sure you want to delete this call log?')) {
            storage.deleteCallLog(id);
            currentLogs = storage.getCallLogs();
            updateAllViews();
            showToast('Call log deleted');
        }
    }

    // Expose globally for inline onclick handlers in table
    window.handleEdit = handleEdit;
    window.handleDelete = handleDelete;

    function resetForm() {
        callLogForm.reset();
        editCallId.value = '';
        document.getElementById('saveCallBtn').innerHTML = '<i class="fa-solid fa-save"></i> Save Call Log';
    }

    // Sort State
    let currentSort = { column: 'date', direction: 'desc' };

    function handleSort(th) {
        const column = th.getAttribute('data-sort');
        
        // Reset all icons
        document.querySelectorAll('th.sortable i').forEach(icon => {
            icon.className = 'fa-solid fa-sort';
        });

        // Toggle direction
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'desc'; // Default new sort to desc
        }

        // Update Icon
        const icon = th.querySelector('i');
        icon.className = currentSort.direction === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';

        renderTable();
    }

    function getFilteredLogs() {
        const search = searchInput.value.toLowerCase();
        const type = filterType.value;

        return currentLogs.filter(log => {
            const matchesSearch = log.personName.toLowerCase().includes(search) || 
                                  log.mobileNumber.includes(search);
            const matchesType = type === 'all' || log.type === type;
            
            return matchesSearch && matchesType;
        });
    }

    function renderTable() {
        let logsToRender = getFilteredLogs();

        // Apply Sorting
        logsToRender.sort((a, b) => {
            let valA, valB;
            
            if (currentSort.column === 'date') {
                valA = new Date(`${a.date}T${a.startTime || '00:00'}`);
                valB = new Date(`${b.date}T${b.startTime || '00:00'}`);
            } else if (currentSort.column === 'name') {
                valA = a.personName.toLowerCase();
                valB = b.personName.toLowerCase();
            } else if (currentSort.column === 'duration') {
                valA = a.duration;
                valB = b.duration;
            }

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Render
        callTableBody.innerHTML = '';
        
        if (logsToRender.length === 0) {
            callTable.classList.add('hidden');
            emptyTableState.classList.remove('hidden');
            return;
        }

        callTable.classList.remove('hidden');
        emptyTableState.classList.add('hidden');

        logsToRender.forEach(log => {
            const tr = document.createElement('tr');
            
            // Format Type Badge
            let badgeClass = '';
            let iconClass = '';
            if (log.type === 'incoming') { badgeClass = 'badge-incoming'; iconClass = 'fa-arrow-down'; }
            else if (log.type === 'outgoing') { badgeClass = 'badge-outgoing'; iconClass = 'fa-arrow-up'; }
            else if (log.type === 'missed') { badgeClass = 'badge-missed'; iconClass = 'fa-phone-slash'; }

            const typeLabel = log.type.charAt(0).toUpperCase() + log.type.slice(1);
            const durationDisplay = log.duration ? dashboardManager.formatDuration(log.duration) : '0m';
            
            // Format Date safely
            let formattedDate = log.date;
            try { formattedDate = new Date(log.date).toLocaleDateString(); } catch(e){}

            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td class="font-medium">${log.personName}</td>
                <td class="text-muted">${log.mobileNumber}</td>
                <td><span class="badge ${badgeClass}"><i class="fa-solid ${iconClass}"></i> ${typeLabel}</span></td>
                <td class="text-muted">${log.startTime || '-'} to ${log.endTime || '-'}</td>
                <td class="font-medium">${durationDisplay}</td>
                <td class="text-muted" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${log.notes || ''}">${log.notes || '-'}</td>
                <td class="action-btns">
                    <button class="btn-icon btn-small text-primary" onclick="handleEdit('${log.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-small text-danger" onclick="handleDelete('${log.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            callTableBody.appendChild(tr);
        });
    }

    function getDashboardFilteredLogs() {
        const timeFilter = dashTimeFilter.value;
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        let filtered = [...currentLogs];

        if (timeFilter === 'today') {
            filtered = filtered.filter(log => log.date === today);
        } 
        else if (timeFilter === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            filtered = filtered.filter(log => log.date === yesterdayStr);
        }
        else if (timeFilter === 'week') {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            filtered = filtered.filter(log => new Date(log.date) >= lastWeek);
        }
        else if (timeFilter === 'month') {
            const lastMonth = new Date(now);
            lastMonth.setDate(now.getDate() - 30);
            filtered = filtered.filter(log => new Date(log.date) >= lastMonth);
        }

        return filtered;
    }

    function updateDashboardView() {
        const logsToProcess = getDashboardFilteredLogs();
        const personStats = dashboardManager.updateAll(logsToProcess);
        
        // Use chartManager to update charts with new filtered data
        chartManager.updateAllCharts(logsToProcess, personStats);
    }

    function updateAllViews() {
        renderTable();
        updateDashboardView();
    }

    // --- UI Helpers ---
    function showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    function hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    let toastTimeout;
    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        
        const icon = toast.querySelector('i');
        const text = toast.querySelector('span');
        
        text.textContent = message;
        
        if (type === 'error') {
            icon.className = 'fa-solid fa-circle-xmark toast-icon';
            icon.style.color = 'var(--danger-color)';
        } else {
            icon.className = 'fa-solid fa-circle-check toast-icon';
            icon.style.color = 'var(--success-color)';
        }
        
        toast.classList.add('show');
        
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- Mock Data Generator ---
    function generateMockData() {
        const names = ['Ahmed', 'Sara', 'Ali', 'Zainab', 'Omar', 'Fatima', 'Hassan', 'Nour'];
        const types = ['incoming', 'outgoing', 'missed'];
        
        for (let i = 0; i < 40; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            
            // Random date within last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            // Random times
            const hourStart = 9 + Math.floor(Math.random() * 8);
            const minStart = Math.floor(Math.random() * 60);
            
            let duration = 0;
            let startStr = '';
            let endStr = '';
            
            if (type !== 'missed') {
                const durationMins = 1 + Math.floor(Math.random() * 45); // 1 to 45 mins
                duration = durationMins * 60 + Math.floor(Math.random() * 60); // In seconds
                
                const startHourStr = hourStart.toString().padStart(2, '0');
                const startMinStr = minStart.toString().padStart(2, '0');
                startStr = `${startHourStr}:${startMinStr}`;
                
                let endMin = minStart + durationMins;
                let endHour = hourStart;
                if (endMin >= 60) {
                    endHour += Math.floor(endMin / 60);
                    endMin = endMin % 60;
                }
                const endHourStr = endHour.toString().padStart(2, '0');
                const endMinStr = endMin.toString().padStart(2, '0');
                endStr = `${endHourStr}:${endMinStr}`;
            } else {
                const startHourStr = hourStart.toString().padStart(2, '0');
                const startMinStr = minStart.toString().padStart(2, '0');
                startStr = `${startHourStr}:${startMinStr}`;
                endStr = startStr;
            }

            storage.addCallLog({
                personName: name,
                mobileNumber: `+971 50 ${Math.floor(1000000 + Math.random() * 9000000)}`,
                date: date.toISOString().split('T')[0],
                type: type,
                startTime: startStr,
                endTime: endStr,
                duration: duration,
                notes: Math.random() > 0.5 ? 'Mock note generated for testing' : ''
            });
        }
    }
});
