document.addEventListener('DOMContentLoaded', () => {

    // --- Configurações e Constantes ---
    const THEME_ICONS = ['scale', 'brain-circuit', 'brain-cog', 'graduation-cap', 'book-check', 'history'];
    const THEME_COLORS = ['text-cyan-500', 'text-amber-500', 'text-violet-500', 'text-emerald-500', 'text-pink-500', 'text-sky-500'];
    const TOTAL_QUESTIONS = 10;
    const CHALLENGE_TIME_PER_QUESTION = 20;

    // --- Referências ao DOM ---
    const elements = {
        loader: document.getElementById('loader'),
        homeLink: document.getElementById('home-link'),
        selectionContainer: document.getElementById('selection-container'),
        modeSelectionContainer: document.getElementById('mode-selection-container'),
        quizContainer: document.getElementById('quiz-container'),
        resultsContainer: document.getElementById('results-container'),
        reviewContainer: document.getElementById('review-container'),
        selectionGrid: document.getElementById('selection-grid'),
        reviewCard: document.getElementById('review-card'),
        reviewCount: document.getElementById('review-count'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        modeSelectionTitle: document.getElementById('mode-selection-title'),
        modeButtons: document.querySelectorAll('[data-mode]'),
        backToThemeBtn: document.getElementById('back-to-theme-selection-btn'),
        quizTitle: document.getElementById('quiz-title'),
        quizSubtitle: document.getElementById('quiz-subtitle'),
        questionCounter: document.getElementById('question-counter'),
        score: document.getElementById('score'),
        timerContainer: document.getElementById('timer-container'),
        timer: document.getElementById('timer'),
        cardStackContainer: document.getElementById('card-stack-container'),
        feedbackFooter: document.getElementById('feedback-footer'),
        feedbackArea: document.getElementById('feedback-area'),
        feedbackIcon: document.getElementById('feedback-icon'),
        feedbackTitle: document.getElementById('feedback-title'),
        explanationText: document.getElementById('explanation-text'),
        nextBtn: document.getElementById('next-btn'),
        finalScore: document.getElementById('final-score'),
        finalMessage: document.getElementById('final-message'),
        resultsCircle: document.getElementById('results-circle'),
        reviewAnswersBtn: document.getElementById('review-answers-btn'),
        restartBtn: document.getElementById('restart-btn'),
        backToMenuResultsBtn: document.getElementById('back-to-menu-btn-results'),
        reviewContent: document.getElementById('review-content'),
        backToResultsBtn: document.getElementById('back-to-results-btn'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
    };

    // --- Estado da Aplicação ---
    const state = {
        allQuestionsData: null,
        reviewDeck: [],
        currentTheme: null,
        currentMode: null,
        quizQuestions: [],
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: [],
        timerId: null,
        timeLeft: 0,
    };
    
    // --- Módulo de Áudio ---
    let correctSound, incorrectSound;
    try {
        if (window.Tone) {
            correctSound = new Tone.Synth().toDestination();
            incorrectSound = new Tone.Synth().toDestination();
        }
    } catch (e) {
        console.warn("Tone.js não pôde ser inicializado. O feedback de áudio está desativado.");
    }

    // --- Lógica de Persistência (LocalStorage) ---
    const getQuestionId = (question) => `${question.fonte}-${question.numero}`.toLowerCase().replace(/[\/\s]/g, '-');

    const loadReviewDeck = () => {
        const deck = localStorage.getItem('reviewDeck');
        state.reviewDeck = deck ? JSON.parse(deck) : [];
        updateReviewCard();
    };

    const saveReviewDeck = () => {
        localStorage.setItem('reviewDeck', JSON.stringify(state.reviewDeck));
        updateReviewCard();
    };

    const addQuestionToReview = (question) => {
        const questionId = getQuestionId(question);
        if (!state.reviewDeck.some(item => getQuestionId(item) === questionId)) {
            state.reviewDeck.push(question);
        }
        saveReviewDeck();
    };

    const removeQuestionFromReview = (question) => {
        const questionId = getQuestionId(question);
        state.reviewDeck = state.reviewDeck.filter(item => getQuestionId(item) !== questionId);
        saveReviewDeck();
    };
    
    const clearAllHistory = () => {
        if (confirm("Você tem certeza que deseja apagar permanentemente todas as questões da sua lista de revisão?")) {
            state.reviewDeck = [];
            saveReviewDeck();
        }
    };

    const updateReviewCard = () => {
        const count = state.reviewDeck.length;
        if (count > 0) {
            elements.reviewCount.textContent = count;
            elements.reviewCard.classList.remove('hidden');
        } else {
            elements.reviewCard.classList.add('hidden');
        }
    };

    // --- Inicialização e Event Listeners ---
    async function init() {
        setupEventListeners();
        applyTheme(localStorage.getItem('theme') || 'light');
        loadReviewDeck();
        try {
            const response = await fetch('bancoDeQuestoes.json');
            if (!response.ok) throw new Error('Network response was not ok');
            state.allQuestionsData = await response.json();
            if (state.allQuestionsData.bancoDeQuestoes?.length > 0) {
                 renderThemeSelection();
                 showView('selection-container');
            } else {
                showError("Nenhum tema encontrado no banco de questões.");
            }
        } catch (error) {
            console.error('Failed to load questions:', error);
            showError("Falha ao carregar as questões.");
        } finally {
            elements.loader.style.display = 'none';
        }
    }

    function setupEventListeners() {
        elements.homeLink.addEventListener('click', quitQuiz);
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
        elements.selectionGrid.addEventListener('click', handleThemeSelection);
        elements.reviewCard.addEventListener('click', startReviewSession);
        elements.clearHistoryBtn.addEventListener('click', clearAllHistory);
        elements.modeButtons.forEach(btn => btn.addEventListener('click', handleModeSelection));
        elements.backToThemeBtn.addEventListener('click', () => showView('selection-container'));
        elements.nextBtn.addEventListener('click', goToNextQuestion);
        elements.cardStackContainer.addEventListener('click', (e) => {
            if (e.target.closest('.quit-quiz-button')) {
                quitQuiz();
            }
        });
        elements.restartBtn.addEventListener('click', () => {
            if (state.currentMode === 'review') startReviewSession();
            else startQuiz();
        });
        elements.backToMenuResultsBtn.addEventListener('click', () => showView('selection-container'));
        elements.reviewAnswersBtn.addEventListener('click', renderReview);
        elements.backToResultsBtn.addEventListener('click', () => showView('results-container'));
    }
    
    // --- Lógica das Sessões (Tema e Revisão) ---
    function handleThemeSelection(e) {
        const card = e.target.closest('.theme-card');
        if (!card) return;
        const themeIndex = parseInt(card.dataset.themeIndex, 10);
        state.currentTheme = state.allQuestionsData.bancoDeQuestoes[themeIndex];
        elements.modeSelectionTitle.textContent = `${state.currentTheme.tema}`;
        showView('mode-selection-container');
    }

    function handleModeSelection(e) {
        const button = e.target.closest('[data-mode]');
        if (!button) return;
        state.currentMode = button.dataset.mode;
        startQuiz();
    }
    
    function startReviewSession() {
        state.currentMode = 'review';
        state.currentTheme = { tema: "Revisão" };
        state.quizQuestions = [...state.reviewDeck].sort(() => 0.5 - Math.random());
        if (state.quizQuestions.length === 0) {
            alert("Não há questões na sua lista de revisão.");
            return;
        }
        setupAndLaunchQuiz();
    }

    function startQuiz() {
        const allThemeQuestions = [...(state.currentTheme.questoesDiretoDoConcurso || []), ...(state.currentTheme.questoesDeConcurso || [])];
        state.quizQuestions = allThemeQuestions.sort(() => 0.5 - Math.random()).slice(0, TOTAL_QUESTIONS);
        if (state.quizQuestions.length < 1) {
            alert(`O tema "${state.currentTheme.tema}" não possui questões.`);
            return;
        }
        setupAndLaunchQuiz();
    }
    
    function setupAndLaunchQuiz() {
        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];
        elements.quizTitle.textContent = state.currentTheme.tema;
        let modeText = state.currentMode === 'review' ? 'Revisão (Modo Prática)' : `Modo: ${state.currentMode.charAt(0).toUpperCase() + state.currentMode.slice(1)}`;
        elements.quizSubtitle.textContent = modeText;
        elements.score.textContent = '0';
        elements.feedbackFooter.classList.remove('visible');
        showView('quiz-container');
        renderCurrentQuestion();
        if (state.currentMode === 'challenge') {
            startTimer();
            elements.timerContainer.classList.remove('hidden');
        } else {
            elements.timerContainer.classList.add('hidden');
        }
    }
    
    // --- Lógica Principal do Quiz (Renderização e Respostas) ---
    function handleAnswerClick(e) {
        const selectedButton = e.target.closest('.answer-btn');
        if (!selectedButton) return;
        const answerContainer = selectedButton.parentElement;
        answerContainer.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
        const question = state.quizQuestions[state.currentQuestionIndex];
        const userAnswerKey = selectedButton.dataset.key;
        const gabaritoFormatado = question.gabarito.toLowerCase().trim();
        const correctAnswerKey = gabaritoFormatado.startsWith('c') ? 'c' : gabaritoFormatado.startsWith('e') ? 'e' : gabaritoFormatado;
        const isCorrect = userAnswerKey === correctAnswerKey;
        state.userAnswers.push({ question, userAnswerKey, isCorrect });
        if (isCorrect) {
            state.score++;
            elements.score.textContent = state.score;
            selectedButton.classList.add('correct');
            triggerConfetti();
            correctSound?.triggerAttackRelease("C5", "8n");
            if (state.currentMode === 'review') removeQuestionFromReview(question);
        } else {
            selectedButton.classList.add('incorrect');
            const correctButton = answerContainer.querySelector(`[data-key="${correctAnswerKey}"]`);
            if (correctButton) correctButton.classList.add('correct');
            incorrectSound?.triggerAttackRelease("C3", "8n");
            if (state.currentMode !== 'review') addQuestionToReview(question);
        }
        const effectiveMode = state.currentMode === 'review' ? 'practice' : state.currentMode;
        if (effectiveMode === 'practice') {
            showFeedback(isCorrect, question.gabarito);
        } else {
            setTimeout(goToNextQuestion, 1200);
        }
    }
    
    function renderCurrentQuestion() {
        elements.cardStackContainer.innerHTML = '';
        const question = state.quizQuestions[state.currentQuestionIndex];
        elements.questionCounter.textContent = `Questão ${state.currentQuestionIndex + 1} de ${state.quizQuestions.length}`;
        const isCertoErrado = question.tipo === 'CERTO_ERRADO';
        const alternativesHTML = isCertoErrado ? `<button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="c">C) Certo</button><button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="e">E) Errado</button>` : question.alternativas.map(alt => `<button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="${alt.key}"><span class="font-bold mr-2">${alt.key.toUpperCase()})</span> ${alt.text}</button>`).join('');
        const cardHTML = `<div class="quiz-card fade-in"><button class="quit-quiz-button"><i data-lucide="x" class="w-5 h-5"></i></button><p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">${question.fonte}</p><p class="text-lg leading-relaxed mb-6">${question.enunciado}</p><div class="space-y-3" id="answer-options">${alternativesHTML}</div></div>`;
        elements.cardStackContainer.innerHTML = cardHTML;
        document.getElementById('answer-options').addEventListener('click', handleAnswerClick);
        lucide.createIcons();
    }
    
    function showFeedback(isCorrect, correctAnswer) {
        elements.feedbackArea.classList.remove('correct', 'incorrect');
        elements.feedbackArea.classList.add(isCorrect ? 'correct' : 'incorrect');
        elements.feedbackIcon.innerHTML = isCorrect ? `<i data-lucide="check-circle-2" class="w-8 h-8 text-green-600"></i>` : `<i data-lucide="x-circle" class="w-8 h-8 text-red-600"></i>`;
        elements.feedbackTitle.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!';
        elements.explanationText.textContent = isCorrect ? 'Muito bem! Continue assim.' : `A resposta correta era: ${correctAnswer}`;
        elements.feedbackFooter.classList.add('visible');
        lucide.createIcons();
    }

    function goToNextQuestion() {
        elements.feedbackFooter.classList.remove('visible');
        const card = document.querySelector('.quiz-card');
        if (card) card.classList.add('card-exit');
        setTimeout(() => {
            state.currentQuestionIndex++;
            if (state.currentQuestionIndex < state.quizQuestions.length) {
                renderCurrentQuestion();
            } else {
                showResults();
            }
        }, 500);
    }

    function quitQuiz() {
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        state.currentTheme = null;
        elements.feedbackFooter.classList.remove('visible');
        showView('selection-container');
    }
    
    function showView(viewId) {
        [elements.selectionContainer, elements.modeSelectionContainer, elements.quizContainer, elements.resultsContainer, elements.reviewContainer].forEach(view => view.classList.add('hidden'));
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('fade-in');
        }
        window.scrollTo(0, 0);
    }
    
    // --- Funções de Renderização de Telas ---
    function renderThemeSelection() { /* ... (sem alterações) ... */ }
    function showResults() { /* ... (sem alterações) ... */ }
    function renderReview() { /* ... (sem alterações) ... */ }
    
    // --- Funções Utilitárias ---
    function applyTheme(theme) { /* ... (sem alterações) ... */ }
    function toggleTheme() { /* ... (sem alterações) ... */ }
    function startTimer() { /* ... (sem alterações) ... */ }
    function updateTimerDisplay() { /* ... (sem alterações) ... */ }
    function triggerConfetti() { /* ... (sem alterações) ... */ }

    init();
});
