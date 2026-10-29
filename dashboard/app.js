// Interactive Dashboard Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // State Data for System Integrations Table
    let integrationsData = [
        { id: 1, name: 'Salesforce CRM', code: 'SF', category: 'CRM', status: 'Connected', desc: 'Customer relationship management' },
        { id: 2, name: 'SAP TMS', code: 'SAP', category: 'TMS', status: 'Connected', desc: 'Transportation management system' },
        { id: 3, name: 'Oracle ERP', code: 'OR', category: 'ERP', status: 'Syncing', desc: 'Enterprise resource planning' },
        { id: 4, name: 'Microsoft Dynamics', code: 'MD', category: 'ERP', status: 'Errors', desc: 'Business applications' },
        { id: 5, name: 'Slack', code: 'SL', category: 'Communication', status: 'Connected', desc: 'Team communication' },
        { id: 6, name: 'Shopify', code: 'SH', category: 'E-commerce', status: 'Connected', desc: 'E-commerce platform' }
    ];

    let currentSortColumn = 'name';
    let sortAscending = true;
    let editingItemId = null;

    // DOM Elements
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const tableBody = document.getElementById('integrations-tbody');
    const searchInput = document.getElementById('table-search-input');
    const globalSearchInput = document.getElementById('global-search-input');
    const addNewBtn = document.getElementById('add-new-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const integrationForm = document.getElementById('integration-form');
    const modalTitle = document.getElementById('modal-title');
    const tfButtons = document.querySelectorAll('.tf-btn');

    // Stat metric elements
    const statConnected = document.getElementById('stat-connected');
    const statSyncing = document.getElementById('stat-syncing');
    const statErrors = document.getElementById('stat-errors');
    const statAvailable = document.getElementById('stat-available');

    // 1. Sidebar Navigation & Page Switching
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');
            const viewTitle = item.getAttribute('data-title');

            if (!targetView) return;

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active view section
            viewSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `view-${targetView}`) {
                    section.classList.add('active');
                }
            });

            // Update breadcrumb
            if (breadcrumbCurrent) {
                breadcrumbCurrent.textContent = viewTitle;
            }
        });
    });

    // 2. Time-frame Metric Toggle Controls
    tfButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tfButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const timeframe = btn.getAttribute('data-tf');
            updateStatsForTimeframe(timeframe);
        });
    });

    function updateStatsForTimeframe(tf) {
        // Dynamic multiplier / variation based on timeframe
        let multiplier = 1;
        if (tf === 'today') multiplier = 0.85;
        if (tf === 'week') multiplier = 1;
        if (tf === 'month') multiplier = 1.25;

        statConnected.textContent = Math.round(45 * multiplier);
        statSyncing.textContent = Math.max(1, Math.round(5 * multiplier));
        statErrors.textContent = tf === 'today' ? '0' : '1';
        statAvailable.textContent = Math.round(54 * multiplier);
    }

    // 3. Render Data Table
    function renderTable(dataToRender) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No matching integrations found.</td></tr>`;
            return;
        }

        dataToRender.forEach(item => {
            const tr = document.createElement('tr');
            
            let statusClass = 'connected';
            let statusIcon = '✔';
            if (item.status === 'Syncing') { statusClass = 'syncing'; statusIcon = '🔄'; }
            if (item.status === 'Errors') { statusClass = 'error'; statusIcon = '❌'; }

            let logoClass = 'logo-default';
            if (item.code === 'SF') logoClass = 'logo-salesforce';
            else if (item.code === 'SAP') logoClass = 'logo-sap';
            else if (item.code === 'OR') logoClass = 'logo-oracle';
            else if (item.code === 'MD') logoClass = 'logo-dynamics';
            else if (item.code === 'SL') logoClass = 'logo-slack';
            else if (item.code === 'SH') logoClass = 'logo-shopify';

            tr.innerHTML = `
                <td>
                    <div class="integration-cell">
                        <div class="integration-logo ${logoClass}">${item.code}</div>
                        <div>
                            <div class="integration-name">${escapeHTML(item.name)}</div>
                            <div class="integration-desc">${escapeHTML(item.desc)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="category-pill">${escapeHTML(item.category)}</span></td>
                <td><span class="status-badge ${statusClass}">${statusIcon} ${item.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action edit" data-id="${item.id}">Edit</button>
                        <button class="btn-action delete" data-id="${item.id}">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach action listeners
        attachTableActionListeners();
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Real-time Search Filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = integrationsData.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.category.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query)
            );
            renderTable(filtered);
        });
    }

    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 0) {
                // switch to projects view if searching globally
                document.querySelector('[data-view="projects"]').click();
                searchInput.value = query;
                searchInput.dispatchEvent(new Event('input'));
            }
        });
    }

    // Column Sorting
    const sortableHeaders = document.querySelectorAll('.data-table th[data-sort]');
    sortableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (currentSortColumn === column) {
                sortAscending = !sortAscending;
            } else {
                currentSortColumn = column;
                sortAscending = true;
            }

            integrationsData.sort((a, b) => {
                let valA = a[column].toLowerCase();
                let valB = b[column].toLowerCase();
                if (valA < valB) return sortAscending ? -1 : 1;
                if (valA > valB) return sortAscending ? 1 : -1;
                return 0;
            });

            renderTable(integrationsData);
        });
    });

    // 4. Modal & CRUD Operations
    function openModal(isEdit = false, item = null) {
        if (!modalOverlay) return;
        modalOverlay.classList.add('open');
        if (isEdit && item) {
            modalTitle.textContent = 'Edit Integration';
            document.getElementById('integration-name').value = item.name;
            document.getElementById('integration-code').value = item.code;
            document.getElementById('integration-category').value = item.category;
            document.getElementById('integration-status').value = item.status;
            document.getElementById('integration-desc').value = item.desc;
            editingItemId = item.id;
        } else {
            modalTitle.textContent = 'Add New Integration';
            integrationForm.reset();
            editingItemId = null;
        }
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('open');
        integrationForm.reset();
        editingItemId = null;
    }

    if (addNewBtn) addNewBtn.addEventListener('click', () => openModal(false));
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Form Submission for Add / Edit
    if (integrationForm) {
        integrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('integration-name').value.trim();
            const code = document.getElementById('integration-code').value.trim().toUpperCase() || name.substring(0, 2).toUpperCase();
            const category = document.getElementById('integration-category').value;
            const status = document.getElementById('integration-status').value;
            const desc = document.getElementById('integration-desc').value.trim();

            if (!name) return;

            if (editingItemId !== null) {
                // Edit existing
                integrationsData = integrationsData.map(item => {
                    if (item.id === editingItemId) {
                        return { ...item, name, code, category, status, desc };
                    }
                    return item;
                });
            } else {
                // Add new
                const newItem = {
                    id: Date.now(),
                    name,
                    code,
                    category,
                    status,
                    desc: desc || 'Custom integrated system service'
                };
                integrationsData.push(newItem);
            }

            renderTable(integrationsData);
            closeModal();
        });
    }

    // Table Action Listeners (Edit & Delete)
    function attachTableActionListeners() {
        document.querySelectorAll('.btn-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this integration?')) {
                    integrationsData = integrationsData.filter(item => item.id !== id);
                    renderTable(integrationsData);
                }
            });
        });

        document.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.getAttribute('data-id'));
                const item = integrationsData.find(i => i.id === id);
                if (item) {
                    openModal(true, item);
                }
            });
        });
    }

    // Initial table render
    renderTable(integrationsData);
});
