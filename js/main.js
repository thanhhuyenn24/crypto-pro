const App = {
    state: {
        keyFormat: 'Text',
        ivFormat: 'Text',
        inputFormat: 'Text', 
        outputFormat: 'Base64',
        lastEncryptResult: null  // Lưu kết quả encrypt gần nhất
    },

    ui: {
        setupIOControls: () => {
            // 1. INPUT HEADER
            const inputHeader = document.querySelector('#inputText').previousElementSibling;
            inputHeader.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-xl font-bold text-slate-700 uppercase"><i class="fas fa-arrow-right mr-2"></i>Input</span>
                    <input type="file" id="inputFile" class="hidden">
                    <button id="btnOpenFile" onclick="document.getElementById('inputFile').click()" class="text-sm bg-white border border-slate-300 px-3 py-1 rounded shadow-sm hover:bg-blue-50 text-slate-700 font-medium transition"><i class="fas fa-folder-open mr-1 text-yellow-600"></i> Open File</button>
                </div>
                <div class="flex items-center gap-3">
                    <span id="inputCounter" class="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">0 bytes</span>
                    <div class="io-format-ctrl flex rounded shadow-sm overflow-hidden text-xs border border-slate-200">
                        <button onclick="App.setFormat('input', 'Text')" id="btnInputText" class="px-3 py-1.5 bg-blue-600 text-white font-bold transition">Text</button>
                        <button onclick="App.setFormat('input', 'Hex')" id="btnInputHex" class="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50 transition border-l">Hex</button>
                        <button onclick="App.setFormat('input', 'Base64')" id="btnInputBase64" class="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50 transition border-l">Base64</button>
                    </div>
                </div>
            `;

            // 2. OUTPUT HEADER
            const outputHeader = document.querySelector('#outputText').previousElementSibling;
            outputHeader.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-xl font-bold text-slate-700 uppercase"><i class="fas fa-arrow-left mr-2"></i>Output</span>
                    <button id="btnSaveFile" onclick="App.io.saveOutput()" class="text-sm bg-white border border-slate-300 px-3 py-1 rounded shadow-sm hover:bg-blue-50 text-slate-700 font-medium transition"><i class="fas fa-download mr-1 text-blue-600"></i> Save</button>
                </div>
                <div class="io-format-ctrl flex items-center gap-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase mr-1">Format (Encrypted Only):</span>
                    <div class="flex rounded shadow-sm overflow-hidden text-xs border border-slate-200">
                        <button onclick="App.setFormat('output', 'Base64')" id="btnOutputBase64" class="px-3 py-1.5 bg-blue-600 text-white font-bold transition">Base64</button>
                        <button onclick="App.setFormat('output', 'Hex')" id="btnOutputHex" class="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50 transition border-l">Hex</button>
                    </div>
                </div>
            `;
            
            document.getElementById('inputFile').onchange = (e) => App.io.handleInputFile(e.target);
        },

        updateLayout: () => {
            const algo = document.getElementById('algoSelect').value;
            const isModern = ['DES','AES'].includes(algo);
            const cfg = document.getElementById('configArea');
            const act = document.getElementById('actionArea');
            const res = document.getElementById('resourceArea');
            const stat = document.getElementById('statusBox');

            // Ẩn/Hiện format control
            const formatCtrls = document.querySelectorAll('.io-format-ctrl');
            formatCtrls.forEach(el => el.classList.toggle('hidden', !isModern));

            cfg.innerHTML = ''; act.innerHTML = '';
            res.classList.toggle('hidden', isModern);
            
            // FIX: Ẩn và xóa nội dung Status Box mỗi khi chuyển Task để tránh hiện thông báo cũ
            if(stat) {
                stat.classList.add('hidden');
                stat.innerHTML = '';
            }

            if(isModern) {
                cfg.innerHTML = `
                    <div class="mb-5">
                        <label class="block text-lg font-bold mb-2 text-slate-700">Mode</label>
                        <select id="modeSelect" onchange="App.ui.toggleIV()" class="w-full p-3 border rounded-lg text-lg font-medium shadow-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="ECB" selected>ECB</option>
                            <option value="CBC">CBC</option>
                        </select>
                    </div>

                    <div class="mb-5">
                        <div class="flex justify-between items-end mb-2">
                            <label class="block text-lg font-bold text-slate-700">Key (${algo==='DES'?'8 bytes':'16/24/32 bytes'})</label>
                            <div class="flex rounded shadow-sm overflow-hidden text-xs border border-slate-300">
                                <button onclick="App.setFormat('key', 'Text')" id="btnKeyText" class="px-3 py-1 bg-blue-600 text-white font-bold transition">Text</button>
                                <button onclick="App.setFormat('key', 'Hex')" id="btnKeyHex" class="px-3 py-1 bg-white text-slate-600 hover:bg-slate-50 transition border-l">Hex</button>
                            </div>
                        </div>
                        <div class="relative">
                            <input id="keyInput" oninput="App.validateUI()" class="w-full p-3 border rounded-lg text-lg font-mono shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter Key...">
                            <div id="keyStatus" class="absolute right-3 top-4 text-xs font-bold transition-colors"></div>
                        </div>
                    </div>

                    <div class="mb-5" id="ivContainer">
                        <div class="flex justify-between items-end mb-2">
                            <label class="block text-lg font-bold text-slate-700" id="ivLabel">IV (For CBC)</label>
                            <div class="flex rounded shadow-sm overflow-hidden text-xs border border-slate-300">
                                <button onclick="App.setFormat('iv', 'Text')" id="btnIvText" class="px-3 py-1 bg-blue-600 text-white font-bold transition">Text</button>
                                <button onclick="App.setFormat('iv', 'Hex')" id="btnIvHex" class="px-3 py-1 bg-white text-slate-600 hover:bg-slate-50 transition border-l">Hex</button>
                            </div>
                        </div>
                        <div class="flex relative">
                            <input id="ivInput" oninput="App.validateUI()" class="w-full p-3 border rounded-l-lg text-lg font-mono shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter IV...">
                            <button id="btnGenIV" class="px-5 border border-l-0 rounded-r-lg bg-gray-100 hover:bg-gray-200 text-xl text-gray-600 shadow-sm transition"><i class="fas fa-dice"></i></button>
                            <div id="ivStatus" class="absolute right-16 top-4 text-xs font-bold transition-colors mr-2"></div>
                        </div>
                    </div>
                `;
                act.innerHTML = `<div class="grid grid-cols-2 gap-4 mt-4"><button id="btnEncrypt" class="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 text-lg shadow-lg transition transform active:scale-95 flex justify-center items-center"><i class="fas fa-lock mr-2"></i> Encrypt</button><button id="btnDecrypt" class="bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 text-lg shadow-lg transition transform active:scale-95 flex justify-center items-center"><i class="fas fa-lock-open mr-2"></i> Decrypt</button></div>`;
                
                document.getElementById('btnGenIV').onclick = App.utils.genIV;
                document.getElementById('btnEncrypt').onclick = () => App.runModern(true);
                document.getElementById('btnDecrypt').onclick = () => App.runModern(false);
                
                App.state.keyFormat = 'Text';
                App.state.ivFormat = 'Text';
                App.validateUI(); 
                App.ui.toggleIV();

            } else {
                act.innerHTML = `<button id="btnBreak" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg text-xl transition transform active:scale-95"><i class="fas fa-hammer mr-3"></i>Break Cipher</button>`;
                document.getElementById('btnBreak').onclick = App.runBreaker;
            }
        },
        
        toggleIV: () => {
            const mode = document.getElementById('modeSelect').value;
            const ivInput = document.getElementById('ivInput');
            const btnGenIV = document.getElementById('btnGenIV');
            const ivContainer = document.getElementById('ivContainer');
            
            const isDisabled = (mode === 'ECB');
            
            if (ivContainer) ivContainer.style.opacity = isDisabled ? '0.5' : '1';
            if (ivInput) {
                ivInput.disabled = isDisabled;
                if(isDisabled) ivInput.value = "Not used in ECB"; 
                else if (ivInput.value === "Not used in ECB") ivInput.value = "";
            }
            if (btnGenIV) btnGenIV.disabled = isDisabled;
            
            App.validateUI();
        },

        setLoading: (vis, msg) => {
            document.getElementById('loadingOverlay').classList.toggle('hidden', !vis);
            if(msg) document.getElementById('loadingText').innerText = msg;
        },
        
        updateQuadStatus: (isLoaded) => {
            const statusText = document.getElementById('quadStatusText');
            if(statusText) {
                const count = Scoring.quadgrams ? Object.keys(Scoring.quadgrams).length : 0;
                statusText.innerText = isLoaded ? `Ready (RAM: ${count})` : "Missing Data";
                statusText.className = isLoaded ? "text-green-400 font-bold text-sm" : "text-red-400 font-bold text-sm";
            }
            const uploadSec = document.getElementById('uploadSection');
            const loadedSec = document.getElementById('loadedSection');
            if(uploadSec) uploadSec.classList.toggle('hidden', isLoaded);
            if(loadedSec) loadedSec.classList.toggle('hidden', !isLoaded);
        }
    },

    setFormat: (target, fmt) => {
        App.state[target + 'Format'] = fmt;
        
        const btnText = document.getElementById(`btn${target.charAt(0).toUpperCase() + target.slice(1)}Text`);
        const btnHex = document.getElementById(`btn${target.charAt(0).toUpperCase() + target.slice(1)}Hex`);
        const btnBase64 = document.getElementById(`btn${target.charAt(0).toUpperCase() + target.slice(1)}Base64`);

        const setActive = (el, active) => {
            if(!el) return;
            el.className = active 
                ? "px-3 py-1.5 bg-blue-600 text-white font-bold transition" 
                : "px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50 transition border-l";
        };

        setActive(btnText, fmt === 'Text');
        setActive(btnHex, fmt === 'Hex');
        setActive(btnBase64, fmt === 'Base64');

        if (target === 'key' || target === 'iv') {
            document.getElementById(target + 'Input').value = '';
            App.validateUI();
        }
        
        if (target === 'input') {
            document.getElementById('inputText').value = '';
            document.getElementById('inputCounter').innerText = "0 bytes";
        }
        
        // Khi thay đổi output format, tự động convert kết quả encrypt gần nhất
        if (target === 'output' && App.state.lastEncryptResult) {
            const res = App.state.lastEncryptResult;
            if (fmt === 'Hex') {
                document.getElementById('outputText').value = Utils.b2h(res);
            } else { // Base64
                document.getElementById('outputText').value = btoa(String.fromCharCode(...res));
            }
        }
    },

    validateUI: () => {
        const algo = document.getElementById('algoSelect').value;
        const keyVal = document.getElementById('keyInput').value;
        const ivVal = document.getElementById('ivInput').value;
        const mode = document.getElementById('modeSelect').value;

        const keyLen = (App.state.keyFormat === 'Hex') ? keyVal.replace(/\s+/g, '').length / 2 : keyVal.length;
        let keyValid = false;
        if (algo === 'DES') keyValid = (keyLen === 8);
        else keyValid = [16, 24, 32].includes(keyLen); 

        const keyStatus = document.getElementById('keyStatus');
        const keyInput = document.getElementById('keyInput');
        
        if (keyVal.length === 0) {
            keyStatus.innerHTML = ''; 
            keyInput.className = "w-full p-3 border rounded-lg text-lg font-mono shadow-sm focus:ring-2 focus:ring-blue-500 outline-none";
        } else if (keyValid) {
            keyStatus.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle"></i> OK (${keyLen} bytes)</span>`;
            keyInput.className = "w-full p-3 border-2 border-green-500 rounded-lg text-lg font-mono shadow-sm bg-green-50 outline-none";
        } else {
            keyStatus.innerHTML = `<span class="text-red-500"><i class="fas fa-times-circle"></i> ${keyLen} bytes</span>`;
            keyInput.className = "w-full p-3 border-2 border-red-500 rounded-lg text-lg font-mono shadow-sm bg-red-50 outline-none";
        }

        if (mode === 'CBC') {
            const targetIV = (algo === 'DES') ? 8 : 16;
            const ivLen = (App.state.ivFormat === 'Hex') ? ivVal.replace(/\s+/g, '').length / 2 : ivVal.length;
            const ivStatus = document.getElementById('ivStatus');
            const ivInput = document.getElementById('ivInput');

            if (ivVal.length === 0) {
                ivStatus.innerHTML = `<span class="text-orange-400">Auto</span>`;
                ivInput.className = "w-full p-3 border rounded-l-lg text-lg font-mono shadow-sm focus:ring-2 focus:ring-blue-500 outline-none";
            } else if (ivLen === targetIV) {
                ivStatus.innerHTML = `<span class="text-green-600"><i class="fas fa-check"></i></span>`;
                ivInput.className = "w-full p-3 border-2 border-green-500 rounded-l-lg text-lg font-mono shadow-sm bg-green-50 outline-none";
            } else {
                ivStatus.innerHTML = `<span class="text-red-500">${ivLen}</span>`;
                ivInput.className = "w-full p-3 border-2 border-red-500 rounded-l-lg text-lg font-mono shadow-sm bg-red-50 outline-none";
            }
        }
    },
    
    utils: {
        genIV: () => {
            const algo = document.getElementById('algoSelect').value;
            const len = algo==='DES'?8:16;
            const ivBytes = Utils.rand(len);
            const ivHex = Utils.b2h(ivBytes);
            
            // Chuyển sang chế độ Hex trước
            App.setFormat('iv', 'Hex');
            // Sau đó mới set value
            document.getElementById('ivInput').value = ivHex;
            App.validateUI();
        }
    },

    io: {
        handleInputFile: (inp) => {
            if(!inp.files[0]) return;
            const r = new FileReader();
            r.onload = e => {
                document.getElementById('inputText').value = e.target.result;
                App.io.updateCounter();
            };
            r.readAsText(inp.files[0]);
        },
        updateCounter: () => {
            const val = document.getElementById('inputText').value;
            let bytes = 0;
            if(App.state.inputFormat === 'Hex') bytes = Math.ceil(val.replace(/\s/g,'').length/2);
            else if(App.state.inputFormat === 'Base64') bytes = Math.floor((val.length*3)/4);
            else bytes = new TextEncoder().encode(val).length;
            document.getElementById('inputCounter').innerText = `${bytes} bytes`;
        },
        saveOutput: async () => {
            const txt = document.getElementById('outputText').value;
            if(!txt) return alert("Không có dữ liệu để lưu!");
            
            // Use File System Access API if available
            try {
                if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: 'result.txt',
                        types: [{ description: 'Text File', accept: {'text/plain': ['.txt']} }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(txt);
                    await writable.close();
                    return; 
                }
            } catch (err) {
                if (err.name === 'AbortError') return; 
            }

            // Fallback: Download without prompt (deleting notification)
            const b = new Blob([txt],{type:'text/plain'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = "result.txt"; 
            a.click();
        }
    },

    runBreaker: async () => {
        const algo = document.getElementById('algoSelect').value;
        const txt = document.getElementById('inputText').value;
        if(!txt) return alert("Please enter ciphertext!");

        App.ui.setLoading(true, "Cryptanalyzing...");
        const out = document.getElementById('outputText');
        const stat = document.getElementById('statusBox');
        stat.classList.remove('hidden'); stat.innerHTML = '';

        await new Promise(r=>setTimeout(r,50));

        try {
            let res;
            if(algo==='CAESAR') {
                res = Classical.caesar(txt);
                out.value = `=== CAESAR RESULT ===\nKey (Shift): ${res.key}\nScore: ${res.score.toFixed(2)}\n\nPLAINTEXT:\n${res.pt}`;
            } else if(algo==='MONO') {
                res = await Classical.mono(txt, msg => {
                    // Check if algorithm is still MONO to avoid ghost updates
                    if(document.getElementById('algoSelect').value === 'MONO') {
                        stat.innerText = msg;
                    }
                });
                // Ensure final update happens only if still on MONO
                if(document.getElementById('algoSelect').value === 'MONO') {
                    stat.innerText = "Hill Climbing: Finished (2000/2000 iterations). Best key found.";
                    out.value = `=== SUBSTITUTION RESULT ===\nKey Map: ${res.key}\nScore: ${res.score.toFixed(2)}\n\nPLAINTEXT:\n${res.pt}`;
                }
            } else if(algo==='VIGENERE') {
                res = Classical.vigenere(txt);
                out.value = `=== VIGENERE RESULT ===\nKey Length: ${res.len}\nKey: ${res.key}\n\nPLAINTEXT:\n${res.pt}`;
            }
        } catch(e) {
            out.value = "Error: " + e.message;
        }
        App.ui.setLoading(false);
    },

    runModern: (isEnc) => {
        const algo = document.getElementById('algoSelect').value;
        const mode = document.getElementById('modeSelect').value;
        const kStr = document.getElementById('keyInput').value;
        const iStr = document.getElementById('ivInput').value;
        const inp = document.getElementById('inputText').value;

        console.log('DEBUG runModern:', {isEnc, algo, mode, keyLen: kStr.length, ivVal: iStr, ivLen: iStr.length, inputLen: inp.length, keyFmt: App.state.keyFormat, ivFmt: App.state.ivFormat, inFmt: App.state.inputFormat});

        try {
            const parseBytes = (str, fmt) => (fmt === 'Hex') ? Utils.h2b(str) : Utils.s2b(str);
            
            const key = parseBytes(kStr, App.state.keyFormat);
            let iv = null;
            if (mode === 'CBC') {
                const targetIV = (algo === 'DES') ? 8 : 16;
                
                if (iStr && iStr !== "Not used in ECB") {
                    // Validate IV length
                    const ivLen = (App.state.ivFormat === 'Hex') ? iStr.replace(/\s+/g, '').length / 2 : iStr.length;
                    if (ivLen !== targetIV) {
                        throw new Error(`IV must be exactly ${targetIV} bytes. Current: ${ivLen} bytes`);
                    }
                    iv = parseBytes(iStr, App.state.ivFormat);
                } else if (isEnc) {
                    // Auto-generate and display IV
                    App.utils.genIV();
                    const newIvStr = document.getElementById('ivInput').value;
                    iv = parseBytes(newIvStr, App.state.ivFormat);
                } else {
                    throw new Error("Decryption in CBC mode requires an IV.");
                }
            }
            
            let data;
            if (App.state.inputFormat === 'Hex') data = Utils.h2b(inp);
            else if (App.state.inputFormat === 'Base64') data = Uint8Array.from(atob(inp), c=>c.charCodeAt(0));
            else data = Utils.s2b(inp);

            const res = BlockCipher.run(algo, mode, data, key, iv, isEnc);
            
            if (isEnc) {
                // Lưu kết quả encrypt để convert format sau này
                App.state.lastEncryptResult = res;
                
                if (App.state.outputFormat === 'Hex') {
                    document.getElementById('outputText').value = Utils.b2h(res);
                } else {
                    document.getElementById('outputText').value = btoa(String.fromCharCode(...res));
                }
            } else {
                // Clear cache khi decrypt
                App.state.lastEncryptResult = null;
                document.getElementById('outputText').value = Utils.b2s(res);
            }

        } catch(e) {
            if (!isEnc && e.message.includes('continuation byte')) {
                 alert("Cảnh báo: Kết quả không phải văn bản. Hiển thị dạng Hex.");
            }
            alert("Error: " + e.message);
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const upscale = (id, clsRem, clsAdd) => {
        const el = document.getElementById(id);
        if(el) {
            if(typeof clsRem === 'string') el.classList.remove(clsRem); else clsRem.forEach(c => el.classList.remove(c));
            if(typeof clsAdd === 'string') el.classList.add(clsAdd); else clsAdd.forEach(c => el.classList.add(c));
        }
    };
    upscale('algoSelect', ['text-sm', 'p-2.5'], ['text-lg', 'p-3', 'font-bold']);
    upscale('inputText', 'text-sm', 'text-lg');
    upscale('outputText', 'text-sm', 'text-lg');
    
    // Setup IO Headers (Inject Buttons)
    App.ui.setupIOControls();

    // Listeners
    document.getElementById('algoSelect').addEventListener('change', App.ui.updateLayout);
    document.getElementById('btnUploadQuad').onclick = () => document.getElementById('quadFile').click();
    document.getElementById('btnClearStorage').onclick = () => { Scoring.clear(); App.ui.updateQuadStatus(false); document.getElementById('quadFile').value = ''; };
    document.getElementById('quadFile').onchange = (e) => {
        if (e.target.files[0]) {
            const r = new FileReader();
            r.onload = ev => {
                try { Scoring.processFileContent(ev.target.result); App.ui.updateQuadStatus(true); alert("Data Loaded (RAM Only)"); } catch(err) { alert(err.message); }
            };
            r.readAsText(e.target.files[0]);
        }
    };
    
    document.getElementById('inputText').addEventListener('input', App.io.updateCounter);

    // Init
    Scoring.init();
    App.ui.updateQuadStatus(false); 
    App.ui.updateLayout();
});