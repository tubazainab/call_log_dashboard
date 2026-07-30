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

    getNormalizedCallType(log) {
        if (!log) return 'outgoing';
        const raw = String(log.type || log.callType || log['Call Type'] || log.call_type || log.mode || '').trim().toLowerCase();
        
        if (raw.includes('inc') || raw.includes('in') || raw.includes('rec') || raw.includes('received')) {
            return 'incoming';
        }
        if (raw.includes('mis') || raw.includes('missed') || raw.includes('rej') || raw.includes('reject')) {
            return 'missed';
        }
        return 'outgoing';
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

            const type = this.getNormalizedCallType(log);
            if (type === 'incoming') incoming++;
            else if (type === 'missed') missed++;
            else outgoing++;
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

    updateInternetKpis(internetData = []) {
        const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        let totalMb = 0;
        internetData.forEach(i => totalMb += (i.dataMB || 0));
        const gb = (totalMb / 1024).toFixed(2);
        
        const statTotalInternet = document.getElementById('statTotalInternet');
        if (statTotalInternet) statTotalInternet.textContent = `${gb} GB`;

        if (internetData.length > 0) {
            const byDate = {};
            internetData.forEach(i => {
                byDate[i.date] = (byDate[i.date] || 0) + (i.dataMB || 0);
            });
            const dates = Object.keys(byDate);
            const values = Object.values(byDate);

            const peakIdx = values.indexOf(Math.max(...values));
            const peakDate = dates[peakIdx];
            const peakMb = values[peakIdx];

            const lowIdx = values.indexOf(Math.min(...values));
            const lowDate = dates[lowIdx];
            const lowMb = values[lowIdx];

            const dailyAvg = totalMb / dates.length;
            const peakSession = Math.max(...internetData.map(i => i.dataMB || 0));

            const fmtMb = mb => mb >= 1024 ? `${(mb/1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
            const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-IN', {day:'numeric', month:'short'}); } catch { return d; }};

            setKpi('kpiTotalSessionsVal', internetData.length);
            setKpi('kpiDailyAvgVal', fmtMb(dailyAvg));
            setKpi('kpiPeakDayVal', `${fmtDate(peakDate)} · ${fmtMb(peakMb)}`);
            setKpi('kpiPeakSessionVal', fmtMb(peakSession));
            setKpi('kpiLowestDayVal', `${fmtDate(lowDate)} · ${fmtMb(lowMb)}`);
            setKpi('kpiActiveDaysVal', `${dates.length} days`);
        } else {
            setKpi('kpiTotalSessionsVal', '0');
            setKpi('kpiDailyAvgVal', '0 MB');
            setKpi('kpiPeakDayVal', '—');
            setKpi('kpiPeakSessionVal', '0 MB');
            setKpi('kpiLowestDayVal', '—');
            setKpi('kpiActiveDaysVal', '0 days');
        }
    }

    updateSmsKpis(smsData = []) {
        const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        let totalSms = 0;
        smsData.forEach(s => totalSms += (s.count || 0));
        
        const statTotalSMS = document.getElementById('statTotalSMS');
        if (statTotalSMS) statTotalSMS.textContent = totalSms;

        if (smsData.length > 0) {
            const byDate = {};
            const contacts = new Set();
            smsData.forEach(s => {
                byDate[s.date] = (byDate[s.date] || 0) + (s.count || 0);
                if (s.mobileNumber) contacts.add(s.mobileNumber);
            });
            const dates = Object.keys(byDate);
            const vals = Object.values(byDate);
            const peakIdx = vals.indexOf(Math.max(...vals));
            const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-IN', {day:'numeric', month:'short'}); } catch { return d; }};

            setKpi('kpiSmsTotal', totalSms);
            setKpi('kpiSmsSessions', smsData.length);
            setKpi('kpiSmsDailyAvg', (totalSms / dates.length).toFixed(1) + ' SMS');
            setKpi('kpiSmsPeakDay', `${fmtDate(dates[peakIdx])} · ${vals[peakIdx]} SMS`);
            setKpi('kpiSmsContacts', contacts.size);
            setKpi('kpiSmsActiveDays', `${dates.length} days`);
        } else {
            setKpi('kpiSmsTotal', '0');
            setKpi('kpiSmsSessions', '0');
            setKpi('kpiSmsDailyAvg', '0 SMS');
            setKpi('kpiSmsPeakDay', '—');
            setKpi('kpiSmsContacts', '0');
            setKpi('kpiSmsActiveDays', '0 days');
        }
    }

    updateCallsKpis(calls = []) {
        const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        let incoming = 0, outgoing = 0, missed = 0, totalDur = 0, longestDur = 0;
        const uniqueContacts = new Set();

        calls.forEach(c => {
            const type = this.getNormalizedCallType(c);
            if (type === 'incoming') incoming++;
            else if (type === 'missed') missed++;
            else outgoing++;
            const dur = parseInt(c.duration) || 0;
            totalDur += dur;
            if (dur > longestDur) longestDur = dur;
            if (c.mobileNumber) uniqueContacts.add(c.mobileNumber);
        });
        const avgDur = calls.length > 0 ? Math.round(totalDur / calls.length) : 0;

        setKpi('kpiCallsTotal', calls.length);
        setKpi('kpiCallsIncoming', incoming);
        setKpi('kpiCallsOutgoing', outgoing);
        setKpi('kpiCallsMissed', missed);
        setKpi('kpiCallsTalkTime', this.formatDuration(totalDur));
        setKpi('kpiCallsAvgDur', this.formatDuration(avgDur));
        setKpi('kpiCallsLongest', this.formatDuration(longestDur));
        setKpi('kpiCallsContacts', uniqueContacts.size);
    }

    updateDashboardSummary(stats, internetData = [], smsData = [], calls = []) {
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        setEl('statTotalCalls', stats.totalCalls);
        setEl('statIncoming', stats.incoming);
        setEl('statOutgoing', stats.outgoing);
        setEl('statMissed', stats.missed);
        
        let totalDuration = 0;
        let longestCall = 0;
        
        calls.forEach(log => {
            const dur = parseInt(log.duration) || 0;
            totalDuration += dur;
            if (dur > longestCall) {
                longestCall = dur;
            }
        });
        
        let avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;
        
        setEl('statTotalDuration', this.formatDuration(totalDuration));
        setEl('statAvgDuration', this.formatDuration(avgDuration));
        setEl('statLongestCall', this.formatDuration(longestCall));
        
        this.updateInternetKpis(internetData);
        this.updateSmsKpis(smsData);
        this.updateCallsKpis(calls);
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
