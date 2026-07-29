const STORAGE_KEY = 'callFlowData';

class Storage {
    constructor() {
        this.data = [];
        this.internetData = [];
        this.smsData = [];
    }

    getCallLogs() { return this.data; }
    getInternetLogs() { return this.internetData; }
    getSmsLogs() { return this.smsData; }

    addCallLog(log) {
        log.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.data.push(log);
        return log;
    }

    setInternetLogs(logs) { this.internetData = logs; }
    setSmsLogs(logs) { this.smsData = logs; }
    
    setCallLogs(logs) { this.data = logs; }

    updateCallLog(id, updatedLog) {
        const index = this.data.findIndex(log => log.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updatedLog };
            return true;
        }
        return false;
    }

    deleteCallLog(id) {
        const index = this.data.findIndex(log => log.id === id);
        if (index !== -1) {
            this.data.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getCallLogById(id) {
        return this.data.find(log => log.id === id);
    }
    
    exportJSON() {
        return JSON.stringify({
            calls: this.data,
            internet: this.internetData,
            sms: this.smsData
        }, null, 2);
    }
    
    importJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) {
                this.data = parsed; // backwards compatibility
                return true;
            } else if (parsed && Array.isArray(parsed.calls)) {
                this.data = parsed.calls;
                this.internetData = parsed.internet || [];
                this.smsData = parsed.sms || [];
                return true;
            }
        } catch (e) {
            console.error("Failed to parse JSON backup", e);
        }
        return false;
    }
}

// Global instance
const storage = new Storage();
