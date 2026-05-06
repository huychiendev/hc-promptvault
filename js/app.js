// ==================== PROMPTVault - Core App ====================
let prompts = [];
let categories = ["Skill AI", "Tạo ảnh", "Tạo video", "Dev", "Khác"];
let currentView = 'all';
let selectedCategory = null;
let searchQuery = '';
let viewMode = 'grid';
let sortMode = 'updated';
let editingId = null;
let draggedId = null;
let selectedPrompts = new Set();
let undoStack = [];
let redoStack = [];

// Global state for current filter
let currentFilter = { type: 'all' };

async function initApp() {
    await loadData();
    // Các hàm render đã được gọi trong loadData nếu fetch API thành công,
    // hoặc loadInitialSamples/LocalStorage.
    // Tuy nhiên gọi lại ở đây để chắc chắn:
    renderSidebar();
    filterPrompts();
    initKeyboardShortcuts();
    updateStatsBar();
    
    // Set default view
    document.getElementById('gridBtn').classList.add('bg-white', 'text-zinc-900', 'shadow');
    
    // Welcome toast
    if (!localStorage.getItem('promptVaultV2Welcome')) {
        setTimeout(() => {
            showToast('Chào mừng đến với PromptVault v2! Kéo thả để sắp xếp, dùng Ctrl+K để tìm kiếm nhanh.');
            localStorage.setItem('promptVaultV2Welcome', 'true');
        }, 2200);
    }
    
    // Auto-save every 30 seconds
    setInterval(() => {
        if (prompts.length > 0) saveToLocalStorage();
    }, 30000);
}

async function loadData() {
    try {
        const res = await fetch('/api/prompts');
        if (res.ok) {
            prompts = await res.json();
            if (prompts.length === 0) {
                loadInitialSamples();
            } else {
                renderSidebar();
                filterPrompts();
                updateStatsBar();
            }
            return;
        }
    } catch (e) {
        console.warn('API không khả dụng, dùng LocalStorage:', e);
    }

    // Fallback LocalStorage
    const saved = localStorage.getItem('promptVaultDataV2');
    if (saved) {
        prompts = JSON.parse(saved);
    } else {
        loadInitialSamples();
    }
}

function loadInitialSamples() {
    prompts = [
        {
            id: 1,
            title: "Military Style - Trực tiếp ngắn gọn",
            category: "Skill AI",
            content: "Military style. Direct. No preamble. No filler. Facts only.\nFormat: [problem] → [cause] → [fix].\nCode unchanged. Technical terms intact.",
            description: "Phong cách quân đội: ngắn gọn, trực tiếp, tiết kiệm 65-75% token",
            tags: ["military", "tiết kiệm token", "dev"],
            isFavorite: true,
            usageCount: 47,
            lastUsed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            versions: [],
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            title: "Feynman - Giải thích như dạy trẻ 12 tuổi",
            category: "Skill AI",
            content: "Use the Feynman technique. Explain to a curious 12-year-old with no CS background.\nNo jargon without immediate plain-English definition.",
            description: "Giải thích đơn giản, xây dựng trực giác trước khi đi sâu",
            tags: ["feynman", "học", "giải thích"],
            isFavorite: false,
            usageCount: 32,
            lastUsed: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            versions: [],
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
        }
    ];
    saveToLocalStorage();
    renderSidebar();
    filterPrompts();
    updateStatsBar();
}

async function saveToLocalStorage() {
    // 1. Lưu LocalStorage trước cho nhanh
    localStorage.setItem('promptVaultDataV2', JSON.stringify(prompts));
    
    // 2. Sync ngầm lên DB
    try {
        await fetch('/api/prompts/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompts)
        });
    } catch (e) {
        console.warn('Lỗi sync DB:', e);
    }
}

function updateStatsBar() {
    const total = prompts.length;
    const fav = prompts.filter(p => p.isFavorite).length;
    const usage = prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0);
    
    document.getElementById('totalPrompts').textContent = total;
    document.getElementById('totalFavorites').textContent = fav;
    document.getElementById('totalUsage').textContent = usage;
    
    // Show stats bar if has data
    document.getElementById('statsBar').classList.toggle('hidden', total === 0);
}

function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = `fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-x-3 z-[99999] toast`;
    
    let icon = 'fa-check-circle text-emerald-400';
    if (type === 'error') icon = 'fa-exclamation-circle text-red-400';
    if (type === 'info') icon = 'fa-info-circle text-blue-400';
    
    toastContainer.innerHTML = `
        <i class="fa-solid ${icon} text-xl"></i>
        <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
        toastContainer.style.transition = 'all 0.3s';
        toastContainer.style.opacity = '0';
        toastContainer.style.transform = 'translateY(20px)';
        setTimeout(() => toastContainer.remove(), 300);
    }, 2600);
}

function pushUndo(action, data) {
    undoStack.push({ action, data: JSON.parse(JSON.stringify(data)) });
    if (undoStack.length > 20) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    
    const last = undoStack.pop();
    redoStack.push(last);
    
    // Simple restore logic
    if (last.action === 'delete') {
        prompts = last.data;
    } else if (last.action === 'reorder') {
        prompts = last.data;
    }
    
    saveToLocalStorage();
    filterPrompts();
    renderSidebar();
    updateStatsBar();
    showToast('Đã hoàn tác');
}

function redo() {
    if (redoStack.length === 0) return;
    const next = redoStack.pop();
    undoStack.push(next);
    
    if (next.action === 'delete') {
        prompts = next.data;
    } else if (next.action === 'reorder') {
        prompts = next.data;
    }
    
    saveToLocalStorage();
    filterPrompts();
    renderSidebar();
    updateStatsBar();
}

window.onload = initApp;

function importFromClipboard() {
    navigator.clipboard.readText().then(text => {
        try {
            const imported = JSON.parse(text);
            if (Array.isArray(imported)) {
                prompts = [...imported, ...prompts];
                saveToLocalStorage();
                filterPrompts();
                renderSidebar();
                updateStatsBar();
                showToast(`Đã nhập ${imported.length} prompt từ clipboard`);
            } else {
                showToast('Dữ liệu clipboard không phải mảng JSON hợp lệ', 'error');
            }
        } catch (e) {
            showToast('Không thể đọc JSON từ clipboard', 'error');
        }
    }).catch(() => {
        const text = prompt('Dán JSON vào đây:');
        if (text) {
            try {
                const imported = JSON.parse(text);
                if (Array.isArray(imported)) {
                    prompts = [...imported, ...prompts];
                    saveToLocalStorage();
                    filterPrompts();
                    renderSidebar();
                    updateStatsBar();
                    showToast(`Đã nhập ${imported.length} prompt`);
                }
            } catch (e) {
                showToast('JSON không hợp lệ', 'error');
            }
        }
    });
}