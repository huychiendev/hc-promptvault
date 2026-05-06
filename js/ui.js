// ==================== UI Rendering ====================

function renderSidebar() {
    const container = document.getElementById('sidebar-menu');
    let html = `
        <div onclick="setView('all')" class="flex items-center gap-x-3 px-4 py-3 rounded-2xl hover:bg-zinc-800 mx-2 cursor-pointer ${currentView === 'all' && !selectedCategory ? 'bg-zinc-800' : ''}">
            <i class="fa-solid fa-home w-5"></i>
            <span>Tất cả Prompt</span>
            <span class="ml-auto text-xs bg-zinc-700 px-2.5 py-0.5 rounded-full">${prompts.length}</span>
        </div>
        <div onclick="setView('favorites')" class="flex items-center gap-x-3 px-4 py-3 rounded-2xl hover:bg-zinc-800 mx-2 cursor-pointer ${currentView === 'favorites' ? 'bg-zinc-800' : ''}">
            <i class="fa-solid fa-star w-5 text-amber-400"></i>
            <span>Yêu thích</span>
            <span class="ml-auto text-xs bg-amber-500 text-white px-2.5 py-0.5 rounded-full">${prompts.filter(p => p.isFavorite).length}</span>
        </div>
        
        <div class="px-4 mt-6 mb-2 text-xs font-bold text-zinc-400 tracking-widest">DANH MỤC</div>
    `;
    
    categories.forEach(cat => {
        const count = prompts.filter(p => p.category === cat).length;
        const isActive = selectedCategory === cat;
        const isDefault = ["Skill AI", "Tạo ảnh", "Tạo video", "Dev", "Khác"].includes(cat);
        
        html += `
            <div onclick="filterByCategory('${cat}')" class="group flex items-center gap-x-3 px-4 py-3 rounded-2xl hover:bg-zinc-800 mx-2 cursor-pointer ${isActive ? 'bg-zinc-800 text-cyan-400' : ''}">
                <i class="fa-solid fa-folder w-5"></i>
                <span class="flex-1">${cat}</span>
                <span class="text-xs bg-zinc-700 px-2 py-0.5 rounded-full">${count}</span>
                ${!isDefault ? `
                    <span onclick="event.stopImmediatePropagation(); deleteCategory('${cat}')" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 ml-1">
                        <i class="fa-solid fa-times text-xs"></i>
                    </span>
                ` : ''}
            </div>
        `;
    });
    
    html += `
        <div onclick="showAddCategoryModal()" class="mx-2 mt-3 flex items-center justify-center gap-x-2 text-sm py-2.5 border border-dashed border-zinc-700 rounded-2xl cursor-pointer hover:border-cyan-400 text-cyan-400">
            <i class="fa-solid fa-plus"></i>
            <span>Thêm danh mục</span>
        </div>
    `;
    
    container.innerHTML = html;
    if (typeof updateStatsBar === 'function') updateStatsBar();
}

function filterPrompts() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    sortMode = document.getElementById('sortSelect').value;
    
    let filtered = [...prompts];
    
    // Apply view filter
    if (currentView === 'favorites') filtered = filtered.filter(p => p.isFavorite);
    if (selectedCategory) filtered = filtered.filter(p => p.category === selectedCategory);
    
    // Search
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchQuery) ||
            p.content.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery) ||
            p.tags.some(t => t.toLowerCase().includes(searchQuery))
        );
    }
    
    // Sort
    if (sortMode === 'usage') {
        filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (sortMode === 'recent') {
        filtered.sort((a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0));
    } else if (sortMode === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    
    renderPrompts(filtered);
    if (typeof updateStatsBar === 'function') updateStatsBar();
}

function renderPrompts(filtered) {
    const grid = document.getElementById('gridView');
    const list = document.getElementById('listView');
    const empty = document.getElementById('emptyState');
    
    grid.innerHTML = '';
    list.innerHTML = '';
    
    if (filtered.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    
    // Grid View
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = `prompt-card bg-zinc-900 border border-zinc-800 rounded-3xl p-6 cursor-pointer ${selectedPrompts.has(p.id) ? 'ring-2 ring-cyan-400' : ''}`;
        card.dataset.id = p.id;
        
        const date = new Date(p.updatedAt).toLocaleDateString('vi-VN');
        const usage = p.usageCount || 0;
        
        card.innerHTML = `
            <div class="grip-handle"><i class="fa-solid fa-grip-lines text-lg"></i></div>
            
            <div class="flex justify-between items-start pr-8">
                <div class="flex items-center gap-x-2">
                    <span class="text-xs font-semibold px-3.5 py-1 bg-zinc-800 text-cyan-400 rounded-2xl">${p.category}</span>
                    ${p.lastUsed ? `<span class="text-[10px] text-emerald-400">• ${usage} lượt</span>` : ''}
                </div>
                <div class="flex items-center gap-x-1">
                    <input type="checkbox" class="bulk-checkbox w-4 h-4 accent-cyan-400" ${selectedPrompts.has(p.id) ? 'checked' : ''} onchange="toggleBulkSelect(${p.id}, this.checked)">
                    <div onclick="event.stopImmediatePropagation(); toggleFavorite(${p.id}); filterPrompts()" class="text-xl cursor-pointer ${p.isFavorite ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}">
                        <i class="fa-solid fa-star"></i>
                    </div>
                </div>
            </div>
            
            <h3 class="font-semibold text-[17px] mt-4 pr-6 line-clamp-2">${p.title}</h3>
            <p class="text-sm text-zinc-400 mt-3 line-clamp-3 pr-4">${p.content.substring(0, 140)}...</p>
            
            <div class="flex flex-wrap gap-2 mt-6">
                ${p.tags.map(tag => `<span class="text-[10px] bg-zinc-800 px-3 py-px rounded-2xl">${tag}</span>`).join('')}
            </div>
            
            <div class="flex items-center justify-between mt-8 text-sm">
                <div class="flex items-center gap-x-2">
                    <button onclick="event.stopImmediatePropagation(); copyPrompt(${p.id})" class="flex items-center gap-x-2 text-cyan-400 hover:text-cyan-300">
                        <i class="fa-solid fa-copy"></i>
                        <span>Sao chép</span>
                    </button>
                    <button onclick="event.stopImmediatePropagation(); quickTest(${p.id})" class="flex items-center gap-x-1.5 text-emerald-400 hover:text-emerald-300">
                        <i class="fa-solid fa-play"></i>
                        <span>Test</span>
                    </button>
                </div>
                
                <div class="flex items-center gap-x-3 text-zinc-400">
                    <button onclick="event.stopImmediatePropagation(); editPrompt(${p.id})"><i class="fa-solid fa-edit"></i></button>
                    <button onclick="event.stopImmediatePropagation(); deletePrompt(${p.id}); filterPrompts()"><i class="fa-solid fa-trash"></i></button>
                    <button onclick="event.stopImmediatePropagation(); exportSinglePrompt(${p.id})"><i class="fa-solid fa-download"></i></button>
                </div>
            </div>
        `;
        
        card.onclick = (e) => {
            if (!e.target.closest('button, input, .grip-handle')) {
                editPrompt(p.id);
            }
        };
        
        grid.appendChild(card);
    });
    
    // List View
    filtered.forEach(p => {
        const row = document.createElement('div');
        row.className = `prompt-card bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-5 flex items-center gap-x-6 cursor-pointer ${selectedPrompts.has(p.id) ? 'ring-2 ring-cyan-400' : ''}`;
        row.dataset.id = p.id;
        
        row.innerHTML = `
            <div class="grip-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-x-3">
                    <span class="text-xs px-4 py-1 bg-zinc-800 text-cyan-400 rounded-3xl">${p.category}</span>
                    <h3 class="font-semibold text-lg truncate">${p.title}</h3>
                </div>
            </div>
            
            <div class="flex items-center gap-x-5 text-sm">
                <button onclick="event.stopImmediatePropagation(); copyPrompt(${p.id})" class="flex items-center gap-x-2 text-cyan-400 hover:text-cyan-300">
                    <i class="fa-solid fa-copy"></i> Sao chép
                </button>
                <button onclick="event.stopImmediatePropagation(); quickTest(${p.id})" class="flex items-center gap-x-1.5 text-emerald-400 hover:text-emerald-300">
                    <i class="fa-solid fa-play"></i> Test
                </button>
                
                <div onclick="event.stopImmediatePropagation(); toggleFavorite(${p.id}); filterPrompts()" class="cursor-pointer text-xl ${p.isFavorite ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}">
                    <i class="fa-solid fa-star"></i>
                </div>
                
                <button onclick="event.stopImmediatePropagation(); editPrompt(${p.id})" class="text-zinc-400 hover:text-white"><i class="fa-solid fa-edit"></i></button>
                <button onclick="event.stopImmediatePropagation(); deletePrompt(${p.id}); filterPrompts()" class="text-zinc-400 hover:text-red-400"><i class="fa-solid fa-trash"></i></button>
                <button onclick="event.stopImmediatePropagation(); exportSinglePrompt(${p.id})" class="text-zinc-400 hover:text-white"><i class="fa-solid fa-download"></i></button>
            </div>
        `;
        
        row.onclick = (e) => {
            if (!e.target.closest('button, .grip-handle')) editPrompt(p.id);
        };
        
        list.appendChild(row);
    });
    
    // Attach drag drop
    if (typeof attachDragListeners === 'function') attachDragListeners();
    
    // Attach bulk checkboxes
    attachBulkListeners();
}

function attachBulkListeners() {
    // Already handled inline in render
}

function toggleBulkSelect(id, checked) {
    if (checked) {
        selectedPrompts.add(id);
    } else {
        selectedPrompts.delete(id);
    }
    updateBulkToolbar();
}

function updateBulkToolbar() {
    const toolbar = document.getElementById('bulkToolbar');
    const countEl = document.getElementById('selectedCount');
    
    if (selectedPrompts.size > 0) {
        toolbar.style.display = 'flex';
        countEl.textContent = `${selectedPrompts.size} đã chọn`;
    } else {
        toolbar.style.display = 'none';
    }
}

function clearBulkSelection() {
    selectedPrompts.clear();
    updateBulkToolbar();
    filterPrompts();
}

function setView(view) {
    currentView = view;
    selectedCategory = null;
    renderSidebar();
    filterPrompts();
}

function filterByCategory(cat) {
    currentView = 'all';
    selectedCategory = cat;
    renderSidebar();
    filterPrompts();
}

function setViewMode(mode) {
    viewMode = mode;
    const gridBtn = document.getElementById('gridBtn');
    const listBtn = document.getElementById('listBtn');
    
    if (mode === 'grid') {
        gridBtn.classList.add('bg-white', 'text-zinc-900', 'shadow');
        listBtn.classList.remove('bg-white', 'text-zinc-900', 'shadow');
        document.getElementById('gridView').classList.remove('hidden');
        document.getElementById('listView').classList.add('hidden');
    } else {
        listBtn.classList.add('bg-white', 'text-zinc-900', 'shadow');
        gridBtn.classList.remove('bg-white', 'text-zinc-900', 'shadow');
        document.getElementById('gridView').classList.add('hidden');
        document.getElementById('listView').classList.remove('hidden');
    }
}

function openCreateModal() {
    editingId = null;
    const modal = createModal('Tạo Prompt Mới');
    document.body.appendChild(modal);
}

function editPrompt(id) {
    editingId = id;
    const p = prompts.find(x => x.id === id);
    const modal = createModal('Chỉnh sửa Prompt', p);
    document.body.appendChild(modal);
}

function createModal(title, promptData = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100]';
    
    const isEdit = !!promptData;
    const p = promptData || {};
    
    modal.innerHTML = `
        <div class="modal bg-zinc-900 w-full max-w-3xl mx-4 rounded-3xl border border-zinc-700" onclick="event.stopImmediatePropagation()">
            <div class="px-8 pt-6 pb-4 border-b border-zinc-700 flex justify-between items-center">
                <h3 class="text-2xl font-semibold">${title}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-4xl text-zinc-400 hover:text-white">×</button>
            </div>
            
            <div class="p-8 space-y-6">
                <div>
                    <label class="text-xs font-bold text-zinc-400 tracking-widest">TIÊU ĐỀ</label>
                    <input id="modalTitle" value="${p.title || ''}" class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg outline-none focus:border-cyan-400">
                </div>
                
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="text-xs font-bold text-zinc-400 tracking-widest">DANH MỤC</label>
                        <select id="modalCategory" class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 outline-none">
                            ${categories.map(c => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-zinc-400 tracking-widest">TAGS (phân cách dấu phẩy)</label>
                        <input id="modalTags" value="${(p.tags || []).join(', ')}" class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 outline-none">
                    </div>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-zinc-400 tracking-widest">NỘI DUNG PROMPT</label>
                    <textarea id="modalContent" rows="10" class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-3xl px-5 py-5 font-mono text-sm outline-none focus:border-cyan-400">${p.content || ''}</textarea>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-zinc-400 tracking-widest">MÔ TẢ (tiếng Việt)</label>
                    <textarea id="modalDesc" rows="3" class="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-3xl px-5 py-5">${p.description || ''}</textarea>
                </div>
            </div>
            
            <div class="px-8 py-6 border-t border-zinc-700 flex justify-end gap-x-3">
                <button onclick="this.closest('.fixed').remove()" class="px-8 py-3.5 rounded-2xl hover:bg-zinc-800">Hủy</button>
                <button onclick="savePromptFromModal(this)" class="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-2xl font-semibold flex items-center gap-x-2">
                    <i class="fa-solid fa-save"></i>
                    <span>${isEdit ? 'Cập nhật' : 'Tạo mới'}</span>
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

function savePromptFromModal(btn) {
    const modal = btn.closest('.fixed');
    const title = document.getElementById('modalTitle').value.trim();
    const content = document.getElementById('modalContent').value.trim();
    const category = document.getElementById('modalCategory').value;
    const tags = document.getElementById('modalTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const description = document.getElementById('modalDesc').value.trim();
    
    if (!title || !content) {
        alert('Tiêu đề và nội dung không được để trống!');
        return;
    }
    
    if (editingId) {
        updatePrompt(editingId, { title, content, category, tags, description });
    } else {
        createPrompt({ title, content, category, tags, description });
    }
    
    modal.remove();
    filterPrompts();
    renderSidebar();
    updateStatsBar();
    showToast(editingId ? 'Đã cập nhật prompt' : 'Đã tạo prompt mới');
}

function showAddCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[200]';
    modal.innerHTML = `
        <div class="modal bg-zinc-900 w-full max-w-md mx-4 rounded-3xl border border-zinc-700 p-8">
            <h3 class="text-2xl font-semibold mb-6">Thêm danh mục mới</h3>
            
            <input id="newCategoryName" type="text" placeholder="Tên danh mục (ví dụ: Marketing)" 
                   class="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400">
            
            <div class="flex gap-x-3 mt-8">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 py-3.5 rounded-2xl hover:bg-zinc-800">Hủy</button>
                <button onclick="confirmAddCategory(this)" class="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-2xl font-semibold">Thêm</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('newCategoryName').focus(), 100);
}

function confirmAddCategory(btn) {
    const input = document.getElementById('newCategoryName');
    const name = input.value.trim();
    
    if (!name) {
        alert('Vui lòng nhập tên danh mục');
        return;
    }
    if (categories.includes(name)) {
        alert('Danh mục đã tồn tại');
        return;
    }
    
    categories.push(name);
    btn.closest('.fixed').remove();
    renderSidebar();
    showToast('Đã thêm danh mục mới');
}

function deleteCategory(cat) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[200]';
    modal.innerHTML = `
        <div class="modal bg-zinc-900 w-full max-w-md mx-4 rounded-3xl border border-zinc-700 p-8">
            <h3 class="text-xl font-semibold mb-4">Xóa danh mục</h3>
            <p class="text-zinc-300">Bạn có chắc muốn xóa danh mục <strong>"${cat}"</strong> không?</p>
            <p class="text-sm text-zinc-400 mt-2">Tất cả prompt trong danh mục này sẽ chuyển sang "Khác".</p>
            
            <div class="flex gap-x-3 mt-8">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 py-3.5 rounded-2xl hover:bg-zinc-800">Hủy</button>
                <button onclick="confirmDeleteCategory('${cat}', this)" class="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold">Xóa danh mục</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmDeleteCategory(cat, btn) {
    prompts.forEach(p => {
        if (p.category === cat) p.category = 'Khác';
    });
    
    categories = categories.filter(c => c !== cat);
    if (selectedCategory === cat) selectedCategory = null;
    
    btn.closest('.fixed').remove();
    saveToLocalStorage();
    renderSidebar();
    filterPrompts();
    updateStatsBar();
    showToast('Đã xóa danh mục');
}