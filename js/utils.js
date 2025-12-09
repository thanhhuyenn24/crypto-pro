// --- UTILITIES ---
const Utils = {
    s2b: str => new TextEncoder().encode(str),
    b2s: bytes => new TextDecoder().decode(bytes),
    h2b: hex => new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h=>parseInt(h,16))),
    b2h: bytes => Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(''),
    rand: n => crypto.getRandomValues(new Uint8Array(n)),
    xor: (a, b) => a.map((v, i) => v ^ b[i])
};

// --- SCORING ENGINE ---
const Scoring = {
    monograms: {'E':12.02,'T':9.10,'A':8.12,'O':7.68,'I':7.31,'N':6.95,'S':6.28,'R':6.02,'H':5.92,'D':4.32,'L':3.98,'U':2.88,'C':2.71,'M':2.61,'F':2.30,'Y':2.11,'W':2.09,'G':2.03,'P':1.82,'B':1.49,'V':1.11,'K':0.69,'X':0.17,'Q':0.11,'J':0.10,'Z':0.07},
    quadgrams: {}, 
    floor: -10,
    
    // Khoi tao
    init: function() {
        this.quadgrams = {};
    },

    processFileContent: function(text) {
        const lines = text.split('\n');
        const tempMap = {};
        let total = 0;
        
        for (let line of lines) {
            const parts = line.trim().split(/\s+/); // Cải tiến regex để bắt khoảng trắng tốt hơn
            if (parts.length === 2) {
                const key = parts[0].toUpperCase();
                const count = parseInt(parts[1]);
                if (!isNaN(count)) {
                    tempMap[key] = count;
                    total += count;
                }
            }
        }

        if (total === 0) return; // Tranh loi chia cho 0

        const logMap = {};
        for (let k in tempMap) {
            logMap[k] = Math.log10(tempMap[k] / total);
        }
        
        // Tinh diem san cho cac quad khong co trong du lieu
        this.floor = Math.log10(0.01 / total);
        this.quadgrams = logMap;
    },

    score: function(text) {
        text = text.toUpperCase().replace(/[^A-Z]/g, '');
        let s = 0;
        const len = text.length - 3;
        if (len <= 0) return 0;

        for (let i = 0; i < len; i++) {
            const q = text.substr(i, 4);
            s += (this.quadgrams[q] || this.floor);
        }
        return s;
    }
};