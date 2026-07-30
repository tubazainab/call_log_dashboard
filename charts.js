class ChartManager {
    constructor() {
        this.charts = {
            mainLine: null,
            mainPie: null,
            durationBar: null,
            callsDoughnut: null,
            topTalkers: null,
            internetLine: null,
            smsLine: null,
            internetAnalysis: null,
            smsAnalysis: null
        };
        
        // Setup default Chart.js configuration for our theme
        Chart.defaults.color = '#94a3b8'; // text-muted
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        Chart.defaults.plugins.tooltip.titleColor = '#fff';
        Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        
        // Premium color palette
        this.colors = {
            primary: '#8b5cf6', // Vibrant Purple
            success: '#10b981', // Emerald Green
            danger: '#f43f5e', // Rose Red
            info: '#0ea5e9', // Sky Blue
            warning: '#f59e0b', // Amber
            purple: '#d946ef', // Fuchsia
            pink: '#ec4899',   // Pink
            teal: '#14b8a6',   // Teal
            orange: '#f97316', // Orange
            grid: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        };
        
        this.palette = [
            this.colors.primary, this.colors.success, this.colors.purple, 
            this.colors.warning, this.colors.pink, this.colors.teal, 
            this.colors.danger, this.colors.orange, '#6366f1', '#84cc16'
        ];
    }

    updateTheme(isDark) {
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        Chart.defaults.color = textColor;
        
        // Update grid lines for all active charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.grid.color = gridColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.grid.color = gridColor;
                }
                chart.update();
            }
        });
    }

    renderMainLineChart(data) {
        const ctx = document.getElementById('mainLineChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        if (this.charts.mainLine) {
            this.charts.mainLine.destroy();
        }

        // Aggregate data by date
        const dateMap = {};
        // Sort data by date first
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedData.forEach(log => {
            if (!dateMap[log.date]) {
                dateMap[log.date] = { incoming: 0, outgoing: 0, missed: 0 };
            }
            dateMap[log.date][log.type]++;
        });

        const labels = Object.keys(dateMap).map(date => {
            // Format date for display
            return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });
        
        const incomingData = Object.values(dateMap).map(d => d.incoming);
        const outgoingData = Object.values(dateMap).map(d => d.outgoing);
        const missedData = Object.values(dateMap).map(d => d.missed);
        
        const chartType = labels.length <= 1 ? 'bar' : 'line';

        this.charts.mainLine = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Incoming',
                        data: incomingData,
                        borderColor: this.colors.success,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Outgoing',
                        data: outgoingData,
                        borderColor: this.colors.primary,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Missed',
                        data: missedData,
                        borderColor: this.colors.danger,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    renderMainPieChart(data) {
        const ctx = document.getElementById('mainPieChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.charts.mainPie) {
            this.charts.mainPie.destroy();
        }

        let incoming = 0, outgoing = 0, missed = 0;
        data.forEach(log => {
            if (log.type === 'incoming') incoming++;
            else if (log.type === 'outgoing') outgoing++;
            else if (log.type === 'missed') missed++;
        });

        this.charts.mainPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Incoming', 'Outgoing', 'Missed'],
                datasets: [{
                    data: [incoming, outgoing, missed],
                    backgroundColor: [
                        this.colors.success,
                        this.colors.primary,
                        this.colors.danger
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    renderHighestCallsChart(personStats) {
        const ctx = document.getElementById('highestCallsChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        if (this.charts.highestCalls) {
            this.charts.highestCalls.destroy();
        }

        // Get top 10 by total calls
        const topStats = [...personStats]
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .slice(0, 10);

        this.charts.highestCalls = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topStats.map(s => s.name),
                datasets: [{
                    label: 'Total Calls',
                    data: topStats.map(s => s.totalCalls),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    renderCallsDoughnutChart(personStats) {
        const ctx = document.getElementById('callsDoughnutChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        if (this.charts.callsDoughnut) {
            this.charts.callsDoughnut.destroy();
        }

        // Get top 8 by total calls
        const topStats = [...personStats]
            .sort((a, b) => b.totalCalls - a.totalCalls)
            .slice(0, 8);
            
        // Group others if necessary
        const mainLabels = topStats.map(s => s.name);
        const mainData = topStats.map(s => s.totalCalls);
        
        const otherCalls = personStats
            .slice(8)
            .reduce((sum, s) => sum + s.totalCalls, 0);
            
        if (otherCalls > 0) {
            mainLabels.push('Others');
            mainData.push(otherCalls);
        }

        this.charts.callsDoughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: mainLabels,
                datasets: [{
                    data: mainData,
                    backgroundColor: this.palette,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                },
                cutout: '60%'
            }
        });
    }

    renderTopTalkersChart(personStats) {
        const ctx = document.getElementById('topTalkersChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        if (this.charts.topTalkers) {
            this.charts.topTalkers.destroy();
        }

        const topStats = [...personStats]
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .slice(0, 10);

        this.charts.topTalkers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topStats.map(s => s.name),
                datasets: [{
                    label: 'Talk Time (Minutes)',
                    data: topStats.map(s => Math.round(s.totalDuration / 60)),
                    backgroundColor: this.colors.purple,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // Makes it a horizontal bar chart
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }
    
    updateAllCharts(data, personStats) {
        this.renderMainLineChart(data);
        this.renderMainPieChart(data);
        this.renderHighestCallsChart(personStats);
        this.renderCallsDoughnutChart(personStats);
        this.renderTopTalkersChart(personStats);
    }
    
    // Explicitly update analytics charts when section is shown
    updateAnalyticsCharts(personStats) {
        this.renderDurationBarChart(personStats);
        this.renderCallsDoughnutChart(personStats);
        this.renderTopTalkersChart(personStats);
    }

    renderInternetLineChart(data) {
        const ctx = document.getElementById('internetLineChart');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.charts.internetLine) this.charts.internetLine.destroy();

        const dateMap = {};
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        sortedData.forEach(log => {
            if (!dateMap[log.date]) dateMap[log.date] = 0;
            dateMap[log.date] += log.dataMB;
        });

        const labels = Object.keys(dateMap).map(date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const mbData = Object.values(dateMap);
        const chartType = labels.length <= 1 ? 'bar' : 'line';

        this.charts.internetLine = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Data Usage (MB)',
                    data: mbData,
                    borderColor: this.colors.primary,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Also render the analysis chart which is a duplicate for now (can be changed later)
        const ctxAnalysis = document.getElementById('internetAnalysisChart');
        if (ctxAnalysis) {
            if (this.charts.internetAnalysis) this.charts.internetAnalysis.destroy();
            this.charts.internetAnalysis = new Chart(ctxAnalysis, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Data Usage (MB)',
                        data: mbData,
                        backgroundColor: this.colors.primary,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    renderSmsLineChart(data) {
        const ctx = document.getElementById('smsLineChart');
        if (!ctx || typeof Chart === 'undefined') return;
        if (this.charts.smsLine) this.charts.smsLine.destroy();

        const dateMap = {};
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        sortedData.forEach(log => {
            if (!dateMap[log.date]) dateMap[log.date] = 0;
            dateMap[log.date] += log.count;
        });

        const labels = Object.keys(dateMap).map(date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const countData = Object.values(dateMap);
        const chartType = labels.length <= 1 ? 'bar' : 'line';

        this.charts.smsLine = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'SMS Count',
                    data: countData,
                    borderColor: this.colors.purple,
                    backgroundColor: 'rgba(217, 70, 239, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });

        // Analysis chart
        const ctxAnalysis = document.getElementById('smsAnalysisChart');
        if (ctxAnalysis) {
            if (this.charts.smsAnalysis) this.charts.smsAnalysis.destroy();
            this.charts.smsAnalysis = new Chart(ctxAnalysis, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'SMS Sent',
                        data: countData,
                        backgroundColor: this.colors.purple,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }
    }

    updateAllCharts(logs, personStats) {
        this.renderMainLineChart(logs);
        this.renderMainPieChart(logs);
        this.renderDurationBarChart(personStats);
        this.renderCallsDoughnutChart(personStats);
        this.renderTopTalkersChart(personStats);
    }
}

const chartManager = new ChartManager();
