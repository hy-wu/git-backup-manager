// DOM Elements
const btnSyncActive = document.getElementById('btn-sync-active');
const btnSettings = document.getElementById('btn-settings');
const editOptSettings = document.getElementById('edit-opt-settings');
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
let currentLang = localStorage.getItem('lang') || 'zh';

// Translation Dictionary
const i18n = {
    zh: {
        title: "代码备份管家 v1.0.0 - Windows 98 Edition",
        menu_file: "文件(F)",
        menu_save: "💾 保存配置...",
        menu_load: "📂 加载配置...",
        menu_edit: "编辑(E)",
        menu_settings: "⚙️ 全局同步配置...",
        menu_view: "查看(V)",
        menu_theme_settings: "🌓 主题设定",
        menu_theme_dark: "🌙 深色主题 (默认)",
        menu_theme_light: "☀️ 浅色主题",
        menu_theme_auto: "🌓 自动 (系统首选)",
        menu_font_settings: "🔤 字体设定",
        menu_font_size: "📏 字号大小",
        menu_size_small: "较小 (12px)",
        menu_size_medium: "中等 (14px)",
        menu_size_large: "较大 (16px)",
        menu_size_xlarge: "超大 (18px)",
        menu_default: "系统默认",
        menu_lang: "🌐 语言 / Language",
        menu_reset: "🔄 恢复默认设置",
        menu_help: "帮助(H)",
        menu_homepage: "🌐 项目主页",
        btn_sync_active: "🔄 更新全部已备份项目",
        btn_settings: "⚙️ 备份同步配置...",
        stat_total_folders: "检测文件夹数:",
        stat_git_repos: "Git仓库数:",
        stat_dirty_repos: "待备份修改:",
        stat_backup_dest: "备份目标目的地:",
        stat_not_set: "未设置",
        filter_projects: "过滤项目:",
        search_placeholder: "输入关键字筛选项目...",
        th_name: "项目名称",
        th_path: "本地路径",
        th_git_status: "Git状态",
        th_files: "文件数",
        th_changes: "修改状态",
        th_last_backup: "上次备份时间",
        th_backup_status: "备份状态",
        th_actions: "操作",
        filter_name_placeholder: "筛选名称...",
        filter_path_placeholder: "筛选路径...",
        filter_min_placeholder: "最少...",
        opt_all: "全部",
        opt_git: "Git 仓库",
        opt_nogit: "非 Git",
        opt_dirty: "有修改",
        opt_clean: "已提交",
        opt_success: "成功",
        opt_failed: "失败",
        opt_pending: "待备份",
        btn_reset: "重置",
        modal_title: "全局同步配置",
        legend_backup_dest: "备份目标位置",
        label_backup_dest: "备份目标文件夹路径 (例如本地盘、外部存储或云盘同步路径):",
        btn_browse: "选择...",
        help_backup_dest: "您可以选择任意本地硬盘分区文件夹、外部存储设备挂载点，或者云端硬盘（如 Google Drive, OneDrive）的同步映射目录。",
        legend_monitored: "监控的本地代码目录",
        label_monitored: "正在监控的主目录列表:",
        add_folder_placeholder: "点击右侧“选择...”浏览文件夹...",
        btn_add: "添加",
        btn_ok: "确定",
        btn_cancel: "取消",
        toast_title: "系统提示",
        toast_title_error: "错误",
        loading_repos: "正在扫描项目并读取 Git 状态...",
        loading_list: "正在加载项目列表中，请稍候...",
        no_repos_found: "没有找到匹配的代码仓库项目",
        badge_git: "Git 仓库",
        badge_nogit: "非 Git",
        badge_clean: "已提交 (Clean)",
        badge_dirty: "有未提交修改",
        badge_success: "备份成功",
        badge_failed: "备份失败",
        badge_pending: "待备份",
        btn_sync_title: "备份当前项目",
        toast_browse_folder: "正在打开文件夹选择器...",
        toast_folder_selected: "已选择监控文件夹，请点击“添加”按钮确认。",
        toast_dest_selected: "已选择备份目标路径！",
        toast_cancel_select: "已取消选择。",
        toast_folder_exists: "该路径已在监控列表中！",
        toast_folder_empty: "请先点击“选择...”来选择要监控的代码主文件夹！",
        toast_save_success: "配置已成功保存！",
        toast_load_success: "配置已成功加载并更新！",
        toast_export_success: "配置已成功导出并下载！",
        toast_sync_all: "正在增量更新所有已备份过的项目...",
        toast_sync_all_success: "更新完成！",
        toast_syncing_project: "正在备份",
        toast_sync_project_success: "备份成功！",
        toast_sync_project_failed: "备份失败",
        toast_net_error: "网络错误",
        toast_not_configured: "请先配置本地代码主文件夹和备份目标！",
        toast_no_active_backups: "当前没有检测到任何已备份过的项目，请先手动备份单个项目！"
    },
    en: {
        title: "Git Backup Manager v1.0.0 - Windows 98 Edition",
        menu_file: "File(F)",
        menu_save: "💾 Save Config...",
        menu_load: "📂 Load Config...",
        menu_edit: "Edit(E)",
        menu_settings: "⚙️ Global Sync Config...",
        menu_view: "View(V)",
        menu_theme_settings: "🌓 Theme Settings",
        menu_theme_dark: "🌙 Dark Theme (Default)",
        menu_theme_light: "☀️ Light Theme",
        menu_theme_auto: "🌓 Auto (System Default)",
        menu_font_settings: "🔤 Font Settings",
        menu_font_size: "📏 Font Size",
        menu_size_small: "Small (12px)",
        menu_size_medium: "Medium (14px)",
        menu_size_large: "Large (16px)",
        menu_size_xlarge: "Extra Large (18px)",
        menu_default: "System Default",
        menu_lang: "🌐 Language / 语言",
        menu_reset: "🔄 Restore Defaults",
        menu_help: "Help(H)",
        menu_homepage: "🌐 Project Homepage",
        btn_sync_active: "🔄 Update All Backed-up Projects",
        btn_settings: "⚙️ Backup Sync Config...",
        stat_total_folders: "Total Folders:",
        stat_git_repos: "Git Repos:",
        stat_dirty_repos: "Pending Changes:",
        stat_backup_dest: "Backup Destination:",
        stat_not_set: "Not Configured",
        filter_projects: "Filter Projects:",
        search_placeholder: "Enter keyword to filter...",
        th_name: "Project Name",
        th_path: "Local Path",
        th_git_status: "Git Status",
        th_files: "Files",
        th_changes: "Changes",
        th_last_backup: "Last Backup Time",
        th_backup_status: "Backup Status",
        th_actions: "Actions",
        filter_name_placeholder: "Filter name...",
        filter_path_placeholder: "Filter path...",
        filter_min_placeholder: "Min...",
        opt_all: "All",
        opt_git: "Git Repo",
        opt_nogit: "Non-Git",
        opt_dirty: "Modified",
        opt_clean: "Clean",
        opt_success: "Success",
        opt_failed: "Failed",
        opt_pending: "Pending",
        btn_reset: "Reset",
        modal_title: "Global Sync Configuration",
        legend_backup_dest: "Backup Destination",
        label_backup_dest: "Backup Target Folder Path (e.g. local disk, external drive, or cloud sync path):",
        btn_browse: "Browse...",
        help_backup_dest: "You can select any local disk partition, external storage drive, or cloud sync directory (like Google Drive, OneDrive).",
        legend_monitored: "Monitored Local Code Directories",
        label_monitored: "Currently monitored directories:",
        add_folder_placeholder: "Click \"Browse...\" to select a folder...",
        btn_add: "Add",
        btn_ok: "OK",
        btn_cancel: "Cancel",
        toast_title: "System Information",
        toast_title_error: "Error",
        loading_repos: "Scanning projects and reading Git status...",
        loading_list: "Loading projects list, please wait...",
        no_repos_found: "No matching repositories found",
        badge_git: "Git Repo",
        badge_nogit: "Non-Git",
        badge_clean: "Clean",
        badge_dirty: "Uncommitted Changes",
        badge_success: "Success",
        badge_failed: "Failed",
        badge_pending: "Pending",
        btn_sync_title: "Backup this project",
        toast_browse_folder: "Opening folder browser...",
        toast_folder_selected: "Folder selected, click \"Add\" to confirm.",
        toast_dest_selected: "Backup destination path selected!",
        toast_cancel_select: "Selection cancelled.",
        toast_folder_exists: "Path already in monitored list!",
        toast_folder_empty: "Please click \"Browse...\" to select a directory first!",
        toast_save_success: "Configuration saved successfully!",
        toast_load_success: "Configuration loaded successfully!",
        toast_export_success: "Configuration exported and downloaded!",
        toast_sync_all: "Updating all backed-up projects...",
        toast_sync_all_success: "Update completed!",
        toast_syncing_project: "Backing up",
        toast_sync_project_success: "Backup succeeded!",
        toast_sync_project_failed: "Backup failed",
        toast_net_error: "Network error",
        toast_not_configured: "Please configure local code folder and backup destination first!",
        toast_no_active_backups: "No previously backed-up projects detected. Please back up a project manually first!"
    }
};

// Bilingual Translation Applier
function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    // 1. Update document title
    document.title = i18n[lang].title;
    
    // 2. Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (i18n[lang][key]) {
            el.textContent = i18n[lang][key];
        }
    });
    
    // 3. Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (i18n[lang][key]) {
            el.placeholder = i18n[lang][key];
        }
    });
    
    // 4. Update custom select items with translated option texts
    const customSelects = document.querySelectorAll('.win98-custom-select');
    customSelects.forEach(customSelect => {
        const selectId = customSelect.dataset.selectId;
        const nativeSelect = document.getElementById(selectId);
        if (nativeSelect) {
            const customOptions = customSelect.querySelectorAll('.select-custom-option');
            customOptions.forEach((opt, idx) => {
                const nativeOpt = nativeSelect.options[idx];
                if (nativeOpt) {
                    opt.textContent = nativeOpt.textContent;
                }
            });
            const displayVal = customSelect.querySelector('.select-value-display');
            if (displayVal && nativeSelect.options[nativeSelect.selectedIndex]) {
                displayVal.textContent = nativeSelect.options[nativeSelect.selectedIndex].textContent;
            }
        }
    });
    
    // 5. Update language menu items checkmarks
    document.querySelectorAll('.lang-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.lang === lang);
    });
    
    // 6. Update dialog titles
    const settingsModalTitle = document.querySelector('#settings-modal .title-bar-text');
    if (settingsModalTitle) settingsModalTitle.textContent = i18n[lang].modal_title;
    
    // Update destination status name text if empty
    if (!localConfig.backup_dest) {
        statBackupDestName.textContent = i18n[lang].stat_not_set;
    }
}

// Toast Notification Helper
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast-win98 window active';
    const toastTitle = document.getElementById('toast-title');
    if (toastTitle) {
        toastTitle.textContent = type === 'error' ? i18n[currentLang].toast_title_error : i18n[currentLang].toast_title;
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
            i18n[currentLang].stat_not_set;
        statBackupDestName.title = localConfig.backup_dest;
        
        renderMonitoredFolders();
    } catch (err) {
        showToast(currentLang === 'zh' ? '获取配置失败！' : 'Failed to fetch config!', 'error');
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
            <button type="button" class="btn-remove-folder" data-index="${index}">${i18n[currentLang].btn_browse === '选择...' ? '删除' : 'Delete'}</button>
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
        repoList.innerHTML = `<tr><td colspan="8" class="text-center">${i18n[currentLang].loading_repos}</td></tr>`;
        const res = await fetch('/api/repos');
        activeRepos = await res.json();
        renderRepos();
    } catch (err) {
        repoList.innerHTML = `<tr><td colspan="8" class="text-center text-error">${currentLang === 'zh' ? '扫描项目失败，请检查服务状态' : 'Failed to scan projects, please check service status'}</td></tr>`;
        console.error(err);
    }
}

// Render Repositories Table
function renderRepos() {
    // Sync custom selects with native values (e.g. after reset)
    if (typeof syncCustomSelects === 'function') {
        syncCustomSelects();
    }
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
        repoList.innerHTML = `<tr><td colspan="8" class="text-center">${i18n[currentLang].no_repos_found}</td></tr>`;
        return;
    }
    
    repoList.innerHTML = '';
    filtered.forEach(repo => {
        const tr = document.createElement('tr');
        
        const gitBadge = repo.is_git ? 
            `<span class="badge badge-git">${i18n[currentLang].badge_git}</span>` : 
            `<span class="badge badge-nogit">${i18n[currentLang].badge_nogit}</span>`;
            
        const dirtyBadge = repo.is_git ? (
            repo.has_changes ? 
                `<span class="badge badge-dirty">${i18n[currentLang].badge_dirty}</span>` : 
                `<span class="badge badge-clean">${i18n[currentLang].badge_clean}</span>`
        ) : '-';
        
        let statusBadge = '-';
        if (repo.is_git) {
            if (repo.last_sync_status === 'Success') {
                statusBadge = `<span class="badge badge-success">${i18n[currentLang].badge_success}</span>`;
            } else if (repo.last_sync_status === 'Failed') {
                statusBadge = `<span class="badge badge-failed">${i18n[currentLang].badge_failed}</span>`;
            } else {
                statusBadge = `<span class="badge badge-pending">${i18n[currentLang].badge_pending}</span>`;
            }
        }
        
        const actionBtn = repo.is_git ? `
            <button class="btn-sync" data-path="${repo.path}" title="${i18n[currentLang].btn_sync_title}">
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
                showToast(`${i18n[currentLang].toast_syncing_project} ${path.substring(path.lastIndexOf('\\') + 1)}...`);
                const res = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path })
                });
                const data = await res.json();
                
                if (data.success) {
                    showToast(currentLang === 'zh' ? 
                        `备份成功！共同步 ${data.copied} 个文件，删除 ${data.deleted} 个冗余文件。` : 
                        `Backup succeeded! Synced ${data.copied} files, cleaned ${data.deleted} redundant files.`);
                } else {
                    showToast(`${i18n[currentLang].toast_sync_project_failed}: ${data.error}`, 'error');
                }
                
                // Refresh list to update time/status
                await fetchRepos();
            } catch (err) {
                showToast(i18n[currentLang].toast_net_error, 'error');
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
        showToast(i18n[currentLang].toast_browse_folder);
        const res = await fetch('/api/browse_folder');
        const data = await res.json();
        if (data.success && data.path) {
            inputBackupDest.value = data.path;
            showToast(i18n[currentLang].toast_dest_selected);
        } else {
            showToast(i18n[currentLang].toast_cancel_select);
        }
    } catch (err) {
        showToast(currentLang === 'zh' ? '打开文件夹选择器失败' : 'Failed to open directory browser', 'error');
        console.error(err);
    }
};

// Folder Picker for Monitored Folder
btnBrowseFolder.onclick = async () => {
    try {
        showToast(i18n[currentLang].toast_browse_folder);
        const res = await fetch('/api/browse_folder');
        const data = await res.json();
        if (data.success && data.path) {
            inputNewFolder.value = data.path;
            showToast(i18n[currentLang].toast_folder_selected);
        } else {
            showToast(i18n[currentLang].toast_cancel_select);
        }
    } catch (err) {
        showToast(currentLang === 'zh' ? '打开文件夹选择器失败' : 'Failed to open directory browser', 'error');
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
            showToast(i18n[currentLang].toast_folder_exists, 'error');
        }
    } else {
        showToast(i18n[currentLang].toast_folder_empty, 'error');
    }
};

// Open Settings
btnSettings.onclick = () => {
    settingsModal.classList.add('active');
};
if (editOptSettings) {
    editOptSettings.onclick = (e) => {
        e.stopPropagation();
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
            showToast(i18n[currentLang].toast_save_success);
            settingsModal.classList.remove('active');
            await fetchConfig();
            await fetchRepos();
        }
    } catch (err) {
        showToast(currentLang === 'zh' ? '保存配置失败' : 'Failed to save configuration', 'error');
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
        showToast(i18n[currentLang].toast_not_configured, 'error');
        settingsModal.classList.add('active');
        return;
    }
    
    // Check if there are active (previously backed-up) repos
    const activeBackupRepos = activeRepos.filter(r => r.is_git && r.last_sync_status !== '-');
    if (activeBackupRepos.length === 0) {
        showToast(i18n[currentLang].toast_no_active_backups, 'error');
        return;
    }
    
    btnSyncActive.disabled = true;
    const syncIcon = btnSyncActive.querySelector('.sync-icon');
    if (syncIcon) syncIcon.classList.add('spinning');
    
    showToast(i18n[currentLang].toast_sync_all);
    
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
            
            showToast(currentLang === 'zh' ? 
                `更新完成！成功同步 ${successCount}/${activeBackupRepos.length} 个已备份项目，共传输 ${totalCopied} 个文件，清理 ${totalDeleted} 个冗余文件。` : 
                `Update completed! Successfully synced ${successCount}/${activeBackupRepos.length} projects, transferred ${totalCopied} files, cleaned ${totalDeleted} redundant files.`);
        } else {
            showToast(currentLang === 'zh' ? '部分项目同步出错，请查看表格详情。' : 'Some projects failed to sync, please check table details.', 'error');
        }
        
        await fetchRepos();
    } catch (err) {
        showToast(currentLang === 'zh' ? '执行更新备份时网络出错' : 'Network error during bulk sync', 'error');
        console.error(err);
    } finally {
        btnSyncActive.disabled = false;
        if (syncIcon) syncIcon.classList.remove('spinning');
    }
};

// Theme, Font, and Size Settings management
let currentTheme = localStorage.getItem('theme') || 'dark'; // Default theme is dark!
let currentFont = localStorage.getItem('font') || localStorage.getItem('zh-font') || localStorage.getItem('en-font') || 'inherit';
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
    
    const fontMap = {
        'Microsoft YaHei': ['"Microsoft YaHei"', '"微软雅黑"'],
        'SimSun': ['"SimSun"', '"宋体"', 'serif'],
        'SimHei': ['"SimHei"', '"黑体"'],
        'Tahoma': ['"Tahoma"', 'Geneva'],
        'Arial': ['"Arial"', 'Helvetica'],
        'Times New Roman': ['"Times New Roman"', 'Times', 'serif'],
        'Courier New': ['"Courier New"', 'Courier', 'monospace']
    };
    
    if (currentFont !== 'inherit' && fontMap[currentFont]) {
        const fontList = fontMap[currentFont].concat(['sans-serif']);
        fontFamily = fontList.filter((item, idx) => fontList.indexOf(item) === idx).join(', ');
    }
    
    document.documentElement.style.fontFamily = fontFamily;
    document.documentElement.style.fontSize = currentFontSize === 'inherit' ? '' : currentFontSize;
    
    if (document.body) {
        document.body.style.fontFamily = fontFamily;
        document.body.style.fontSize = currentFontSize === 'inherit' ? '' : currentFontSize;
    }
    
    // Update font checkmarks
    document.querySelectorAll('.font-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.font === currentFont);
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

document.querySelectorAll('.font-opt').forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        currentFont = opt.dataset.font;
        localStorage.setItem('font', currentFont);
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

// Register Language selection listeners
document.querySelectorAll('.lang-opt').forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        const selectedLang = opt.dataset.lang;
        applyLanguage(selectedLang);
        renderRepos(); // Re-render repository list with updated badge languages
    };
});

const resetOpt = document.getElementById('theme-opt-reset');
if (resetOpt) {
    resetOpt.onclick = (e) => {
        e.stopPropagation();
        
        // Remove from localStorage
        localStorage.removeItem('theme');
        localStorage.removeItem('font');
        localStorage.removeItem('zh-font');
        localStorage.removeItem('en-font');
        localStorage.removeItem('font-size');
        localStorage.removeItem('lang');
        
        // Reset local variables to defaults
        currentTheme = 'dark'; // Default is dark
        currentFont = 'inherit';
        currentFontSize = 'inherit';
        currentLang = 'zh';
        
        // Apply changes
        applyTheme(currentTheme);
        applyFontsAndSize();
        applyLanguage(currentLang);
        renderRepos();
        
        showToast(currentLang === 'zh' ? '已恢复默认主题和字体设置！' : 'Theme and font settings restored to defaults!');
    };
}

// File menu action: Save Configuration
const fileOptSave = document.getElementById('file-opt-save');
if (fileOptSave) {
    fileOptSave.onclick = async (e) => {
        e.stopPropagation();
        try {
            const response = await fetch('/api/config');
            if (!response.ok) throw new Error('获取配置失败');
            const config = await response.json();
            
            // Create blob and trigger download
            const blob = new Blob([JSON.stringify(config, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'git-backup-config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(i18n[currentLang].toast_export_success);
        } catch (err) {
            showToast(currentLang === 'zh' ? `导出配置失败: ${err.message}` : `Export configuration failed: ${err.message}`);
        }
    };
}

// File menu action: Load Configuration
const fileOptLoad = document.getElementById('file-opt-load');
if (fileOptLoad) {
    fileOptLoad.onclick = (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const config = JSON.parse(ev.target.result);
                    // Validate basic configuration structure
                    if (!config || (config.backup_dest === undefined && config.monitored_folders === undefined)) {
                        throw new Error('配置文件格式无效或不匹配');
                    }
                    
                    // POST the configuration to /api/config
                    const response = await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            backup_dest: config.backup_dest || '',
                            monitored_folders: config.monitored_folders || []
                        })
                    });
                    
                    if (!response.ok) throw new Error('同步配置到服务器失败');
                    
                    // Refresh app configuration
                    await fetchConfig();
                    await fetchRepos();
                    showToast(i18n[currentLang].toast_load_success);
                } catch (err) {
                    showToast(currentLang === 'zh' ? `加载配置失败: ${err.message}` : `Failed to load config: ${err.message}`);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };
}

// Help menu action: Project Homepage
const helpOptHomepage = document.getElementById('help-opt-homepage');
if (helpOptHomepage) {
    helpOptHomepage.onclick = (e) => {
        e.stopPropagation();
        window.open('https://github.com/hy-wu/git-backup-manager', '_blank');
    };
}

// Sync Custom Selects Helper
function syncCustomSelects() {
    const customSelects = document.querySelectorAll('.win98-custom-select');
    customSelects.forEach(customSelect => {
        const selectId = customSelect.dataset.selectId;
        const nativeSelect = document.getElementById(selectId);
        if (nativeSelect) {
            const displayVal = customSelect.querySelector('.select-value-display');
            const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
            if (displayVal && selectedOpt) {
                displayVal.textContent = selectedOpt.textContent;
            }
            // Update selected class in custom options list
            const customOptions = customSelect.querySelectorAll('.select-custom-option');
            customOptions.forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === nativeSelect.value);
            });
        }
    });
}

// Initialize Custom Select Component
function initCustomSelects() {
    const nativeSelects = document.querySelectorAll('select.col-filter');
    
    nativeSelects.forEach(select => {
        // Hide native select
        select.style.display = 'none';
        
        // Create custom select container
        const customSelect = document.createElement('div');
        customSelect.className = 'win98-custom-select';
        customSelect.dataset.selectId = select.id;
        
        // Value display box
        const displayVal = document.createElement('div');
        displayVal.className = 'select-value-display';
        displayVal.textContent = select.options[select.selectedIndex]?.text || '';
        customSelect.appendChild(displayVal);
        
        // Dropdown arrow button
        const arrowBtn = document.createElement('div');
        arrowBtn.className = 'select-arrow-btn';
        arrowBtn.textContent = '▼';
        customSelect.appendChild(arrowBtn);
        
        // Custom Options List Container
        const optionsList = document.createElement('div');
        optionsList.className = 'select-options-list';
        
        Array.from(select.options).forEach(opt => {
            const customOpt = document.createElement('div');
            customOpt.className = 'select-custom-option';
            customOpt.dataset.value = opt.value;
            customOpt.textContent = opt.text;
            if (opt.selected) {
                customOpt.classList.add('selected');
            }
            
            customOpt.onclick = (e) => {
                e.stopPropagation();
                select.value = opt.value;
                displayVal.textContent = opt.text;
                optionsList.querySelectorAll('.select-custom-option').forEach(o => o.classList.remove('selected'));
                customOpt.classList.add('selected');
                customSelect.classList.remove('active');
                
                // Fire native events so filtering triggers
                select.dispatchEvent(new Event('change'));
                select.dispatchEvent(new Event('input'));
            };
            
            optionsList.appendChild(customOpt);
        });
        
        customSelect.appendChild(optionsList);
        
        // Toggle active status
        customSelect.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.win98-custom-select').forEach(cs => {
                if (cs !== customSelect) cs.classList.remove('active');
            });
            customSelect.classList.toggle('active');
        };
        
        // Insert custom select after native one
        select.parentNode.insertBefore(customSelect, select.nextSibling);
    });
    
    // Clicking outside closes all lists
    document.addEventListener('click', () => {
        document.querySelectorAll('.win98-custom-select').forEach(cs => {
            cs.classList.remove('active');
        });
    });
}

// Initial Load
(async function init() {
    applyTheme(currentTheme);
    applyFontsAndSize();
    initCustomSelects();
    applyLanguage(currentLang);
    await fetchConfig();
    // If not configured, pop up the settings modal automatically
    if (!localConfig.backup_dest || localConfig.monitored_folders.length === 0) {
        settingsModal.classList.add('active');
        showToast(i18n[currentLang].toast_not_configured);
    }
    await fetchRepos();
})();
