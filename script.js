document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos do DOM ---
    const elements = {
        loader: document.getElementById('loader'),
        appContainer: document.getElementById('app-container'),
        
        // Telas
        selectionContainer: document.getElementById('selection-container'),
        modeSelectionContainer: document.getElementById('mode-selection-container'),
        quizContainer: document.getElementById('quiz-container'),
        resultsContainer: document.getElementById('results-container'),
        reviewContainer: document.getElementById('review-container'),
        
        // Seleção
        selectionGrid: document.getElementById('selection-grid'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // Seleção de Modo
        modeSelectionTitle: document.getElementById('mode-selection-title'),
        modeButtons: document.querySelectorAll('[data-mode]'),
        backToThemeBtn: document.getElementById('back-to-theme-selection-btn'),

        // Quiz
        quizHeader: document.getElementById('quiz-header'),
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

        // Resultados
        resultsTitle: document.getElementById('results-title'),
        finalScore: document.getElementById('final-score'),
        finalMessage: document.getElementById('final-message'),
        resultsCircle: document.getElementById('results-circle'),
        reviewAnswersBtn: document.getElementById('review-answers-btn'),
        restartBtn: document.getElementById('restart-btn'),
        backToMenuResultsBtn: document.getElementById('back-to-menu-btn-results'),

        // Revisão
        reviewContent: document.getElementById('review-content'),
        backToResultsBtn: document.getElementById('back-to-results-btn'),

        // Tema
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
    };

    // --- Estado da Aplicação ---
    const state = {
        allQuestions: [],
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
    const CHALLENGE_TIME_PER_QUESTION = 20; // 20 segundos por questão

    // --- Funções de Inicialização e Carregamento ---

    async function init() {
        setupEventListeners();
        applyTheme(localStorage.getItem('theme') || 'light');
        
        try {
            const response = await fetch('bancoDeQuestoes.json');
            if (!response.ok) throw new Error('Network response was not ok');
            state.allQuestions = await response.json();
            
            if (state.allQuestions.bancoDeQuestoes.length > 0) {
                 renderThemeSelection();
                 showView('selection-container');
            } else {
                showError("Nenhum tema encontrado no banco de questões.");
            }

        } catch (error) {
            console.error('Failed to load questions:', error);
            showError("Falha ao carregar as questões. Verifique o console para mais detalhes.");
        } finally {
            elements.loader.style.display = 'none';
        }
    }

    function setupEventListeners() {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
        elements.selectionGrid.addEventListener('click', handleThemeSelection);
        elements.modeButtons.forEach(btn => btn.addEventListener('click', handleModeSelection));
        elements.backToThemeBtn.addEventListener('click', () => showView('selection-container'));
        elements.nextBtn.addEventListener('click', goToNextQuestion);
        elements.quitQuizBtn.addEventListener('click', () => showView('selection-container'));
        elements.restartBtn.addEventListener('click', startQuiz);
        elements.backToMenuResultsBtn.addEventListener('click', () => showView('selection-container'));
        elements.reviewAnswersBtn.addEventListener('click', renderReview);
        elements.backToResultsBtn.addEventListener('click', () => showView('results-container'));
    }

    // --- Gerenciamento de Visualização (Telas) ---

    function showView(viewId) {
        const views = [
            elements.selectionContainer, 
            elements.modeSelectionContainer, 
            elements.quizContainer, 
            elements.resultsContainer, 
            elements.reviewContainer
        ];
        views.forEach(view => view.classList.add('hidden'));
        
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('fade-in');
        }
    }

    function showError(message) {
        elements.loader.innerHTML = `<p class="text-red-500">${message}</p>`;
    }

    // --- Lógica de Seleção de Tema e Modo ---

    function renderThemeSelection() {
        const themes = state.allQuestions.bancoDeQuestoes;
        elements.selectionGrid.innerHTML = themes.map((themeData, index) => {
            const totalQuestions = (themeData.questoesDiretoDoConcurso?.length || 0) + (themeData.questoesDeConcurso?.length || 0);
            
            return `
                <div class="selection-card p-6 cursor-pointer" data-theme-index="${index}">
                    <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">${themeData.tema}</h2>
                    <p class="card-description">${totalQuestions} questões disponíveis</p>
                </div>
            `;
        }).join('');
    }

    function handleThemeSelection(e) {
        const card = e.target.closest('.selection-card');
        if (!card) return;
        
        const themeIndex = parseInt(card.dataset.themeIndex, 10);
        state.currentTheme = state.allQuestions.bancoDeQuestoes[themeIndex];
        
        elements.modeSelectionTitle.textContent = `Tema: ${state.currentTheme.tema}`;
        showView('mode-selection-container');
    }

    function handleModeSelection(e) {
        const button = e.target.closest('[data-mode]');
        if (!button) return;
        
        state.currentMode = button.dataset.mode;
        startQuiz();
    }

    // --- Lógica do Simulado ---

    function startQuiz() {
        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];
        
        const allThemeQuestions = [
            ...(state.currentTheme.questoesDiretoDoConcurso || []),
            ...(state.currentTheme.questoesDeConcurso || [])
        ];

        // Embaralhar e selecionar questões
        state.quizQuestions = allThemeQuestions.sort(() => 0.5 - Math.random()).slice(0, TOTAL_QUESTIONS);
        
        if (state.quizQuestions.length < 1) {
            showError(`O tema "${state.currentTheme.tema}" não possui questões.`);
            showView('selection-container');
            return;
        }

        elements.quizTitle.textContent = state.currentTheme.tema;
        elements.quizSubtitle.textContent = `Modo: ${state.currentMode.charAt(0).toUpperCase() + state.currentMode.slice(1)}`;
        elements.score.textContent = '0';
        elements.feedbackArea.classList.add('hidden');
        
        showView('quiz-container');
        renderCurrentQuestion();

        if (state.currentMode === 'challenge') {
            startTimer();
            elements.timerContainer.classList.remove('hidden');
        } else {
            elements.timerContainer.classList.add('hidden');
        }
    }

    function renderCurrentQuestion() {
        elements.cardStackContainer.innerHTML = '';
        elements.feedbackArea.classList.add('hidden');
        
        const question = state.quizQuestions[state.currentQuestionIndex];
        elements.questionCounter.textContent = `Questão ${state.currentQuestionIndex + 1} de ${state.quizQuestions.length}`;
        
        const isCertoErrado = question.tipo === 'CERTO_ERRADO';
        const alternativesHTML = isCertoErrado 
            ? `
                <button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="c">C) Certo</button>
                <button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="e">E) Errado</button>
            `
            : question.alternativas.map(alt => `
                <button class="answer-btn w-full text-left p-4 rounded-lg font-semibold" data-key="${alt.key}">
                    <span class="font-bold mr-2">${alt.key.toUpperCase()})</span> ${alt.text}
                </button>
            `).join('');

        const cardHTML = `
            <div class="quiz-card fade-in">
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">${question.fonte}</p>
                <p class="text-lg leading-relaxed mb-6">${question.enunciado}</p>
                <div class="space-y-3" id="answer-options">
                    ${alternativesHTML}
                </div>
            </div>
        `;
        
        elements.cardStackContainer.innerHTML = cardHTML;
        document.getElementById('answer-options').addEventListener('click', handleAnswerClick);
    }
    
    function handleAnswerClick(e) {
        const selectedButton = e.target.closest('.answer-btn');
        if (!selectedButton) return;
        
        const answerContainer = selectedButton.parentElement;
        const allButtons = answerContainer.querySelectorAll('.answer-btn');
        allButtons.forEach(btn => btn.disabled = true);
        
        const question = state.quizQuestions[state.currentQuestionIndex];
        const userAnswerKey = selectedButton.dataset.key;
        
        const correctAnswerKey = question.gabarito.toLowerCase().startsWith('c') ? 'c' : 
                                 question.gabarito.toLowerCase().startsWith('e') ? 'e' : 
                                 question.gabarito.toLowerCase();

        const isCorrect = userAnswerKey === correctAnswerKey;
        
        state.userAnswers.push({ question, userAnswerKey, isCorrect });

        if (isCorrect) {
            state.score++;
            elements.score.textContent = state.score;
            selectedButton.classList.add('correct');
        } else {
            selectedButton.classList.add('incorrect');
            const correctButton = answerContainer.querySelector(`[data-key="${correctAnswerKey}"]`);
            if (correctButton) correctButton.classList.add('correct');
        }

        if (state.currentMode === 'practice') {
            showFeedback(isCorrect, question.gabarito);
        } else {
            setTimeout(goToNextQuestion, 1200);
        }
    }

    function showFeedback(isCorrect, correctAnswer) {
        elements.feedbackArea.classList.remove('hidden', 'correct', 'incorrect');
        elements.feedbackArea.classList.add('fade-in', isCorrect ? 'correct' : 'incorrect');

        elements.feedbackIcon.innerHTML = isCorrect 
            ? `<i data-lucide="check-circle-2" class="w-8 h-8 text-green-600"></i>`
            : `<i data-lucide="x-circle" class="w-8 h-8 text-red-600"></i>`;
        
        elements.feedbackTitle.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!';
        elements.explanationText.textContent = isCorrect ? 'Muito bem! Continue assim.' : `A resposta correta era: ${correctAnswer}`;
        
        lucide.createIcons();
    }

    function goToNextQuestion() {
        // *** LINHA ADICIONADA PARA A CORREÇÃO ***
        elements.feedbackArea.classList.add('hidden');

        const card = document.querySelector('.quiz-card');
        if (card) {
            card.classList.add('card-exit');
        }
        
        setTimeout(() => {
            state.currentQuestionIndex++;
            if (state.currentQuestionIndex < state.quizQuestions.length) {
                renderCurrentQuestion();
            } else {
                showResults();
            }
        }, 500);
    }

    // --- Lógica de Resultados e Revisão ---

    function showResults() {
        clearInterval(state.timerId);
        
        const scorePercentage = (state.score / state.quizQuestions.length) * 100;
        const radius = 15.9155;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (scorePercentage / 100) * circumference;
        
        elements.resultsCircle.style.strokeDasharray = circumference;
        elements.resultsCircle.style.strokeDashoffset = offset;
        
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
            const correctAnswerKey = question.gabarito.toLowerCase().startsWith('c') ? 'c' : 
                                     question.gabarito.toLowerCase().startsWith('e') ? 'e' : 
                                     question.gabarito.toLowerCase();

            let alternativesHTML;
            if (question.tipo === 'CERTO_ERRADO') {
                alternativesHTML = `
                    <p class="p-3 rounded-lg ${'c' === correctAnswerKey ? 'bg-green-100 dark:bg-green-900/50' : ''} ${'c' === userAnswerKey && !isCorrect ? 'bg-red-100 dark:bg-red-900/50' : ''}">C) Certo</p>
                    <p class="p-3 rounded-lg ${'e' === correctAnswerKey ? 'bg-green-100 dark:bg-green-900/50' : ''} ${'e' === userAnswerKey && !isCorrect ? 'bg-red-100 dark:bg-red-900/50' : ''}">E) Errado</p>
                `;
            } else {
                alternativesHTML = question.alternativas.map(alt => {
                    const isUserAnswer = alt.key === userAnswerKey;
                    const isCorrectAnswer = alt.key === correctAnswerKey;
                    let classes = "p-3 rounded-lg";
                    if (isCorrectAnswer) classes += " bg-green-100 dark:bg-green-900/50";
                    if (isUserAnswer && !isCorrect) classes += " bg-red-100 dark:bg-red-900/50";
                    return `<p class="${classes}">${alt.key.toUpperCase()}) ${alt.text}</p>`;
                }).join('');
            }
            
            return `
                <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <p class="font-bold mb-2">Questão ${index + 1}: ${isCorrect ? '<span class="text-green-500">Correta</span>' : '<span class="text-red-500">Incorreta</span>'}</p>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">${question.enunciado}</p>
                    <div class="space-y-2 text-sm">${alternativesHTML}</div>
                </div>
            `;
        }).join('');
        showView('review-container');
    }


    // --- Funções Utilitárias (Tema, Timer, Confetes) ---

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
        lucide.createIcons(); // Recria os ícones para alternar sol/lua
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    function startTimer() {
        clearInterval(state.timerId);
        state.timeLeft = state.quizQuestions.length * CHALLENGE_TIME_PER_QUESTION;
        
        state.timerId = setInterval(() => {
            state.timeLeft--;
            const minutes = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
            const seconds = (state.timeLeft % 60).toString().padStart(2, '0');
            elements.timer.textContent = `${minutes}:${seconds}`;

            if (state.timeLeft <= 0) {
                clearInterval(state.timerId);
                showResults();
            }
        }, 1000);
    }
    
    function triggerConfetti() {
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            });
        }
    }

    // --- Iniciar a Aplicação ---
    init();
});
