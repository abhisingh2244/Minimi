// (() => {
//     if (document.getElementById('neko-assist-cat')) return;

//     const PROFILE_KEY = 'nekoAssistProfile';
//     const EXPERIENCE_DEFAULTS = [
//         {
//             company: 'Boeing',
//             role: 'Software Development Engineer II (SDE 2)',
//             location: 'Bangalore, India',
//             dates: 'Sep 2023–Present',
//             description: 'Designed and built low-latency, multithreaded C++17 services on RTOS for real-time flight deck video streams. Improved throughput by 30% through cache-aware multithreading and memory-access optimizations. Resolved race conditions and deadlocks, reducing system failures by 90%. Built data-integrity and stale-data validation frameworks under DO-178-aligned standards.'
//         },
//         {
//             company: 'Goldman Sachs',
//             role: 'Cybersecurity Virtual Intern',
//             location: 'Remote',
//             dates: 'May 2023–Jun 2023',
//             description: 'Configured enterprise firewalls, IDS/IPS and VPNs; evaluated cryptographic protocols used in financial infrastructure as part of security risk analysis.'
//         },
//         {
//             company: 'JPMorgan Chase & Co.',
//             role: 'Quantitative Developer Virtual Intern',
//             location: 'Remote',
//             dates: 'Sep 2022–Nov 2022',
//             description: 'Built a Python and JavaScript backend for a live financial data dashboard, integrating real-time market data feeds. Automated anomaly-detection pipelines to flag irregularities across large datasets and reduce manual review.'
//         }
//     ];
//     const PROJECT_DEFAULTS = [
//         {
//             title: 'Trading Simulator',
//             technologies: 'C++, Lock-Free Programming, Linux, WebSockets',
//             description: 'Built a multithreaded, sharded order-matching engine with a custom lock-free MPMC queue, sustaining 1.6–2.4M orders/sec. O(1) order cancellation; tuned queue depth to reduce p50 latency from 177ms to 0.84ms without measurable throughput cost. Includes benchmark CLI, Qt GUI and WebSocket server.',
//             links: 'GitHub: https://github.com/abhisingh2244/Trading-Simulator | Demo: https://trading-simulator-htip.onrender.com/'
//         },
//         {
//             title: 'Real-Time Video Fault Detection Pipeline',
//             technologies: 'C++, Linux, Multithreading',
//             description: 'Designed checksum- and timestamp-based frozen-frame detection with deterministic sub-100ms latency and diagnostic logging. Built a regression testbench and validation framework for data-integrity and stale-data checks under DO-178-aligned standards.',
//             links: ''
//         },
//         {
//             title: 'CodeBuddy',
//             technologies: 'Node.js, Express, SQLite, REST APIs',
//             description: 'Built a full-stack, 12-language online code runner with a vanilla JS/CodeMirror frontend and Node.js/Express REST API proxying Judge0. Designed SQLite-backed indexed run history and language success statistics; implemented API rate limiting and input validation.',
//             links: 'GitHub: https://github.com/abhisingh2244/CodeBuddy | Demo: https://codebuddy-lln6.onrender.com/'
//         }
//     ];
//     const DEFAULT_PROFILE = {
//         name: 'Abhishek Kumar Singh',
//         email: 'iitianabhisingh2244@gmail.com',
//         phone: '+91 8542054587',
//         location: 'Bangalore, India',
//         linkedin: 'https://www.linkedin.com/in/abhisingh2244',
//         github: 'https://github.com/abhisingh2244',
//         headline: 'SDE 2 – Systems, Performance & Backend',
//         summary: 'Software Engineer with 3+ years building low-latency, high-throughput systems in C++ and Python for safety-critical, real-time environments. Improved production throughput by 30% and cut system failures by 90% through cache-aware multithreading and hard concurrency debugging on live streaming pipelines. Comfortable across the stack: RTOS-level systems programming, distributed/lock-free architectures processing 1M+ events/sec, and REST-integrated, database-backed services. Ranked in the top 0.5% globally in Google Code Jam and top 1% in Meta Hacker Cup.',
//         skills: 'Languages: C++, Python, JavaScript, Go, SQL\nSystems & Performance: Multithreading, Concurrency, Lock-Free Programming, Memory Optimization, RTOS, High-Throughput/Low-Latency Pipelines\nBackend & Data: REST APIs, Distributed Systems, PostgreSQL, SQL, Real-Time Data Pipelines\nInfrastructure: Linux, Docker, Cloud Computing, Storage Architecture\nPractices & Tools: Git, Software Test Engineering, Performance Profiling & Analysis, Debugging',
//         education: 'Kamla Nehru Institute of Technology — Bachelor of Technology, Computer Science (GPA: 8.2/10), Jul 2019–May 2023',
//         achievements: 'Google Code Jam: top 0.5% globally (400,000+ participants). Meta Hacker Cup: top 1% worldwide. Google Hash Code: global rank 2,508. CodeChef: 4-star, maximum rating 1908.'
//     };
//     EXPERIENCE_DEFAULTS.forEach((entry, index) => {
//         Object.entries(entry).forEach(([key, value]) => {
//             DEFAULT_PROFILE[`experience${index + 1}_${key}`] = value;
//         });
//     });
//     PROJECT_DEFAULTS.forEach((entry, index) => {
//         Object.entries(entry).forEach(([key, value]) => {
//             DEFAULT_PROFILE[`project${index + 1}_${key}`] = value;
//         });
//     });
//     const profileFields = [
//         { key: 'name', label: 'Full name', autocomplete: 'name' },
//         { key: 'email', label: 'Email', autocomplete: 'email' },
//         { key: 'phone', label: 'Phone', autocomplete: 'tel' },
//         { key: 'location', label: 'City / location', autocomplete: 'address-level2' },
//         { key: 'linkedin', label: 'LinkedIn URL', autocomplete: 'url' },
//         { key: 'github', label: 'GitHub URL', autocomplete: 'url' },
//         { key: 'headline', label: 'Professional headline', multiline: true },
//         { key: 'summary', label: 'Professional summary', multiline: true },
//         { key: 'skills', label: 'Skills', multiline: true },
//         { key: 'education', label: 'Education', multiline: true },
//         { key: 'achievements', label: 'Achievements', multiline: true }
//     ];

//     const cat = document.createElement('button');
//     cat.id = 'neko-assist-cat';
//     cat.type = 'button';
//     cat.setAttribute('aria-label', 'Open NekoAssist form helper');
//     cat.setAttribute('aria-expanded', 'false');
//     cat.title = 'NekoAssist — click to open';
//     const krishnaImage = document.createElement('img');
//     krishnaImage.className = 'neko-krishna-image';
//     krishnaImage.alt = 'Krishna';
//     cat.appendChild(krishnaImage);
//     const krishnaImages = [
//         'krishna.png',
//         'krishna2.png',
//         'Krishna3.png',
//         'krishna4.png',
//         'krishna5.png'
//     ];
//     const imageCycleStorageKey = 'nekoKrishnaImageCycleStartedAt';
//     const imageCycleDuration = 30 * 60 * 1000;
//     let imageCycleStartedAt;
//     let imageChangeTimeout;
//     let displayedImageIndex = -1;

//     const updateKrishnaImage = () => {
//         if (!Number.isFinite(imageCycleStartedAt)) return;
//         const elapsed = Math.max(0, Date.now() - imageCycleStartedAt);
//         const imageIndex = Math.floor(elapsed / imageCycleDuration) % krishnaImages.length;
//         if (imageIndex !== displayedImageIndex) {
//             displayedImageIndex = imageIndex;
//             krishnaImage.src = chrome.runtime.getURL(krishnaImages[imageIndex]);
//             cat.title = `Krishna ${imageIndex + 1} of ${krishnaImages.length} — changes every 30 minutes`;
//         }
//         window.clearTimeout(imageChangeTimeout);
//         const nextChangeAt = imageCycleStartedAt + (Math.floor(elapsed / imageCycleDuration) + 1) * imageCycleDuration;
//         imageChangeTimeout = window.setTimeout(updateKrishnaImage, Math.max(0, nextChangeAt - Date.now()));
//     };

//     krishnaImage.addEventListener('error', () => {
//         setStatus(`Could not load Krishna image: ${krishnaImages[displayedImageIndex]}`, true);
//     });

//     const startKrishnaImageCycle = () => {
//         chrome.storage.local.get(imageCycleStorageKey, (result) => {
//             const error = chrome.runtime.lastError;
//             if (error) {
//                 setStatus(`Could not load Krishna image rotation settings: ${error.message}`, true);
//                 return;
//             }
//             const savedStart = result[imageCycleStorageKey];
//             if (Number.isFinite(savedStart)) {
//                 imageCycleStartedAt = savedStart;
//                 updateKrishnaImage();
//                 return;
//             }
//             imageCycleStartedAt = Date.now();
//             chrome.storage.local.set({ [imageCycleStorageKey]: imageCycleStartedAt }, () => {
//                 const saveError = chrome.runtime.lastError;
//                 if (saveError) {
//                     setStatus(`Could not save Krishna image rotation settings: ${saveError.message}`, true);
//                     return;
//                 }
//                 updateKrishnaImage();
//             });
//         });
//     };

//     const panel = document.createElement('section');
//     panel.id = 'neko-assist-panel';
//     panel.setAttribute('aria-label', 'NekoAssist form helper');
//     panel.hidden = true;

//     const header = document.createElement('header');
//     header.className = 'neko-header';
//     const title = document.createElement('div');
//     title.className = 'neko-title';
//     title.textContent = 'NekoAssist';
//     const closeButton = document.createElement('button');
//     closeButton.className = 'neko-close';
//     closeButton.type = 'button';
//     closeButton.setAttribute('aria-label', 'Close');
//     closeButton.textContent = '×';
//     header.append(title, closeButton);

//     const intro = document.createElement('p');
//     intro.className = 'neko-intro';
//     intro.textContent = 'Your profile stays in this browser. Review the fields before filling a form.';

//     const profileForm = document.createElement('form');
//     profileForm.className = 'neko-profile';
//     const addProfileField = ({ key, label, autocomplete, multiline }) => {
//         const field = document.createElement('label');
//         field.className = 'neko-field';
//         field.textContent = label;
//         const input = document.createElement(multiline ? 'textarea' : 'input');
//         input.dataset.profileKey = key;
//         input.autocomplete = autocomplete || 'off';
//         input.rows = multiline ? 3 : 1;
//         if (!multiline) input.type = key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text';
//         field.appendChild(input);
//         profileForm.appendChild(field);
//     };
//     profileFields.slice(0, 9).forEach(addProfileField);
//     const addProfileGroup = (titleText, entries, prefix, properties) => {
//         const group = document.createElement('section');
//         group.className = 'neko-profile-group';
//         const heading = document.createElement('h3');
//         heading.textContent = titleText;
//         group.appendChild(heading);
//         entries.forEach((entry, index) => {
//             const card = document.createElement('fieldset');
//             card.className = 'neko-entry-card';
//             const legend = document.createElement('legend');
//             legend.textContent = `${titleText} ${index + 1}`;
//             card.appendChild(legend);
//             properties.forEach(({ key, label, multiline }) => {
//                 const field = document.createElement('label');
//                 field.className = 'neko-field';
//                 field.textContent = label;
//                 const input = document.createElement(multiline ? 'textarea' : 'input');
//                 input.dataset.profileKey = `${prefix}${index + 1}_${key}`;
//                 input.autocomplete = 'off';
//                 if (multiline) input.rows = key === 'description' ? 5 : 2;
//                 else input.type = 'text';
//                 field.appendChild(input);
//                 card.appendChild(field);
//             });
//             group.appendChild(card);
//         });
//         profileForm.appendChild(group);
//     };
//     addProfileGroup('Work experience', EXPERIENCE_DEFAULTS, 'experience', [
//         { key: 'company', label: 'Company' },
//         { key: 'role', label: 'Role' },
//         { key: 'location', label: 'Location' },
//         { key: 'dates', label: 'Dates' },
//         { key: 'description', label: 'Responsibilities', multiline: true }
//     ]);
//     addProfileGroup('Projects', PROJECT_DEFAULTS, 'project', [
//         { key: 'title', label: 'Project name' },
//         { key: 'technologies', label: 'Technologies' },
//         { key: 'description', label: 'Description', multiline: true },
//         { key: 'links', label: 'Links' }
//     ]);
//     profileFields.slice(9).forEach(addProfileField);

//     const saveButton = document.createElement('button');
//     saveButton.className = 'neko-button neko-secondary';
//     saveButton.type = 'submit';
//     saveButton.textContent = 'Save profile';
//     profileForm.appendChild(saveButton);

//     const fillButton = document.createElement('button');
//     fillButton.className = 'neko-button neko-primary';
//     fillButton.type = 'button';
//     fillButton.textContent = 'Fill this form';

//     const status = document.createElement('p');
//     status.className = 'neko-status';
//     status.setAttribute('role', 'status');
//     status.setAttribute('aria-live', 'polite');
//     status.textContent = 'Add your details, then save your profile.';

//     panel.append(header, intro, profileForm, fillButton, status);
//     document.documentElement.append(cat, panel);

//     const readProfile = () => new Promise((resolve, reject) => {
//         chrome.storage.local.get(PROFILE_KEY, (result) => {
//             const error = chrome.runtime.lastError;
//             if (error) {
//                 reject(new Error(error.message));
//                 return;
//             }
//             const saved = { ...(result[PROFILE_KEY] || {}) };
//             migrateLegacyEntries(saved, 'experience', EXPERIENCE_DEFAULTS.length);
//             migrateLegacyEntries(saved, 'projects', PROJECT_DEFAULTS.length);
//             resolve({ ...DEFAULT_PROFILE, ...saved });
//         });
//     });

//     function migrateLegacyEntries(profile, type, count) {
//         if (typeof profile[type] !== 'string') return;
//         const entries = profile[type].split(/\n\s*\n/).map((entry) => entry.trim()).filter(Boolean);
//         entries.slice(0, count).forEach((entry, index) => {
//             const description = entry.split(/\r?\n/).slice(1).join('\n').trim();
//             if (description) profile[`${type === 'projects' ? 'project' : 'experience'}${index + 1}_description`] = description;
//         });
//         delete profile[type];
//     }

//     const writeProfile = (profile) => new Promise((resolve, reject) => {
//         chrome.storage.local.set({ [PROFILE_KEY]: profile }, () => {
//             const error = chrome.runtime.lastError;
//             if (error) {
//                 reject(new Error(error.message));
//                 return;
//             }
//             resolve();
//         });
//     });

//     const setStatus = (message, isError = false) => {
//         status.textContent = message;
//         status.classList.toggle('neko-error', isError);
//     };

//     const loadProfile = async () => {
//         try {
//             const profile = await readProfile();
//             profileForm.querySelectorAll('[data-profile-key]').forEach((input) => {
//                 input.value = profile[input.dataset.profileKey] || '';
//             });
//             if (Object.values(profile).some((value) => typeof value === 'string' && value.trim())) {
//                 setStatus('Profile loaded. You can review or update it any time.');
//             }
//         } catch (error) {
//             setStatus(`Could not load your profile: ${error.message}`, true);
//         }
//     };

//     const positionPanel = () => {
//         if (panel.hidden) return;
//         const catRect = cat.getBoundingClientRect();
//         const panelWidth = Math.min(340, window.innerWidth - 24);
//         const panelHeight = Math.min(panel.scrollHeight, window.innerHeight - 24);
//         const left = Math.max(12, Math.min(catRect.left + catRect.width - panelWidth, window.innerWidth - panelWidth - 12));
//         const top = catRect.top > panelHeight + 16
//             ? catRect.top - panelHeight - 12
//             : Math.min(catRect.bottom + 12, window.innerHeight - panelHeight - 12);
//         panel.style.left = `${left}px`;
//         panel.style.top = `${Math.max(12, top)}px`;
//     };

//     const openPanel = async () => {
//         panel.hidden = false;
//         cat.setAttribute('aria-expanded', 'true');
//         positionPanel();
//         await loadProfile();
//     };

//     const closePanel = () => {
//         panel.hidden = true;
//         cat.setAttribute('aria-expanded', 'false');
//     };

//     cat.addEventListener('click', () => {
//         if (cat.dataset.dragged === 'true') {
//             delete cat.dataset.dragged;
//             return;
//         }
//         if (panel.hidden) openPanel();
//         else closePanel();
//     });
//     closeButton.addEventListener('click', closePanel);
//     window.addEventListener('resize', positionPanel);

//     profileForm.addEventListener('submit', async (event) => {
//         event.preventDefault();
//         const profile = {};
//         profileForm.querySelectorAll('[data-profile-key]').forEach((input) => {
//             profile[input.dataset.profileKey] = input.value.trim();
//         });
//         try {
//             await writeProfile(profile);
//             setStatus('Profile saved on this device.');
//         } catch (error) {
//             setStatus(`Could not save your profile: ${error.message}`, true);
//         }
//     });

//     fillButton.addEventListener('click', async () => {
//         let profile;
//         try {
//             profile = await readProfile();
//         } catch (error) {
//             setStatus(`Could not load your profile: ${error.message}`, true);
//             return;
//         }

//         const fields = document.querySelectorAll('input, textarea');
//         let filledCount = 0;
//         const fieldOccurrences = {};
//         fields.forEach((field) => {
//             if (field === cat || panel.contains(field) || field.disabled || field.readOnly) return;
//             if (!['INPUT', 'TEXTAREA'].includes(field.tagName)) return;
//             if (field.tagName === 'INPUT' && !['text', 'email', 'tel', 'url', 'search'].includes(field.type)) return;
//             if (field.value.trim() || field.getAttribute('aria-hidden') === 'true' || field.getClientRects().length === 0) return;

//             const profileField = identifyProfileField(field);
//             const occurrence = fieldOccurrences[profileField] || 0;
//             fieldOccurrences[profileField] = occurrence + 1;
//             const value = getProfileValue(profile, profileField, occurrence);
//             if (!value) return;
//             setFieldValue(field, value);
//             filledCount += 1;
//         });

//         setStatus(filledCount
//             ? `Filled ${filledCount} empty field${filledCount === 1 ? '' : 's'}. Please review before submitting.`
//             : 'No matching empty fields found. Add profile details or check the form labels.');
//     });

//     function identifyProfileField(field) {
//         const labelParts = [];
//         if (field.labels) labelParts.push(...Array.from(field.labels, (label) => label.textContent || ''));
//         const parentLabel = field.closest('label');
//         if (parentLabel) labelParts.push(parentLabel.textContent || '');
//         const fieldsetLegend = field.closest('fieldset')?.querySelector('legend');

//         const metadata = [
//             field.name,
//             field.id,
//             field.placeholder,
//             field.getAttribute('aria-label'),
//             field.getAttribute('autocomplete'),
//             ...labelParts,
//             fieldsetLegend?.textContent || ''
//         ].join(' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[_-]+/g, ' ');
//         const has = (pattern) => pattern.test(metadata);

//         const projectContext = has(/\b(project|portfolio|work sample)\b/);
//         const experienceContext = has(/\b(experience|employment|work history|job history|career)\b/);
//         if (projectContext) {
//             if (has(/\b(link|url|website|demo|github)\b/)) return 'project_links';
//             if (has(/\b(technology|technologies|tech stack|tools)\b/)) return 'project_technologies';
//             if (has(/\b(description|details|responsibilities)\b/)) return 'project_description';
//             if (has(/\b(name|title)\b/)) return 'project_title';
//             return 'project_all';
//         }
//         if (experienceContext || has(/\b(company|employer|position|job title|responsibilities|duties)\b/)) {
//             if (has(/\b(company|employer|organization)\b/)) return 'experience_company';
//             if (has(/\b(role|position|job title)\b/)) return 'experience_role';
//             if (has(/\b(location|city)\b/)) return 'experience_location';
//             if (has(/\b(date|duration|period|start|end|from|to)\b/)) return 'experience_dates';
//             if (has(/\b(description|responsibilities|duties)\b/)) return 'experience_description';
//             return 'experience_all';
//         }
//         if (has(/\b(first|given) name\b/)) return 'firstName';
//         if (has(/\b(last|family) name\b|\bsurname\b/)) return 'lastName';
//         if (has(/\b(company|employer)\b/)) return 'experience_company';
//         if (field.type === 'email' || has(/\bemail\b|\be mail\b/)) return 'email';
//         if (field.type === 'tel' || has(/\b(phone|telephone|mobile|cell)\b/)) return 'phone';
//         if (has(/\blinkedin\b/)) return 'linkedin';
//         if (has(/\bgithub\b/)) return 'github';
//         if (has(/\b(city|location|address level2)\b/)) return 'location';
//         if (has(/\b(headline|professional title|job title)\b/)) return 'headline';
//         if (has(/\b(skill|technology|tech stack)\b/)) return 'skills';
//         if (has(/\b(achievement|award|honou?r|certification)\b/)) return 'achievements';
//         if (has(/\b(project|portfolio|work sample)\b/)) return 'project_all';
//         if (has(/\b(experience|employment|work history|job history|career)\b/)) return 'experience_all';
//         if (has(/\b(education|university|college|degree)\b/)) return 'education';
//         if (has(/\b(summary|about me|professional bio|profile summary)\b/)) return 'summary';
//         if (has(/\b(full name|your name|applicant name)\b/)) return 'name';
//         if (has(/\bname\b/)) return 'name';
//         return '';
//     }

//     function getProfileValue(profile, key, occurrence = 0) {
//         if (key === 'firstName' || key === 'lastName') {
//             const parts = (profile.name || '').trim().split(/\s+/);
//             return key === 'firstName' ? parts[0] || '' : parts.length > 1 ? parts.slice(1).join(' ') : '';
//         }
//         const experienceField = key.match(/^experience_(company|role|location|dates|description)$/);
//         if (experienceField) return profile[`experience${occurrence + 1}_${experienceField[1]}`] || '';
//         const projectField = key.match(/^project_(title|technologies|description|links)$/);
//         if (projectField) return profile[`project${occurrence + 1}_${projectField[1]}`] || '';
//         if (key === 'experience_all') return EXPERIENCE_DEFAULTS.map((_, index) => [
//             profile[`experience${index + 1}_company`],
//             profile[`experience${index + 1}_role`],
//             profile[`experience${index + 1}_dates`],
//             profile[`experience${index + 1}_description`]
//         ].filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
//         if (key === 'project_all') return PROJECT_DEFAULTS.map((_, index) => [
//             profile[`project${index + 1}_title`],
//             profile[`project${index + 1}_technologies`],
//             profile[`project${index + 1}_description`],
//             profile[`project${index + 1}_links`]
//         ].filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
//         return profile[key] || '';
//     }

//     function setFieldValue(field, value) {
//         const prototype = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
//         const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
//         setter.call(field, value);
//         field.dispatchEvent(new Event('input', { bubbles: true }));
//         field.dispatchEvent(new Event('change', { bubbles: true }));
//     }

//     startKrishnaImageCycle();
//     loadProfile();
// })();
(() => {
    if (document.getElementById('neko-assist-cat')) return;

    const PROFILE_KEY = 'nekoAssistProfile';
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
        { key: 'achievements', label: 'Achievements', multiline: true }
    ];

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
    const krishnaImages = [
        'krishna.png',
        'krishna2.png',
        'Krishna3.png',
        'krishna4.png',
        'krishna5.png'
    ];
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
            krishnaImage.src = chrome.runtime.getURL(krishnaImages[imageIndex]);
            cat.title = `Krishna ${imageIndex + 1} of ${krishnaImages.length} — changes every 30 minutes`;
        }
        window.clearTimeout(imageChangeTimeout);
        const nextChangeAt = imageCycleStartedAt + (Math.floor(elapsed / imageCycleDuration) + 1) * imageCycleDuration;
        imageChangeTimeout = window.setTimeout(updateKrishnaImage, Math.max(0, nextChangeAt - Date.now()));
    };

    krishnaImage.addEventListener('error', () => {
        setStatus(`Could not load Krishna image: ${krishnaImages[displayedImageIndex]}`, true);
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
    const addProfileField = ({ key, label, autocomplete, multiline }) => {
        const field = document.createElement('label');
        field.className = 'neko-field';
        field.textContent = label;
        const input = document.createElement(multiline ? 'textarea' : 'input');
        input.dataset.profileKey = key;
        input.autocomplete = autocomplete || 'off';
        input.rows = multiline ? 3 : 1;
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
    addProfileGroup('Work experience', EXPERIENCE_DEFAULTS, 'experience', [
        { key: 'company', label: 'Company' },
        { key: 'role', label: 'Role' },
        { key: 'location', label: 'Location' },
        { key: 'dates', label: 'Dates' },
        { key: 'description', label: 'Responsibilities', multiline: true }
    ]);
    addProfileGroup('Projects', PROJECT_DEFAULTS, 'project', [
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

    const fillButton = document.createElement('button');
    fillButton.className = 'neko-button neko-primary';
    fillButton.type = 'button';
    fillButton.textContent = 'Fill this form';

    const status = document.createElement('p');
    status.className = 'neko-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Add your details, then save your profile.';

    panel.append(header, intro, profileForm, fillButton, status);
    document.documentElement.append(cat, panel);

    const readProfile = () => new Promise((resolve, reject) => {
        chrome.storage.local.get(PROFILE_KEY, (result) => {
            const error = chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            const saved = { ...(result[PROFILE_KEY] || {}) };
            migrateLegacyEntries(saved, 'experience', EXPERIENCE_DEFAULTS.length);
            migrateLegacyEntries(saved, 'projects', PROJECT_DEFAULTS.length);
            resolve({ ...DEFAULT_PROFILE, ...saved });
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

    const writeProfile = (profile) => new Promise((resolve, reject) => {
        chrome.storage.local.set({ [PROFILE_KEY]: profile }, () => {
            const error = chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            resolve();
        });
    });

    const setStatus = (message, isError = false) => {
        status.textContent = message;
        status.classList.toggle('neko-error', isError);
    };

    const loadProfile = async () => {
        try {
            const profile = await readProfile();
            profileForm.querySelectorAll('[data-profile-key]').forEach((input) => {
                input.value = profile[input.dataset.profileKey] || '';
            });
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
            await writeProfile(profile);
            setStatus('Profile saved on this device.');
        } catch (error) {
            setStatus(`Could not save your profile: ${error.message}`, true);
        }
    });

    fillButton.addEventListener('click', async () => {
        let profile;
        try {
            profile = await readProfile();
        } catch (error) {
            setStatus(`Could not load your profile: ${error.message}`, true);
            return;
        }

        const fields = document.querySelectorAll('input, textarea');
        let filledCount = 0;
        let hiddenCount = 0;
        let prefilledCount = 0;
        const report = [];
        const fieldOccurrences = {};
        fields.forEach((field) => {
            if (field === cat || panel.contains(field) || field.disabled || field.readOnly) return;
            if (!['INPUT', 'TEXTAREA'].includes(field.tagName)) return;
            if (field.tagName === 'INPUT' && !['text', 'email', 'tel', 'url', 'search'].includes(field.type)) return;
            if (field.getAttribute('aria-hidden') === 'true' || field.getClientRects().length === 0) { hiddenCount += 1; return; }
            if (field.value.trim()) { prefilledCount += 1; return; }

            const profileField = identifyProfileField(field);
            const occurrence = fieldOccurrences[profileField] || 0;
            fieldOccurrences[profileField] = occurrence + 1;
            const value = getProfileValue(profile, profileField, occurrence);
            report.push({
                name: field.name, id: field.id, placeholder: field.placeholder,
                detected: profileField || '(no match)', filled: Boolean(value)
            });
            if (!value) return;
            setFieldValue(field, value);
            filledCount += 1;
        });

        console.log(`[NekoAssist] ${fields.length} inputs in this frame; ${hiddenCount} hidden, ${prefilledCount} already filled, ${report.length} checked, ${filledCount} filled`);
        if (report.length) console.table(report);

        if (filledCount) {
            setStatus(`Filled ${filledCount} empty field${filledCount === 1 ? '' : 's'}. Please review before submitting.`);
        } else if (!fields.length) {
            setStatus('No input fields found in this frame. The form may be inside an iframe.', true);
        } else {
            setStatus(`No matches: ${report.length} empty fields checked, ${prefilledCount} already filled, ${hiddenCount} hidden. Details are in the console.`);
        }
    });

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
                const text = (node.previousElementSibling?.textContent || '').trim();
                if (text && text.length <= 80) { parts.push(text); break; }
            }
        }
        return parts;
    }

    function identifyProfileField(field) {
        const labelParts = getFieldLabelParts(field);
        const fieldsetLegend = field.closest('fieldset')?.querySelector('legend');

        const raw = [
            field.name,
            field.id,
            field.placeholder,
            field.title,
            field.getAttribute('aria-label'),
            field.getAttribute('autocomplete'),
            field.getAttribute('data-automation-id'),
            field.getAttribute('data-testid'),
            field.getAttribute('data-qa'),
            ...labelParts,
            fieldsetLegend?.textContent || ''
        ].join(' ');
        const metadata = raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[_\-.:\[\]]+/g, ' ');
        // Same text with every separator removed, so names like "firstname" / "phoneNumber" still match
        const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
        const has = (pattern) => pattern.test(metadata);
        const hasCompact = (pattern) => pattern.test(compact);

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
        if (field.type === 'email' || has(/\bemail\b|\be mail\b/) || hasCompact(/email/)) return 'email';
        if (field.type === 'tel' || has(/\b(phone|telephone|mobile|cell)\b/) || hasCompact(/phone|mobile/)) return 'phone';
        if (has(/\blinkedin\b/)) return 'linkedin';
        if (has(/\bgithub\b/)) return 'github';
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
        return profile[key] || '';
    }

    function setFieldValue(field, value) {
        const prototype = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        setter.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    startKrishnaImageCycle();
    loadProfile();
})();