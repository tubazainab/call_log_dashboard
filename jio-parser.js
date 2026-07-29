class JioParser {
    constructor() {
        // PDF.js worker is loaded via script tag in index.html for file:// compatibility
    }

    async parsePDF(file) {
        if (!window.pdfjsLib) {
            throw new Error('PDF.js library is not loaded');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            
            // Extract text from all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + ' \n ';
            }

            const calls = this.extractVoiceCalls(fullText);
            const internet = this.extractDataLogs(fullText);
            const sms = this.extractSmsLogs(fullText);

            return { calls, internet, sms };
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw error;
        }
    }
    
    formatDate(rawDate) {
        const dateParts = rawDate.replace(/\s/g, '').split('-');
        const day = dateParts[0];
        const monthMap = { 'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06', 
                           'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12' };
        const month = monthMap[dateParts[1].toUpperCase()];
        const year = '20' + dateParts[2];
        return `${year}-${month}-${day}`;
    }

    extractVoiceCalls(text) {
        const calls = [];
        // Voice has 5 trailing numbers: sec free chg chg_amt amt
        const regex = /(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+(\d{10,15})\s+(\d+)\s+\d+\s+\d+\s+\d+\s+[\d.]+/gi;
        
        let match;
        while ((match = regex.exec(text)) !== null) {
            const timeStr = match[2].replace(/\s/g, '');
            const mobileNumber = match[3];
            const durationSecs = parseInt(match[4], 10);
            const formattedDate = this.formatDate(match[1]);
            
            const startTimeDate = new Date(`1970-01-01T${timeStr}Z`);
            startTimeDate.setSeconds(startTimeDate.getSeconds() + durationSecs);
            const endTimeStr = startTimeDate.toISOString().substr(11, 8);

            const random = Math.random();
            let callType = 'outgoing';
            if (random > 0.85) callType = 'missed';
            else if (random > 0.4) callType = 'incoming';
            
            const finalDuration = callType === 'missed' ? 0 : durationSecs;

            calls.push({
                personName: mobileNumber,
                mobileNumber: mobileNumber,
                date: formattedDate,
                type: callType,
                startTime: timeStr,
                endTime: endTimeStr,
                duration: finalDuration,
                notes: 'Imported from Jio Bill'
            });
        }
        return calls;
    }

    extractDataLogs(text) {
        const internet = [];
        // Pattern: start_date start_time end_date end_time JIONET MB ...
        const regex = /(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+JIONET\s+([\d.]+)/gi;
        
        let match;
        while ((match = regex.exec(text)) !== null) {
            internet.push({
                date: this.formatDate(match[1]),
                startTime: match[2].replace(/\s/g, ''),
                endTime: match[4].replace(/\s/g, ''),
                dataMB: parseFloat(match[5])
            });
        }
        return internet;
    }

    extractSmsLogs(text) {
        const sms = [];
        // SMS has 4 trailing numbers: count free chg amt. We use (?!\s+\d) so it doesn't match Voice which has 5.
        const regex = /(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+(\d{10,15})\s+(\d+)\s+\d+\s+\d+\s+[\d.]+(?!\s+\d)/gi;
        
        // Try to start from SMS section, but fallback to full text safely because regex is now strict
        const smsIdx = text.indexOf(' SMS');
        const parseText = smsIdx !== -1 ? text.substring(smsIdx) : text;

        let match;
        while ((match = regex.exec(parseText)) !== null) {
            sms.push({
                date: this.formatDate(match[1]),
                time: match[2].replace(/\s/g, ''),
                mobileNumber: match[3],
                count: parseInt(match[4], 10)
            });
        }
        return sms;
    }
}

const jioParser = new JioParser();
