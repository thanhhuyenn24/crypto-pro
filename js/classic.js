// Ham ho tro tu dong tai du lieu Quadgrams
const loadQuadgramsIfNeeded = async (cb) => {
    // Kiem tra neu du lieu da co trong RAM thi bo qua
    if (typeof Scoring !== 'undefined' && Object.keys(Scoring.quadgrams).length > 0) return;

    if (cb) cb("Dang tu dong tai du lieu english_quadgrams.txt...");
    try {
        // Fetch file tu server
        const response = await fetch('english_quadgrams.txt');
        if (!response.ok) throw new Error("404 Not Found: english_quadgrams.txt");

        const data = await response.text();

        // Xu ly du lieu va nap vao RAM (su dung Utils)
        Scoring.processFileContent(data);

        if (cb) cb("Tai du lieu xong. Bat dau giai ma...");
    } catch (e) {
        console.error(e);
        throw new Error("Khong tim thay file 'english_quadgrams.txt'. Kiem tra lai thu muc deploy.");
    }
};

const Classical = {
    // === TASK 1: CAESAR CIPHER ===
    caesar: async (text) => {
        // 1. Dam bao du lieu Quadgrams da san sang
        await loadQuadgramsIfNeeded();

        const useQuad = Object.keys(Scoring.quadgrams).length > 0;
        let bestKey = 0, bestScore = -Infinity, bestPlain = "";

        // Ham tinh diem Chi-Binh phuong (Fallback khi khong co Quadgrams)
        const scoreChiSquared = (txt) => {
            const clean = txt.toUpperCase().replace(/[^A-Z]/g, '');
            const counts = {};
            for (let c of clean) counts[c] = (counts[c] || 0) + 1;
            
            let chi = 0;
            for (let char in Scoring.monograms) {
                let observed = counts[char] || 0;
                let expected = clean.length * (Scoring.monograms[char] / 100);
                if (expected > 0) chi += Math.pow(observed - expected, 2) / expected;
            }
            return -chi;
        };

        // 2. Vet can tat ca 26 truong hop dich chuyen
        for (let k = 0; k < 26; k++) {
            let plain = "";
            for (let c of text) {
                let code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) plain += String.fromCharCode((code - 65 - k + 26) % 26 + 65);
                else if (code >= 97 && code <= 122) plain += String.fromCharCode((code - 97 - k + 26) % 26 + 97);
                else plain += c;
            }

            // Uu tien dung Quadgrams de tinh diem
            let s = useQuad ? Scoring.score(plain) : scoreChiSquared(plain);
            if (s > bestScore) { bestScore = s; bestKey = k; bestPlain = plain; }
        }
        return { key: bestKey, pt: bestPlain, score: bestScore };
    },

    // === TASK 2: SUBSTITUTION CIPHER (MONO) ===
    mono: async (text, cb) => {
        // 1. Tai du lieu bat buoc
        await loadQuadgramsIfNeeded(cb);

        if (Object.keys(Scoring.quadgrams).length === 0) {
            throw new Error("Khong the chay Task 2 vi thieu du lieu Quadgrams.");
        }

        // 2. Chuan bi du lieu phan tich (Lay 2000 ky tu dau)
        const fullClean = text.toUpperCase().replace(/[^A-Z]/g, '');
        const analysisText = fullClean.slice(0, 2000);

        // 3. Tao Key khoi tao dua tren Phan tich tan suat (Frequency Analysis)
        const counts = {};
        for (let c of fullClean) counts[c] = (counts[c] || 0) + 1;
        
        // Sap xep ky tu xuat hien nhieu nhat
        const sortedCipher = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const stdFreq = "ETAOINSHRDLCUMWFGYPBVKJXQZ"; // Tan suat tieng Anh chuan

        let parentKey = new Array(26).fill('');
        const used = new Set();

        // Map cac ky tu pho bien nhat
        for (let i = 0; i < sortedCipher.length; i++) {
            if (i < stdFreq.length) {
                const cIdx = sortedCipher[i].charCodeAt(0) - 65;
                parentKey[cIdx] = stdFreq[i];
                used.add(stdFreq[i]);
            }
        }
        // Dien not cac ky tu con thieu
        const unused = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').filter(c => !used.has(c));
        for (let i = 0; i < 26; i++) {
            if (parentKey[i] === '') parentKey[i] = unused.shift();
        }

        let parentScore = -Infinity;

        // Ham giai ma nhanh cho vong lap
        const decryptFast = (t, kArr) => {
            let r = "";
            for (let i = 0; i < t.length; i++) {
                r += kArr[t.charCodeAt(i) - 65];
            }
            return r;
        };

        parentScore = Scoring.score(decryptFast(analysisText, parentKey));

        // 4. Thuat toan Leo doi (Hill Climbing)
        const maxIter = 2000;
        for (let i = 0; i < maxIter; i++) {
            // Cap nhat UI moi 200 vong lap
            if (i % 200 === 0 && cb) {
                cb(`Hill Climbing: Iteration ${i}/${maxIter}... Score: ${Math.floor(parentScore)}`);
                await new Promise(r => setTimeout(r, 0));
            }

            // Tao key con bang cach dao vi tri 2 ky tu
            let child = [...parentKey];
            let a = Math.floor(Math.random() * 26), b = Math.floor(Math.random() * 26);
            [child[a], child[b]] = [child[b], child[a]];

            let pt = decryptFast(analysisText, child);
            let sc = Scoring.score(pt);

            // Giu lai key neu diem cao hon
            if (sc > parentScore) { parentScore = sc; parentKey = child; }
        }

        // 5. Giai ma toan bo van ban goc (giu nguyen dinh dang)
        const map = {};
        for (let i = 0; i < 26; i++) map[String.fromCharCode(65 + i)] = parentKey[i];

        let res = "";
        for (let c of text) {
            let u = c.toUpperCase();
            if (map[u]) res += (c === u) ? map[u] : map[u].toLowerCase();
            else res += c;
        }
        return { key: parentKey.join(''), pt: res, score: parentScore };
    },

    // === TASK 3: VIGENERE CIPHER ===
    vigenere: (text) => {
        const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
        let bestLen = 1, bestIC = 0;

        // 1. Tim do dai khoa (Key Length) su dung Index of Coincidence (IC)
        for (let l = 1; l <= 20; l++) {
            let avgIC = 0;
            for (let i = 0; i < l; i++) {
                let col = "", map = {};
                for (let j = i; j < clean.length; j += l) { 
                    col += clean[j]; 
                    map[clean[j]] = (map[clean[j]] || 0) + 1; 
                }
                let sum = 0, n = col.length;
                for (let k in map) sum += map[k] * (map[k] - 1);
                avgIC += sum / (n * (n - 1));
            }
            if (avgIC / l > bestIC) { bestIC = avgIC / l; bestLen = l; }
        }

        // 2. Tim tung ky tu cua khoa dua tren Chi-Binh phuong
        let key = "";
        for (let i = 0; i < bestLen; i++) {
            let col = ""; 
            for (let j = i; j < clean.length; j += bestLen) col += clean[j];
            
            let minChi = Infinity, bestShift = 0;
            for (let s = 0; s < 26; s++) {
                let chi = 0, map = {};
                for (let c of col) { 
                    let dc = String.fromCharCode((c.charCodeAt(0) - 65 - s + 26) % 26 + 65); 
                    map[dc] = (map[dc] || 0) + 1; 
                }
                for (let k in Scoring.monograms) {
                    let obs = map[k] || 0, exp = col.length * (Scoring.monograms[k] / 100);
                    chi += Math.pow(obs - exp, 2) / exp;
                }
                if (chi < minChi) { minChi = chi; bestShift = s; }
            }
            key += String.fromCharCode(bestShift + 65);
        }

        // 3. Giai ma voi khoa tim duoc
        let pt = "", ki = 0;
        for (let c of text) {
            let code = c.charCodeAt(0);
            let shift = key.charCodeAt(ki % key.length) - 65;
            if (code >= 65 && code <= 90) { 
                pt += String.fromCharCode((code - 65 - shift + 26) % 26 + 65); 
                ki++; 
            } else if (code >= 97 && code <= 122) { 
                pt += String.fromCharCode((code - 97 - shift + 26) % 26 + 97); 
                ki++; 
            } else pt += c;
        }
        return { key: key, pt: pt, len: bestLen };
    }
};