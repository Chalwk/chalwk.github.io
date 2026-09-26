// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

(() => {
    const STORAGE_KEY = "social-script-builder-v1";
    const DRAFT_KEY = "social-script-builder-draft-v1";

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
            category: "Getting to Know People",
            steps: [
                { id: "g1", type: "statement", text: "Hi [Name]! It's good to see you.", order: 0 },
                { id: "g2", type: "question", text: "Hi [Name], it's good to see you too.", order: 1 },
                { id: "g3", type: "statement", text: "How have you been since we last talked?", order: 2 },
                { id: "g4", type: "question", text: "I've been doing well, thanks! How about you?", order: 3 },
                { id: "g5", type: "statement", text: "I'm doing well too, thank you.", order: 4 },
                {
                    id: "g6",
                    type: "reminder",
                    text: "If eye contact feels hard, I'll smile at their forehead or shoulder",
                    order: 5
                },
                { id: "g7", type: "reminder", text: "Taking one deep breath before speaking calms my nerves", order: 6 }
            ]
        },
        {
            id: "introduction-script",
            title: "Introducing Myself",
            description: "Meeting someone for the first time",
            category: "Getting to Know People",
            steps: [
                { id: "i1", type: "statement", text: "Hello, I'm Jay. It's nice to meet you.", order: 0 },
                { id: "i2", type: "question", text: "Hi Jay, I'm [Name]. Nice to meet you too.", order: 1 },
                { id: "i3", type: "statement", text: "I enjoy [hobby].", order: 2 },
                { id: "i4", type: "question", text: "What do you do in your free time?", order: 3 },
                { id: "i5", type: "statement", text: "I like to [activity]. What about you?", order: 4 },
                { id: "i6", type: "reminder", text: "I'll write 3 bullet points about myself beforehand", order: 5 },
                {
                    id: "i7",
                    type: "reminder",
                    text: "If feeling shy, I'll focus just on 'Hello, I'm Jay' + smile",
                    order: 6
                }
            ]
        },
        {
            id: "help-script",
            title: "Asking for Help/Clarification",
            description: "Confused by instructions or missing information",
            category: "Everyday",
            steps: [
                { id: "h1", type: "statement", text: "Excuse me, could you please explain that again?", order: 0 },
                { id: "h2", type: "question", text: "Sure, [clarified version]", order: 1 },
                { id: "h3", type: "statement", text: "Thank you - I understand now.", order: 2 },
                { id: "h4", type: "question", text: "I'm busy right now.", order: 3 },
                { id: "h5", type: "statement", text: "No problem. When would be a good time?", order: 4 },
                { id: "h6", type: "reminder", text: "Keep a notepad ready for written explanations", order: 5 },
                {
                    id: "h7",
                    type: "reminder",
                    text: "If overwhelmed: 'Would email instructions work better for me?'",
                    order: 6
                }
            ]
        },
        {
            id: "boundaries-script",
            title: "Expressing Boundaries",
            description: "Physical/emotional discomfort in interactions",
            category: "Boundaries",
            steps: [
                {
                    id: "b1",
                    type: "statement",
                    text: "I feel uncomfortable when [specific action]. Could we [alternative]?",
                    order: 0
                },
                {
                    id: "b2",
                    type: "statement",
                    text: "Example: 'I feel uncomfortable with hugs. Could we wave instead?'",
                    order: 1
                },
                { id: "b3", type: "question", text: "Sorry! I didn't realize.", order: 2 },
                { id: "b4", type: "statement", text: "Thank you for understanding.", order: 3 },
                { id: "b5", type: "question", text: "You're too sensitive.", order: 4 },
                { id: "b6", type: "statement", text: "This is important for my wellbeing.", order: 5 },
                { id: "b7", type: "reminder", text: "Pre-identify 3 non-negotiable boundaries", order: 6 },
                {
                    id: "b8",
                    type: "reminder",
                    text: "Practice power stance (feet apart, shoulders back) before speaking",
                    order: 7
                }
            ]
        },
        {
            id: "small-talk-script",
            title: "Making Small Talk",
            description: "Filling silence with easy, low-pressure conversation",
            category: "Everyday",
            steps: [
                { id: "st1", type: "observation", text: "Wow, it's really [warm/cold/busy] today, isn't it?", order: 0 },
                { id: "st2", type: "question", text: "Yeah, I know! / Sure is.", order: 1 },
                { id: "st3", type: "followup", text: "Have you got any plans for the weekend?", order: 2 },
                { id: "st4", type: "question", text: "They share their plans.", order: 3 },
                { id: "st5", type: "statement", text: "That sounds nice. I'm planning to [activity].", order: 4 },
                { id: "st6", type: "reminder", text: "Small talk doesn't need to be deep — short exchanges still count as a success.", order: 5 },
                { id: "st7", type: "transition", text: "If it naturally winds down, I can say 'Well, it was nice chatting!' and move on.", order: 6 }
            ]
        },
        {
            id: "ending-conversation-script",
            title: "Ending a Conversation Politely",
            description: "Wrapping up a chat without it feeling abrupt or rude",
            category: "Everyday",
            steps: [
                { id: "ec1", type: "observation", text: "I notice I'm ready to go, or the conversation has paused.", order: 0 },
                { id: "ec2", type: "transition", text: "This has been great, but I should get going.", order: 1 },
                { id: "ec3", type: "question", text: "Oh okay, no worries!", order: 2 },
                { id: "ec4", type: "statement", text: "It was really good talking with you.", order: 3 },
                { id: "ec5", type: "closure", text: "Take care! / See you soon!", order: 4 },
                { id: "ec6", type: "reminder", text: "I don't need an elaborate excuse — 'I should get going' is a complete sentence.", order: 5 },
                { id: "ec7", type: "reminder", text: "If it feels awkward walking away, a wave and a smile is enough.", order: 6 }
            ]
        },
        {
            id: "declining-invitation-script",
            title: "Declining an Invitation",
            description: "Saying no to plans without over-explaining or feeling guilty",
            category: "Social Events",
            steps: [
                { id: "di1", type: "statement", text: "Thank you so much for inviting me!", order: 0 },
                { id: "di2", type: "statement", text: "I'm not going to be able to make it this time.", order: 1 },
                { id: "di3", type: "question", text: "Oh, that's a shame. Maybe next time?", order: 2 },
                { id: "di4", type: "statement", text: "Definitely — I'd like that.", order: 3 },
                { id: "di5", type: "boundary", text: "I don't owe a detailed reason. 'I have other plans' or 'I need some downtime' is enough.", order: 4 },
                { id: "di6", type: "reminder", text: "Saying no to protect my energy isn't rude — it's necessary.", order: 5 },
                { id: "di7", type: "followup", text: "If I want to, I can suggest an alternative: 'Could we catch up another time instead?'", order: 6 }
            ]
        },
        {
            id: "phone-appointment-script",
            title: "Booking an Appointment by Phone",
            description: "Calling a clinic, salon, or office to schedule something",
            category: "Phone Calls",
            steps: [
                { id: "pa1", type: "reminder", text: "Before dialing, I'll write down what I need: reason for the call, and preferred days/times.", order: 0 },
                { id: "pa2", type: "statement", text: "Hi, my name is [Name]. I'd like to book an appointment for [reason].", order: 1 },
                { id: "pa3", type: "question", text: "Sure, what day works for you?", order: 2 },
                { id: "pa4", type: "statement", text: "Would [day/time] be available?", order: 3 },
                { id: "pa5", type: "question", text: "They may offer a different time.", order: 4 },
                { id: "pa6", type: "statement", text: "That works for me, thank you.", order: 5 },
                { id: "pa7", type: "followup", text: "Could you repeat the date and time back to me, just to confirm?", order: 6 },
                { id: "pa8", type: "closure", text: "Thank you so much, see you then. Goodbye.", order: 7 },
                { id: "pa9", type: "reminder", text: "If I get flustered, it's okay to say 'Sorry, one moment' before continuing.", order: 8 }
            ]
        },
        {
            id: "restaurant-ordering-script",
            title: "Ordering at a Restaurant or Café",
            description: "Placing a food order without feeling rushed",
            category: "Everyday",
            steps: [
                { id: "ro1", type: "reminder", text: "I can look at the menu online beforehand if that helps me decide calmly.", order: 0 },
                { id: "ro2", type: "question", text: "Hi, what can I get for you today?", order: 1 },
                { id: "ro3", type: "statement", text: "Could I please get [order]?", order: 2 },
                { id: "ro4", type: "question", text: "Anything else? / For here or to go?", order: 3 },
                { id: "ro5", type: "statement", text: "That's all, thank you. / For here, please.", order: 4 },
                { id: "ro6", type: "reminder", text: "If I don't understand a menu item, I can just ask: 'What's in this one?'", order: 5 },
                { id: "ro7", type: "closure", text: "Thank you!", order: 6 }
            ]
        },
        {
            id: "joining-group-script",
            title: "Joining a Group Conversation",
            description: "Entering a conversation that's already happening",
            category: "Social Events",
            steps: [
                { id: "jg1", type: "observation", text: "I'll watch for a natural pause before stepping in, rather than interrupting.", order: 0 },
                { id: "jg2", type: "statement", text: "Mind if I join you?", order: 1 },
                { id: "jg3", type: "question", text: "Of course, come on in!", order: 2 },
                { id: "jg4", type: "observation", text: "I'll listen for a moment to catch the topic before speaking.", order: 3 },
                { id: "jg5", type: "followup", text: "What were you all talking about?", order: 4 },
                { id: "jg6", type: "statement", text: "Share a related thought once I understand the topic.", order: 5 },
                { id: "jg7", type: "reminder", text: "I don't have to say something clever right away — just being present is enough.", order: 6 },
                { id: "jg8", type: "reminder", text: "If it feels like too much, it's okay to quietly step back out.", order: 7 }
            ]
        },
        {
            id: "workplace-accommodation-script",
            title: "Asking for a Workplace Accommodation",
            description: "Requesting a change that helps me do my job comfortably",
            category: "Workplace",
            steps: [
                { id: "wa1", type: "reminder", text: "I'll think through exactly what I need before the conversation, e.g. noise-cancelling headphones, written instructions, flexible hours.", order: 0 },
                { id: "wa2", type: "statement", text: "Could I talk to you about something that would help me work better?", order: 1 },
                { id: "wa3", type: "statement", text: "I find [specific challenge, e.g. open-plan noise] difficult to manage.", order: 2 },
                { id: "wa4", type: "statement", text: "It would really help if I could [specific accommodation].", order: 3 },
                { id: "wa5", type: "question", text: "They may ask follow-up questions or need time to consider.", order: 4 },
                { id: "wa6", type: "statement", text: "Of course, take your time — I'm happy to discuss options.", order: 5 },
                { id: "wa7", type: "validation", text: "This is a reasonable thing to ask for, not a burden.", order: 6 },
                { id: "wa8", type: "followup", text: "Could we check in again in a couple of weeks to see how it's going?", order: 7 }
            ]
        },
        {
            id: "change-of-plans-script",
            title: "Handling a Sudden Change of Plans",
            description: "Coping when something unexpected disrupts what I expected to happen",
            category: "Coping & Transitions",
            steps: [
                { id: "cp1", type: "observation", text: "I notice I'm feeling thrown off because the plan changed.", order: 0 },
                { id: "cp2", type: "reminder", text: "It's okay to feel unsettled — this is a normal reaction to unexpected change.", order: 1 },
                { id: "cp3", type: "statement", text: "Could you give me a moment to adjust to the new plan?", order: 2 },
                { id: "cp4", type: "question", text: "Sure, take your time.", order: 3 },
                { id: "cp5", type: "reminder", text: "I'll take a few slow breaths and ask myself: what's the new plan, step by step?", order: 4 },
                { id: "cp6", type: "followup", text: "Could you walk me through what's happening now?", order: 5 },
                { id: "cp7", type: "validation", text: "I handled that change, even though it was hard.", order: 6 }
            ]
        },
        {
            id: "repair-misunderstanding-script",
            title: "Repairing a Misunderstanding",
            description: "Addressing it when I realize something I said or did landed wrong",
            category: "Conflict & Repair",
            steps: [
                { id: "rm1", type: "observation", text: "I've noticed the other person seems upset or confused by something I said.", order: 0 },
                { id: "rm2", type: "statement", text: "I think that may have come out differently than I meant — can I clarify?", order: 1 },
                { id: "rm3", type: "statement", text: "What I meant was [intended meaning].", order: 2 },
                { id: "rm4", type: "question", text: "Oh, that makes more sense, thanks for explaining.", order: 3 },
                { id: "rm5", type: "statement", text: "I'm sorry if it landed the wrong way.", order: 4 },
                { id: "rm6", type: "reminder", text: "Misunderstandings happen to everyone — this doesn't mean I did something wrong as a person.", order: 5 },
                { id: "rm7", type: "followup", text: "Is there anything else I can clarify?", order: 6 },
                { id: "rm8", type: "closure", text: "Thanks for talking it through with me.", order: 7 }
            ]
        },
        {
            id: "feedback-response-script",
            title: "Responding to Feedback or Criticism",
            description: "Receiving feedback at work or school without shutting down or overreacting",
            category: "Workplace",
            steps: [
                { id: "fr1", type: "reminder", text: "Feedback about my work isn't the same as feedback about my worth as a person.", order: 0 },
                { id: "fr2", type: "statement", text: "Thank you for telling me — can you give me an example?", order: 1 },
                { id: "fr3", type: "question", text: "They give a specific example.", order: 2 },
                { id: "fr4", type: "statement", text: "That makes sense. I'll work on that.", order: 3 },
                { id: "fr5", type: "reminder", text: "If I feel defensive, I can pause and say 'Let me think about that for a moment.'", order: 4 },
                { id: "fr6", type: "followup", text: "Is there a way you'd suggest I approach it differently next time?", order: 5 },
                { id: "fr7", type: "closure", text: "I appreciate you taking the time to tell me.", order: 6 }
            ]
        },
        {
            id: "asking-directions-script",
            title: "Asking a Stranger for Directions or Help",
            description: "Approaching someone I don't know for quick assistance",
            category: "Everyday",
            steps: [
                { id: "ad1", type: "statement", text: "Excuse me, could you help me with something?", order: 0 },
                { id: "ad2", type: "question", text: "Sure, what do you need?", order: 1 },
                { id: "ad3", type: "statement", text: "I'm trying to find [place/thing] — do you know where that is?", order: 2 },
                { id: "ad4", type: "question", text: "They give directions.", order: 3 },
                { id: "ad5", type: "followup", text: "Could you repeat that? I want to make sure I've got it.", order: 4 },
                { id: "ad6", type: "statement", text: "Thank you so much, I appreciate it.", order: 5 },
                { id: "ad7", type: "reminder", text: "Most people are happy to help — asking isn't a burden.", order: 6 }
            ]
        },
        {
            id: "leaving-early-script",
            title: "Leaving a Social Event Early",
            description: "Exiting gracefully when I'm overstimulated or my social battery is low",
            category: "Coping & Transitions",
            steps: [
                { id: "le1", type: "observation", text: "I notice I'm feeling overwhelmed — this is a signal to plan my exit.", order: 0 },
                { id: "le2", type: "statement", text: "I've had a great time, but I'm going to head out now.", order: 1 },
                { id: "le3", type: "question", text: "Aw, already? Okay, take care!", order: 2 },
                { id: "le4", type: "statement", text: "Thanks so much for having me.", order: 3 },
                { id: "le5", type: "reminder", text: "I don't need to explain that I'm overstimulated unless I want to — 'I'm heading out' is enough.", order: 4 },
                { id: "le6", type: "reminder", text: "Leaving early to take care of myself is a strength, not a failure.", order: 5 },
                { id: "le7", type: "closure", text: "Goodnight / See you soon!", order: 6 }
            ]
        }
    ];

    const el = (sel, root = document) => root.querySelector(sel);
    const on = (element, event, handler) => {
        if (element) element.addEventListener(event, handler);
    };
    const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": "&#39;"
    }[m]));
    const getStepType = type => STEP_TYPES[type] || STEP_TYPES.statement;
    const getStepTypeKey = type => (STEP_TYPES[type] ? type : "statement");

    const scriptTitle = el("#script-title");
    const scriptDescription = el("#script-description");
    const stepsList = el("#steps-list");
    const addStepBtn = el("#add-step");
    const stepTypeSelect = el("#step-type");
    const saveScriptBtn = el("#save-script");
    const newScriptBtn = el("#new-script");
    const exportScriptBtn = el("#export-script");
    const importScriptBtn = el("#import-script-btn");
    const importFileInput = el("#import-file");
    const backupAllBtn = el("#backup-all-btn");
    const restoreAllBtn = el("#restore-all-btn");
    const importAllFileInput = el("#import-all-file");
    const personalizeBtn = el("#personalize-btn");
    const printScriptBtn = el("#print-script-btn");
    const printArea = el("#print-area");
    const fontDecreaseBtn = el("#font-decrease");
    const fontIncreaseBtn = el("#font-increase");
    const scriptsLibrary = el("#scripts-library");
    const premadeScripts = el("#premade-scripts");
    const premadeCategoryFilter = el("#premade-category-filter");
    const searchScripts = el("#search-scripts");
    const sortSelect = el("#sort-scripts");
    const draftStatus = el("#draft-status");
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
    const autoAdvanceDelaySelect = el("#auto-advance-delay");
    const autoAdvanceCountdown = el("#auto-advance-countdown");
    const readAloudToggle = el("#read-aloud-toggle");
    const readAloudBtn = el("#read-aloud-btn");
    const breathingBtn = el("#breathing-btn");
    const breathingStopBtn = el("#breathing-stop-btn");
    const breathingPacer = el("#breathing-pacer");
    const breathingText = el("#breathing-text");
    const toastContainer = el("#toast-container");
    const confirmModal = el("#confirm-modal");
    const confirmMessage = el("#confirm-message");
    const confirmOkBtn = el("#confirm-ok");
    const confirmCancelBtn = el("#confirm-cancel");

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

    let draftSaveTimer = null;
    let autoAdvanceTimer = null;
    let autoAdvanceTickTimer = null;
    let autoAdvanceRemainingMs = 0;
    let breathingInterval = null;
    let breathingTimeout = null;
    let textScaleLevel = 0;

    const TEXT_SCALE_KEY = "social-script-builder-text-scale";
    const TEXT_SCALE_CLASSES = ["text-scale-1", "text-scale-2", "text-scale-3"];

    // ---------- Toasts (non-blocking, replaces alert()) ----------

    function showToast(message, type = "info") {
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = type === "info" ? "toast" : `toast toast-${type}`;
        toast.setAttribute("role", "status");
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // ---------- Confirm dialog ----------

    function showConfirm(message, { okLabel = "Confirm" } = {}) {
        return new Promise(resolve => {
            if (!confirmModal || !confirmMessage || !confirmOkBtn || !confirmCancelBtn) {
                resolve(window.confirm(message));
                return;
            }

            confirmMessage.textContent = message;
            confirmOkBtn.textContent = okLabel;

            const cleanup = result => {
                confirmOkBtn.removeEventListener("click", onOk);
                confirmCancelBtn.removeEventListener("click", onCancel);
                confirmModal.removeEventListener("cancel", onNativeCancel);
                confirmModal.close();
                resolve(result);
            };
            const onOk = () => cleanup(true);
            const onCancel = () => cleanup(false);
            const onNativeCancel = e => {
                e.preventDefault();
                cleanup(false);
            };

            confirmOkBtn.addEventListener("click", onOk);
            confirmCancelBtn.addEventListener("click", onCancel);
            confirmModal.addEventListener("cancel", onNativeCancel);

            confirmModal.showModal();
        });
    }

    // ---------- Draft autosave (protects against lost work) ----------

    function setDraftStatus(text) {
        if (draftStatus) draftStatus.textContent = text;
    }

    function scheduleDraftSave() {
        if (draftSaveTimer) clearTimeout(draftSaveTimer);
        draftSaveTimer = setTimeout(saveDraftNow, 500);
    }

    function saveDraftNow() {
        try {
            const title = scriptTitle.value.trim();
            const description = scriptDescription.value.trim();
            const hasContent = title || description || currentScript.steps.length > 0;

            if (!hasContent) {
                localStorage.removeItem(DRAFT_KEY);
                setDraftStatus("");
                return;
            }

            currentScript.title = scriptTitle.value;
            currentScript.description = scriptDescription.value;
            localStorage.setItem(DRAFT_KEY, JSON.stringify(currentScript));
            setDraftStatus("Draft autosaved");
        } catch (e) {
            console.error("Failed to autosave draft", e);
        }
    }

    function restoreDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;

            const draft = JSON.parse(raw);
            const hasContent = draft && (draft.title || draft.description || (draft.steps && draft.steps.length > 0));
            if (!hasContent) return;

            currentScript = {
                id: draft.id || null,
                title: draft.title || "",
                description: draft.description || "",
                steps: Array.isArray(draft.steps) ? draft.steps : []
            };
            scriptTitle.value = currentScript.title;
            scriptDescription.value = currentScript.description;
            setDraftStatus("Restored your unsaved draft");
        } catch (e) {
            console.error("Failed to restore draft", e);
        }
    }

    function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
        setDraftStatus("");
    }

    // ---------- Local library storage ----------

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
        renderScriptLibrary(searchScripts ? searchScripts.value : "");
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ---------- Step editing ----------

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
        scheduleDraftSave();

        setTimeout(() => {
            const textarea = el(`#step-${stepId}-text`);
            if (textarea) textarea.focus();
        }, 100);
    }

    async function removeStep(stepId) {
        const ok = await showConfirm("Remove this step? This can't be undone.");
        if (!ok) return;

        currentScript.steps = currentScript.steps.filter(step => step.id !== stepId);
        renderSteps();
        scheduleDraftSave();
        showToast("Step removed");
    }

    function duplicateStep(stepId) {
        const index = currentScript.steps.findIndex(step => step.id === stepId);
        if (index === -1) return;

        const copy = { ...currentScript.steps[index], id: generateId() };
        currentScript.steps.splice(index + 1, 0, copy);
        renderSteps();
        scheduleDraftSave();
        showToast("Step duplicated");
    }

    function moveStep(stepId, direction) {
        const index = currentScript.steps.findIndex(step => step.id === stepId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentScript.steps.length) return;

        [currentScript.steps[index], currentScript.steps[newIndex]] =
            [currentScript.steps[newIndex], currentScript.steps[index]];

        renderSteps();
        scheduleDraftSave();
    }

    function renderSteps() {
        stepsList.innerHTML = "";

        currentScript.steps.forEach((step, index) => {
            step.order = index;
        });

        if (currentScript.steps.length === 0) {
            stepsList.innerHTML = `<div style="color: var(--gray); text-align: center; padding: 2rem;">No steps yet. Add your first step above.</div>`;
            return;
        }

        currentScript.steps.forEach((step, index) => {
            const typeKey = getStepTypeKey(step.type);
            const stepEl = document.createElement("div");
            stepEl.className = `step-item fade-in step-type-${typeKey}-accent`;
            stepEl.innerHTML = `
                <div class="step-content">
                    <textarea
                        id="step-${step.id}-text"
                        placeholder="Enter step content..."
                        aria-label="Step ${index + 1} content"
                    >${escapeHtml(step.text)}</textarea>
                </div>
                <div class="step-type">
                    <select id="step-${step.id}-type" aria-label="Step type" style="padding: 0.5rem; border: 1px solid var(--gray-light); border-radius: var(--radius); width: 100%;">
                        ${Object.entries(STEP_TYPES).map(([key, value]) =>
                `<option value="${key}" ${typeKey === key ? 'selected' : ''}>${value.name}</option>`
            ).join('')}
                    </select>
                </div>
                <div class="step-actions">
                    <button type="button" class="btn btn-secondary" onclick="moveStep('${step.id}', 'up')" ${index === 0 ? 'disabled' : ''} aria-label="Move step up" style="padding: 0.5rem;">↑</button>
                    <button type="button" class="btn btn-secondary" onclick="moveStep('${step.id}', 'down')" ${index === currentScript.steps.length - 1 ? 'disabled' : ''} aria-label="Move step down" style="padding: 0.5rem;">↓</button>
                    <button type="button" class="btn btn-secondary" onclick="duplicateStep('${step.id}')" aria-label="Duplicate step" style="padding: 0.5rem;">⧉</button>
                    <button type="button" class="btn btn-secondary" onclick="removeStep('${step.id}')" aria-label="Remove step" style="padding: 0.5rem;">X</button>
                </div>
            `;
            stepsList.appendChild(stepEl);

            const textarea = el(`#step-${step.id}-text`);
            const typeSelect = el(`#step-${step.id}-type`);

            textarea.addEventListener("input", (e) => {
                step.text = e.target.value;
                scheduleDraftSave();
            });

            typeSelect.addEventListener("change", (e) => {
                step.type = e.target.value;
                scheduleDraftSave();
                renderSteps();
            });
        });
    }

    // ---------- Script library ----------

    function sortScripts(scripts, mode) {
        const sorted = [...scripts];
        if (mode === "title") {
            sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        } else if (mode === "steps") {
            sorted.sort((a, b) => (b.steps || []).length - (a.steps || []).length);
        } else {
            sorted.sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
        }
        return sorted;
    }

    function renderScriptLibrary(filter = "") {
        const scripts = loadScripts();
        const q = filter.trim().toLowerCase();

        scriptsLibrary.innerHTML = "";

        if (scripts.length === 0) {
            scriptsLibrary.innerHTML = `<div class="empty-library">No scripts saved yet. Create your first script!</div>`;
            return;
        }

        const sorted = sortScripts(scripts, sortSelect ? sortSelect.value : "updated");
        const filteredScripts = sorted.filter(script =>
            !q ||
            (script.title || "").toLowerCase().includes(q) ||
            (script.description || "").toLowerCase().includes(q)
        );

        if (filteredScripts.length === 0) {
            scriptsLibrary.innerHTML = `<div class="empty-library">No scripts match your search.</div>`;
            return;
        }

        filteredScripts.forEach(script => {
            const card = document.createElement("div");
            card.className = "script-card fade-in";
            const practiceLine = script.practiceCount
                ? `Practiced ${script.practiceCount} time${script.practiceCount === 1 ? "" : "s"}`
                : "Not practiced yet";
            card.innerHTML = `
                <h4>${escapeHtml(script.title)}</h4>
                <p>${escapeHtml(script.description || "No description")} • ${script.steps.length} steps</p>
                <p class="script-meta-line">${practiceLine}</p>
                <div class="script-card-actions">
                    <button class="btn btn-secondary" onclick="loadScriptForEdit('${script.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">Edit</button>
                    <button class="btn btn-primary" onclick="startPractice('${script.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">Practice</button>
                    <button class="btn btn-secondary" onclick="duplicateScript('${script.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">Duplicate</button>
                    <button class="btn btn-secondary" onclick="deleteScript('${script.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">Delete</button>
                </div>
            `;
            scriptsLibrary.appendChild(card);
        });
    }

    function duplicateScript(scriptId) {
        const scripts = loadScripts();
        const original = scripts.find(s => s.id === scriptId);
        if (!original) return;

        const copy = JSON.parse(JSON.stringify(original));
        copy.id = generateId();
        copy.title = `${copy.title} (Copy)`;
        copy.created = Date.now();
        copy.updated = Date.now();

        scripts.push(copy);
        saveScripts(scripts);
        showToast(`Duplicated "${original.title}"`, "success");
    }

    function populatePremadeCategories() {
        if (!premadeCategoryFilter) return;
        const categories = [...new Set(PREMADE_SCRIPTS.map(s => s.category).filter(Boolean))].sort();
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            premadeCategoryFilter.appendChild(option);
        });
    }

    function renderPremadeScripts(category = "") {
        premadeScripts.innerHTML = "";

        const filtered = category
            ? PREMADE_SCRIPTS.filter(s => s.category === category)
            : PREMADE_SCRIPTS;

        if (filtered.length === 0) {
            premadeScripts.innerHTML = `<div class="empty-library">No templates in this category.</div>`;
            return;
        }

        filtered.forEach(script => {
            const card = document.createElement("div");
            card.className = "script-card premade-script-card fade-in";
            card.innerHTML = `
                ${script.category ? `<span class="premade-category">${escapeHtml(script.category)}</span>` : ""}
                <h4>${escapeHtml(script.title)}</h4>
                <p>${escapeHtml(script.description || "No description")} • ${script.steps.length} steps</p>
                <div class="script-card-actions">
                    <button class="btn btn-primary" onclick="loadPremadeScript('${script.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">Use This Template</button>
                    <button class="btn btn-secondary" onclick="previewPremadeScript('${script.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">Preview</button>
                </div>
            `;
            premadeScripts.appendChild(card);
        });
    }

    async function loadPremadeScript(scriptId) {
        if (currentScript.steps.length > 0) {
            const ok = await showConfirm("Load this template? Your current unsaved changes will be replaced.");
            if (!ok) return;
        }

        const script = PREMADE_SCRIPTS.find(s => s.id === scriptId);
        if (script) {
            currentScript = JSON.parse(JSON.stringify(script));
            currentScript.id = generateId();
            scriptTitle.value = currentScript.title;
            scriptDescription.value = currentScript.description;
            renderSteps();
            setDraftStatus("");
            scheduleDraftSave();
        }
    }

    function previewPremadeScript(scriptId) {
        const script = PREMADE_SCRIPTS.find(s => s.id === scriptId);
        if (!script) return;

        let previewContent = `<h4 style="color: var(--dark); margin-bottom: 0.5rem;">${escapeHtml(script.title)}</h4>`;
        previewContent += `<p style="color: var(--gray); margin-bottom: 1rem;"><em>${escapeHtml(script.description)}</em></p>`;
        previewContent += `<div class="preview-steps">`;

        script.steps.forEach(step => {
            const stepType = getStepType(step.type);
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
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--gray-light);">
                <h3 style="margin: 0;">Script Preview</h3>
                <button class="btn btn-secondary close-preview" aria-label="Close preview" style="padding: 0.5rem 0.75rem;">X</button>
            </div>
            <div class="preview-content">
                ${previewContent}
            </div>
            <div class="modal-actions" style="padding: 1rem 1.5rem; border-top: 1px solid var(--gray-light); display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button class="btn btn-primary load-preview-script" data-script-id="${scriptId}">Use This Template</button>
                <button class="btn btn-secondary close-preview">Close</button>
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
            scriptDescription.value = currentScript.description || "";
            renderSteps();
            setDraftStatus("");
            scheduleDraftSave();
        }
    }

    async function deleteScript(scriptId) {
        const ok = await showConfirm("Delete this script? This cannot be undone.");
        if (!ok) return;

        const scripts = loadScripts();
        const filtered = scripts.filter(s => s.id !== scriptId);
        saveScripts(filtered);
        showToast("Script deleted");

        if (currentScript.id === scriptId) {
            currentScript = { id: null, title: "", description: "", steps: [] };
            scriptTitle.value = "";
            scriptDescription.value = "";
            renderSteps();
            clearDraft();
        }
    }

    function saveCurrentScript() {
        if (!scriptTitle.value.trim()) {
            showToast("Please enter a script title.", "error");
            scriptTitle.focus();
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
        clearDraft();
        setDraftStatus("Saved to library");
        showToast("Script saved!", "success");
    }

    async function newScript() {
        if (currentScript.steps.length > 0) {
            const ok = await showConfirm("Start a new script? Unsaved changes will be lost.");
            if (!ok) return;
        }

        currentScript = { id: null, title: "", description: "", steps: [] };
        scriptTitle.value = "";
        scriptDescription.value = "";
        renderSteps();
        clearDraft();
    }

    function exportScript() {
        if (currentScript.steps.length === 0) {
            showToast("Nothing to export yet — add a step first.", "error");
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

    function sanitizeSteps(rawSteps) {
        if (!Array.isArray(rawSteps)) return [];
        return rawSteps.map(s => ({
            id: (s && s.id) || generateId(),
            type: s && STEP_TYPES[s.type] ? s.type : "statement",
            text: s && typeof s.text === "string" ? s.text : "",
            order: 0
        }));
    }

    function handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || typeof data.title !== "string" || !Array.isArray(data.steps)) {
                    throw new Error("Invalid script file");
                }

                if (currentScript.steps.length > 0) {
                    const ok = await showConfirm("Import this script? Your current unsaved changes will be replaced.");
                    if (!ok) return;
                }

                currentScript = {
                    id: generateId(),
                    title: data.title || "Imported script",
                    description: typeof data.description === "string" ? data.description : "",
                    steps: sanitizeSteps(data.steps)
                };

                scriptTitle.value = currentScript.title;
                scriptDescription.value = currentScript.description;
                renderSteps();
                setDraftStatus("");
                scheduleDraftSave();
                showToast("Script imported — remember to save it to your library.", "success");
            } catch (err) {
                console.error("Failed to import script", err);
                showToast("Couldn't read that file — is it a valid exported script?", "error");
            }
        };
        reader.readAsText(file);
    }

    function exportAllScripts() {
        const scripts = loadScripts();
        if (scripts.length === 0) {
            showToast("No saved scripts to back up yet.", "error");
            return;
        }

        const payload = { version: 1, exportedAt: new Date().toISOString(), scripts };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `social-scripts-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Backed up ${scripts.length} script${scripts.length === 1 ? "" : "s"}.`, "success");
    }

    function handleImportAllFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const incoming = Array.isArray(data) ? data : (Array.isArray(data.scripts) ? data.scripts : null);
                if (!incoming) throw new Error("Invalid backup file");

                const ok = await showConfirm(
                    `Restore ${incoming.length} script${incoming.length === 1 ? "" : "s"}? They'll be added to your library alongside your existing scripts.`,
                    { okLabel: "Restore" }
                );
                if (!ok) return;

                const existing = loadScripts();
                const existingIds = new Set(existing.map(s => s.id));
                let added = 0;

                incoming.forEach(script => {
                    if (!script || typeof script.title !== "string" || !Array.isArray(script.steps)) return;

                    const id = script.id && !existingIds.has(script.id) ? script.id : generateId();
                    const clean = {
                        id,
                        title: script.title,
                        description: typeof script.description === "string" ? script.description : "",
                        steps: sanitizeSteps(script.steps),
                        created: script.created || Date.now(),
                        updated: script.updated || Date.now()
                    };
                    clean.steps.forEach((s, i) => { s.order = i; });

                    existing.push(clean);
                    existingIds.add(id);
                    added++;
                });

                saveScripts(existing);
                showToast(`Restored ${added} script${added === 1 ? "" : "s"}.`, "success");
            } catch (err) {
                console.error("Failed to import backup", err);
                showToast("Couldn't read that backup file.", "error");
            }
        };
        reader.readAsText(file);
    }

    // ---------- Practice mode ----------

    function startPractice(scriptId) {
        const scripts = loadScripts();
        const script = scripts.find(s => s.id === scriptId);

        if (!script || script.steps.length === 0) {
            showToast("No script available for practice.", "error");
            return;
        }

        if ("speechSynthesis" in window) window.speechSynthesis.cancel();

        script.practiceCount = (script.practiceCount || 0) + 1;
        script.lastPracticed = Date.now();
        saveScripts(scripts);

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

        if (breathingPacer && !breathingPacer.hidden) {
            clearInterval(breathingInterval);
            clearTimeout(breathingTimeout);
            breathingPacer.hidden = true;
        }

        const stepType = getStepType(step.type);
        currentStepText.textContent = step.text || "(No content)";
        currentStepType.textContent = stepType.name;

        currentStepType.className = "step-type-badge";
        currentStepType.classList.add(stepType.color);

        const progress = ((practiceState.currentStep + 1) / practiceState.script.steps.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Step ${practiceState.currentStep + 1} of ${practiceState.script.steps.length}`;

        prevStepBtn.disabled = practiceState.currentStep === 0;
        nextStepBtn.disabled = practiceState.currentStep === practiceState.script.steps.length - 1;

        if (readAloudToggle && readAloudToggle.checked) {
            speakStepText(step.text || "");
        }

        startAutoAdvance();
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

    function stopAutoAdvance() {
        clearTimeout(autoAdvanceTimer);
        clearInterval(autoAdvanceTickTimer);
        autoAdvanceTimer = null;
        autoAdvanceTickTimer = null;
        if (autoAdvanceCountdown) autoAdvanceCountdown.textContent = "";
    }

    function startAutoAdvance() {
        stopAutoAdvance();

        if (!autoAdvance || !autoAdvance.checked || !practiceState.script) return;
        if (practiceState.currentStep >= practiceState.script.steps.length - 1) return;

        const delay = parseInt(autoAdvanceDelaySelect ? autoAdvanceDelaySelect.value : "5000", 10) || 5000;
        autoAdvanceRemainingMs = delay;

        autoAdvanceTickTimer = setInterval(() => {
            autoAdvanceRemainingMs -= 250;
            if (autoAdvanceCountdown) {
                const secs = Math.max(0, Math.ceil(autoAdvanceRemainingMs / 1000));
                autoAdvanceCountdown.textContent = `Next step in ${secs}s`;
            }
        }, 250);

        autoAdvanceTimer = setTimeout(() => {
            nextPracticeStep();
        }, delay);
    }

    function speakStepText(text) {
        if (!("speechSynthesis" in window)) {
            showToast("Speech isn't supported in this browser.", "error");
            return;
        }
        window.speechSynthesis.cancel();
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

    // ---------- Fill in the blanks (personalize [placeholders]) ----------

    function findPlaceholders() {
        const found = new Set();
        const pattern = /\[([^\]]+)\]/g;
        currentScript.steps.forEach(step => {
            let match;
            while ((match = pattern.exec(step.text || "")) !== null) {
                found.add(match[1]);
            }
        });
        return [...found];
    }

    function openPersonalizeDialog() {
        const placeholders = findPlaceholders();
        if (placeholders.length === 0) {
            showToast("No placeholders like [Name] found in this script.", "error");
            return;
        }

        const modal = document.createElement("dialog");
        modal.className = "modal-base personalize-modal";
        modal.setAttribute("aria-labelledby", "personalize-title");
        modal.innerHTML = `
            <div class="modal-header">
                <h3 id="personalize-title">Fill In Your Details</h3>
                <button aria-label="Close" class="btn btn-secondary close-personalize" type="button">X</button>
            </div>
            <div class="personalize-fields">
                ${placeholders.map((p, i) => `
                    <label class="field">
                        <span>[${escapeHtml(p)}]</span>
                        <input data-placeholder="${escapeHtml(p)}" id="personalize-field-${i}" placeholder="Leave blank to keep [${escapeHtml(p)}]" type="text" />
                    </label>
                `).join("")}
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary close-personalize" type="button">Cancel</button>
                <button class="btn btn-primary" id="apply-personalize" type="button">Apply</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.showModal();

        const close = () => {
            modal.close();
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelectorAll(".close-personalize").forEach(btn => on(btn, "click", close));

        on(el("#apply-personalize", modal), "click", () => {
            const inputs = modal.querySelectorAll("input[data-placeholder]");
            let replacedCount = 0;

            inputs.forEach(input => {
                const value = input.value.trim();
                if (!value) return;

                const token = `[${input.dataset.placeholder}]`;
                currentScript.steps.forEach(step => {
                    if (step.text && step.text.includes(token)) {
                        step.text = step.text.split(token).join(value);
                        replacedCount++;
                    }
                });
            });

            renderSteps();
            scheduleDraftSave();
            close();

            if (replacedCount > 0) {
                showToast("Script personalized!", "success");
            } else {
                showToast("No blanks were filled in.");
            }
        });
    }

    // ---------- Printable cue card ----------

    function printCurrentScript() {
        if (currentScript.steps.length === 0) {
            showToast("Add at least one step before printing.", "error");
            return;
        }
        if (!printArea) return;

        const stepsHtml = currentScript.steps.map(step => {
            const stepType = getStepType(step.type);
            return `
                <div class="print-step">
                    <div class="print-step-type">${escapeHtml(stepType.name)}</div>
                    <div class="print-step-text">${escapeHtml(step.text || "(No content)")}</div>
                </div>
            `;
        }).join("");

        printArea.innerHTML = `
            <h2>${escapeHtml(currentScript.title || "Untitled Script")}</h2>
            ${currentScript.description ? `<p><em>${escapeHtml(currentScript.description)}</em></p>` : ""}
            ${stepsHtml}
        `;

        window.print();
    }

    // ---------- Text size ----------

    function applyTextScale(level) {
        textScaleLevel = Math.max(0, Math.min(TEXT_SCALE_CLASSES.length - 1, level));
        TEXT_SCALE_CLASSES.forEach(cls => document.body.classList.remove(cls));
        document.body.classList.add(TEXT_SCALE_CLASSES[textScaleLevel]);
        localStorage.setItem(TEXT_SCALE_KEY, String(textScaleLevel));
    }

    function initTextScale() {
        const saved = parseInt(localStorage.getItem(TEXT_SCALE_KEY), 10);
        applyTextScale(Number.isInteger(saved) ? saved : 0);
    }

    // ---------- Breathing / grounding break ----------

    function startBreathingBreak() {
        if (!breathingPacer || !breathingText) return;
        stopAutoAdvance();

        const phases = ["Breathe in...", "Hold...", "Breathe out...", "Hold..."];
        let phaseIndex = 0;

        breathingPacer.hidden = false;
        breathingText.textContent = phases[0];

        clearInterval(breathingInterval);
        clearTimeout(breathingTimeout);

        breathingInterval = setInterval(() => {
            phaseIndex = (phaseIndex + 1) % phases.length;
            breathingText.textContent = phases[phaseIndex];
        }, 4000);

        breathingTimeout = setTimeout(stopBreathingBreak, 32000);
    }

    function stopBreathingBreak() {
        clearInterval(breathingInterval);
        clearTimeout(breathingTimeout);
        if (breathingPacer) breathingPacer.hidden = true;

        if (autoAdvance && autoAdvance.checked && practiceState.script) {
            startAutoAdvance();
        }
    }

    // ---------- Wiring ----------

    function wire() {
        initTextScale();
        restoreDraft();
        renderSteps();
        renderScriptLibrary();
        populatePremadeCategories();
        renderPremadeScripts();

        on(scriptTitle, "input", scheduleDraftSave);
        on(scriptDescription, "input", scheduleDraftSave);

        on(addStepBtn, "click", () => {
            addStep(stepTypeSelect.value);
        });

        on(saveScriptBtn, "click", saveCurrentScript);
        on(newScriptBtn, "click", newScript);
        on(exportScriptBtn, "click", exportScript);

        on(importScriptBtn, "click", () => {
            if (importFileInput) importFileInput.click();
        });
        on(importFileInput, "change", (e) => {
            const file = e.target.files[0];
            if (file) handleImportFile(file);
            e.target.value = "";
        });

        on(personalizeBtn, "click", openPersonalizeDialog);
        on(printScriptBtn, "click", printCurrentScript);
        on(fontIncreaseBtn, "click", () => applyTextScale(textScaleLevel + 1));
        on(fontDecreaseBtn, "click", () => applyTextScale(textScaleLevel - 1));
        on(premadeCategoryFilter, "change", (e) => renderPremadeScripts(e.target.value));

        on(backupAllBtn, "click", exportAllScripts);
        on(restoreAllBtn, "click", () => {
            if (importAllFileInput) importAllFileInput.click();
        });
        on(importAllFileInput, "change", (e) => {
            const file = e.target.files[0];
            if (file) handleImportAllFile(file);
            e.target.value = "";
        });

        on(practiceBtn, "click", () => {
            if (currentScript.steps.length === 0) {
                showToast("Add at least one step before practicing.", "error");
                return;
            }

            if (!scriptTitle.value.trim()) {
                scriptTitle.value = "Untitled Script";
            }

            saveCurrentScript();
            startPractice(currentScript.id);
        });

        on(prevStepBtn, "click", prevPracticeStep);
        on(nextStepBtn, "click", nextPracticeStep);
        on(resetPracticeBtn, "click", resetPractice);
        on(readAloudBtn, "click", () => speakStepText(currentStepText.textContent));
        on(breathingBtn, "click", startBreathingBreak);
        on(breathingStopBtn, "click", stopBreathingBreak);

        on(practiceModal, "keydown", (e) => {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                nextPracticeStep();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                prevPracticeStep();
            }
        });

        on(closePractice, "click", () => {
            practiceModal.close();
            stopTimer();
            stopAutoAdvance();
            clearInterval(breathingInterval);
            clearTimeout(breathingTimeout);
            if (breathingPacer) breathingPacer.hidden = true;
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        });

        on(helpBtn, "click", () => {
            helpModal.showModal();
        });

        on(closeHelp, "click", () => {
            helpModal.close();
        });

        on(closeHelpBtn, "click", () => {
            helpModal.close();
        });

        on(searchScripts, "input", (e) => {
            renderScriptLibrary(e.target.value);
        });

        on(sortSelect, "change", () => {
            renderScriptLibrary(searchScripts ? searchScripts.value : "");
        });

        on(autoAdvance, "change", () => {
            if (!practiceState.script) return;
            if (autoAdvance.checked) startAutoAdvance();
            else stopAutoAdvance();
        });

        on(autoAdvanceDelaySelect, "change", () => {
            if (practiceState.script && autoAdvance.checked) startAutoAdvance();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        window.moveStep = moveStep;
        window.removeStep = removeStep;
        window.duplicateStep = duplicateStep;
        window.loadScriptForEdit = loadScriptForEdit;
        window.startPractice = startPractice;
        window.deleteScript = deleteScript;
        window.duplicateScript = duplicateScript;
        window.loadPremadeScript = loadPremadeScript;
        window.previewPremadeScript = previewPremadeScript;

        wire();
    });
})();
