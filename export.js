class ExportManager {
    
    // Helper to format data for export
    prepareDataForExport(logs) {
        return logs.map(log => ({
            'Date': log.date,
            'Start Time': log.startTime || '-',
            'End Time': log.endTime || '-',
            'Person Name': log.personName,
            'Mobile Number': log.mobileNumber,
            'Call Type': log.type.charAt(0).toUpperCase() + log.type.slice(1),
            'Duration (Mins)': log.duration,
            'Notes': log.notes || ''
        }));
    }

    exportToCSV(logs) {
        if (!logs || logs.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }

        const data = this.prepareDataForExport(logs);
        const headers = Object.keys(data[0]);
        
        // Build CSV string
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(fieldName => {
                    let field = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
                    // Escape quotes and wrap in quotes if contains comma
                    field = String(field).replace(/"/g, '""');
                    if (field.search(/("|,|\n)/g) >= 0) {
                        field = `"${field}"`;
                    }
                    return field;
                }).join(',')
            )
        ].join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0,10);
        link.setAttribute('href', url);
        link.setAttribute('download', `call_logs_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Exported to CSV successfully');
    }

    exportToExcel(logs) {
        if (!logs || logs.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }

        if (typeof XLSX === 'undefined') {
            this.showToast('Excel library not loaded. Try again later.', 'error');
            return;
        }

        try {
            const data = this.prepareDataForExport(logs);
            
            // Create a new workbook and add a worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            
            // Add sheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Call Logs");
            
            // Generate filename with date
            const timestamp = new Date().toISOString().slice(0,10);
            
            // Save the file
            XLSX.writeFile(wb, `CallFlow_Report_${timestamp}.xlsx`);
            
            this.showToast('Exported to Excel successfully');
        } catch (error) {
            console.error('Excel Export Error:', error);
            this.showToast('Failed to export to Excel', 'error');
        }
    }

    printDashboard() {
        window.print();
    }
    
    showToast(message, type = 'success') {
        // We will dispatch a custom event that script.js will handle, 
        // to keep UI logic separated.
        const event = new CustomEvent('show-toast', { 
            detail: { message, type } 
        });
        window.dispatchEvent(event);
    }
}

const exportManager = new ExportManager();
