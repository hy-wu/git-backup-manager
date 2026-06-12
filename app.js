// DOM Elements
const btnSyncActive = document.getElementById('btn-sync-active');
const btnSettings = document.getElementById('btn-settings');
const menuTriggerSettings = document.getElementById('menu-trigger-settings');
const settingsModal = document.getElementById('settings-modal');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const settingsForm = document.getElementById('settings-form');
const inputBackupDest = document.getElementById('input-backup-dest');
const btnBrowseDest = document.getElementById('btn-browse-dest');
const monitoredFoldersList = document.getElementById('monitored-folders-list');
const inputNewFolder = document.getElementById('input-new-folder');
const btnBrowseFolder = document.getElementById('btn-browse-folder');
const btnAddFolder = document.getElementById('btn-add-folder');
const repoList = document.getElementById('repo-list');
const repoSearch = document.getElementById('repo-search');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Stats Elements
const statTotalRepos = document.getElementById('stat-total-repos');
const statGitRepos = document.getElementById('stat-git-repos');
const statDirtyRepos = document.getElementById('stat-dirty-repos');
const statBackupDestName = document.getElementById('stat-backup-dest-name');

// Column Filter Elements
const filterName = document.getElementById('filter-name');
const filterPath = document.getElementById('filter-path');
const filterIsGit = document.getElementById('filter-is-git');
const filterFileCount = document.getElementById('filter-file-count');
const filterHasChanges = document.getElementById('filter-has-changes');
const filterLastSyncStatus = document.getElementById('filter-last-sync-status');
const btnClearFilters = document.getElementById('btn-clear-filters');

// State
let localConfig = { backup_dest: '', monitored_folders: [] };
let activeRepos = [];
let currentSortCol = null;
let currentSortOrder = null; // 'asc', 'desc', or null

// Toast Notification Helper
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast-win98 window active';
    const toastTitle = document.getElementById('toast-title');
    if (toastTitle) {
        toastTitle.textContent = type === 'error' ? '错误' : '系统提示';
    }
    setTimeout(() => {
        toast.className = 'toast-win98 window';
    }, 3000);
}

// Fetch Configuration
async function fetchConfig() {
    try {
        const res = await fetch('/api/config');
        localConfig = await res.json();
        
        // Update stats and settings input
        inputBackupDest.value = localConfig.backup_dest;
        statBackupDestName.textContent = localConfig.backup_dest ? 
            localConfig.backup_dest.substring(localConfig.backup_dest.lastIndexOf('\\') + 1) || localConfig.backup_dest : 
            '未设置';
        statBackupDestName.title = localConfig.backup_dest;
        
        renderMonitoredFolders();
    } catch (err) {
        showToast('获取配置失败！', 'error');
        console.error(err);
    }
}

// Render Monitored Folders list in Settings modal
function renderMonitoredFolders() {
    monitoredFoldersList.innerHTML = '';
    localConfig.monitored_folders.forEach((folder, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="folder-path" title="${folder}">${folder}</span>
            <button type="button" class="btn-remove-folder" data-index="${index}">删除</button>
        `;
        monitoredFoldersList.appendChild(li);
    });
    
    // Add remove listeners
    document.querySelectorAll('.btn-remove-folder').forEach(btn => {
        btn.onclick = (e) => {
            const idx = parseInt(e.target.dataset.index);
            localConfig.monitored_folders.splice(idx, 1);
            renderMonitoredFolders();
        };
    });
}

// Fetch and Render Repositories list
async function fetchRepos() {
    try {
        repoList.innerHTML = '<tr><td colspan="8" class="text-center">正在扫描项目并读取 Git 状态...</td></tr>';
        const res = await fetch('/api/repos');
        activeRepos = await res.json();
        renderRepos();
    } catch (err) {
        repoList.innerHTML = '<tr><td colspan="8" class="text-center text-error">扫描项目失败，请检查服务状态</td></tr>';
        console.error(err);
    }
}

// Render Repositories Table
function renderRepos() {
    // 1. General Search Filter
    const query = repoSearch.value.toLowerCase().trim();
    
    // 2. Read Column Filter Values
    const fName = filterName.value.toLowerCase().trim();
    const fPath = filterPath.value.toLowerCase().trim();
    const fIsGit = filterIsGit.value;
    const fMinFiles = parseInt(filterFileCount.value) || 0;
    const fHasChanges = filterHasChanges.value;
    const fStatus = filterLastSyncStatus.value;
    
    // 3. Apply Filters
    let filtered = activeRepos.filter(r => {
        // General query match
        if (query && !r.name.toLowerCase().includes(query) && !r.path.toLowerCase().includes(query)) {
            return false;
        }
        // Project name column filter
        if (fName && !r.name.toLowerCase().includes(fName)) {
            return false;
        }
        // Local path column filter
        if (fPath && !r.path.toLowerCase().includes(fPath)) {
            return false;
        }
        // Git status column filter
        if (fIsGit) {
            if (fIsGit === 'git' && !r.is_git) return false;
            if (fIsGit === 'nogit' && r.is_git) return false;
        }
        // File count column filter (min files)
        if (fMinFiles > 0) {
            if (!r.is_git || r.file_count < fMinFiles) return false;
        }
        // Has changes column filter
        if (fHasChanges) {
            if (fHasChanges === 'dirty' && (!r.is_git || !r.has_changes)) return false;
            if (fHasChanges === 'clean' && (!r.is_git || r.has_changes)) return false;
            if (fHasChanges === 'nogit' && r.is_git) return false;
        }
        // Last sync status column filter
        if (fStatus) {
            if (fStatus === 'Success' && (!r.is_git || r.last_sync_status !== 'Success')) return false;
            if (fStatus === 'Failed' && (!r.is_git || r.last_sync_status !== 'Failed')) return false;
            if (fStatus === 'Pending' && (!r.is_git || (r.last_sync_status === 'Success' || r.last_sync_status === 'Failed'))) return false;
        }
        return true;
    });
    
    // 4. Apply Sorting
    if (currentSortCol && currentSortOrder) {
        filtered.sort((a, b) => {
            let valA, valB;
            
            switch (currentSortCol) {
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'path':
                    valA = a.path.toLowerCase();
                    valB = b.path.toLowerCase();
                    break;
                case 'is_git':
                    valA = a.is_git ? 1 : 0;
                    valB = b.is_git ? 1 : 0;
                    break;
                case 'file_count':
                    valA = a.is_git ? a.file_count : -1;
                    valB = b.is_git ? b.file_count : -1;
                    break;
                case 'has_changes':
                    valA = a.is_git ? (a.has_changes ? 1 : 0) : -1;
                    valB = b.is_git ? (b.has_changes ? 1 : 0) : -1;
                    break;
                case 'last_sync_time':
                    valA = a.last_sync_time === '-' ? '' : a.last_sync_time;
                    valB = b.last_sync_time === '-' ? '' : b.last_sync_time;
                    break;
                case 'last_sync_status':
                    valA = a.is_git ? (a.last_sync_status || 'Pending') : '';
                    valB = b.is_git ? (b.last_sync_status || 'Pending') : '';
                    break;
                default:
                    return 0;
            }
            
            if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // Update Stats
    statTotalRepos.textContent = activeRepos.length;
    statGitRepos.textContent = activeRepos.filter(r => r.is_git).length;
    statDirtyRepos.textContent = activeRepos.filter(r => r.is_git && r.has_changes).length;
    
    if (filtered.length === 0) {
        repoList.innerHTML = '<tr><td colspan="8" class="text-center">没有找到匹配的代码仓库项目</td></tr>';
        return;
    }
    
    repoList.innerHTML = '';
    filtered.forEach(repo => {
        const tr = document.createElement('tr');
        
        const gitBadge = repo.is_git ? 
            '<span class="badge badge-git">Git 仓库</span>' : 
            '<span class="badge badge-nogit">非 Git</span>';
            
        const dirtyBadge = repo.is_git ? (
            repo.has_changes ? 
                '<span class="badge badge-dirty">有未提交修改</span>' : 
                '<span class="badge badge-clean">已提交 (Clean)</span>'
        ) : '-';
        
        let statusBadge = '-';
        if (repo.is_git) {
            if (repo.last_sync_status === 'Success') {
                statusBadge = '<span class="badge badge-success">备份成功</span>';
            } else if (repo.last_sync_status === 'Failed') {
                statusBadge = '<span class="badge badge-failed">备份失败</span>';
            } else {
                statusBadge = '<span class="badge badge-pending">待备份</span>';
            }
        }
        
        const actionBtn = repo.is_git ? `
            <button class="btn-sync" data-path="${repo.path}" title="备份当前项目">
                <span class="sync-icon">🔄</span>
            </button>
        ` : '-';
        
        tr.innerHTML = `
            <td style="font-weight:600;">${repo.name}</td>
            <td style="color:var(--text-secondary); font-size:0.8rem;" title="${repo.path}">${repo.path}</td>
            <td>${gitBadge}</td>
            <td>${repo.is_git ? repo.file_count : '-'}</td>
            <td>${dirtyBadge}</td>
            <td style="font-size:0.8rem; color:var(--text-secondary);">${repo.last_sync_time}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        repoList.appendChild(tr);
    });
    
    // Add individual sync click listeners
    document.querySelectorAll('.btn-sync').forEach(btn => {
        btn.onclick = async (e) => {
            const btnEl = e.currentTarget;
            const path = btnEl.dataset.path;
            const icon = btnEl.querySelector('.sync-icon');
            
            btnEl.disabled = true;
            icon.classList.add('spinning');
            
            try {
                showToast(`正在备份 ${path.substring(path.lastIndexOf('\\') + 1)}...`);
                const res = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path })
                });
                const data = await res.json();
                
                if (data.success) {
                    showToast(`备份成功！共同步 ${data.copied} 个文件，删除 ${data.deleted} 个冗余文件。`);
                } else {
                    showToast(`备份失败: ${data.error}`, 'error');
                }
                
                // Refresh list to update time/status
                await fetchRepos();
            } catch (err) {
                showToast('同步网络错误', 'error');
                console.error(err);
                btnEl.disabled = false;
                icon.classList.remove('spinning');
            }
        };
    });
}

// Folder Picker for Backup Destination
btnBrowseDest.onclick = async () => {
    try {
        showToast('正在打开文件夹选择器...');
        const res = await fetch('/api/browse_folder');
        const data = await res.json();
        if (data.success && data.path) {
            inputBackupDest.value = data.path;
            showToast('已选择备份目标路径！');
        } else {
            showToast('已取消选择。');
        }
    } catch (err) {
        showToast('打开文件夹选择器失败', 'error');
        console.error(err);
    }
};

// Folder Picker for Monitored Folder
btnBrowseFolder.onclick = async () => {
    try {
        showToast('正在打开文件夹选择器...');
        const res = await fetch('/api/browse_folder');
        const data = await res.json();
        if (data.success && data.path) {
            inputNewFolder.value = data.path;
            showToast('已选择监控文件夹，请点击“添加”按钮确认。');
        } else {
            showToast('已取消选择。');
        }
    } catch (err) {
        showToast('打开文件夹选择器失败', 'error');
        console.error(err);
    }
};

// Add Monitored Folder action
btnAddFolder.onclick = () => {
    const val = inputNewFolder.value.trim();
    if (val) {
        if (!localConfig.monitored_folders.includes(val)) {
            localConfig.monitored_folders.push(val);
            renderMonitoredFolders();
            inputNewFolder.value = '';
        } else {
            showToast('该路径已在监控列表中！', 'error');
        }
    } else {
        showToast('请先点击“选择...”来选择要监控的代码主文件夹！', 'error');
    }
};

// Open Settings
btnSettings.onclick = () => {
    settingsModal.classList.add('active');
};
if (menuTriggerSettings) {
    menuTriggerSettings.onclick = () => {
        settingsModal.classList.add('active');
    };
}

// Close Settings
const closeModal = () => {
    settingsModal.classList.remove('active');
    fetchConfig(); // Re-read current config to discard unsaved edits
};
btnCloseSettings.onclick = closeModal;
btnCancelSettings.onclick = closeModal;

// Save Settings Form
settingsForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                backup_dest: inputBackupDest.value.trim(),
                monitored_folders: localConfig.monitored_folders
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('配置已成功保存！');
            settingsModal.classList.remove('active');
            await fetchConfig();
            await fetchRepos();
        }
    } catch (err) {
        showToast('保存配置失败', 'error');
        console.error(err);
    }
};

// Search Filter
repoSearch.oninput = renderRepos;

// Sort Indicators Helper
function updateSortIndicators() {
    document.querySelectorAll('.header-sort-row th[data-sort]').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (!indicator) return;
        
        if (th.dataset.sort === currentSortCol && currentSortOrder) {
            indicator.textContent = currentSortOrder === 'asc' ? ' ▲' : ' ▼';
            indicator.classList.add('active');
        } else {
            indicator.textContent = ' ▲';
            indicator.classList.remove('active');
        }
    });
}

// Register Sort Event Listeners on headers
document.querySelectorAll('.header-sort-row th[data-sort]').forEach(th => {
    th.onclick = () => {
        const col = th.dataset.sort;
        if (currentSortCol === col) {
            if (currentSortOrder === 'asc') {
                currentSortOrder = 'desc';
            } else if (currentSortOrder === 'desc') {
                currentSortOrder = null;
                currentSortCol = null;
            } else {
                currentSortOrder = 'asc';
            }
        } else {
            currentSortCol = col;
            currentSortOrder = 'asc';
        }
        updateSortIndicators();
        renderRepos();
    };
});

// Register Column Filter Event Listeners
const colFilters = [filterName, filterPath, filterIsGit, filterFileCount, filterHasChanges, filterLastSyncStatus];
colFilters.forEach(filter => {
    if (filter) {
        filter.oninput = renderRepos;
        filter.onchange = renderRepos;
    }
});

if (btnClearFilters) {
    btnClearFilters.onclick = () => {
        colFilters.forEach(filter => {
            if (filter) filter.value = '';
        });
        renderRepos();
    };
}

// Sync Active action
btnSyncActive.onclick = async () => {
    if (!localConfig.backup_dest) {
        showToast('请先配置云盘备份目标文件夹！', 'error');
        settingsModal.classList.add('active');
        return;
    }
    
    // Check if there are active (previously backed-up) repos
    const activeBackupRepos = activeRepos.filter(r => r.is_git && r.last_sync_status !== '-');
    if (activeBackupRepos.length === 0) {
        showToast('当前没有检测到任何已备份过的项目，请先手动备份单个项目！', 'error');
        return;
    }
    
    btnSyncActive.disabled = true;
    const syncIcon = btnSyncActive.querySelector('.sync-icon');
    if (syncIcon) syncIcon.classList.add('spinning');
    
    showToast('正在增量更新所有已备份过的项目...');
    
    try {
        const res = await fetch('/api/sync_active', { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
            let totalCopied = 0;
            let totalDeleted = 0;
            let successCount = 0;
            
            data.results.forEach(r => {
                if (r.result.success) {
                    successCount++;
                    totalCopied += r.result.copied;
                    totalDeleted += r.result.deleted;
                }
            });
            
            showToast(`更新完成！成功同步 ${successCount}/${activeBackupRepos.length} 个已备份项目，共传输 ${totalCopied} 个文件，清理 ${totalDeleted} 个冗余文件。`);
        } else {
            showToast('部分项目同步出错，请查看表格详情。', 'error');
        }
        
        await fetchRepos();
    } catch (err) {
        showToast('执行更新备份时网络出错', 'error');
        console.error(err);
    } finally {
        btnSyncActive.disabled = false;
        if (syncIcon) syncIcon.classList.remove('spinning');
    }
};

// Theme, Font, and Size Settings management
let currentTheme = localStorage.getItem('theme') || 'dark'; // Default theme is dark!
let currentZhFont = localStorage.getItem('zh-font') || 'inherit';
let currentEnFont = localStorage.getItem('en-font') || 'inherit';
let currentFontSize = localStorage.getItem('font-size') || 'inherit';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.className = 'theme-dark';
    } else if (theme === 'light') {
        document.documentElement.className = 'theme-light';
    } else {
        // 'auto' mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.className = 'theme-light';
        } else {
            document.documentElement.className = 'theme-dark';
        }
    }
    
    // Update checkmarks in theme menu
    document.querySelectorAll('#theme-opt-dark, #theme-opt-light, #theme-opt-auto').forEach(opt => {
        opt.classList.remove('selected');
    });
    const selectedOpt = document.getElementById(`theme-opt-${theme}`);
    if (selectedOpt) selectedOpt.classList.add('selected');
}

function applyFontsAndSize() {
    let fontFamily = '';
    if (currentEnFont !== 'inherit' && currentZhFont !== 'inherit') {
        fontFamily = `${currentEnFont}, "${currentZhFont}", sans-serif`;
    } else if (currentEnFont !== 'inherit') {
        fontFamily = `${currentEnFont}, sans-serif`;
    } else if (currentZhFont !== 'inherit') {
        fontFamily = `"${currentZhFont}", sans-serif`;
    }
    
    document.documentElement.style.fontFamily = fontFamily;
    document.documentElement.style.fontSize = currentFontSize === 'inherit' ? '' : currentFontSize;
    
    // Update Chinese font checkmarks
    document.querySelectorAll('.font-zh-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.font === currentZhFont);
    });
    
    // Update English font checkmarks
    document.querySelectorAll('.font-en-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.font === currentEnFont);
    });
    
    // Update Font size checkmarks
    document.querySelectorAll('.font-size-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.size === currentFontSize);
    });
}

// Register dropdown option listeners
document.querySelectorAll('#theme-opt-dark, #theme-opt-light, #theme-opt-auto').forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        currentTheme = opt.dataset.value;
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
    };
});

document.querySelectorAll('.font-zh-opt').forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        currentZhFont = opt.dataset.font;
        localStorage.setItem('zh-font', currentZhFont);
        applyFontsAndSize();
    };
});

document.querySelectorAll('.font-en-opt').forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        currentEnFont = opt.dataset.font;
        localStorage.setItem('en-font', currentEnFont);
        applyFontsAndSize();
    };
});

document.querySelectorAll('.font-size-opt').forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        currentFontSize = opt.dataset.size;
        localStorage.setItem('font-size', currentFontSize);
        applyFontsAndSize();
    };
});

// Initial Load
(async function init() {
    applyTheme(currentTheme);
    applyFontsAndSize();
    await fetchConfig();
    // If not configured, pop up the settings modal automatically
    if (!localConfig.backup_dest || localConfig.monitored_folders.length === 0) {
        settingsModal.classList.add('active');
        showToast('请先配置本地代码主文件夹和备份目标！');
    }
    await fetchRepos();
})();
