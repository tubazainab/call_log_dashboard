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

    updateDashboardSummary(stats, internetData = [], smsData = [], calls = []) {
        // Safe helper - avoids crash if element doesn't exist
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        setEl('statTotalCalls', stats.totalCalls);
        setEl('statIncoming', stats.incoming);
        setEl('statOutgoing', stats.outgoing);
        setEl('statMissed', stats.missed);
        
        let totalDuration = 0;
        let longestCall = 0;
        
        calls.forEach(log => {
            const dur = log.duration || 0;
            totalDuration += dur;
            if (dur > longestCall) {
                longestCall = dur;
            }
        });
        
        let avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;
        
        setEl('statTotalDuration', this.formatDuration(totalDuration));
        setEl('statAvgDuration', this.formatDuration(avgDuration));
        setEl('statLongestCall', this.formatDuration(longestCall));
        
        let totalMb = 0;
        internetData.forEach(i => totalMb += i.dataMB);
        const gb = (totalMb / 1024).toFixed(2);
        
        const statTotalInternet = document.getElementById('statTotalInternet');
        if (statTotalInternet) statTotalInternet.textContent = `${gb} GB`;

        // ---- Internet KPIs ----
        if (internetData.length > 0) {
            const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

            // Group by date
            const byDate = {};
            internetData.forEach(i => {
                byDate[i.date] = (byDate[i.date] || 0) + i.dataMB;
            });
            const dates = Object.keys(byDate);
            const values = Object.values(byDate);

            // Peak day
            const peakIdx = values.indexOf(Math.max(...values));
            const peakDate = dates[peakIdx];
            const peakMb = values[peakIdx];

            // Lowest day
            const lowIdx = values.indexOf(Math.min(...values));
            const lowDate = dates[lowIdx];
            const lowMb = values[lowIdx];

            // Daily average
            const dailyAvg = totalMb / dates.length;

            // Peak single session
            const peakSession = Math.max(...internetData.map(i => i.dataMB));

            const fmtMb = mb => mb >= 1024 ? `${(mb/1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
            const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-IN', {day:'numeric', month:'short'}); } catch { return d; }};

            setKpi('kpiTotalSessionsVal', internetData.length);
            setKpi('kpiDailyAvgVal', fmtMb(dailyAvg));
            setKpi('kpiPeakDayVal', `${fmtDate(peakDate)} · ${fmtMb(peakMb)}`);
            setKpi('kpiPeakSessionVal', fmtMb(peakSession));
            setKpi('kpiLowestDayVal', `${fmtDate(lowDate)} · ${fmtMb(lowMb)}`);
            setKpi('kpiActiveDaysVal', `${dates.length} days`);
        }
        
        let totalSms = 0;
        smsData.forEach(s => totalSms += s.count);
        
        const statTotalSMS = document.getElementById('statTotalSMS');
        if (statTotalSMS) statTotalSMS.textContent = totalSms;

        // ---- SMS KPIs ----
        if (smsData.length > 0) {
            const setK = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

            const byDate = {};
            const contacts = new Set();
            smsData.forEach(s => {
                byDate[s.date] = (byDate[s.date] || 0) + s.count;
                if (s.mobileNumber) contacts.add(s.mobileNumber);
            });
            const dates = Object.keys(byDate);
            const vals = Object.values(byDate);
            const peakIdx = vals.indexOf(Math.max(...vals));
            const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-IN', {day:'numeric', month:'short'}); } catch { return d; }};

            setK('kpiSmsTotal', totalSms);
            setK('kpiSmsSessions', smsData.length);
            setK('kpiSmsDailyAvg', (totalSms / dates.length).toFixed(1) + ' SMS');
            setK('kpiSmsPeakDay', `${fmtDate(dates[peakIdx])} · ${vals[peakIdx]} SMS`);
            setK('kpiSmsContacts', contacts.size);
            setK('kpiSmsActiveDays', `${dates.length} days`);
        }

        // ---- Calls KPIs ----
        if (calls.length > 0) {
            const setK = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

            let incoming = 0, outgoing = 0, missed = 0, totalDur = 0, longestDur = 0;
            const uniqueContacts = new Set();

            calls.forEach(c => {
                const type = (c.callType || '').toLowerCase();
                if (type === 'incoming') incoming++;
                else if (type === 'outgoing') outgoing++;
                else if (type === 'missed') missed++;
                const dur = parseInt(c.duration) || 0;
                totalDur += dur;
                if (dur > longestDur) longestDur = dur;
                if (c.mobileNumber) uniqueContacts.add(c.mobileNumber);
            });
            const avgDur = calls.length > 0 ? Math.round(totalDur / calls.length) : 0;

            setK('kpiCallsTotal', calls.length);
            setK('kpiCallsIncoming', incoming);
            setK('kpiCallsOutgoing', outgoing);
            setK('kpiCallsMissed', missed);
            setK('kpiCallsTalkTime', this.formatDuration(totalDur));
            setK('kpiCallsAvgDur', this.formatDuration(avgDur));
            setK('kpiCallsLongest', this.formatDuration(longestDur));
            setK('kpiCallsContacts', uniqueContacts.size);
        }
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
        this.updateDashboardSummary(stats, internet, sms, logs);
        
        this.calculatePersonStats(logs);
        this.renderLeaderboard();
        this.renderPersonStats();
        
        return this.personStats;
    }
}

const dashboardManager = new DashboardManager();
