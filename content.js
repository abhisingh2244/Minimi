/* NekoAssist UI — top frame only. All fill logic lives in core.js (window.NekoCore). */
(() => {
    if (window.top !== window) return;
    if (document.getElementById('neko-assist-cat')) return;
    const core = window.NekoCore;
    if (!core) return;

    const profileFields = [
        { key: 'name', label: 'Full name', autocomplete: 'name' },
        { key: 'email', label: 'Email', autocomplete: 'email' },
        { key: 'phone', label: 'Phone', autocomplete: 'tel' },
        { key: 'location', label: 'City / location', autocomplete: 'address-level2' },
        { key: 'linkedin', label: 'LinkedIn URL', autocomplete: 'url' },
        { key: 'github', label: 'GitHub URL', autocomplete: 'url' },
        { key: 'headline', label: 'Professional headline', multiline: true },
        { key: 'summary', label: 'Professional summary', multiline: true },
        { key: 'skills', label: 'Skills', multiline: true },
        { key: 'education', label: 'Education', multiline: true },
        { key: 'achievements', label: 'Achievements', multiline: true },
        { key: 'country', label: 'Country' },
        { key: 'workAuth', label: 'Authorized to work? (Yes / No)' },
        { key: 'sponsorship', label: 'Need visa sponsorship? (Yes / No)' },
        { key: 'relocate', label: 'Willing to relocate? (Yes / No)' },
        { key: 'noticePeriod', label: 'Notice period' },
        { key: 'currentCtc', label: 'Current CTC / salary' },
        { key: 'expectedCtc', label: 'Expected CTC / salary' },
        { key: 'howHeard', label: 'How did you hear about us?' },
        {
            key: 'customAnswers',
            label: 'Custom answers — one per line: keywords = answer (use & for several keywords)',
            multiline: true,
            placeholder: 'gender = Male\nveteran = No\ndisability & status = No'
        }
    ];

    /* ---------- floating image ---------- */
    const cat = document.createElement('button');
    cat.id = 'neko-assist-cat';
    cat.type = 'button';
    cat.setAttribute('aria-label', 'Open NekoAssist form helper');
    cat.setAttribute('aria-expanded', 'false');
    cat.title = 'NekoAssist — click to open';
    const krishnaImage = document.createElement('img');
    krishnaImage.className = 'neko-krishna-image';
    krishnaImage.alt = 'Krishna';
    cat.appendChild(krishnaImage);
    const krishnaImages = ['krishna.png', 'krishna2.png', 'Krishna3.png', 'krishna4.png', 'krishna5.png'];
    const imageCycleStorageKey = 'nekoKrishnaImageCycleStartedAt';
    const imageCycleDuration = 30 * 60 * 1000;
    let imageCycleStartedAt;
    let imageChangeTimeout;
    let displayedImageIndex = -1;

    const updateKrishnaImage = () => {
        if (!Number.isFinite(imageCycleStartedAt)) return;
        const elapsed = Math.max(0, Date.now() - imageCycleStartedAt);
        const imageIndex = Math.floor(elapsed / imageCycleDuration) % krishnaImages.length;
        if (imageIndex !== displayedImageIndex) {
            displayedImageIndex = imageIndex;
            delete krishnaImage.dataset.fallback;
            krishnaImage.src = chrome.runtime.getURL(krishnaImages[imageIndex]);
            cat.title = `Krishna ${imageIndex + 1} of ${krishnaImages.length} — changes every 30 minutes`;
        }
        window.clearTimeout(imageChangeTimeout);
        const nextChangeAt = imageCycleStartedAt + (Math.floor(elapsed / imageCycleDuration) + 1) * imageCycleDuration;
        imageChangeTimeout = window.setTimeout(updateKrishnaImage, Math.max(0, nextChangeAt - Date.now()));
    };

    krishnaImage.addEventListener('error', () => {
        // A listed image is missing from the extension folder: fall back to the first one
        if (!krishnaImage.dataset.fallback) {
            krishnaImage.dataset.fallback = '1';
            krishnaImage.src = chrome.runtime.getURL('krishna.png');
        } else {
            setStatus(`Could not load Krishna image: ${krishnaImages[displayedImageIndex]}`, true);
        }
    });

    const startKrishnaImageCycle = () => {
        chrome.storage.local.get(imageCycleStorageKey, (result) => {
            const error = chrome.runtime.lastError;
            if (error) {
                setStatus(`Could not load Krishna image rotation settings: ${error.message}`, true);
                return;
            }
            const savedStart = result[imageCycleStorageKey];
            if (Number.isFinite(savedStart)) {
                imageCycleStartedAt = savedStart;
                updateKrishnaImage();
                return;
            }
            imageCycleStartedAt = Date.now();
            chrome.storage.local.set({ [imageCycleStorageKey]: imageCycleStartedAt }, () => {
                const saveError = chrome.runtime.lastError;
                if (saveError) {
                    setStatus(`Could not save Krishna image rotation settings: ${saveError.message}`, true);
                    return;
                }
                updateKrishnaImage();
            });
        });
    };

    /* ---------- panel ---------- */
    const panel = document.createElement('section');
    panel.id = 'neko-assist-panel';
    panel.setAttribute('aria-label', 'NekoAssist form helper');
    panel.hidden = true;

    const header = document.createElement('header');
    header.className = 'neko-header';
    const title = document.createElement('div');
    title.className = 'neko-title';
    title.textContent = 'NekoAssist';
    const closeButton = document.createElement('button');
    closeButton.className = 'neko-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.textContent = '×';
    header.append(title, closeButton);

    const intro = document.createElement('p');
    intro.className = 'neko-intro';
    intro.textContent = 'Your profile stays in this browser. Review the fields before filling a form.';

    const profileForm = document.createElement('form');
    profileForm.className = 'neko-profile';
    const addProfileField = ({ key, label, autocomplete, multiline, placeholder }) => {
        const field = document.createElement('label');
        field.className = 'neko-field';
        field.textContent = label;
        const input = document.createElement(multiline ? 'textarea' : 'input');
        input.dataset.profileKey = key;
        input.autocomplete = autocomplete || 'off';
        input.rows = multiline ? 3 : 1;
        if (placeholder) input.placeholder = placeholder;
        if (!multiline) input.type = key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text';
        field.appendChild(input);
        profileForm.appendChild(field);
    };
    profileFields.slice(0, 9).forEach(addProfileField);
    const addProfileGroup = (titleText, entries, prefix, properties) => {
        const group = document.createElement('section');
        group.className = 'neko-profile-group';
        const heading = document.createElement('h3');
        heading.textContent = titleText;
        group.appendChild(heading);
        entries.forEach((entry, index) => {
            const card = document.createElement('fieldset');
            card.className = 'neko-entry-card';
            const legend = document.createElement('legend');
            legend.textContent = `${titleText} ${index + 1}`;
            card.appendChild(legend);
            properties.forEach(({ key, label, multiline }) => {
                const field = document.createElement('label');
                field.className = 'neko-field';
                field.textContent = label;
                const input = document.createElement(multiline ? 'textarea' : 'input');
                input.dataset.profileKey = `${prefix}${index + 1}_${key}`;
                input.autocomplete = 'off';
                if (multiline) input.rows = key === 'description' ? 5 : 2;
                else input.type = 'text';
                field.appendChild(input);
                card.appendChild(field);
            });
            group.appendChild(card);
        });
        profileForm.appendChild(group);
    };
    addProfileGroup('Work experience', core.EXPERIENCE_DEFAULTS, 'experience', [
        { key: 'company', label: 'Company' },
        { key: 'role', label: 'Role' },
        { key: 'location', label: 'Location' },
        { key: 'dates', label: 'Dates' },
        { key: 'description', label: 'Responsibilities', multiline: true }
    ]);
    addProfileGroup('Projects', core.PROJECT_DEFAULTS, 'project', [
        { key: 'title', label: 'Project name' },
        { key: 'technologies', label: 'Technologies' },
        { key: 'description', label: 'Description', multiline: true },
        { key: 'links', label: 'Links' }
    ]);
    profileFields.slice(9).forEach(addProfileField);

    const saveButton = document.createElement('button');
    saveButton.className = 'neko-button neko-secondary';
    saveButton.type = 'submit';
    saveButton.textContent = 'Save profile';
    profileForm.appendChild(saveButton);

    /* resume */
    const resumeBox = document.createElement('div');
    resumeBox.className = 'neko-resume';
    const resumeHeading = document.createElement('h3');
    resumeHeading.textContent = 'Resume';
    const resumeField = document.createElement('label');
    resumeField.className = 'neko-field';
    resumeField.textContent = 'Resume file (PDF or Word, up to 4 MB)';
    const resumeInput = document.createElement('input');
    resumeInput.type = 'file';
    resumeInput.accept = '.pdf,.doc,.docx,application/pdf';
    resumeField.appendChild(resumeInput);
    const resumeInfo = document.createElement('p');
    resumeInfo.className = 'neko-intro';
    resumeInfo.textContent = 'No resume saved yet.';
    const removeResumeButton = document.createElement('button');
    removeResumeButton.className = 'neko-button neko-secondary';
    removeResumeButton.type = 'button';
    removeResumeButton.textContent = 'Remove saved resume';
    removeResumeButton.hidden = true;
    resumeBox.append(resumeHeading, resumeField, resumeInfo, removeResumeButton);

    /* actions */
    const fillButton = document.createElement('button');
    fillButton.className = 'neko-button neko-primary';
    fillButton.type = 'button';
    fillButton.textContent = 'Fill this form';

    const teachButton = document.createElement('button');
    teachButton.className = 'neko-button neko-secondary';
    teachButton.type = 'button';
    teachButton.textContent = 'Teach a field…';
    teachButton.title = 'Click a field on the page, choose which profile value it should get, and it is remembered for this site.';

    const followLabel = document.createElement('label');
    followLabel.className = 'neko-check';
    const followBox = document.createElement('input');
    followBox.type = 'checkbox';
    followLabel.append(followBox, document.createTextNode(' Keep filling new steps in this tab'));

    const status = document.createElement('p');
    status.className = 'neko-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Add your details, then save your profile.';

    panel.append(header, intro, profileForm, resumeBox, fillButton, teachButton, followLabel, status);
    document.documentElement.append(cat, panel);

    const setStatus = (message, isError = false) => {
        status.textContent = message;
        status.classList.toggle('neko-error', isError);
    };

    /* ---------- profile, resume, settings ---------- */
    const showResume = (resume) => {
        if (resume) {
            resumeInfo.textContent = `Saved: ${resume.name} (${Math.max(1, Math.round(resume.size / 1024))} KB). It is attached to resume/CV upload fields when you fill.`;
            removeResumeButton.hidden = false;
        } else {
            resumeInfo.textContent = 'No resume saved yet.';
            removeResumeButton.hidden = true;
        }
    };

    const loadProfile = async () => {
        try {
            const [profile, resume, settings] = await Promise.all([core.readProfile(), core.readResume(), core.readSettings()]);
            profileForm.querySelectorAll('[data-profile-key]').forEach((input) => {
                input.value = profile[input.dataset.profileKey] || '';
            });
            followBox.checked = settings.autoFollow;
            showResume(resume);
            if (Object.values(profile).some((value) => typeof value === 'string' && value.trim())) {
                setStatus('Profile loaded. You can review or update it any time.');
            }
        } catch (error) {
            setStatus(`Could not load your profile: ${error.message}`, true);
        }
    };

    const positionPanel = () => {
        if (panel.hidden) return;
        const catRect = cat.getBoundingClientRect();
        const panelWidth = Math.min(340, window.innerWidth - 24);
        const panelHeight = Math.min(panel.scrollHeight, window.innerHeight - 24);
        const left = Math.max(12, Math.min(catRect.left + catRect.width - panelWidth, window.innerWidth - panelWidth - 12));
        const top = catRect.top > panelHeight + 16
            ? catRect.top - panelHeight - 12
            : Math.min(catRect.bottom + 12, window.innerHeight - panelHeight - 12);
        panel.style.left = `${left}px`;
        panel.style.top = `${Math.max(12, top)}px`;
    };

    const openPanel = async () => {
        panel.hidden = false;
        cat.setAttribute('aria-expanded', 'true');
        positionPanel();
        await loadProfile();
    };

    const closePanel = () => {
        panel.hidden = true;
        cat.setAttribute('aria-expanded', 'false');
        profileForm.reset(); // keep profile values out of the page's DOM while the panel is closed
    };

    cat.addEventListener('click', () => {
        if (cat.dataset.dragged === 'true') {
            delete cat.dataset.dragged;
            return;
        }
        if (panel.hidden) openPanel();
        else closePanel();
    });
    closeButton.addEventListener('click', closePanel);
    window.addEventListener('resize', positionPanel);

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const profile = {};
        profileForm.querySelectorAll('[data-profile-key]').forEach((input) => {
            profile[input.dataset.profileKey] = input.value.trim();
        });
        try {
            await core.writeProfile(profile);
            setStatus('Profile saved on this device.');
        } catch (error) {
            setStatus(`Could not save your profile: ${error.message}`, true);
        }
    });

    resumeInput.addEventListener('change', async () => {
        const file = resumeInput.files && resumeInput.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            setStatus('That file is larger than 4 MB. Please choose a smaller resume.', true);
            resumeInput.value = '';
            return;
        }
        try {
            showResume(await core.saveResume(file));
            setStatus('Resume saved on this device.');
        } catch (error) {
            setStatus(`Could not save the resume: ${error.message}`, true);
        }
        resumeInput.value = '';
    });

    removeResumeButton.addEventListener('click', async () => {
        try {
            await core.removeResume();
            showResume(null);
            setStatus('Saved resume removed.');
        } catch (error) {
            setStatus(`Could not remove the resume: ${error.message}`, true);
        }
    });

    followBox.addEventListener('change', async () => {
        try {
            const settings = await core.readSettings();
            await core.writeSettings({ ...settings, autoFollow: followBox.checked });
            if (!followBox.checked) core.sendMessage({ type: 'neko-disarm' });
        } catch (error) {
            setStatus(`Could not save the setting: ${error.message}`, true);
        }
    });

    /* ---------- fill + teach ---------- */
    let agg = null;
    const newAgg = () => ({ reported: 0, frames: 0, scanned: 0, checked: 0, filled: 0, files: 0, prefilled: 0, hidden: 0 });

    const renderAgg = () => {
        const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
        if (agg.filled || agg.files) {
            const parts = [];
            if (agg.filled) parts.push(`Filled ${plural(agg.filled, 'field')}`);
            if (agg.files) parts.push(`${agg.filled ? 'attached' : 'Attached'} your resume to ${plural(agg.files, 'upload field')}`);
            const frames = agg.frames > 1 ? ` across ${agg.frames} frames` : '';
            setStatus(`${parts.join(' and ')}${frames}. Please review before submitting.`);
        } else if (!agg.scanned) {
            setStatus('No form fields found yet. If the form loads in a later step, leave "Keep filling new steps" on.');
        } else {
            setStatus(`No matches: checked ${agg.checked} empty fields (${agg.prefilled} already filled, ${agg.hidden} hidden). Use "Teach a field…" or see the console for details.`);
        }
    };

    core.onTopPayload = (payload) => {
        if (!payload) return;
        if (payload.kind === 'status') {
            setStatus(payload.text, Boolean(payload.error));
            return;
        }
        if (payload.kind !== 'fill-result') return;
        if (!agg) agg = newAgg();
        agg.reported += 1;
        if (payload.scanned) agg.frames += 1;
        ['scanned', 'checked', 'filled', 'files', 'prefilled', 'hidden'].forEach((k) => { agg[k] += payload[k] || 0; });
        renderAgg();
    };

    fillButton.addEventListener('click', async () => {
        agg = newAgg();
        setStatus('Filling…');
        let settings;
        try {
            settings = await core.readSettings();
        } catch (error) {
            settings = { autoFollow: true };
        }
        core.sendMessage({ type: 'neko-fill-request', arm: settings.autoFollow, host: location.hostname });
        window.setTimeout(() => {
            if (agg && !agg.reported) setStatus('No response from the page. Reload this tab (and the extension, if you just updated it) and try again.', true);
        }, 2500);
    });

    teachButton.addEventListener('click', () => {
        core.sendMessage({ type: 'neko-teach' });
        setStatus('Teach mode: click the field you want to map on the page. Press Esc to cancel.');
    });

    startKrishnaImageCycle();
})();
