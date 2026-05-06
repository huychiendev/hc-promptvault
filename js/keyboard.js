// ==================== Keyboard Shortcuts ====================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K → Focus search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const search = document.getElementById('searchInput');
            search.focus();
            search.select();
        }
        
        // Ctrl/Cmd + N → New prompt
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            openCreateModal();
        }
        
        // Ctrl/Cmd + D → Duplicate selected (if one selected)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            if (selectedPrompts.size === 1) {
                const id = Array.from(selectedPrompts)[0];
                duplicatePrompt(id);
                filterPrompts();
                showToast('Đã nhân bản prompt');
            }
        }
        
        // Delete key → Delete selected
        if (e.key === 'Delete' && selectedPrompts.size > 0) {
            if (confirm(`Xóa ${selectedPrompts.size} prompt đã chọn?`)) {
                Array.from(selectedPrompts).forEach(id => deletePrompt(id));
                selectedPrompts.clear();
                filterPrompts();
                updateBulkToolbar();
            }
        }
        
        // Escape → Close modals or clear selection
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.fixed.inset-0');
            if (modals.length > 0) {
                modals[modals.length - 1].remove();
            } else if (selectedPrompts.size > 0) {
                clearBulkSelection();
            }
        }
        
        // Ctrl/Cmd + Z → Undo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (typeof undo === 'function') undo();
        }
        
        // Ctrl/Cmd + Shift + Z → Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) {
            e.preventDefault();
            if (typeof redo === 'function') redo();
        }
        
        // Ctrl/Cmd + / → Show shortcuts help
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showShortcutsHelp();
        }
    });
    
    // Show hint on first use
    if (!localStorage.getItem('shortcutsHintShown')) {
        setTimeout(() => {
            console.log('%c[PromptVault] Nhấn Ctrl+/ để xem danh sách phím tắt', 'color:#64748b');
        }, 5000);
    }
}

function showShortcutsHelp() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[200]';
    modal.innerHTML = `
        <div class="bg-zinc-900 rounded-3xl w-full max-w-lg p-8 border border-zinc-700">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-semibold">Phím tắt</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl">×</button>
            </div>
            
            <div class="space-y-4 text-sm">
                <div class="flex justify-between"><span class="text-zinc-400">Tạo prompt mới</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Ctrl + N</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Tìm kiếm nhanh</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Ctrl + K</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Nhân bản prompt</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Ctrl + D</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Hoàn tác</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Ctrl + Z</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Làm lại</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Ctrl + Shift + Z</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Xóa đã chọn</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Delete</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Đóng modal / Bỏ chọn</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Esc</span></div>
                <div class="flex justify-between"><span class="text-zinc-400">Xem danh sách phím tắt</span> <span class="font-mono bg-zinc-800 px-3 py-1 rounded">Ctrl + /</span></div>
            </div>
            
            <div class="mt-8 text-center text-xs text-zinc-500">Mẹo: Kết hợp với drag & drop để sắp xếp cực nhanh</div>
        </div>
    `;
    document.body.appendChild(modal);
}