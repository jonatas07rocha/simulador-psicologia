document.addEventListener('DOMContentLoaded', () => {

    const THEME_ICONS = ['scale', 'brain-circuit', 'brain-cog', 'graduation-cap', 'book-check', 'history'];
    const THEME_COLORS = ['text-cyan-500', 'text-amber-500', 'text-violet-500', 'text-emerald-500', 'text-pink-500', 'text-sky-500'];

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
        feedbackArea: document.getElementById('feedback-area'),
        feedbackIcon: document.getElementById('feedback-icon'),
        feedbackTitle: document.getElementById('feedback-title'),
        explanationText: document.getElementById('explanation-text'),
        nextBtn: document.getElementById('next-btn'),
        quitQuizBtn: document.getElementById('back-to-menu-btn-quiz'),
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
    
    const TOTAL_QUESTIONS = 10;
    const CHALLENGE_TIME_PER_QUESTION = 20;

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
        if (!state.reviewDeck.includes(questionId)) {
            state.reviewDeck.push(questionId);
            saveReviewDeck();
        }
    };

    const removeQuestionFromReview = (question) => {
        const questionId = getQuestionId(question);
        state.reviewDeck = state.reviewDeck.filter(id => id !== questionId);
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

    // --- Inicialização ---
    
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
        elements.quitQuizBtn.addEventListener('click', quitQuiz);
        elements.restartBtn.addEventListener('click', () => {
            if (state.currentMode === 'review') startReviewSession();
            else startQuiz();
        });
        elements.backToMenuResultsBtn.addEventListener('click', () => showView('selection-container'));
        elements.reviewAnswersBtn.addEventListener('click', renderReview);
        elements.backToResultsBtn.addEventListener('click', () => showView('results-container'));
    }

    function renderThemeSelection() {
        // Limpa o grid antes de adicionar novos cards
        const themeCardsHTML = state.allQuestionsData.bancoDeQuestoes.map((themeData, index) => {
            const totalQuestions = (themeData.questoesDiretoDoConcurso?.length || 0) + (themeData.questoesDeConcurso?.length || 0);
            const iconName = THEME_ICONS[index % THEME_ICONS.length];
            const iconColor = THEME_COLORS[index % THEME_COLORS.length];
            return `
                <div class="selection-card theme-card p-6" data-theme-index="${index}">
                    <i data-lucide="${iconName}" class="w-10 h-10 mb-4 ${iconColor}"></i>
                    <h2 class="text-xl font-bold mb-2 text-center text-gray-800 dark:text-white">${themeData.tema}</h2>
                    <p class="card-description text-sm">${totalQuestions} questões disponíveis</p>
                </div>
            `;
        }).join('');
        
        // Remove apenas os cards de tema antigos para não apagar o card de revisão
        elements.selectionGrid.querySelectorAll('.theme-card').forEach(card => card.remove());
        elements.selectionGrid.insertAdjacentHTML('beforeend', themeCardsHTML);
        lucide.createIcons();
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
        state.currentTheme = { tema: "Revisão" }; // Objeto simulado de tema
        
        const allQuestions = state.allQuestionsData.bancoDeQuestoes.flatMap(theme => [
            ...(theme.questoesDiretoDoConcurso || []),
            ...(theme.questoesDeConcurso || [])
        ]);

        state.quizQuestions = state.reviewDeck
            .map(id => allQuestions.find(q => getQuestionId(q) === id))
            .filter(Boolean) // Remove nulos se uma questão não for encontrada
            .sort(() => 0.5 - Math.random()); // Embaralha a ordem da revisão
        
        if (state.quizQuestions.length === 0) {
            alert("Não há questões na sua lista de revisão.");
            return;
        }

        setupAndLaunchQuiz();
    }

    function startQuiz() {
        const allThemeQuestions = [
            ...(state.currentTheme.questoesDiretoDoConcurso || []),
            ...(state.currentTheme.questoesDeConcurso || [])
        ];
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
        let modeText = state.currentMode === 'review' 
            ? 'Revisão (Modo Prática)' 
            : `Modo: ${state.currentMode.charAt(0).toUpperCase() + state.currentMode.slice(1)}`;
        elements.quizSubtitle.textContent = modeText;
        elements.score.textContent = '0';
        
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
        allButtons = answerContainer.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
        
        const question = state.quizQuestions[state.currentQuestionIndex];
        const userAnswerKey = selectedButton.dataset.key;
        
        const gabaritoFormatado = question.gabarito.toLowerCase().trim();
        const correctAnswerKey = gabaritoFormatado.startsWith('certo') ? 'c' : gabaritoFormatado.startsWith('errado') ? 'e' : gabaritoFormatado;

        const isCorrect = userAnswerKey === correctAnswerKey;
        
        state.userAnswers.push({ question, userAnswerKey, isCorrect });

        if (isCorrect) {
            state.score++;
            elements.score.textContent = state.score;
            selectedButton.classList.add('correct');
            triggerConfetti();
            
            if (state.currentMode === 'review') {
                removeQuestionFromReview(question);
            }
        } else {
            selectedButton.classList.add('incorrect');
            const correctButton = answerContainer.querySelector(`[data-key="${correctAnswerKey}"]`);
            if (correctButton) correctButton.classList.add('correct');
            
            // Adiciona à revisão apenas se não for uma sessão de revisão
            if (state.currentMode !== 'review') {
                addQuestionToReview(question);
            }
        }

        const effectiveMode = state.currentMode === 'review' ? 'practice' : state.currentMode;
        if (effectiveMode === 'practice') {
            showFeedback(isCorrect, question.gabarito);
        } else {
            setTimeout(goToNextQuestion, 1200);
        }
    }

    // --- Demais funções (já existentes, com pequenas adaptações) ---
    
    function quitQuiz() {
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        state.currentTheme = null;
        showView('selection-container');
    }
    
    function showView(viewId) {
        const views = [ elements.selectionContainer, elements.modeSelectionContainer, elements.quizContainer, elements.resultsContainer, elements.reviewContainer ];
        views.forEach(view => view.classList.add('hidden'));
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('fade-in');
        }
        window.scrollTo(0, 0);
    }
    
    function renderCurrentQuestion() {
        elements.cardStackContainer.innerHTML = '';
        elements.feedbackArea.classList.add('hidden');
        
        const question = state.quizQuestions[state.currentQuestionIndex];
        elements.questionCounter.textContent = `Questão ${state.currentQuestionIndex + 1} de ${state.quizQuestions.length}`;
        
        const isCertoErrado = question.tipo === 'CERTO_ERRADO';
        const alternativesHTML = isCertoErrado 
            ? `<button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="c">C) Certo</button><button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="e">E) Errado</button>`
            : question.alternativas.map(alt => `<button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="${alt.key}"><span class="font-bold mr-2">${alt.key.toUpperCase()})</span> ${alt.text}</button>`).join('');

        const cardHTML = `<div class="quiz-card fade-in"><p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">${question.fonte}</p><p class="text-lg leading-relaxed mb-6">${question.enunciado}</p><div class="space-y-3" id="answer-options">${alternativesHTML}</div></div>`;
        
        elements.cardStackContainer.innerHTML = cardHTML;
        document.getElementById('answer-options').addEventListener('click', handleAnswerClick);
    }

    function showFeedback(isCorrect, correctAnswer) {
        elements.feedbackArea.classList.remove('hidden', 'correct', 'incorrect');
        elements.feedbackArea.classList.add('fade-in', isCorrect ? 'correct' : 'incorrect');
        elements.feedbackIcon.innerHTML = isCorrect ? `<i data-lucide="check-circle-2" class="w-8 h-8 text-green-600"></i>` : `<i data-lucide="x-circle" class="w-8 h-8 text-red-600"></i>`;
        elements.feedbackTitle.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!';
        elements.explanationText.textContent = isCorrect ? 'Muito bem! Continue assim.' : `A resposta correta era: ${correctAnswer}`;
        lucide.createIcons();
    }

    function goToNextQuestion() {
        elements.feedbackArea.classList.add('hidden');
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

    function showResults() {
        clearInterval(state.timerId);
        state.timerId = null;
        
        const scorePercentage = state.quizQuestions.length > 0 ? (state.score / state.quizQuestions.length) * 100 : 0;
        const radius = 15.9155;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (scorePercentage / 100) * circumference;
        
        elements.resultsCircle.style.strokeDasharray = circumference;
        setTimeout(() => { elements.resultsCircle.style.strokeDashoffset = offset; }, 100);
        
        elements.finalScore.textContent = `${Math.round(scorePercentage)}%`;
        
        let message = "Continue praticando para melhorar!";
        if (scorePercentage >= 90) {
            message = "Excelente desempenho! Você está no caminho certo!";
            triggerConfetti();
        } else if (scorePercentage >= 70) {
            message = "Ótimo resultado! Você está quase lá.";
        } else if (scorePercentage >= 50) {
            message = "Bom esforço! A prática leva à perfeição.";
        }

        elements.finalMessage.textContent = message;
        showView('results-container');
    }
    
    function renderReview() {
        elements.reviewContent.innerHTML = state.userAnswers.map((answer, index) => {
            const { question, userAnswerKey, isCorrect } = answer;
            const gabaritoFormatado = question.gabarito.toLowerCase().trim();
            const correctAnswerKey = gabaritoFormatado.startsWith('certo') ? 'c' : gabaritoFormatado.startsWith('errado') ? 'e' : gabaritoFormatado;
            let alternativesHTML;
            if (question.tipo === 'CERTO_ERRADO') {
                alternativesHTML = `<p class="p-3 rounded-lg ${'c' === correctAnswerKey ? 'bg-green-100 dark:bg-green-900/50 font-bold' : ''} ${'c' === userAnswerKey && !isCorrect ? 'bg-red-100 dark:bg-red-900/50 line-through' : ''}">C) Certo</p><p class="p-3 rounded-lg ${'e' === correctAnswerKey ? 'bg-green-100 dark:bg-green-900/50 font-bold' : ''} ${'e' === userAnswerKey && !isCorrect ? 'bg-red-100 dark:bg-red-900/50 line-through' : ''}">E) Errado</p>`;
            } else {
                alternativesHTML = question.alternativas.map(alt => {
                    const isUserAnswer = alt.key === userAnswerKey;
                    const isCorrectAnswer = alt.key === correctAnswerKey;
                    let classes = "p-3 rounded-lg";
                    if (isCorrectAnswer) classes += " bg-green-100 dark:bg-green-900/50 font-bold";
                    if (isUserAnswer && !isCorrect) classes += " bg-red-100 dark:bg-red-900/50 line-through";
                    return `<p class="${classes}">${alt.key.toUpperCase()}) ${alt.text}</p>`;
                }).join('');
            }
            return `<div class="border-b border-gray-200 dark:border-gray-700 pb-6"><p class="font-bold mb-2">Questão ${index + 1}: ${isCorrect ? '<span class="text-green-500">Correta</span>' : '<span class="text-red-500">Incorreta</span>'}</p><p class="text-gray-600 dark:text-gray-300 mb-4">${question.enunciado}</p><div class="space-y-2 text-sm">${alternativesHTML}</div></div>`;
        }).join('');
        showView('review-container');
    }

    function applyTheme(theme) {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
        lucide.createIcons();
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    function startTimer() {
        clearInterval(state.timerId);
        state.timeLeft = state.quizQuestions.length * CHALLENGE_TIME_PER_QUESTION;
        updateTimerDisplay();
        state.timerId = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            if (state.timeLeft <= 0) showResults();
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
        const seconds = (state.timeLeft % 60).toString().padStart(2, '0');
        elements.timer.textContent = `${minutes}:${seconds}`;
    }
    
    function triggerConfetti() {
        if (window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }

    init();
});
