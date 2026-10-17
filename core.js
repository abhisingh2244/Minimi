/* NekoAssist core — runs in EVERY frame (all_frames) and holds all fill logic.
   content.js (top frame only) builds the UI on top of window.NekoCore. */
(() => {
    'use strict';
    if (window.NekoCore) return;

    const IS_TOP = window.top === window;
    const PROFILE_KEY = 'nekoAssistProfile';
    const RESUME_KEY = 'nekoAssistResume';
    const RULES_KEY = 'nekoSiteRules';
    const SETTINGS_KEY = 'nekoSettings';
    const MAX_AUTO_RUNS = 60;

    const EXPERIENCE_DEFAULTS = [
        {
            company: 'Boeing',
            role: 'Software Development Engineer II (SDE 2)',
            location: 'Bangalore, India',
            dates: 'Sep 2023–Present',
            description: 'Designed and built low-latency, multithreaded C++17 services on RTOS for real-time flight deck video streams. Improved throughput by 30% through cache-aware multithreading and memory-access optimizations. Resolved race conditions and deadlocks, reducing system failures by 90%. Built data-integrity and stale-data validation frameworks under DO-178-aligned standards.'
        },
        {
            company: 'Goldman Sachs',
            role: 'Cybersecurity Virtual Intern',
            location: 'Remote',
            dates: 'May 2023–Jun 2023',
            description: 'Configured enterprise firewalls, IDS/IPS and VPNs; evaluated cryptographic protocols used in financial infrastructure as part of security risk analysis.'
        },
        {
            company: 'JPMorgan Chase & Co.',
            role: 'Quantitative Developer Virtual Intern',
            location: 'Remote',
            dates: 'Sep 2022–Nov 2022',
            description: 'Built a Python and JavaScript backend for a live financial data dashboard, integrating real-time market data feeds. Automated anomaly-detection pipelines to flag irregularities across large datasets and reduce manual review.'
        }
    ];
    const PROJECT_DEFAULTS = [
        {
            title: 'Trading Simulator',
            technologies: 'C++, Lock-Free Programming, Linux, WebSockets',
            description: 'Built a multithreaded, sharded order-matching engine with a custom lock-free MPMC queue, sustaining 1.6–2.4M orders/sec. O(1) order cancellation; tuned queue depth to reduce p50 latency from 177ms to 0.84ms without measurable throughput cost. Includes benchmark CLI, Qt GUI and WebSocket server.',
            links: 'GitHub: https://github.com/abhisingh2244/Trading-Simulator | Demo: https://trading-simulator-htip.onrender.com/'
        },
        {
            title: 'Real-Time Video Fault Detection Pipeline',
            technologies: 'C++, Linux, Multithreading',
            description: 'Designed checksum- and timestamp-based frozen-frame detection with deterministic sub-100ms latency and diagnostic logging. Built a regression testbench and validation framework for data-integrity and stale-data checks under DO-178-aligned standards.',
            links: ''
        },
        {
            title: 'CodeBuddy',
            technologies: 'Node.js, Express, SQLite, REST APIs',
            description: 'Built a full-stack, 12-language online code runner with a vanilla JS/CodeMirror frontend and Node.js/Express REST API proxying Judge0. Designed SQLite-backed indexed run history and language success statistics; implemented API rate limiting and input validation.',
            links: 'GitHub: https://github.com/abhisingh2244/CodeBuddy | Demo: https://codebuddy-lln6.onrender.com/'
        }
    ];
    const DEFAULT_PROFILE = {
        name: 'Abhishek Kumar Singh',
        email: 'iitianabhisingh2244@gmail.com',
        phone: '+91 8542054587',
        location: 'Bangalore, India',
        linkedin: 'https://www.linkedin.com/in/abhisingh2244',
        github: 'https://github.com/abhisingh2244',
        headline: 'SDE 2 – Systems, Performance & Backend',
        summary: 'Software Engineer with 3+ years building low-latency, high-throughput systems in C++ and Python for safety-critical, real-time environments. Improved production throughput by 30% and cut system failures by 90% through cache-aware multithreading and hard concurrency debugging on live streaming pipelines. Comfortable across the stack: RTOS-level systems programming, distributed/lock-free architectures processing 1M+ events/sec, and REST-integrated, database-backed services. Ranked in the top 0.5% globally in Google Code Jam and top 1% in Meta Hacker Cup.',
        skills: 'Languages: C++, Python, JavaScript, Go, SQL\nSystems & Performance: Multithreading, Concurrency, Lock-Free Programming, Memory Optimization, RTOS, High-Throughput/Low-Latency Pipelines\nBackend & Data: REST APIs, Distributed Systems, PostgreSQL, SQL, Real-Time Data Pipelines\nInfrastructure: Linux, Docker, Cloud Computing, Storage Architecture\nPractices & Tools: Git, Software Test Engineering, Performance Profiling & Analysis, Debugging',
        education: 'Kamla Nehru Institute of Technology — Bachelor of Technology, Computer Science (GPA: 8.2/10), Jul 2019–May 2023',
        achievements: 'Google Code Jam: top 0.5% globally (400,000+ participants). Meta Hacker Cup: top 1% worldwide. Google Hash Code: global rank 2,508. CodeChef: 4-star, maximum rating 1908.'
    };
    EXPERIENCE_DEFAULTS.forEach((entry, index) => {
        Object.entries(entry).forEach(([key, value]) => {
            DEFAULT_PROFILE[`experience${index + 1}_${key}`] = value;
        });
    });
    PROJECT_DEFAULTS.forEach((entry, index) => {
        Object.entries(entry).forEach(([key, value]) => {
            DEFAULT_PROFILE[`project${index + 1}_${key}`] = value;
        });
    });

    Object.assign(DEFAULT_PROFILE, {
        country: 'India',
        workAuth: '',
        sponsorship: '',
        relocate: '',
        noticePeriod: '',
        currentCtc: '',
        expectedCtc: '',
        howHeard: '',
        customAnswers: ''
    });
    const YES_NO_KEYS = ['workAuth', 'sponsorship', 'relocate'];
    const TEXT_TYPES = ['text', 'email', 'tel', 'url', 'search', 'textarea'];
    const CONSENT_RE = /\b(agree|consent|terms|privacy|policy|acknowledge|certify|accept|gdpr|newsletter|subscribe|marketing|i understand|declare)\b/;

    /* ---------- storage ---------- */
    const storageGet = (key) => new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            const error = chrome.runtime.lastError;
            if (error) reject(new Error(error.message));
            else resolve(result ? result[key] : undefined);
        });
    });
    const storageSet = (obj) => new Promise((resolve, reject) => {
        chrome.storage.local.set(obj, () => {
            const error = chrome.runtime.lastError;
            if (error) reject(new Error(error.message));
            else resolve();
        });
    });
    const storageRemove = (key) => new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, () => {
            const error = chrome.runtime.lastError;
            if (error) reject(new Error(error.message));
            else resolve();
        });
    });

    function migrateLegacyEntries(profile, type, count) {
        if (typeof profile[type] !== 'string') return;
        const entries = profile[type].split(/\n\s*\n/).map((entry) => entry.trim()).filter(Boolean);
        entries.slice(0, count).forEach((entry, index) => {
            const description = entry.split(/\r?\n/).slice(1).join('\n').trim();
            if (description) profile[`${type === 'projects' ? 'project' : 'experience'}${index + 1}_description`] = description;
        });
        delete profile[type];
    }

    async function readProfile() {
        const saved = { ...((await storageGet(PROFILE_KEY)) || {}) };
        migrateLegacyEntries(saved, 'experience', EXPERIENCE_DEFAULTS.length);
        migrateLegacyEntries(saved, 'projects', PROJECT_DEFAULTS.length);
        return { ...DEFAULT_PROFILE, ...saved };
    }
    const writeProfile = (profile) => storageSet({ [PROFILE_KEY]: profile });
    const readResume = async () => (await storageGet(RESUME_KEY)) || null;
    const removeResume = () => storageRemove(RESUME_KEY);
    const readRules = async () => (await storageGet(RULES_KEY)) || {};
    const readSettings = async () => ({ autoFollow: true, ...((await storageGet(SETTINGS_KEY)) || {}) });
    const writeSettings = (settings) => storageSet({ [SETTINGS_KEY]: settings });

    function saveResume(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Could not read the file'));
            reader.onload = async () => {
                try {
                    const data = String(reader.result).split(',')[1] || '';
                    const resume = { name: file.name, type: file.type || 'application/pdf', size: file.size, data };
                    await storageSet({ [RESUME_KEY]: resume });
                    resolve(resume);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    /* ---------- messaging ---------- */
    const sendMessage = (message) => {
        try {
            chrome.runtime.sendMessage(message, () => void chrome.runtime.lastError);
        } catch (error) { /* extension was reloaded; ignore */ }
    };
    const NekoCore = { onTopPayload: null };
    const sendToTop = (payload) => {
        if (IS_TOP) {
            if (typeof NekoCore.onTopPayload === 'function') NekoCore.onTopPayload(payload);
        } else {
            sendMessage({ type: 'neko-to-top', payload });
        }
    };

    /* ---------- field description ---------- */
    const OUR_UI = '#neko-assist-panel, #neko-assist-cat, #neko-assist-picker-host';
    const isOursNode = (node) => {
        const el = node && node.nodeType === 1 ? node : node && node.parentElement;
        return Boolean(el && el.closest && el.closest(OUR_UI));
    };

    // Text of the element just before `node`, but only if it is plain label-like text
    // (not another field's label/group, which would leak that field's meaning onto this one).
    function precedingLabelText(node, maxLength) {
        const prev = node.previousElementSibling;
        if (!prev || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(prev.tagName)) return '';
        if (prev.querySelector && prev.querySelector('input, select, textarea')) return '';
        const text = (prev.textContent || '').trim();
        return text && text.length <= maxLength ? text : '';
    }

    function getFieldLabelParts(field) {
        const parts = [];
        if (field.labels) parts.push(...Array.from(field.labels, (label) => label.textContent || ''));
        const parentLabel = field.closest('label');
        if (parentLabel) parts.push(parentLabel.textContent || '');
        (field.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).forEach((id) => {
            const el = document.getElementById(id);
            if (el) parts.push(el.textContent || '');
        });
        if (!parts.join('').trim()) {
            // Fallback for sites that put the label in a nearby element instead of a real <label>
            let node = field;
            for (let depth = 0; depth < 3 && node && node !== document.body; depth += 1, node = node.parentElement) {
                const text = precedingLabelText(node, 80);
                if (text) { parts.push(text); break; }
            }
        }
        return parts;
    }

    function groupQuestionText(radio) {
        const parts = [];
        const legend = radio.closest('fieldset')?.querySelector('legend');
        if (legend) parts.push(legend.textContent || '');
        const group = radio.closest('[role="radiogroup"], [role="group"]');
        if (group) {
            parts.push(group.getAttribute('aria-label') || '');
            (group.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).forEach((id) => {
                const el = document.getElementById(id);
                if (el) parts.push(el.textContent || '');
            });
        }
        if (!parts.join('').trim()) {
            let node = radio.parentElement;
            for (let depth = 0; depth < 5 && node && node !== document.body; depth += 1, node = node.parentElement) {
                const text = precedingLabelText(node, 250);
                if (text) { parts.push(text); break; }
            }
        }
        return parts.join(' ');
    }

    function radioOptionText(radio) {
        const label = radio.labels && radio.labels[0];
        if (label) return label.textContent || '';
        const parentLabel = radio.closest('label');
        if (parentLabel) return parentLabel.textContent || '';
        const aria = radio.getAttribute('aria-label');
        if (aria) return aria;
        const next = (radio.nextElementSibling?.textContent || radio.nextSibling?.textContent || '').trim();
        return next || radio.value || '';
    }

    function getRadioGroup(radio) {
        if (!radio.name) return [radio];
        const root = radio.form || document;
        return Array.from(root.querySelectorAll('input[type="radio"]')).filter((r) => r.name === radio.name);
    }

    function buildMeta(raw) {
        return {
            // word-separated form: "firstName" -> "first name"
            metadata: raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[_\-.:[\]]+/g, ' '),
            // separator-free form so "firstname" / "phoneNumber" / "LinkedIn" still match
            compact: raw.toLowerCase().replace(/[^a-z0-9]/g, '')
        };
    }

    function metaFor(field) {
        const type = (field.type || '').toLowerCase();
        if (type === 'radio') return buildMeta([field.name, groupQuestionText(field)].join(' '));
        const legend = field.closest('fieldset')?.querySelector('legend');
        return buildMeta([
            field.name,
            field.id,
            field.placeholder,
            field.title,
            field.getAttribute('aria-label'),
            field.getAttribute('autocomplete'),
            field.getAttribute('data-automation-id'),
            field.getAttribute('data-testid'),
            field.getAttribute('data-qa'),
            ...getFieldLabelParts(field),
            legend?.textContent || ''
        ].join(' '));
    }

    /* ---------- field identification ---------- */
    function identifyFromMeta({ metadata, compact }, type) {
        const has = (pattern) => pattern.test(metadata);
        const hasCompact = (pattern) => pattern.test(compact);

        // Screening-question style answers (checked first: their labels contain words like "company")
        if (has(/authori[sz]ed to work|authori[sz]ation to work|legally (authori[sz]ed|eligible|permitted)|eligible to work|right to work|work authori[sz]ation/)) return 'workAuth';
        if (has(/sponsor/) || has(/require.*visa|visa.*require/)) return 'sponsorship';
        if (has(/relocat/)) return 'relocate';
        if (has(/notice period|how soon (can|could|would) you|earliest (start|joining)|available to (start|join)|joining time/)) return 'noticePeriod';
        if (has(/current (ctc|salary|compensation|package)|present (ctc|salary)|current annual/)) return 'currentCtc';
        if (has(/expected (ctc|salary|compensation|package)|salary expectation|desired (salary|compensation)|expected annual/)) return 'expectedCtc';
        if (has(/how did you (hear|find)|where did you (hear|find)|hear about (us|this)|referral source/)) return 'howHeard';
        if (has(/\bcountry\b/) && !has(/\bcode\b/)) return 'country';

        const projectContext = has(/\b(project|portfolio|work sample)\b/);
        const experienceContext = has(/\b(experience|employment|work history|job history|career)\b/);
        if (projectContext) {
            if (has(/\b(link|url|website|demo|github)\b/)) return 'project_links';
            if (has(/\b(technology|technologies|tech stack|tools)\b/)) return 'project_technologies';
            if (has(/\b(description|details|responsibilities)\b/)) return 'project_description';
            if (has(/\b(name|title)\b/)) return 'project_title';
            return 'project_all';
        }
        if (experienceContext || has(/\b(company|employer|position|job title|responsibilities|duties)\b/)) {
            if (has(/\b(company|employer|organization)\b/)) return 'experience_company';
            if (has(/\b(role|position|job title)\b/)) return 'experience_role';
            if (has(/\b(location|city)\b/)) return 'experience_location';
            if (has(/\b(date|duration|period|start|end|from|to)\b/)) return 'experience_dates';
            if (has(/\b(description|responsibilities|duties)\b/)) return 'experience_description';
            return 'experience_all';
        }
        if (has(/\b(first|given) name\b/) || hasCompact(/firstname|givenname|fname/)) return 'firstName';
        if (has(/\b(last|family) name\b|\bsurname\b/) || hasCompact(/lastname|familyname|surname|(?<!l)lname/)) return 'lastName';
        if (has(/\b(company|employer)\b/)) return 'experience_company';
        if (type === 'email' || has(/\bemail\b|\be mail\b/) || hasCompact(/email/)) return 'email';
        if (type === 'tel' || has(/\b(phone|telephone|mobile|cell)\b/) || hasCompact(/phone|mobile/)) return 'phone';
        if (has(/\blinkedin\b/) || hasCompact(/linkedin/)) return 'linkedin';
        if (has(/\bgithub\b/) || hasCompact(/github/)) return 'github';
        if (has(/\b(city|location|address level2)\b/)) return 'location';
        if (has(/\b(headline|professional title|job title)\b/)) return 'headline';
        if (has(/\b(skill|technology|tech stack)\b/)) return 'skills';
        if (has(/\b(achievement|award|honou?r|certification)\b/)) return 'achievements';
        if (has(/\b(project|portfolio|work sample)\b/)) return 'project_all';
        if (has(/\b(experience|employment|work history|job history|career)\b/)) return 'experience_all';
        if (has(/\b(education|university|college|degree)\b/)) return 'education';
        if (has(/\b(summary|about me|professional bio|profile summary)\b/)) return 'summary';
        if (has(/\b(full name|your name|applicant name)\b/) || hasCompact(/fullname|yourname|applicantname|candidatename/)) return 'name';
        if (has(/\bname\b/)) return 'name';
        return '';
    }

    function getProfileValue(profile, key, occurrence = 0) {
        if (!key) return '';
        if (key === 'firstName' || key === 'lastName') {
            const parts = (profile.name || '').trim().split(/\s+/);
            return key === 'firstName' ? parts[0] || '' : parts.length > 1 ? parts.slice(1).join(' ') : '';
        }
        const experienceField = key.match(/^experience_(company|role|location|dates|description)$/);
        if (experienceField) return profile[`experience${occurrence + 1}_${experienceField[1]}`] || '';
        const projectField = key.match(/^project_(title|technologies|description|links)$/);
        if (projectField) return profile[`project${occurrence + 1}_${projectField[1]}`] || '';
        if (key === 'experience_all') return EXPERIENCE_DEFAULTS.map((_, index) => [
            profile[`experience${index + 1}_company`],
            profile[`experience${index + 1}_role`],
            profile[`experience${index + 1}_dates`],
            profile[`experience${index + 1}_description`]
        ].filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
        if (key === 'project_all') return PROJECT_DEFAULTS.map((_, index) => [
            profile[`project${index + 1}_title`],
            profile[`project${index + 1}_technologies`],
            profile[`project${index + 1}_description`],
            profile[`project${index + 1}_links`]
        ].filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
        const value = profile[key];
        return typeof value === 'string' ? value : '';
    }

    /* "keywords = answer" lines. Use "a & b" to require several keywords. */
    function matchCustomAnswer(customText, metadata) {
        for (const line of String(customText || '').split(/\r?\n/)) {
            const index = line.indexOf('=');
            if (index < 1) continue;
            const keywords = line.slice(0, index).trim().toLowerCase();
            const answer = line.slice(index + 1).trim();
            if (!keywords || !answer) continue;
            const parts = keywords.split(/\s*&\s*/).filter(Boolean);
            if (parts.length && parts.every((part) => metadata.includes(part))) return answer;
        }
        return '';
    }

    /* ---------- per-site rules ---------- */
    function signatureFor(el) {
        const type = (el.type || '').toLowerCase();
        const tag = type === 'radio' ? 'radio' : `${el.tagName.toLowerCase()}:${type}`;
        const clean = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 50);
        const label = type === 'radio'
            ? groupQuestionText(el)
            : getFieldLabelParts(el).join(' ') || el.getAttribute('aria-label') || el.placeholder || '';
        const id = /^[a-z][a-z_-]{2,}$/i.test(el.id || '') ? el.id : '';
        return [tag, clean(el.name), clean(label), clean(id)].join('|');
    }

    /* ---------- choosing + applying values ---------- */
    const norm = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
    const yesNo = (normalized) => /^(yes|y|true)$/.test(normalized) ? 'yes' : /^(no|n|false)$/.test(normalized) ? 'no' : '';

    function chooseOption(items, desired, skipEmptyValue) {
        const d = norm(desired);
        if (!d) return null;
        const usable = items.filter((item) => {
            const text = norm(item.text);
            if (!text || /^(select|choose|please select|pick)\b/.test(text)) return false;
            return !(skipEmptyValue && item.value === '');
        });
        const yn = yesNo(d);
        if (yn) {
            const re = new RegExp(`^${yn}\\b`);
            const hit = usable.find((item) => re.test(norm(item.text))) || usable.find((item) => norm(item.value) === yn);
            if (hit) return hit.ref;
        }
        const found = usable.find((item) => norm(item.text) === d)
            || usable.find((item) => norm(item.value) === d)
            || usable.find((item) => norm(item.text).includes(d))
            || usable.find((item) => { const t = norm(item.text); return t.length >= 3 && d.includes(t); });
        return found ? found.ref : null;
    }

    function setFieldValue(field, value) {
        const prototype = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        setter.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function selectValue(select, value) {
        const items = Array.from(select.options).map((option) => ({ text: option.textContent, value: option.value, ref: option }));
        const hit = chooseOption(items, value, true);
        if (!hit) return false;
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        setter.call(select, hit.value);
        hit.selected = true;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function radioValue(radio, value) {
        const group = getRadioGroup(radio);
        const items = group.map((r) => ({ text: radioOptionText(r), value: r.value, ref: r }));
        const hit = chooseOption(items, value, false);
        if (!hit) return false;
        hit.click();
        return true;
    }

    function checkValue(checkbox, value) {
        if (yesNo(norm(value)) !== 'yes') return false;
        if (!checkbox.checked) checkbox.click();
        return true;
    }

    function applyValue(el, value) {
        if (!value) return false;
        const type = (el.type || '').toLowerCase();
        if (el.tagName === 'SELECT') return selectValue(el, value);
        if (type === 'radio') return radioValue(el, value);
        if (type === 'checkbox') return checkValue(el, value);
        if (type === 'file') return false;
        setFieldValue(el, value);
        return true;
    }

    function isSelectEmpty(select) {
        if (select.selectedIndex < 0 || select.value === '') return true;
        const first = select.options[0];
        return select.selectedIndex === 0 && Boolean(first) && /^(select|choose|please|pick)\b/.test(norm(first.textContent));
    }

    /* ---------- resume upload ---------- */
    function wantsResume(input, allFileInputs) {
        const { metadata, compact } = metaFor(input);
        if (/cover letter/.test(metadata) || /coverletter/.test(compact)) return false;
        const accept = (input.accept || '').toLowerCase();
        if (accept && !/pdf|application|\.docx?|\*/.test(accept)) return false;
        if (/resume|\bcv\b|curriculum/.test(metadata) || /resume|curriculum/.test(compact)) return true;
        return allFileInputs.length === 1;
    }

    function attachResume(input, resume) {
        const binary = atob(resume.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const file = new File([bytes], resume.name, { type: resume.type || 'application/pdf' });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /* ---------- the fill pass ---------- */
    function resolveKey(el, meta, rules, profile, type) {
        const rule = rules[signatureFor(el)];
        if (rule === 'skip') return { key: 'skip' };
        if (rule) return { key: rule };
        const custom = matchCustomAnswer(profile.customAnswers, meta.metadata);
        if (custom) return { key: 'custom', value: custom };
        return { key: identifyFromMeta(meta, type) };
    }

    let filling = false;
    async function fillDocument({ silent = false } = {}) {
        if (filling) return null;
        filling = true;
        try {
            const [profile, resume, allRules] = await Promise.all([readProfile(), readResume(), readRules()]);
            const rules = allRules[location.hostname] || {};
            const res = { frame: location.hostname, scanned: 0, checked: 0, filled: 0, files: 0, prefilled: 0, hidden: 0, rows: [] };
            const occurrences = {};
            const doneGroups = new Set();
            const controls = Array.from(document.querySelectorAll('input, textarea, select')).filter((el) => !isOursNode(el));
            const fileInputs = controls.filter((el) => el.type === 'file');

            for (const el of controls) {
                if (el.disabled) continue;
                const type = (el.type || '').toLowerCase();
                const tag = el.tagName;
                if (tag === 'INPUT' && ['hidden', 'submit', 'button', 'reset', 'image', 'password'].includes(type)) continue;
                res.scanned += 1;

                if (type === 'file') {
                    if (!resume || (el.files && el.files.length)) continue;
                    const rule = rules[signatureFor(el)];
                    if (rule === 'skip' || !(rule === 'resume' || wantsResume(el, fileInputs))) continue;
                    try {
                        attachResume(el, resume);
                        res.files += 1;
                    } catch (error) {
                        console.warn('[NekoAssist] Could not attach resume:', error);
                    }
                    continue;
                }

                if (el.readOnly) continue;
                const isChoice = type === 'radio' || type === 'checkbox';
                if (!isChoice && (el.getAttribute('aria-hidden') === 'true' || el.getClientRects().length === 0)) {
                    res.hidden += 1;
                    continue;
                }

                let target = el;
                let kind = 'text';
                if (type === 'radio') {
                    kind = 'radio';
                    const group = getRadioGroup(el);
                    if (doneGroups.has(group[0])) continue;
                    doneGroups.add(group[0]);
                    if (group.some((r) => r.checked)) { res.prefilled += 1; continue; }
                    target = group[0];
                } else if (type === 'checkbox') {
                    kind = 'checkbox';
                    if (el.checked) { res.prefilled += 1; continue; }
                } else if (tag === 'SELECT') {
                    kind = 'select';
                    if (el.multiple) continue;
                    if (!isSelectEmpty(el)) { res.prefilled += 1; continue; }
                } else {
                    if (!TEXT_TYPES.includes(type)) continue;
                    if (el.value.trim()) { res.prefilled += 1; continue; }
                }

                const meta = metaFor(target);
                if (kind === 'checkbox' && CONSENT_RE.test(meta.metadata)) continue; // never tick terms/consent boxes
                const resolved = resolveKey(target, meta, rules, profile, type);
                if (resolved.key === 'skip') continue;
                const occurrence = occurrences[resolved.key] || 0;
                if (resolved.key && resolved.key !== 'custom') occurrences[resolved.key] = occurrence + 1;
                const value = resolved.value !== undefined ? resolved.value : getProfileValue(profile, resolved.key, occurrence);
                res.checked += 1;
                const applied = value ? applyValue(target, value) : false;
                res.rows.push({ kind, name: target.name, id: target.id, detected: resolved.key || '(no match)', filled: applied });
                if (applied) res.filled += 1;
            }

            res.totalFilled = res.filled + res.files;
            if (!silent || res.totalFilled) {
                console.log(`[NekoAssist] ${location.hostname || 'frame'}: ${res.scanned} controls, ${res.hidden} hidden, ${res.prefilled} already filled, ${res.checked} checked, ${res.filled} filled, ${res.files} resume upload(s)`);
                if (res.rows.length && !silent) console.table(res.rows);
            }
            return res;
        } finally {
            filling = false;
        }
    }

    const summarise = (res, silent) => ({
        kind: 'fill-result',
        silent: Boolean(silent),
        scanned: res.scanned,
        checked: res.checked,
        filled: res.filled,
        files: res.files,
        prefilled: res.prefilled,
        hidden: res.hidden
    });

    /* ---------- auto-follow (multi-step forms / late-rendered fields) ---------- */
    let observer = null;
    let followTimer = null;
    let autoRuns = 0;

    function scheduleAutoFill(delay) {
        window.clearTimeout(followTimer);
        followTimer = window.setTimeout(async () => {
            if (!observer) return;
            autoRuns += 1;
            if (autoRuns > MAX_AUTO_RUNS) { stopAutoFollow(); return; }
            try {
                const res = await fillDocument({ silent: true });
                if (res && res.totalFilled) sendToTop(summarise(res, true));
            } catch (error) { /* ignore */ }
        }, delay);
    }

    function startAutoFollow() {
        if (observer) return;
        autoRuns = 0;
        observer = new MutationObserver((mutations) => {
            if (mutations.every((m) => isOursNode(m.target))) return;
            scheduleAutoFill(800);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        scheduleAutoFill(600);
    }

    function stopAutoFollow() {
        if (observer) observer.disconnect();
        observer = null;
        window.clearTimeout(followTimer);
    }

    /* ---------- teach mode: click a field, map it to a profile key, remember per site ---------- */
    const KEY_LABELS = {
        name: 'Full name', firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone',
        location: 'City / location', country: 'Country', linkedin: 'LinkedIn URL', github: 'GitHub URL',
        headline: 'Headline', summary: 'Summary', skills: 'Skills', education: 'Education', achievements: 'Achievements',
        workAuth: 'Authorized to work (Yes/No)', sponsorship: 'Needs sponsorship (Yes/No)', relocate: 'Willing to relocate (Yes/No)',
        noticePeriod: 'Notice period', currentCtc: 'Current CTC', expectedCtc: 'Expected CTC', howHeard: 'How did you hear about us',
        resume: 'Resume file'
    };

    function keyOptions() {
        const options = Object.entries(KEY_LABELS);
        Object.keys(DEFAULT_PROFILE).forEach((key) => {
            const match = key.match(/^(experience|project)(\d+)_(\w+)$/);
            if (match) options.push([key, `${match[1] === 'experience' ? 'Experience' : 'Project'} ${match[2]} – ${match[3]}`]);
        });
        options.push(['skip', 'Never fill this field']);
        return options;
    }

    const teach = { active: false, cleanup: null, timer: null };

    function closePicker() {
        const old = document.getElementById('neko-assist-picker-host');
        if (old) old.remove();
    }

    function openPicker(el) {
        closePicker();
        const host = document.createElement('div');
        host.id = 'neko-assist-picker-host';
        host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;';
        const root = host.attachShadow({ mode: 'closed' });
        const style = document.createElement('style');
        style.textContent = '.box{font:13px system-ui,sans-serif;background:#fffafd;color:#35242c;border:1px solid #f0c5d3;'
            + 'border-radius:12px;padding:12px;width:270px;box-shadow:0 10px 30px #30172440}'
            + '.t{font-weight:700;color:#a83d68;margin-bottom:8px}select{width:100%;padding:6px;margin-bottom:8px;border-radius:8px;border:1px solid #e6cbd5}'
            + 'button{border:0;border-radius:8px;padding:7px 12px;cursor:pointer;font:600 12px system-ui,sans-serif}'
            + '.s{background:#b94d77;color:#fff;margin-right:6px}.c{background:#f8e8ee;color:#813653}';
        const box = document.createElement('div');
        box.className = 'box';
        const title = document.createElement('div');
        title.className = 't';
        title.textContent = 'Map this field to…';
        const select = document.createElement('select');
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Choose a profile value';
        select.appendChild(blank);
        keyOptions().forEach(([key, label]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = label;
            select.appendChild(option);
        });
        const guess = identifyFromMeta(metaFor(el), (el.type || '').toLowerCase());
        if (guess && Array.from(select.options).some((o) => o.value === guess)) select.value = guess;
        const save = document.createElement('button');
        save.className = 's';
        save.textContent = 'Save & fill';
        const cancel = document.createElement('button');
        cancel.className = 'c';
        cancel.textContent = 'Cancel';
        box.append(title, select, save, cancel);
        root.append(style, box);
        document.documentElement.appendChild(host);

        const rect = el.getBoundingClientRect();
        host.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 290))}px`;
        host.style.top = `${Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 150))}px`;

        cancel.addEventListener('click', () => stopTeach(true));
        save.addEventListener('click', async () => {
            const key = select.value;
            if (!key) return;
            try {
                const rules = await readRules();
                const hostName = location.hostname;
                rules[hostName] = { ...(rules[hostName] || {}), [signatureFor(el)]: key };
                await storageSet({ [RULES_KEY]: rules });
                let note = '';
                if (key === 'resume') {
                    const resume = await readResume();
                    if ((el.type || '').toLowerCase() === 'file' && resume) { attachResume(el, resume); note = ' Resume attached.'; }
                } else if (key !== 'skip') {
                    const profile = await readProfile();
                    note = applyValue(el, getProfileValue(profile, key, 0)) ? ' Filled it now.' : ' (Nothing to fill yet — check that value in your profile.)';
                }
                const label = (keyOptions().find(([k]) => k === key) || [key, key])[1];
                sendToTop({ kind: 'status', text: `Saved for ${hostName || 'this site'}: field → ${label}.${note}` });
            } catch (error) {
                sendToTop({ kind: 'status', text: `Could not save the rule: ${error.message}`, error: true });
            }
            stopTeach(true);
        });
    }

    function startTeach() {
        if (teach.active) return;
        teach.active = true;
        const onPointer = (event) => {
            if (isOursNode(event.target)) return;
            const target = event.target && event.target.closest ? event.target : null;
            const control = target && (target.closest('input, textarea, select') || (target.closest('label') && target.closest('label').control));
            if (!control || ['hidden', 'submit', 'button', 'reset', 'image'].includes((control.type || '').toLowerCase())) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.type === 'mousedown') openPicker(control);
        };
        const onKey = (event) => { if (event.key === 'Escape') stopTeach(true); };
        document.addEventListener('mousedown', onPointer, true);
        document.addEventListener('click', onPointer, true);
        document.addEventListener('keydown', onKey, true);
        teach.cleanup = () => {
            document.removeEventListener('mousedown', onPointer, true);
            document.removeEventListener('click', onPointer, true);
            document.removeEventListener('keydown', onKey, true);
        };
        teach.timer = window.setTimeout(() => stopTeach(true), 90000);
    }

    function stopTeach(broadcast) {
        const wasActive = teach.active;
        teach.active = false;
        window.clearTimeout(teach.timer);
        if (teach.cleanup) teach.cleanup();
        teach.cleanup = null;
        closePicker();
        if (wasActive && broadcast) sendMessage({ type: 'neko-stop-teach' });
    }

    /* ---------- wiring ---------- */
    chrome.runtime.onMessage.addListener((message) => {
        switch (message && message.type) {
            case 'neko-run-fill':
                if (message.arm) startAutoFollow();
                fillDocument({ silent: false })
                    .then((res) => { if (res) sendToTop(summarise(res, false)); })
                    .catch((error) => sendToTop({ kind: 'status', text: `Fill failed: ${error.message}`, error: true }));
                break;
            case 'neko-teach':
                startTeach();
                break;
            case 'neko-stop-teach':
                stopTeach(false);
                break;
            case 'neko-stop':
                stopAutoFollow();
                break;
            case 'neko-top-payload':
                sendToTop(message.payload);
                break;
            default:
                break;
        }
    });

    try {
        chrome.runtime.sendMessage({ type: 'neko-hello', isTop: IS_TOP, host: location.hostname }, (response) => {
            void chrome.runtime.lastError;
            if (response && response.armed) startAutoFollow();
        });
    } catch (error) { /* extension reloaded */ }

    Object.assign(NekoCore, {
        IS_TOP,
        DEFAULT_PROFILE,
        EXPERIENCE_DEFAULTS,
        PROJECT_DEFAULTS,
        readProfile,
        writeProfile,
        readResume,
        saveResume,
        removeResume,
        readSettings,
        writeSettings,
        sendMessage,
        _internals: { identifyFromMeta, buildMeta, metaFor, chooseOption, fillDocument, matchCustomAnswer, signatureFor, applyValue, startAutoFollow, stopAutoFollow }
    });
    window.NekoCore = NekoCore;
})();
