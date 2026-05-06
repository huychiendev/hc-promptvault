// ==================== Prompt Manager ====================

function createPrompt(data) {
    const newPrompt = {
        id: Date.now(),
        title: data.title,
        content: data.content,
        description: data.description || '',
        category: data.category,
        tags: data.tags || [],
        isFavorite: false,
        usageCount: 0,
        lastUsed: null,
        versions: [],
        updatedAt: new Date().toISOString()
    };
    
    prompts.unshift(newPrompt);
    saveToLocalStorage();
    return newPrompt;
}

function updatePrompt(id, data) {
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const oldPrompt = JSON.parse(JSON.stringify(prompts[index]));
    
    // Save version before update
    if (!prompts[index].versions) prompts[index].versions = [];
    prompts[index].versions.unshift({
        timestamp: new Date().toISOString(),
        title: oldPrompt.title,
        content: oldPrompt.content,
        description: oldPrompt.description
    });
    
    // Keep only last 5 versions
    if (prompts[index].versions.length > 5) prompts[index].versions.length = 5;
    
    // Update
    prompts[index].title = data.title;
    prompts[index].content = data.content;
    prompts[index].description = data.description || '';
    prompts[index].category = data.category;
    prompts[index].tags = data.tags || [];
    prompts[index].updatedAt = new Date().toISOString();
    
    saveToLocalStorage();
}

function deletePrompt(id) {
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const deleted = prompts.splice(index, 1)[0];
    pushUndo('delete', prompts);
    saveToLocalStorage();
    return deleted;
}

function toggleFavorite(id) {
    const p = prompts.find(x => x.id === id);
    if (!p) return;
    p.isFavorite = !p.isFavorite;
    saveToLocalStorage();
}

function incrementUsage(id) {
    const p = prompts.find(x => x.id === id);
    if (!p) return;
    p.usageCount = (p.usageCount || 0) + 1;
    p.lastUsed = new Date().toISOString();
    saveToLocalStorage();
}

function reorderPrompts(draggedId, targetId) {
    const draggedIndex = prompts.findIndex(p => p.id === draggedId);
    const targetIndex = prompts.findIndex(p => p.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;
    
    const [moved] = prompts.splice(draggedIndex, 1);
    prompts.splice(targetIndex, 0, moved);
    
    pushUndo('reorder', prompts);
    saveToLocalStorage();
}

function getPromptById(id) {
    return prompts.find(p => p.id === id);
}

function duplicatePrompt(id) {
    const original = prompts.find(p => p.id === id);
    if (!original) return;
    
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = Date.now();
    copy.title = original.title + ' (Copy)';
    copy.usageCount = 0;
    copy.lastUsed = null;
    copy.versions = [];
    copy.updatedAt = new Date().toISOString();
    
    prompts.unshift(copy);
    saveToLocalStorage();
    return copy;
}

function exportSinglePrompt(id, format = 'md') {
    const p = prompts.find(x => x.id === id);
    if (!p) return;
    
    let content = '';
    if (format === 'md') {
        content = `# ${p.title}\n\n**Danh mục:** ${p.category}\n\n**Mô tả:** ${p.description || 'Không có'}\n\n**Tags:** ${p.tags.join(', ')}\n\n\`\`\`\n${p.content}\n\`\`\`\n`;
    } else {
        content = p.content;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
}