const fs = require('fs'); 
const text = fs.readFileSync('pdf_text.txt', 'utf8'); 

class JioParser { 
    formatDate(rawDate) { 
        const dateParts = rawDate.replace(/\s/g, '').split('-'); 
        const day = dateParts[0]; 
        const monthMap = { 'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12' }; 
        const month = monthMap[dateParts[1].toUpperCase()]; 
        const year = '20' + dateParts[2]; 
        return `${year}-${month}-${day}`; 
    } 

    extractVoiceCalls(text) { 
        const calls = []; 
        const regex = /(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+(\d{10,15})\s+(\d+)\s+\d+\s+\d+\s+\d+\s+[\d.]+/gi; 
        let match; 
        while ((match = regex.exec(text)) !== null) { 
            const timeStr = match[2].replace(/\s/g, ''); 
            const mobileNumber = match[3]; 
            const durationSecs = parseInt(match[4], 10); 
            const formattedDate = this.formatDate(match[1]); 
            calls.push({ formattedDate, timeStr, durationSecs }); 
        } 
        return calls; 
    } 

    extractDataLogs(text) { 
        const internet = []; 
        const regex = /(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+JIONET\s+([\d.]+)/gi; 
        let match; 
        while ((match = regex.exec(text)) !== null) { 
            internet.push({ date: this.formatDate(match[1]) }); 
        } 
        return internet; 
    } 

    extractSmsLogs(text) { 
        const sms = []; 
        const regex = /(\d{2}\s*-\s*[a-z]{3}\s*-\s*\d{2})\s+(\d{2}\s*:\s*\d{2}\s*:\s*\d{2})\s+(\d{10,15})\s+(\d+)\s+\d+\s+\d+\s+[\d.]+/gi; 
        const smsIdx = text.indexOf('3.0 SMS'); 
        const parseText = smsIdx !== -1 ? text.substring(smsIdx) : text; 
        let match; 
        while ((match = regex.exec(parseText)) !== null) { 
            sms.push({ date: this.formatDate(match[1]) }); 
        } 
        return sms; 
    } 
} 

const parser = new JioParser(); 
console.log(parser.extractVoiceCalls(text).length); 
console.log(parser.extractDataLogs(text).length); 
console.log(parser.extractSmsLogs(text).length); 
