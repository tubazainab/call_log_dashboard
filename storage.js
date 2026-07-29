const STORAGE_KEY = 'callFlowData';

class Storage {
    constructor() {
        this.data = [];
    }

    getCallLogs() {
        return this.data;
    }

    addCallLog(log) {
        // Generate a unique ID
        log.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.data.push(log);
        return log;
    }

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
    
    // For Backup & Restore
    exportJSON() {
        return JSON.stringify(this.data, null, 2);
    }
    
    importJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) {
                this.data = parsed;
                this.saveData();
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
