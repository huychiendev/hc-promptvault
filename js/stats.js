// ==================== Stats & Analytics ====================

function updateStatsBar() {
    // Already handled in app.js, but can extend here
}

function showStatsModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[200]';
    
    // Calculate stats
    const total = prompts.length;
    const fav = prompts.filter(p => p.isFavorite).length;
    const totalUsage = prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0);
    const avgUsage = total > 0 ? Math.round(totalUsage / total) : 0;
    
    // Category distribution
    const catData = {};
    prompts.forEach(p => {
        catData[p.category] = (catData[p.category] || 0) + 1;
    });
    
    const catLabels = Object.keys(catData);
    const catValues = Object.values(catData);
    
    modal.innerHTML = `
        <div class="modal bg-zinc-900 w-full max-w-4xl mx-4 rounded-3xl border border-zinc-700 p-8">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-3xl font-semibold">Thống kê PromptVault</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-4xl">×</button>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div class="bg-zinc-800 rounded-3xl p-6">
                    <div class="text-sm text-zinc-400">TỔNG PROMPT</div>
                    <div class="text-5xl font-bold mt-3">${total}</div>
                </div>
                <div class="bg-zinc-800 rounded-3xl p-6">
                    <div class="text-sm text-zinc-400">YÊU THÍCH</div>
                    <div class="text-5xl font-bold mt-3 text-amber-400">${fav}</div>
                </div>
                <div class="bg-zinc-800 rounded-3xl p-6">
                    <div class="text-sm text-zinc-400">TỔNG LƯỢT DÙNG</div>
                    <div class="text-5xl font-bold mt-3 text-emerald-400">${totalUsage}</div>
                </div>
                <div class="bg-zinc-800 rounded-3xl p-6">
                    <div class="text-sm text-zinc-400">TRUNG BÌNH / PROMPT</div>
                    <div class="text-5xl font-bold mt-3">${avgUsage}</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div class="text-sm font-bold text-zinc-400 mb-4">PHÂN BỐ THEO DANH MỤC</div>
                    <div class="bg-zinc-800 rounded-3xl p-6 h-[320px]">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
                
                <div>
                    <div class="text-sm font-bold text-zinc-400 mb-4">TOP 5 PROMPT DÙNG NHIỀU NHẤT</div>
                    <div class="bg-zinc-800 rounded-3xl p-6 space-y-4 max-h-[320px] overflow-auto">
                        ${[...prompts].sort((a,b) => (b.usageCount||0) - (a.usageCount||0)).slice(0,5).map((p,i) => `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-x-3">
                                    <span class="text-xs w-5 text-center">${i+1}</span>
                                    <span class="font-medium line-clamp-1">${p.title}</span>
                                </div>
                                <span class="text-emerald-400 font-mono">${p.usageCount || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="mt-8 text-center">
                <button onclick="this.closest('.fixed').remove()" class="px-10 py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl">Đóng</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Render Chart
    setTimeout(() => {
        const ctx = document.getElementById('categoryChart');
        if (ctx && catLabels.length > 0) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: catLabels,
                    datasets: [{
                        data: catValues,
                        backgroundColor: ['#06b6d4', '#8b5cf6', '#f43f5e', '#eab308', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#a1a1aa', padding: 20 } }
                    }
                }
            });
        }
    }, 300);
}