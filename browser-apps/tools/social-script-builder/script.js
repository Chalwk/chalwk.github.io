/*
	Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

    Social Script Builder JavaScript
*/

(() => {
    const STORAGE_KEY = "social-script-builder-v1";
    const STEP_TYPES = {
        statement: { name: "I Say", color: "step-type-statement" },
        question: { name: "They Might Say", color: "step-type-question" },
        action: { name: "Action I Take", color: "step-type-action" },
        reminder: { name: "Reminder to Self", color: "step-type-reminder" },
        transition: { name: "Transition", color: "step-type-transition" },
        observation: { name: "Observation", color: "step-type-observation" },
        validation: { name: "Validation", color: "step-type-validation" },
        boundary: { name: "Boundary", color: "step-type-boundary" },
        followup: { name: "Follow-up", color: "step-type-followup" },
        closure: { name: "Closure", color: "step-type-closure" }
    };

    const PREMADE_SCRIPTS = [
        {
            id: "greeting-script",
            title: "Greeting Someone",
            description: "Meeting someone new or greeting familiar people",
            steps: [
                { id: "g1", type: "statement", text: "Hi [Name]! It's good to see you.", order: 0 },
                { id: "g2", type: "question", text: "Hi [Name], it's good to see you too.", order: 1 },
                { id: "g3", type: "statement", text: "How have you been since we last talked?", order: 2 },
                { id: "g4", type: "question", text: "I've been doing well, thanks! How about you?", order: 3 },
                { id: "g5", type: "statement", text: "I'm doing well too, thank you.", order: 4 },
                { id: "g6", type: "reminder", text: "If eye contact feels hard, I'll smile at their forehead or shoulder", order: 5 },
                { id: "g7", type: "reminder", text: "Taking one deep breath before speaking calms my nerves", order: 6 }
            ]
        },
        {
            id: "introduction-script",
            title: "Introducing Myself",
            description: "Meeting someone for the first time",
            steps: [
                { id: "i1", type: "statement", text: "Hello, I'm Jay. It's nice to meet you.", order: 0 },
                { id: "i2", type: "question", text: "Hi Jay, I'm [Name]. Nice to meet you too.", order: 1 },
                { id: "i3", type: "statement", text: "I enjoy [hobby].", order: 2 },
                { id: "i4", type: "question", text: "What do you do in your free time?", order: 3 },
                { id: "i5", type: "statement", text: "I like to [activity]. What about you?", order: 4 },
                { id: "i6", type: "reminder", text: "I'll write 3 bullet points about myself beforehand", order: 5 },
                { id: "i7", type: "reminder", text: "If feeling shy, I'll focus just on 'Hello, I'm Jay' + smile", order: 6 }
            ]
        },
        {
            id: "help-script",
            title: "Asking for Help/Clarification",
            description: "Confused by instructions or missing information",
            steps: [
                { id: "h1", type: "statement", text: "Excuse me, could you please explain that again?", order: 0 },
                { id: "h2", type: "question", text: "Sure, [clarified version]", order: 1 },
                { id: "h3", type: "statement", text: "Thank you - I understand now.", order: 2 },
                { id: "h4", type: "question", text: "I'm busy right now.", order: 3 },
                { id: "h5", type: "statement", text: "No problem. When would be a good time?", order: 4 },
                { id: "h6", type: "reminder", text: "Keep a notepad ready for written explanations", order: 5 },
                { id: "h7", type: "reminder", text: "If overwhelmed: 'Would email instructions work better for me?'", order: 6 }
            ]
        },
        {
            id: "boundaries-script",
            title: "Expressing Boundaries",
            description: "Physical/emotional discomfort in interactions",
            steps: [
                { id: "b1", type: "statement", text: "I feel uncomfortable when [specific action]. Could we [alternative]?", order: 0 },
                { id: "b2", type: "statement", text: "Example: 'I feel uncomfortable with hugs. Could we wave instead?'", order: 1 },
                { id: "b3", type: "question", text: "Sorry! I didn't realize.", order: 2 },
                { id: "b4", type: "statement", text: "Thank you for understanding.", order: 3 },
                { id: "b5", type: "question", text: "You're too sensitive.", order: 4 },
                { id: "b6", type: "statement", text: "This is important for my wellbeing.", order: 5 },
                { id: "b7", type: "reminder", text: "Pre-identify 3 non-negotiable boundaries", order: 6 },
                { id: "b8", type: "reminder", text: "Practice power stance (feet apart, shoulders back) before speaking", order: 7 }
            ]
        },
        {
            id: "ending-script",
            title: "Ending Conversations",
            description: "Need to leave or feeling drained",
            steps: [
                { id: "e1", type: "statement", text: "It was great talking with you!", order: 0 },
                { id: "e2", type: "action", text: "Start gathering belongings", order: 1 },
                { id: "e3", type: "statement", text: "I need to [specific reason] now.", order: 2 },
                { id: "e4", type: "statement", text: "Examples: '...get to my next meeting', '...recharge alone for a bit'", order: 3 },
                { id: "e5", type: "question", text: "Wait - one more thing!", order: 4 },
                { id: "e6", type: "statement", text: "I have 1 minute - what's most important?", order: 5 },
                { id: "e7", type: "reminder", text: "Set phone vibration alert at exit time", order: 6 },
                { id: "e8", type: "reminder", text: "Have exit phrase ready: 'My social battery is low - need to recharge'", order: 7 }
            ]
        },
        {
            id: "smalltalk-script",
            title: "Small Talk",
            description: "Filling silence with acquaintances",
            steps: [
                { id: "s1", type: "statement", text: "This [event/place] has great [observation], doesn't it?", order: 0 },
                { id: "s2", type: "statement", text: "Examples: 'The coffee here is strong today!', 'This webinar has useful slides'", order: 1 },
                { id: "s3", type: "question", text: "Yes! I especially like...", order: 2 },
                { id: "s4", type: "statement", text: "What's your favorite part?", order: 3 },
                { id: "s5", type: "question", text: "Meh, it's okay.", order: 4 },
                { id: "s6", type: "statement", text: "Are you working on anything interesting lately?", order: 5 },
                { id: "s7", type: "reminder", text: "Prepare 3 universal questions: 'Seen any good movies?', 'Tried new food spots?', 'Working on any projects?'", order: 6 },
                { id: "s8", type: "reminder", text: "Allow 5-second pauses - silence is normal", order: 7 }
            ]
        },
        {
            id: "needs-script",
            title: "Discussing My Needs",
            description: "Meetings or new social settings",
            steps: [
                { id: "n1", type: "statement", text: "I thrive when I have [accommodation]. This helps me [benefit].", order: 0 },
                { id: "n2", type: "statement", text: "Example: 'I do best with written instructions. This helps me deliver accurate information.'", order: 1 },
                { id: "n3", type: "question", text: "We can arrange that!", order: 2 },
                { id: "n4", type: "statement", text: "Would Thursday deadlines work better than Friday?", order: 3 },
                { id: "n5", type: "question", text: "That's unusual.", order: 4 },
                { id: "n6", type: "statement", text: "Many neurodivergent people need this. Here's a helpful article...", order: 5 },
                { id: "n7", type: "reminder", text: "Bring printed accommodation suggestions", order: 6 },
                { id: "n8", type: "reminder", text: "Script key phrases on index card", order: 7 }
            ]
        },
        {
            id: "interruption-script",
            title: "Handling Interruptions",
            description: "When someone interrupts me while speaking",
            steps: [
                { id: "int1", type: "statement", text: "I'd like to finish my thought first.", order: 0 },
                { id: "int2", type: "action", text: "Hold up one finger briefly to signal 'one moment'", order: 1 },
                { id: "int3", type: "statement", text: "As I was saying...", order: 2 },
                { id: "int4", type: "question", text: "But this is more important!", order: 3 },
                { id: "int5", type: "statement", text: "I understand it's important. I'll be done in a moment.", order: 4 },
                { id: "int6", type: "reminder", text: "It's okay to assert my right to speak", order: 5 },
                { id: "int7", type: "boundary", text: "I deserve to finish my sentences without interruption", order: 6 }
            ]
        },
        {
            id: "overwhelm-script",
            title: "Managing Sensory Overload",
            description: "When environments become overwhelming",
            steps: [
                { id: "ov1", type: "observation", text: "I notice the lights/sounds are becoming overwhelming", order: 0 },
                { id: "ov2", type: "statement", text: "I need to take a brief break to reset.", order: 1 },
                { id: "ov3", type: "action", text: "Move to a quieter space or step outside", order: 2 },
                { id: "ov4", type: "action", text: "Use noise-canceling headphones or sunglasses if available", order: 3 },
                { id: "ov5", type: "reminder", text: "Focus on breathing slowly for 60 seconds", order: 4 },
                { id: "ov6", type: "reminder", text: "This feeling will pass - I am safe", order: 5 },
                { id: "ov7", type: "statement", text: "I'm ready to return now.", order: 6 }
            ]
        },
        {
            id: "conflict-script",
            title: "Resolving Disagreements",
            description: "Navigating differences of opinion calmly",
            steps: [
                { id: "c1", type: "validation", text: "I understand we see this differently.", order: 0 },
                { id: "c2", type: "statement", text: "Can you help me understand your perspective?", order: 1 },
                { id: "c3", type: "statement", text: "From my point of view...", order: 2 },
                { id: "c4", type: "question", text: "You're wrong about this.", order: 3 },
                { id: "c5", type: "statement", text: "I respect that we may not agree on this.", order: 4 },
                { id: "c6", type: "boundary", text: "Let's focus on the issue, not personal attacks", order: 5 },
                { id: "c7", type: "closure", text: "I think we've both shared our views. Should we move on?", order: 6 }
            ]
        },
        {
            id: "group-script",
            title: "Joining Group Conversations",
            description: "Entering existing conversations smoothly",
            steps: [
                { id: "gr1", type: "observation", text: "Observe the conversation topic before joining", order: 0 },
                { id: "gr2", type: "action", text: "Make eye contact with one person and smile", order: 1 },
                { id: "gr3", type: "statement", text: "Mind if I join you?", order: 2 },
                { id: "gr4", type: "transition", text: "That reminds me of...", order: 3 },
                { id: "gr5", type: "question", text: "What were you discussing?", order: 4 },
                { id: "gr6", type: "reminder", text: "It's okay to listen more than speak at first", order: 5 },
                { id: "gr7", type: "reminder", text: "Groups are loud - it's fine to step back if needed", order: 6 }
            ]
        },
        {
            id: "feedback-script",
            title: "Giving and Receiving Feedback",
            description: "Constructive communication in work/school settings",
            steps: [
                { id: "f1", type: "statement", text: "I have some thoughts about the project. Is now a good time?", order: 0 },
                { id: "f2", type: "statement", text: "I noticed [specific observation].", order: 1 },
                { id: "f3", type: "statement", text: "One suggestion I have is...", order: 2 },
                { id: "f4", type: "question", text: "I need feedback on my work.", order: 3 },
                { id: "f5", type: "action", text: "Take notes during feedback to process later", order: 4 },
                { id: "f6", type: "reminder", text: "Feedback is about the work, not me as a person", order: 5 },
                { id: "f7", type: "validation", text: "Thank you for this feedback - it's helpful.", order: 6 }
            ]
        },
        {
            id: "phone-script",
            title: "Phone Calls",
            description: "Structured approach to telephone conversations",
            steps: [
                { id: "p1", type: "statement", text: "Hello, this is [Name] speaking.", order: 0 },
                { id: "p2", type: "statement", text: "I'm calling about [specific reason].", order: 1 },
                { id: "p3", type: "action", text: "Have pen and paper ready for important information", order: 2 },
                { id: "p4", type: "question", text: "Could you repeat that please?", order: 3 },
                { id: "p5", type: "statement", text: "Let me read that back to confirm...", order: 4 },
                { id: "p6", type: "reminder", text: "It's okay to ask for a moment to process", order: 5 },
                { id: "p7", type: "closure", text: "Thank you for your help. Goodbye.", order: 6 }
            ]
        },
        {
            id: "dating-script",
            title: "Dating Situations",
            description: "Navigating romantic social interactions",
            steps: [
                { id: "d1", type: "statement", text: "I've enjoyed getting to know you.", order: 0 },
                { id: "d2", type: "question", text: "What are you looking for in a relationship?", order: 1 },
                { id: "d3", type: "boundary", text: "I prefer to take physical intimacy slowly.", order: 2 },
                { id: "d4", type: "statement", text: "As an autistic person, I sometimes...", order: 3 },
                { id: "d5", type: "validation", text: "I appreciate you sharing that with me.", order: 4 },
                { id: "d6", type: "reminder", text: "My needs and boundaries are valid", order: 5 },
                { id: "d7", type: "closure", text: "I'd like to see you again if you're interested.", order: 6 }
            ]
        },
        {
            id: "medical-script",
            title: "Medical Appointments",
            description: "Communicating effectively with healthcare providers",
            steps: [
                { id: "m1", type: "action", text: "Bring written list of questions and concerns", order: 0 },
                { id: "m2", type: "statement", text: "I have some specific things I'd like to discuss today.", order: 1 },
                { id: "m3", type: "statement", text: "As an autistic person, I need...", order: 2 },
                { id: "m4", type: "question", text: "Could you explain that in simpler terms?", order: 3 },
                { id: "m5", type: "statement", text: "I'd like to take notes or record this conversation.", order: 4 },
                { id: "m6", type: "boundary", text: "I need to understand all procedures before consenting", order: 5 },
                { id: "m7", type: "closure", text: "Thank you for taking the time to explain everything.", order: 6 }
            ]
        },
        {
            id: "restaurant-script",
            title: "Restaurant Interactions",
            description: "Ordering food and managing dining situations",
            steps: [
                { id: "r1", type: "observation", text: "Review menu online before arriving", order: 0 },
                { id: "r2", type: "statement", text: "I need a few more minutes to decide, please.", order: 1 },
                { id: "r3", type: "statement", text: "I'd like to order the [dish], with modifications...", order: 2 },
                { id: "r4", type: "question", text: "What ingredients are in this sauce?", order: 3 },
                { id: "r5", type: "action", text: "Use noise-canceling earbuds if the environment is loud", order: 4 },
                { id: "r6", type: "reminder", text: "It's okay to send food back if it's wrong", order: 5 },
                { id: "r7", type: "closure", text: "Check, please. Thank you for the meal.", order: 6 }
            ]
        }
    ];

    // ----- helpers -----
    const el = (sel, root = document) => root.querySelector(sel);
    const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));

    // ----- DOM refs -----
    const scriptTitle = el("#script-title");
    const scriptDescription = el("#script-description");
    const stepsList = el("#steps-list");
    const addStepBtn = el("#add-step");
    const stepTypeSelect = el("#step-type");
    const saveScriptBtn = el("#save-script");
    const newScriptBtn = el("#new-script");
    const exportScriptBtn = el("#export-script");
    const scriptsLibrary = el("#scripts-library");
    const premadeScripts = el("#premade-scripts");
    const searchScripts = el("#search-scripts");
    const practiceBtn = el("#practice-btn");
    const helpBtn = el("#help-btn");
    const practiceModal = el("#practice-modal");
    const helpModal = el("#help-modal");
    const closePractice = el("#close-practice");
    const closeHelp = el("#close-help");
    const closeHelpBtn = el("#close-help-btn");
    const practiceScriptName = el("#practice-script-name");
    const currentStepText = el("#current-step-text");
    const currentStepType = el("#current-step-type");
    const prevStepBtn = el("#prev-step");
    const nextStepBtn = el("#next-step");
    const resetPracticeBtn = el("#reset-practice");
    const progressFill = el("#progress-fill");
    const progressText = el("#progress-text");
    const practiceTimer = el("#practice-timer");
    const timerDisplay = el("#timer-display");
    const showTimer = el("#show-timer");
    const autoAdvance = el("#auto-advance");
    const importFile = el("#import-file");

    let currentScript = {
        id: null,
        title: "",
        description: "",
        steps: []
    };

    let practiceState = {
        currentStep: 0,
        script: null,
        timer: null,
        startTime: null,
        elapsed: 0
    };

    function loadScripts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load scripts", e);
            return [];
        }
    }

    function saveScripts(scripts) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
        renderScriptLibrary();
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function addStep(type = "statement") {
        const stepId = generateId();
        const step = {
            id: stepId,
            type: type,
            text: "",
            order: currentScript.steps.length
        };

        currentScript.steps.push(step);
        renderSteps();

        setTimeout(() => {
            const textarea = el(`#step-${stepId}-text`);
            if (textarea) textarea.focus();
        }, 100);
    }

    function removeStep(stepId) {
        if (!confirm("Remove this step?")) return;
        currentScript.steps = currentScript.steps.filter(step => step.id !== stepId);
        renderSteps();
    }

    function moveStep(stepId, direction) {
        const index = currentScript.steps.findIndex(step => step.id === stepId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentScript.steps.length) return;

        [currentScript.steps[index], currentScript.steps[newIndex]] =
        [currentScript.steps[newIndex], currentScript.steps[index]];

        renderSteps();
    }

    function renderSteps() {
        stepsList.innerHTML = "";

        if (currentScript.steps.length === 0) {
            stepsList.innerHTML = `<div class="muted">No steps yet. Add your first step above.</div>`;
            return;
        }

        currentScript.steps.forEach((step, index) => {
            const stepEl = document.createElement("div");
            stepEl.className = "step-item fade-in";
            stepEl.innerHTML = `
                <div class="step-content">
                    <textarea
                        id="step-${step.id}-text"
                        placeholder="Enter step content..."
                        aria-label="Step ${index + 1} content"
                    >${escapeHtml(step.text)}</textarea>
                </div>
                <div class="step-type">
                    <select id="step-${step.id}-type" aria-label="Step type">
                        ${Object.entries(STEP_TYPES).map(([key, value]) =>
                            `<option value="${key}" ${step.type === key ? 'selected' : ''}>${value.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="step-actions">
                    <button type="button" class="btn small" onclick="moveStep('${step.id}', 'up')" ${index === 0 ? 'disabled' : ''} aria-label="Move step up">↑</button>
                    <button type="button" class="btn small" onclick="moveStep('${step.id}', 'down')" ${index === currentScript.steps.length - 1 ? 'disabled' : ''} aria-label="Move step down">↓</button>
                    <button type="button" class="btn small" onclick="removeStep('${step.id}')" aria-label="Remove step">×</button>
                </div>
            `;
            stepsList.appendChild(stepEl);

            const textarea = el(`#step-${step.id}-text`);
            const typeSelect = el(`#step-${step.id}-type`);

            textarea.addEventListener("input", (e) => {
                step.text = e.target.value;
            });

            typeSelect.addEventListener("change", (e) => {
                step.type = e.target.value;
            });
        });
    }

    function renderScriptLibrary(filter = "") {
        const scripts = loadScripts();
        const q = filter.trim().toLowerCase();

        scriptsLibrary.innerHTML = "";

        if (scripts.length === 0) {
            scriptsLibrary.innerHTML = `<div class="muted">No scripts saved yet. Create your first script!</div>`;
            return;
        }

        const filteredScripts = scripts.filter(script =>
        !q || script.title.toLowerCase().includes(q) || script.description.toLowerCase().includes(q)
        );

        if (filteredScripts.length === 0) {
            scriptsLibrary.innerHTML = `<div class="muted">No scripts match your search.</div>`;
            return;
        }

        filteredScripts.forEach(script => {
            const card = document.createElement("div");
            card.className = "script-card fade-in";
            card.innerHTML = `
                <h4>${escapeHtml(script.title)}</h4>
                <p>${escapeHtml(script.description || "No description")} • ${script.steps.length} steps</p>
                <div class="script-card-actions">
                    <button class="btn small" onclick="loadScriptForEdit('${script.id}')">Edit</button>
                    <button class="btn small" onclick="startPractice('${script.id}')">Practice</button>
                    <button class="btn small" onclick="deleteScript('${script.id}')">Delete</button>
                </div>
            `;
            scriptsLibrary.appendChild(card);
        });
    }

    function renderPremadeScripts() {
        premadeScripts.innerHTML = "";

        PREMADE_SCRIPTS.forEach(script => {
            const card = document.createElement("div");
            card.className = "script-card premade-script-card fade-in";
            card.innerHTML = `
                <h4>${escapeHtml(script.title)}</h4>
                <p>${escapeHtml(script.description || "No description")} • ${script.steps.length} steps</p>
                <div class="script-card-actions">
                    <button class="btn small primary" onclick="loadPremadeScript('${script.id}')">Use This Template</button>
                    <button class="btn small" onclick="previewPremadeScript('${script.id}')">Preview</button>
                </div>
            `;
            premadeScripts.appendChild(card);
        });
    }

    function loadPremadeScript(scriptId) {
        if (currentScript.steps.length > 0 && !confirm("Load this template? Current unsaved changes will be lost.")) {
            return;
        }

        const script = PREMADE_SCRIPTS.find(s => s.id === scriptId);
        if (script) {
            currentScript = JSON.parse(JSON.stringify(script));
            currentScript.id = generateId();
            scriptTitle.value = currentScript.title;
            scriptDescription.value = currentScript.description;
            renderSteps();
        }
    }

    function previewPremadeScript(scriptId) {
        const script = PREMADE_SCRIPTS.find(s => s.id === scriptId);
        if (!script) return;

        let previewContent = `<h4>${escapeHtml(script.title)}</h4>`;
        previewContent += `<p><em>${escapeHtml(script.description)}</em></p>`;
        previewContent += `<div class="preview-steps">`;

        script.steps.forEach(step => {
            const stepType = STEP_TYPES[step.type];
            previewContent += `
                <div class="preview-step ${stepType.color}">
                    <div class="preview-step-type">${stepType.name}</div>
                    <div class="preview-step-text">${escapeHtml(step.text)}</div>
                </div>
            `;
        });

        previewContent += `</div>`;

        const previewModal = document.createElement("dialog");
        previewModal.className = "preview-modal";
        previewModal.innerHTML = `
            <div class="modal-header">
                <h3>Script Preview</h3>
                <button class="btn ghost close-preview" aria-label="Close preview">×</button>
            </div>
            <div class="preview-content">
                ${previewContent}
            </div>
            <div class="modal-actions">
                <button class="btn primary load-preview-script" data-script-id="${scriptId}">Use This Template</button>
                <button class="btn close-preview">Close</button>
            </div>
        `;

        document.body.appendChild(previewModal);
        previewModal.showModal();

        const closeButtons = previewModal.querySelectorAll(".close-preview");
        closeButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                previewModal.close();
                setTimeout(() => previewModal.remove(), 300);
            });
        });

        const loadButton = previewModal.querySelector(".load-preview-script");
        loadButton.addEventListener("click", () => {
            previewModal.close();
            setTimeout(() => previewModal.remove(), 300);
            loadPremadeScript(scriptId);
        });
    }

    function loadScriptForEdit(scriptId) {
        const scripts = loadScripts();
        const script = scripts.find(s => s.id === scriptId);

        if (script) {
            currentScript = JSON.parse(JSON.stringify(script));
            scriptTitle.value = currentScript.title;
            scriptDescription.value = currentScript.description;
            renderSteps();
        }
    }

    function deleteScript(scriptId) {
        if (!confirm("Delete this script? This cannot be undone.")) return;

        const scripts = loadScripts();
        const filtered = scripts.filter(s => s.id !== scriptId);
        saveScripts(filtered);

        if (currentScript.id === scriptId) {
            newScript();
        }
    }

    function saveCurrentScript() {
        if (!scriptTitle.value.trim()) {
            alert("Please enter a script title.");
            return;
        }

        currentScript.title = scriptTitle.value.trim();
        currentScript.description = scriptDescription.value.trim();

        if (!currentScript.id) {
            currentScript.id = generateId();
            currentScript.created = Date.now();
        }

        currentScript.updated = Date.now();

        const scripts = loadScripts();
        const existingIndex = scripts.findIndex(s => s.id === currentScript.id);

        if (existingIndex >= 0) {
            scripts[existingIndex] = currentScript;
        } else {
            scripts.push(currentScript);
        }

        saveScripts(scripts);
        alert("Script saved!");
    }

    function newScript() {
        if (currentScript.steps.length > 0 && !confirm("Create new script? Unsaved changes will be lost.")) {
            return;
        }

        currentScript = {
            id: null,
            title: "",
            description: "",
            steps: []
        };

        scriptTitle.value = "";
        scriptDescription.value = "";
        renderSteps();
    }

    function exportScript() {
        if (currentScript.steps.length === 0) {
            alert("No script to export.");
            return;
        }

        const dataStr = JSON.stringify(currentScript, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `social-script-${currentScript.title || 'untitled'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function startPractice(scriptId) {
        const scripts = loadScripts();
        const script = scripts.find(s => s.id === scriptId);

        if (!script || script.steps.length === 0) {
            alert("No script available for practice.");
            return;
        }

        practiceState = {
            currentStep: 0,
            script: script,
            timer: null,
            startTime: Date.now(),
            elapsed: 0
        };

        practiceScriptName.textContent = script.title;
        updatePracticeStep();
        practiceModal.showModal();

        if (showTimer.checked) {
            startTimer();
            practiceTimer.style.display = "block";
        } else {
            practiceTimer.style.display = "none";
        }
    }

    function updatePracticeStep() {
        if (!practiceState.script) return;

        const step = practiceState.script.steps[practiceState.currentStep];
        if (!step) return;

        currentStepText.textContent = step.text || "(No content)";
        currentStepType.textContent = STEP_TYPES[step.type].name;

        currentStepType.className = "step-type-badge";
        currentStepType.classList.add(STEP_TYPES[step.type].color);

        const progress = ((practiceState.currentStep + 1) / practiceState.script.steps.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Step ${practiceState.currentStep + 1} of ${practiceState.script.steps.length}`;

        prevStepBtn.disabled = practiceState.currentStep === 0;
        nextStepBtn.disabled = practiceState.currentStep === practiceState.script.steps.length - 1;
    }

    function nextPracticeStep() {
        if (practiceState.currentStep < practiceState.script.steps.length - 1) {
            practiceState.currentStep++;
            updatePracticeStep();
        }
    }

    function prevPracticeStep() {
        if (practiceState.currentStep > 0) {
            practiceState.currentStep--;
            updatePracticeStep();
        }
    }

    function resetPractice() {
        practiceState.currentStep = 0;
        practiceState.elapsed = 0;
        updatePracticeStep();

        if (showTimer.checked) {
            clearInterval(practiceState.timer);
            startTimer();
        }
    }

    function startTimer() {
        clearInterval(practiceState.timer);
        practiceState.startTime = Date.now() - practiceState.elapsed;

        practiceState.timer = setInterval(() => {
            practiceState.elapsed = Date.now() - practiceState.startTime;
            const minutes = Math.floor(practiceState.elapsed / 60000);
            const seconds = Math.floor((practiceState.elapsed % 60000) / 1000);
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(practiceState.timer);
    }

    function wire() {
        renderSteps();
        renderScriptLibrary();
        renderPremadeScripts();

        addStepBtn.addEventListener("click", () => {
            addStep(stepTypeSelect.value);
        });

        saveScriptBtn.addEventListener("click", saveCurrentScript);
        newScriptBtn.addEventListener("click", newScript);
        exportScriptBtn.addEventListener("click", exportScript);

        practiceBtn.addEventListener("click", () => {
            if (currentScript.steps.length === 0) {
                alert("Create a script with at least one step to practice.");
                return;
            }

            if (currentScript.title || currentScript.steps.length > 0) {
                saveCurrentScript();
            }

            startPractice(currentScript.id);
        });

        prevStepBtn.addEventListener("click", prevPracticeStep);
        nextStepBtn.addEventListener("click", nextPracticeStep);
        resetPracticeBtn.addEventListener("click", resetPractice);

        closePractice.addEventListener("click", () => {
            practiceModal.close();
            stopTimer();
        });

        helpBtn.addEventListener("click", () => {
            helpModal.showModal();
        });

        closeHelp.addEventListener("click", () => {
            helpModal.close();
        });

        closeHelpBtn.addEventListener("click", () => {
            helpModal.close();
        });

        searchScripts.addEventListener("input", (e) => {
            renderScriptLibrary(e.target.value);
        });

        autoAdvance.addEventListener("change", () => {
            if (autoAdvance.checked && practiceState.script) {
                console.log("Auto-advance enabled");
            }
        });
    }

    function updateOnlineStatus() {
        const offlineIndicator = document.getElementById('offline-indicator');
        if (!offlineIndicator) return;

        if (navigator.onLine) {
            offlineIndicator.classList.remove('show');
        } else {
            offlineIndicator.classList.add('show');
        }
    }

    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.textContent = 'You are currently offline. Some features may be limited.';
    document.body.prepend(offlineIndicator);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    document.addEventListener("DOMContentLoaded", () => {
        window.moveStep = moveStep;
        window.removeStep = removeStep;
        window.loadScriptForEdit = loadScriptForEdit;
        window.startPractice = startPractice;
        window.deleteScript = deleteScript;
        window.loadPremadeScript = loadPremadeScript;
        window.previewPremadeScript = previewPremadeScript;

        wire();
    });
})();