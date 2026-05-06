// ==================== Variables & Quick Test ====================

function extractVariables(content) {
    const regex = /\{\{([^}]+)\}\}/g;
    const vars = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        const raw = match[1].trim();
        const parts = raw.split(':');
        const name = parts[0].trim();
        const hint = parts.length > 1 ? parts.slice(1).join(':').trim() : `Giá trị cho ${name}`;
        vars.push({ name, hint });
    }
    return vars;
}

function quickTest(id) {
    const p = prompts.find(x => x.id === id);
    if (!p) return;
    
    const vars = extractVariables(p.content);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[150]';
    
    let formHTML = '';
    if (vars.length > 0) {
        formHTML = vars.map(v => `
            <div class="mb-4">
                <label class="text-xs text-zinc-400 font-medium">${v.name}</label>
                <input id="var_${v.name}" class="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 outline-none focus:border-cyan-400" placeholder="${v.hint}">
            </div>
        `).join('');
    } else {
        formHTML = `<p class="text-zinc-400">Prompt này không có biến {{ }} nào.</p>`;
    }
    
    modal.innerHTML = `
        <div class="modal bg-zinc-900 w-full max-w-2xl mx-4 rounded-3xl border border-zinc-700">
            <div class="px-8 pt-6 pb-4 border-b flex justify-between">
                <div>
                    <h3 class="text-xl font-semibold">Test Prompt</h3>
                    <p class="text-sm text-zinc-400">${p.title}</p>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl">×</button>
            </div>
            
            <div class="p-8">
                ${formHTML}
                
                <div class="mt-6">
                    <label class="text-xs text-zinc-400">KẾT QUẢ SAU KHI THAY THẾ</label>
                    <div id="previewResult" class="mt-2 bg-zinc-950 border border-zinc-700 rounded-3xl p-5 font-mono text-sm whitespace-pre-wrap max-h-80 overflow-auto"></div>
                </div>
            </div>
            
            <div class="px-8 py-6 border-t flex justify-end gap-x-3">
                <button onclick="this.closest('.fixed').remove()" class="px-8 py-3 rounded-2xl hover:bg-zinc-800">Đóng</button>
                <button onclick="copyTestedPrompt(${id}, this)" class="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-2xl font-semibold flex items-center gap-x-2">
                    <i class="fa-solid fa-copy"></i> Sao chép kết quả
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Live preview
    if (vars.length > 0) {
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.oninput = () => updatePreview(modal, p.content, vars);
        });
    } else {
        document.getElementById('previewResult').textContent = p.content;
    }
}

function updatePreview(modal, originalContent, vars) {
    let result = originalContent;
    vars.forEach(v => {
        const val = document.getElementById(`var_${v.name}`).value || `{{${v.name}}}`;
        result = result.replace(new RegExp(`\\{\\{${v.name}(?::[^}]+)?\\}\\}`, 'g'), val);
    });
    document.getElementById('previewResult').textContent = result;
}

function copyTestedPrompt(id, btn) {
    const modal = btn.closest('.fixed');
    const resultEl = document.getElementById('previewResult');
    const text = resultEl.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Đã sao chép!`;
        incrementUsage(id);
        filterPrompts();
        updateStatsBar();
        setTimeout(() => modal.remove(), 800);
    });
}