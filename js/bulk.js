// ==================== Bulk Actions ====================

function bulkFavorite() {
    if (selectedPrompts.size === 0) return;
    
    let count = 0;
    selectedPrompts.forEach(id => {
        const p = prompts.find(x => x.id === id);
        if (p && !p.isFavorite) {
            p.isFavorite = true;
            count++;
        }
    });
    
    saveToLocalStorage();
    filterPrompts();
    updateBulkToolbar();
    showToast(`Đã thêm ${count} prompt vào yêu thích`);
}

function bulkDelete() {
    if (selectedPrompts.size === 0) return;
    
    if (!confirm(`Xóa ${selectedPrompts.size} prompt đã chọn?`)) return;
    
    const idsToDelete = Array.from(selectedPrompts);
    idsToDelete.forEach(id => deletePrompt(id));
    
    selectedPrompts.clear();
    filterPrompts();
    updateBulkToolbar();
    renderSidebar();
    updateStatsBar();
    showToast(`Đã xóa ${idsToDelete.length} prompt`);
}