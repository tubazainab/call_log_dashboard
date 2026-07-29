class DashboardManager {
    constructor() {
        this.personStats = [];
    }

    formatDuration(totalSeconds) {
        if (!totalSeconds || isNaN(totalSeconds)) return '0s';
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0) parts.push(`${mins}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        
        // Use non-breaking space (\u00A0) to prevent wrapping onto multiple lines
        return parts.join('\u00A0');
    }

    calculateSummaryStats(logs) {
        let totalDuration = 0;
        let incoming = 0;
        let outgoing = 0;
        let missed = 0;
        let longestCall = 0;
        let shortestCall = Infinity;

        logs.forEach(log => {
            const duration = parseInt(log.duration) || 0;
            totalDuration += duration;
            
            if (duration > longestCall) longestCall = duration;
            if (duration > 0 && duration < shortestCall) shortestCall = duration;

            if (log.type === 'incoming') incoming++;
            else if (log.type === 'outgoing') outgoing++;
            else if (log.type === 'missed') missed++;
        });

        if (shortestCall === Infinity) shortestCall = 0;
        
        const totalCalls = logs.length;
        const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

        return {
            totalCalls,
            totalDuration,
            avgDuration,
            longestCall,
            incoming,
            outgoing,
            missed
        };
    }

    updateDashboardSummary(stats, internetData = [], smsData = []) {
        document.getElementById('statTotalCalls').textContent = stats.totalCalls;
        document.getElementById('statIncoming').textContent = stats.incoming;
        document.getElementById('statOutgoing').textContent = stats.outgoing;
        document.getElementById('statMissed').textContent = stats.missed;
        
        let totalMb = 0;
        internetData.forEach(i => totalMb += i.dataMB);
        const gb = (totalMb / 1024).toFixed(2);
        
        const statTotalInternet = document.getElementById('statTotalInternet');
        if (statTotalInternet) statTotalInternet.textContent = `${gb} GB`;
        
        let totalSms = 0;
        smsData.forEach(s => totalSms += s.count);
        
        const statTotalSMS = document.getElementById('statTotalSMS');
        if (statTotalSMS) statTotalSMS.textContent = totalSms;
    }

    calculatePersonStats(logs) {
        const statsMap = {};

        logs.forEach(log => {
            if (!statsMap[log.personName]) {
                statsMap[log.personName] = {
                    name: log.personName,
                    totalCalls: 0,
                    totalDuration: 0,
                    longestCall: 0,
                    lastCallDate: log.date
                };
            }

            const person = statsMap[log.personName];
            person.totalCalls++;
            
            const duration = parseInt(log.duration) || 0;
            person.totalDuration += duration;
            
            if (duration > person.longestCall) {
                person.longestCall = duration;
            }

            // Keep track of latest date
            if (new Date(log.date) > new Date(person.lastCallDate)) {
                person.lastCallDate = log.date;
            }
        });

        // Convert to array and calculate averages
        this.personStats = Object.values(statsMap).map(person => {
            person.avgDuration = Math.round(person.totalDuration / person.totalCalls);
            return person;
        });

        return this.personStats;
    }

    renderLeaderboard(limit = 10) {
        const list = document.getElementById('leaderboardList');
        if (!list) return;

        list.innerHTML = '';

        const sortedStats = [...this.personStats]
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .slice(0, limit);

        if (sortedStats.length === 0) {
            list.innerHTML = '<li class="text-muted text-center py-4">No data available</li>';
            return;
        }

        sortedStats.forEach((stat, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            
            let rankClass = '';
            if (index === 0) rankClass = 'rank-1';
            else if (index === 1) rankClass = 'rank-2';
            else if (index === 2) rankClass = 'rank-3';

            li.innerHTML = `
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="lb-info">
                    <div class="lb-name">${stat.name}</div>
                    <div class="text-muted" style="font-size: 0.85rem">${stat.totalCalls} calls</div>
                </div>
                <div class="lb-time">${this.formatDuration(stat.totalDuration)}</div>
            `;
            list.appendChild(li);
        });
    }

    renderPersonStats(searchTerm = '') {
        const container = document.getElementById('personStatsList');
        if (!container) return;

        container.innerHTML = '';

        let filteredStats = this.personStats;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredStats = this.personStats.filter(stat => 
                stat.name.toLowerCase().includes(term)
            );
        }

        // Sort alphabetically by default
        filteredStats.sort((a, b) => a.name.localeCompare(b.name));

        if (filteredStats.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4">No persons found</div>';
            return;
        }

        filteredStats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'person-stat-card glass-panel';
            card.innerHTML = `
                <div class="person-stat-header">
                    <strong style="font-size: 1.1rem">${stat.name}</strong>
                    <span class="badge badge-outgoing">${stat.totalCalls} Calls</span>
                </div>
                <div class="person-stat-grid">
                    <div class="ps-item">
                        <span>Total Talk Time</span>
                        <strong>${this.formatDuration(stat.totalDuration)}</strong>
                    </div>
                    <div class="ps-item">
                        <span>Avg Duration</span>
                        <strong>${this.formatDuration(stat.avgDuration)}</strong>
                    </div>
                    <div class="ps-item">
                        <span>Longest Call</span>
                        <strong>${this.formatDuration(stat.longestCall)}</strong>
                    </div>
                    <div class="ps-item">
                        <span>Last Call</span>
                        <strong>${new Date(stat.lastCallDate).toLocaleDateString()}</strong>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    updateAll(logs, internet = [], sms = []) {
        const stats = this.calculateSummaryStats(logs);
        this.updateDashboardSummary(stats, internet, sms);
        
        this.calculatePersonStats(logs);
        this.renderLeaderboard();
        this.renderPersonStats();
        
        return this.personStats;
    }
}

const dashboardManager = new DashboardManager();
