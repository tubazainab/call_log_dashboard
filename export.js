class ExportManager {
    
    // Formatter for Call Logs
    prepareCallLogsForExport(logs) {
        return (logs || []).map(log => ({
            'Date': log.date || '-',
            'Start Time': log.startTime || '-',
            'End Time': log.endTime || '-',
            'Person Name': log.personName || '-',
            'Mobile Number': log.mobileNumber || '-',
            'Call Type': log.callType ? (log.callType.charAt(0).toUpperCase() + log.callType.slice(1)) : (log.type ? (log.type.charAt(0).toUpperCase() + log.type.slice(1)) : '-'),
            'Duration (Seconds)': log.duration || 0,
            'Formatted Duration': this.formatDuration(log.duration || 0),
            'Notes': log.notes || ''
        }));
    }

    // Formatter for Internet Data
    prepareInternetDataForExport(internetData) {
        return (internetData || []).map(item => ({
            'Date': item.date || '-',
            'Start Time': item.startTime || '-',
            'End Time': item.endTime || '-',
            'Data Used (MB)': item.dataMB || 0,
            'Data Used (GB)': ((item.dataMB || 0) / 1024).toFixed(3)
        }));
    }

    // Formatter for SMS Logs
    prepareSMSDataForExport(smsData) {
        return (smsData || []).map(item => ({
            'Date': item.date || '-',
            'Time': item.time || '-',
            'Mobile Number': item.mobileNumber || '-',
            'SMS Count': item.count || 1
        }));
    }

    // Formatter for Person Stats
    preparePersonStatsForExport(personStats) {
        return (personStats || []).map(p => ({
            'Contact Name': p.name || '-',
            'Total Calls': p.totalCalls || 0,
            'Total Talk Time': this.formatDuration(p.totalDuration || 0),
            'Average Duration': this.formatDuration(p.avgDuration || 0),
            'Longest Call': this.formatDuration(p.longestCall || 0),
            'Last Call Date': p.lastCallDate ? new Date(p.lastCallDate).toLocaleDateString() : '-'
        }));
    }

    formatDuration(seconds) {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    }

    // Export CSV (Call Logs)
    exportToCSV(logs) {
        if (!logs || logs.length === 0) {
            this.showToast('No call logs to export to CSV', 'error');
            return;
        }

        const data = this.prepareCallLogsForExport(logs);
        const headers = Object.keys(data[0]);
        
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(fieldName => {
                    let field = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
                    field = String(field).replace(/"/g, '""');
                    if (field.search(/("|,|\n)/g) >= 0) {
                        field = `"${field}"`;
                    }
                    return field;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0,10);
        link.setAttribute('href', url);
        link.setAttribute('download', `Call_Logs_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Exported CSV file successfully!');
    }

    // Export Multi-Sheet Excel (All Datasets)
    exportToExcel(calls = [], internet = [], sms = [], personStats = []) {
        if (typeof XLSX === 'undefined') {
            this.showToast('Excel library not loaded.', 'error');
            return;
        }

        const hasCalls = calls && calls.length > 0;
        const hasInternet = internet && internet.length > 0;
        const hasSms = sms && sms.length > 0;

        if (!hasCalls && !hasInternet && !hasSms) {
            this.showToast('No data available to export to Excel', 'error');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();

            if (hasCalls) {
                const callData = this.prepareCallLogsForExport(calls);
                const wsCalls = XLSX.utils.json_to_sheet(callData);
                XLSX.utils.book_append_sheet(wb, wsCalls, "Call Logs");
            }

            if (hasInternet) {
                const internetData = this.prepareInternetDataForExport(internet);
                const wsInternet = XLSX.utils.json_to_sheet(internetData);
                XLSX.utils.book_append_sheet(wb, wsInternet, "Internet Usage");
            }

            if (hasSms) {
                const smsData = this.prepareSMSDataForExport(sms);
                const wsSms = XLSX.utils.json_to_sheet(smsData);
                XLSX.utils.book_append_sheet(wb, wsSms, "SMS Logs");
            }

            if (personStats && personStats.length > 0) {
                const personData = this.preparePersonStatsForExport(personStats);
                const wsPerson = XLSX.utils.json_to_sheet(personData);
                XLSX.utils.book_append_sheet(wb, wsPerson, "Person Stats");
            }

            const timestamp = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `CheckingInfo_Full_Report_${timestamp}.xlsx`);

            this.showToast('Full Excel report (.xlsx) exported successfully!');
        } catch (error) {
            console.error('Excel Export Error:', error);
            this.showToast('Failed to export Excel report', 'error');
        }
    }

    // Export single dataset to Excel
    exportSingleSheetExcel(data, sheetName, fileNamePrefix) {
        if (typeof XLSX === 'undefined') {
            this.showToast('Excel library not loaded.', 'error');
            return;
        }

        if (!data || data.length === 0) {
            this.showToast(`No ${sheetName.toLowerCase()} data to export`, 'error');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            const timestamp = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `${fileNamePrefix}_${timestamp}.xlsx`);

            this.showToast(`Exported ${sheetName} to Excel (.xlsx) successfully!`);
        } catch (error) {
            console.error('Single Sheet Excel Export Error:', error);
            this.showToast(`Failed to export ${sheetName} Excel file`, 'error');
        }
    }

    // Specific dataset exports
    exportCallsExcel(logs) {
        const data = this.prepareCallLogsForExport(logs);
        this.exportSingleSheetExcel(data, "Call Logs", "Call_Logs_Report");
    }

    exportInternetExcel(internetData) {
        const data = this.prepareInternetDataForExport(internetData);
        this.exportSingleSheetExcel(data, "Internet Data", "Internet_Usage_Report");
    }

    exportSmsExcel(smsData) {
        const data = this.prepareSMSDataForExport(smsData);
        this.exportSingleSheetExcel(data, "SMS Logs", "SMS_Logs_Report");
    }

    printDashboard() {
        window.print();
    }
    
    showToast(message, type = 'success') {
        const event = new CustomEvent('show-toast', { 
            detail: { message, type } 
        });
        window.dispatchEvent(event);
    }
}

const exportManager = new ExportManager();
