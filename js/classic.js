const Classical = {
    caesar: (text) => {
        const useQuad = Object.keys(Scoring.quadgrams).length > 0;
        let bestKey = 0, bestScore = -Infinity, bestPlain = "";
        
        const scoreChiSquared = (txt) => {
            const clean = txt.toUpperCase().replace(/[^A-Z]/g, '');
            const counts = {};
            for(let c of clean) counts[c] = (counts[c]||0)+1;
            let chi = 0;
            for(let char in Scoring.monograms) {
                let observed = counts[char] || 0;
                let expected = clean.length * (Scoring.monograms[char] / 100);
                if(expected > 0) chi += Math.pow(observed - expected, 2) / expected;
            }
            return -chi; 
        };

        for (let k=0; k<26; k++) {
            let plain = "";
            for (let c of text) {
                let code = c.charCodeAt(0);
                if (code>=65 && code<=90) plain += String.fromCharCode((code-65-k+26)%26+65);
                else if (code>=97 && code<=122) plain += String.fromCharCode((code-97-k+26)%26+97);
                else plain += c;
            }
            let s = useQuad ? Scoring.score(plain) : scoreChiSquared(plain);
            if (s > bestScore) { bestScore = s; bestKey = k; bestPlain = plain; }
        }
        return { key: bestKey, pt: bestPlain, score: bestScore };
    },

    mono: async (text, cb) => {
        if (Object.keys(Scoring.quadgrams).length === 0) throw new Error("Vui lòng tải file 'english_quadgrams.txt' để chạy Task 2!");
        
        // 1. Tối ưu: Chỉ lấy tối đa 2000 ký tự để phân tích điểm số cho nhanh
        const fullClean = text.toUpperCase().replace(/[^A-Z]/g, '');
        const analysisText = fullClean.slice(0, 2000); 
        
        // 2. Tối ưu: Khởi tạo khóa dựa trên Tần suất (Frequency Analysis) thay vì Random
        // Giúp hội tụ nhanh hơn gấp nhiều lần
        const counts = {};
        for(let c of fullClean) counts[c] = (counts[c]||0)+1;
        const sortedCipher = Object.keys(counts).sort((a,b) => counts[b] - counts[a]); // Ký tự xuất hiện nhiều nhất
        const stdFreq = "ETAOINSHRDLCUMWFGYPBVKJXQZ"; // Tần suất tiếng Anh chuẩn
        
        let parentKey = new Array(26).fill('');
        const used = new Set();
        
        // Map các ký tự phổ biến nhất trước
        for(let i=0; i<sortedCipher.length; i++) {
            if (i < stdFreq.length) {
                const cIdx = sortedCipher[i].charCodeAt(0) - 65;
                parentKey[cIdx] = stdFreq[i];
                used.add(stdFreq[i]);
            }
        }
        // Điền nốt các ký tự còn thiếu
        const unused = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').filter(c => !used.has(c));
        for(let i=0; i<26; i++) {
            if(parentKey[i] === '') parentKey[i] = unused.shift();
        }

        let parentScore = -Infinity;
        
        // Hàm giải mã tối ưu cho vòng lặp (dùng mảng thay vì map object)
        const decryptFast = (t, kArr) => {
            let r = "";
            for(let i=0; i<t.length; i++) {
                r += kArr[t.charCodeAt(i) - 65];
            }
            return r;
        };

        // Tính điểm khởi đầu
        parentScore = Scoring.score(decryptFast(analysisText, parentKey));

        // 3. Hill Climbing
        const maxIter = 2000;
        for (let i=0; i<maxIter; i++) {
            // Giảm tần suất update UI xuống mỗi 200 vòng để đỡ lag
            if (i%200===0) { 
                cb(`Hill Climbing: Iteration ${i}/${maxIter}... Score: ${Math.floor(parentScore)}`); 
                await new Promise(r=>setTimeout(r,0)); 
            }
            
            let child = [...parentKey];
            let a = Math.floor(Math.random()*26), b = Math.floor(Math.random()*26);
            [child[a], child[b]] = [child[b], child[a]];
            
            let pt = decryptFast(analysisText, child);
            let sc = Scoring.score(pt);
            
            if (sc > parentScore) { parentScore = sc; parentKey = child; }
        }

        // Giải mã lần cuối trên TOÀN BỘ văn bản gốc (giữ nguyên hoa thường/ký tự lạ)
        const map = {}; 
        for(let i=0; i<26; i++) map[String.fromCharCode(65+i)] = parentKey[i];
        
        let res = "";
        for (let c of text) {
            let u = c.toUpperCase();
            if (map[u]) res += (c===u) ? map[u] : map[u].toLowerCase();
            else res += c;
        }
        return { key: parentKey.join(''), pt: res, score: parentScore };
    },

    vigenere: (text) => {
        const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
        let bestLen=1, bestIC=0;
        for (let l=1; l<=20; l++) {
            let avgIC=0;
            for(let i=0; i<l; i++) {
                let col="", map={};
                for(let j=i; j<clean.length; j+=l) { col+=clean[j]; map[clean[j]]=(map[clean[j]]||0)+1; }
                let sum=0, n=col.length;
                for(let k in map) sum+=map[k]*(map[k]-1);
                avgIC += sum/(n*(n-1));
            }
            if (avgIC/l > bestIC) { bestIC=avgIC/l; bestLen=l; }
        }
        
        let key = "";
        for (let i=0; i<bestLen; i++) {
            let col = ""; for(let j=i; j<clean.length; j+=bestLen) col+=clean[j];
            let minChi=Infinity, bestShift=0;
            for (let s=0; s<26; s++) {
                let chi=0, map={};
                for(let c of col) { let dc=String.fromCharCode((c.charCodeAt(0)-65-s+26)%26+65); map[dc]=(map[dc]||0)+1; }
                for(let k in Scoring.monograms) {
                    let obs = map[k]||0, exp = col.length * (Scoring.monograms[k]/100);
                    chi += Math.pow(obs-exp,2)/exp;
                }
                if(chi<minChi) { minChi=chi; bestShift=s; }
            }
            key += String.fromCharCode(bestShift+65);
        }

        let pt="", ki=0;
        for(let c of text) {
            let code=c.charCodeAt(0);
            let shift=key.charCodeAt(ki%key.length)-65;
            if(code>=65 && code<=90) { pt+=String.fromCharCode((code-65-shift+26)%26+65); ki++; }
            else if(code>=97 && code<=122) { pt+=String.fromCharCode((code-97-shift+26)%26+97); ki++; }
            else pt+=c;
        }
        return { key: key, pt: pt, len: bestLen };
    }
};