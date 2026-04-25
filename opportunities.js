// opportunities.js — connects to admin dashboard jobs & applications

let currentView = 'all';
let filteredOpportunities = [];

document.addEventListener('DOMContentLoaded', function () {
    displayOpportunities();
    updateOpportunitiesCount();

    document.getElementById('search-opportunities')?.addEventListener('input', filterOpportunities);
    document.getElementById('filter-type')?.addEventListener('change', filterOpportunities);
    document.getElementById('filter-skill')?.addEventListener('change', filterOpportunities);
    document.getElementById('filter-location')?.addEventListener('change', filterOpportunities);

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            filterOpportunities();
        });
    });

    document.getElementById('show-matches')?.addEventListener('click', function () {
        currentView = 'matched';
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.toggle-btn[data-view="matched"]').classList.add('active');
        filterOpportunities();
    });

    // Close detail modal
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    window.addEventListener('click', function (e) {
        if (e.target === document.getElementById('opportunity-modal')) closeModal();
        if (e.target === document.getElementById('apply-modal')) closeApplyModal();
    });

    // Apply form submission
    document.getElementById('apply-form')?.addEventListener('submit', submitApplication);
});

// ─── DISPLAY ───
function displayOpportunities(opps = null) {
    const container = document.getElementById('opportunities-container');
    const opportunities = opps || AppData.opportunities;

    if (!opportunities.length) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🔍</div>
                <h3>No opportunities found</h3>
                <p>Try adjusting your filters or add more skills to see matches!</p>
            </div>`;
        return;
    }

    container.innerHTML = opportunities.map(opp => {
        const appliedKey = 'applied_' + opp.id;
        const isApplied = AppData.appliedOpportunities.includes(opp.id) ||
            localStorage.getItem(appliedKey) === 'true';
        const showMatch = opp.matchScore > 0 && AppData.skills.length > 0;

        const adminBadge = opp.isAdminJob ? `
            <span class="tag" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;">
                ✦ DevBridge Project
            </span>` : '';

        const diffColor = {
            Easy: '#dcfce7|#166534',
            Medium: '#fef9c3|#854d0e',
            Hard: '#fee2e2|#991b1b'
        };
        const [bg, fg] = (diffColor[opp.difficulty] || '').split('|');
        const diffBadge = opp.difficulty ? `
            <span class="tag" style="background:${bg};color:${fg};border:1px solid ${bg};">
                ${opp.difficulty}
            </span>` : '';

        return `
        <div class="opportunity-card" data-opp-id="${opp.id}">
            <div class="opportunity-header">
                <h3>${opp.title}</h3>
                <p class="opportunity-company">${opp.company}</p>
            </div>

            <div class="opportunity-tags">
                <span class="tag type">${opp.type}</span>
                <span class="tag location">📍 ${opp.location}</span>
                ${opp.paid ? '<span class="tag skill">💰 Paid</span>' : ''}
                ${adminBadge}
                ${diffBadge}
            </div>

            ${showMatch ? `<div class="opportunity-match">${opp.matchScore}% Match with your skills!</div>` : ''}

            <p class="opportunity-description">${opp.description}</p>

            <div class="opportunity-footer">
                <div>
                    <strong>Duration:</strong> ${opp.duration}<br>
                    <strong>Skills:</strong> ${opp.requiredSkills.slice(0, 2).join(', ')}
                    ${opp.requiredSkills.length > 2 ? `+${opp.requiredSkills.length - 2}` : ''}
                </div>
            </div>

            <div class="opportunity-footer">
                <button class="btn-view-details" onclick="viewOpportunityDetails('${opp.id}')">
                    View Details
                </button>
                <button class="btn-apply" onclick="openApplyModal('${opp.id}')" ${isApplied ? 'disabled' : ''}>
                    ${isApplied ? 'Applied ✓' : 'Apply Now'}
                </button>
            </div>
        </div>`;
    }).join('');
}

function filterOpportunities() {
    const searchTerm = document.getElementById('search-opportunities').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const skillFilter = document.getElementById('filter-skill').value;
    const locationFilter = document.getElementById('filter-location').value;

    let filtered = [...AppData.opportunities];

    if (currentView === 'matched') {
        filtered = filtered.filter(o => o.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
    }
    if (searchTerm) {
        filtered = filtered.filter(o =>
            o.title.toLowerCase().includes(searchTerm) ||
            o.company.toLowerCase().includes(searchTerm) ||
            o.description.toLowerCase().includes(searchTerm)
        );
    }
    if (typeFilter) filtered = filtered.filter(o => o.type === typeFilter);
    if (skillFilter) filtered = filtered.filter(o => o.category === skillFilter);
    if (locationFilter) filtered = filtered.filter(o => o.location === locationFilter);

    filteredOpportunities = filtered;
    displayOpportunities(filtered);
    updateOpportunitiesCount(filtered.length);
}

function updateOpportunitiesCount(count = null) {
    const el = document.getElementById('opportunities-count');
    if (el) el.textContent = count !== null ? count : AppData.opportunities.length;
    const heroEl = document.getElementById('hero-count');
    if (heroEl) heroEl.textContent = AppData.opportunities.length;
}

// ─── DETAIL MODAL ───
function viewOpportunityDetails(oppId) {
    const opportunity = AppData.opportunities.find(o => String(o.id) === String(oppId));
    if (!opportunity) return;

    const modal = document.getElementById('opportunity-modal');
    const modalBody = document.getElementById('modal-body');
    const isApplied = AppData.appliedOpportunities.includes(opportunity.id) ||
        localStorage.getItem('applied_' + opportunity.id) === 'true';
    const showMatch = opportunity.matchScore > 0 && AppData.skills.length > 0;

    modalBody.innerHTML = `
        <h2>${opportunity.title}</h2>
        <h3 style="color:#666;font-weight:500;margin-top:4px;">${opportunity.company}</h3>

        <div class="opportunity-tags" style="margin:1rem 0;">
            <span class="tag type">${opportunity.type}</span>
            <span class="tag location">📍 ${opportunity.location}</span>
            ${opportunity.paid ? '<span class="tag skill">💰 Paid</span>' : '<span class="tag">Volunteer</span>'}
            ${opportunity.isAdminJob ? '<span class="tag" style="background:#e0f2fe;color:#0369a1;">✦ DevBridge Project</span>' : ''}
        </div>

        ${showMatch ? `<div class="opportunity-match" style="margin:1rem 0;">${opportunity.matchScore}% Match with your skills!</div>` : ''}

        <div style="margin:1.5rem 0;">
            <h4>Description</h4>
            <p style="margin-top:0.5rem;color:#444;line-height:1.7;">${opportunity.description}</p>
        </div>

        <div style="margin:1.5rem 0;">
            <h4>Required Skills</h4>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem;">
                ${opportunity.requiredSkills.map(s => `<span class="skill-badge">${s}</span>`).join('')}
            </div>
        </div>

        <div style="margin:1.5rem 0;">
            <h4>Details</h4>
            <p><strong>Duration:</strong> ${opportunity.duration}</p>
            <p><strong>Location:</strong> ${opportunity.location}</p>
            <p><strong>Type:</strong> ${opportunity.type}</p>
            ${opportunity.difficulty ? `<p><strong>Difficulty:</strong> ${opportunity.difficulty}</p>` : ''}
            ${opportunity.slots ? `<p><strong>Open Slots:</strong> ${opportunity.slots}</p>` : ''}
            <p><strong>Compensation:</strong> ${opportunity.paid ? 'Paid' : 'Volunteer / Experience'}</p>
        </div>

        <button class="btn-apply cta-button primary"
            onclick="closeModal(); openApplyModal('${opportunity.id}');"
            ${isApplied ? 'disabled' : ''}>
            ${isApplied ? 'Already Applied ✓' : 'Apply Now'}
        </button>`;

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('opportunity-modal')?.classList.remove('active');
}

// ─── APPLICATION MODAL ───
let currentApplyOppId = null;

function openApplyModal(oppId) {
    const isApplied = AppData.appliedOpportunities.includes(oppId) ||
        localStorage.getItem('applied_' + oppId) === 'true';
    if (isApplied) { Utils.showNotification('You have already applied!', 'error'); return; }

    currentApplyOppId = oppId;
    const opp = AppData.opportunities.find(o => String(o.id) === String(oppId));

    // Pre-fill skills from user profile
    const userSkills = AppData.skills.map(s => s.name).join(', ');
    document.getElementById('apply-skills').value = userSkills || '';
    document.getElementById('apply-job-title').textContent = opp ? opp.title : 'this opportunity';
    document.getElementById('apply-name').value = AppData.user?.name !== 'Guest' ? AppData.user.name : '';
    document.getElementById('apply-email').value = AppData.user?.email !== 'guest@devbridge.com' ? AppData.user.email : '';
    document.getElementById('apply-message').value = '';
    document.getElementById('apply-error').style.display = 'none';

    document.getElementById('apply-modal').classList.add('active');
}

function closeApplyModal() {
    document.getElementById('apply-modal')?.classList.remove('active');
    currentApplyOppId = null;
}

function submitApplication(e) {
    e.preventDefault();

    const name = document.getElementById('apply-name').value.trim();
    const email = document.getElementById('apply-email').value.trim();
    const skillsRaw = document.getElementById('apply-skills').value.trim();
    const message = document.getElementById('apply-message').value.trim();
    const errEl = document.getElementById('apply-error');

    if (!name || !email) {
        errEl.textContent = 'Please fill in your name and email.';
        errEl.style.display = 'block';
        return;
    }

    const opp = AppData.opportunities.find(o => String(o.id) === String(currentApplyOppId));
    const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

    // Save to admin dashboard applications
    const applications = JSON.parse(localStorage.getItem('applications')) || [];
    applications.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        jobId: opp?._adminId || currentApplyOppId,
        jobTitle: opp?.title || 'Unknown',
        name,
        email,
        skills,
        message,
        status: 'pending',
        date: new Date().toISOString()
    });
    localStorage.setItem('applications', JSON.stringify(applications));

    // Mark as applied on this site
    AppData.appliedOpportunities.push(currentApplyOppId);
    localStorage.setItem('applied_' + currentApplyOppId, 'true');
    Storage.save();

    closeApplyModal();
    filterOpportunities();
    Utils.showNotification('✓ Application submitted! We\'ll be in touch soon.');
}
