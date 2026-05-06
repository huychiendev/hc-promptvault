// ==================== Drag & Drop ====================

function attachDragListeners() {
    const cards = document.querySelectorAll('#gridView .prompt-card, #listView .prompt-card');
    
    cards.forEach(card => {
        const id = parseInt(card.dataset.id);
        
        card.draggable = true;
        
        card.ondragstart = (e) => {
            draggedId = id;
            card.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        };
        
        card.ondragend = () => {
            card.style.opacity = '1';
        };
        
        card.ondragover = (e) => {
            e.preventDefault();
            card.classList.add('drag-over');
        };
        
        card.ondragleave = () => {
            card.classList.remove('drag-over');
        };
        
        card.ondrop = (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            const targetId = parseInt(card.dataset.id);
            if (draggedId && draggedId !== targetId) {
                reorderPrompts(draggedId, targetId);
                filterPrompts();
            }
            draggedId = null;
        };
    });
}