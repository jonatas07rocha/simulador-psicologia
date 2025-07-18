document.addEventListener('DOMContentLoaded', () => {
    // --- Variável Global para o Banco de Questões ---
    let allQuizzes = null;

    // --- Mapeamento de Elementos do DOM ---
    const elements = {
        // Contêineres principais
        selectionContainer: document.getElementById('selection-container'),
        modeSelectionContainer: document.getElementById('mode-selection-container'),
        quizContainer: document.getElementById('quiz-container'),
        reviewContainer: document.getElementById('review-container'),
        appContainer: document.getElementById('app-container'),
        loader: document.getElementById('loader'),
        
        // Seleção de Tema
        selectionGrid: document.getElementById('selection-grid'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // Cabeçalho
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        streakCounter: document.getElementById('streak-counter'),
        streakDays: document.getElementById('streak-days'),

        // Seleção de Modo
        modeSelectionTitle: document.getElementById('mode-selection-title'),
        backToThemeSelectionBtn: document.getElementById('back-to-theme-selection-btn'),

        // Simulado
        quizTitle: document.getElementById('quiz-title'),
        quizSubtitle: document.getElementById('quiz-subtitle'),
        questionCounter: document.getElementById('question-counter'),
        score: document.getElementById('score'),
        progressBar: document.getElementById('progress-bar'),
        timerContainer: document.getElementById('timer-container'),
        timer: document.getElementById('timer'),
        
        // Área da Questão
        questionArea: document.getElementById('question-area'),
        questionSource: document.getElementById('question-source'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        
        // Feedback
        feedbackArea: document.getElementById('feedback-area'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackIcon: document.getElementById('feedback-icon'),
        explanationText: document.getElementById('explanation-text'),
        
        // Controles do Simulado
        backToMenuBtnQuiz: document.getElementById('back-to-menu-btn-quiz'),
        nextBtn: document.getElementById('next-btn'),
        
        // Resultados
        resultsArea: document.getElementById('results-area'),
        resultsTitle: document.getElementById('results-title'),
        finalScore: document.getElementById('final-score'),
        finalMessage: document.getElementById('final-message'),
        resultsCircle: document.getElementById('results-circle'),
        restartBtn: document.getElementById('restart-btn'),
        reviewAnswersBtn: document.getElementById('review-answers-btn'),
        backToMenuBtnResults: document.getElementById('back-to-menu-btn-results'),

        // Revisão
        reviewContent: document.getElementById('review-content'),
        backToResultsBtn: document.getElementById('back-to-results-btn'),

        // Modal
        notificationModal: document.getElementById('notification-modal'),
        modalIcon: document.getElementById('modal-icon'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalActions: document.getElementById('modal-actions'),
        modalCloseBtn: document.getElementById('modal-close-btn'),

        // Confetes
        confettiCanvas: document.getElementById('confetti-canvas'),
    };

    // --- Estado da Aplicação ---
    let state = {
        currentQuizKey: null,
        currentQuizData: [], 
        currentQuestionIndex: 0,
        score: 0,
        quizMode: 'practice', // 'practice', 'exam', 'challenge'
        userAnswers: [],
        answeredQuestions: {}, // { quizKey: [answeredIndexes] }
        incorrectAnswers: {}, // { quizKey: [incorrectIndexes] }
        streakData: {
            currentStreak: 0,
            lastVisit: null
        },
        timerInterval: null,
    };
    
    // --- Lógica de Confetes ---
    const confettiCtx = elements.confettiCanvas.getContext('2d');
    let confettiParticles = [];
    const triggerConfetti = () => {
        elements.confettiCanvas.width = window.innerWidth;
        elements.confettiCanvas.height = window.innerHeight;
        confettiParticles = [];
        for (let i = 0; i < 100; i++) {
            confettiParticles.push({
                x: Math.random() * elements.confettiCanvas.width,
                y: -20,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 360}, 90%, 65%)`,
                speedX: Math.random() * 6 - 3,
                speedY: Math.random() * 5 + 2,
                angle: Math.random() * 360,
                spin: Math.random() * 20 - 10,
            });
        }
        animateConfetti();
    };

    const animateConfetti = () => {
        confettiCtx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);
        let activeParticles = false;
        confettiParticles.forEach(p => {
            if (p.y < elements.confettiCanvas.height) {
                activeParticles = true;
                p.x += p.speedX;
                p.y += p.speedY;
                p.angle += p.spin;
                p.speedY += 0.08; // Gravity

                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.angle * Math.PI / 180);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                confettiCtx.restore();
            }
        });
        if (activeParticles) {
            requestAnimationFrame(animateConfetti);
        } else {
             confettiCtx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);
        }
    };

    // --- Funções de Estado (Salvar/Carregar) ---
    const saveData = () => {
        localStorage.setItem('quizData', JSON.stringify({
            answeredQuestions: state.answeredQuestions,
            incorrectAnswers: state.incorrectAnswers,
            streakData: state.streakData
        }));
    };
    const loadData = () => {
        const savedData = JSON.parse(localStorage.getItem('quizData'));
        if (savedData) {
            state.answeredQuestions = savedData.answeredQuestions || {};
            state.incorrectAnswers = savedData.incorrectAnswers || {};
            state.streakData = savedData.streakData || { currentStreak: 0, lastVisit: null };
        }
    };

    // --- Funções de Navegação e UI ---
    const showScreen = (screenToShow) => {
        [elements.selectionContainer, elements.modeSelectionContainer, elements.quizContainer, elements.reviewContainer].forEach(screen => {
            if(screen) screen.classList.add('hidden');
        });
        if (screenToShow) {
            screenToShow.classList.remove('hidden');
            screenToShow.classList.add('fade-in');
            window.scrollTo(0, 0);
        }
    };

    const showModal = (icon, title, message, buttons = []) => {
        elements.modalIcon.innerHTML = icon;
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
        
        // Limpa ações antigas e adiciona novas
        elements.modalActions.innerHTML = '';
        buttons.forEach(btn => elements.modalActions.appendChild(btn));
        elements.modalActions.appendChild(elements.modalCloseBtn);

        elements.notificationModal.classList.remove('hidden');
        lucide.createIcons();
    };

    const hideModal = () => elements.notificationModal.classList.add('hidden');

    const setTheme = (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('quizAppTheme', theme);
        lucide.createIcons();
    };

    const applyThemeColor = (color) => {
        document.documentElement.style.setProperty('--theme-color-primary', color);
    };

    const showMenu = () => {
        showScreen(elements.selectionContainer);
        updateSelectionScreen();
        applyThemeColor('#16a34a'); // Cor padrão do menu
    };
    
    const createSelectionCards = () => {
        elements.selectionGrid.innerHTML = '';
        
        // Card de Simulado de Erros
        const incorrectCount = Object.values(state.incorrectAnswers).flat().length;
        if (incorrectCount > 0) {
            const errorCard = document.createElement('button');
            errorCard.className = 'selection-card p-6 flex items-center gap-5 text-left md:col-span-2 border-red-500 hover:border-red-600';
            errorCard.dataset.quiz = 'error_quiz';
            errorCard.innerHTML = `
                <div class="card-icon flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/50 text-red-500">
                    <i data-lucide="target" class="w-8 h-8"></i>
                </div>
                <div>
                    <h2 class="card-title text-xl text-gray-800 dark:text-white">Simulado de Erros</h2>
                    <p class="card-description mt-1">Refaça as ${incorrectCount} questões que você errou para fortalecer seu conhecimento.</p>
                </div>`;
            elements.selectionGrid.appendChild(errorCard);
        }

        // Cards de Temas
        for (const key in allQuizzes) {
            const quiz = allQuizzes[key];
            const card = document.createElement('div');
            card.className = 'selection-card p-6 flex flex-col justify-between';
            
            card.innerHTML = `
                <button class="flex items-center gap-5 text-left w-full" data-quiz="${key}">
                    <div class="checkmark-icon absolute top-3 right-3 text-green-500">
                        <i data-lucide="check-circle-2" class="w-7 h-7"></i>
                    </div>
                    <div class="card-icon flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style="background-color: ${quiz.theme.color}20; color: ${quiz.theme.color};">
                        <i data-lucide="${quiz.theme.icon}" class="w-8 h-8"></i>
                    </div>
                    <div>
                        <h2 class="card-title text-xl text-gray-800 dark:text-white">${quiz.title}</h2>
                        <p class="card-description mt-1">Questões sobre ${quiz.title.toLowerCase()}.</p>
                    </div>
                </button>
                <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                     <p class="progress-text text-xs font-semibold text-gray-500 dark:text-gray-400"></p>
                     <button class="reset-progress-btn text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition" data-quiz="${key}">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            elements.selectionGrid.appendChild(card);
        }
        lucide.createIcons();
    };
    
    const updateSelectionScreen = () => {
        if (!allQuizzes) return;
        createSelectionCards(); // Recria os cards para garantir que o de erros apareça/desapareça
        
        document.querySelectorAll('.selection-card').forEach(cardWrapper => {
            const button = cardWrapper.querySelector('button[data-quiz]');
            if (!button) return;

            const quizKey = button.dataset.quiz;
            if (quizKey === 'error_quiz') return;

            const totalQuestions = allQuizzes[quizKey].data.length;
            const answeredCount = (state.answeredQuestions[quizKey] || []).length;
            
            cardWrapper.querySelector('.progress-text').textContent = `${answeredCount} / ${totalQuestions} respondidas`;
            cardWrapper.querySelector('.reset-progress-btn').style.visibility = answeredCount > 0 ? 'visible' : 'hidden';

            if (answeredCount === totalQuestions) {
                button.classList.add('completed');
            } else {
                button.classList.remove('completed');
            }
        });
        lucide.createIcons();
    };

    // --- Funções de Gamificação (Streak) ---
    const updateStreak = (quizCompleted = false) => {
        const today = new Date().toISOString().split('T')[0];
        const lastVisitDate = state.streakData.lastVisit;
        
        if (quizCompleted) {
            if (lastVisitDate === today) {
                // Já contou hoje, não faz nada
            } else {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (lastVisitDate === yesterday) {
                    state.streakData.currentStreak++; // Continua a sequência
                } else {
                    state.streakData.currentStreak = 1; // Nova sequência
                }
                state.streakData.lastVisit = today;
            }
        }

        if (state.streakData.currentStreak > 0) {
            elements.streakDays.textContent = state.streakData.currentStreak;
            elements.streakCounter.classList.remove('hidden');
            elements.streakCounter.classList.add('inline-flex');
        } else {
            elements.streakCounter.classList.add('hidden');
        }
        saveData();
    };

    // --- Funções do Simulado ---
    const selectQuizTheme = (quizKey) => {
        if (quizKey === 'error_quiz') {
            startErrorQuiz();
            return;
        }
        state.currentQuizKey = quizKey;
        const quiz = allQuizzes[quizKey];
        if (!quiz) return;

        applyThemeColor(quiz.theme.color);
        elements.modeSelectionTitle.textContent = `Tema: ${quiz.title}`;
        showScreen(elements.modeSelectionContainer);
    };
    
    const startErrorQuiz = () => {
        const errorQuestions = [];
        for (const quizKey in state.incorrectAnswers) {
            state.incorrectAnswers[quizKey].forEach(originalIndex => {
                errorQuestions.push({
                    questionData: allQuizzes[quizKey].data[originalIndex],
                    originalIndex: originalIndex,
                    originalQuizKey: quizKey
                });
            });
        }

        if (errorQuestions.length === 0) {
            showModal('<i data-lucide="check-check" class="w-12 h-12 text-green-500"></i>', 'Tudo Certo!', 'Você não tem nenhuma questão errada para revisar. Parabéns!');
            return;
        }

        state.currentQuizKey = 'error_quiz';
        state.quizMode = 'practice'; // Modo de erros é sempre prática
        state.currentQuizData = errorQuestions.sort(() => 0.5 - Math.random());
        
        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];

        applyThemeColor('#dc2626'); // Cor vermelha para erros
        elements.quizTitle.textContent = "Simulado de Erros";
        elements.quizSubtitle.textContent = `Modo Prática`;
        
        resetQuizUI();
        showScreen(elements.quizContainer);
        showQuestion();
    };

    const startQuiz = (mode) => {
        state.quizMode = mode;
        const quiz = allQuizzes[state.currentQuizKey];
        if (!quiz) return;

        const fullBank = quiz.data;
        const answeredIndexes = state.answeredQuestions[state.currentQuizKey] || [];
        
        let availableQuestions = fullBank
            .map((questionData, index) => ({ questionData, originalIndex: index }))
            .filter(item => !answeredIndexes.includes(item.originalIndex));

        if (availableQuestions.length === 0) {
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Sim, recomeçar';
            confirmBtn.className = 'action-btn bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg';
            confirmBtn.onclick = () => {
                resetThemeProgress(state.currentQuizKey);
                hideModal();
                startQuiz(mode);
            };
            showModal(
                '<i data-lucide="party-popper" class="w-12 h-12 text-green-500"></i>',
                'Parabéns!',
                `Você concluiu todas as ${fullBank.length} questões do tema "${quiz.title}". Deseja reiniciar o progresso deste tema e jogar novamente?`,
                [confirmBtn]
            );
            return;
        }

        availableQuestions.sort(() => 0.5 - Math.random());
        state.currentQuizData = availableQuestions.slice(0, 10);

        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];

        elements.quizTitle.textContent = quiz.title;
        const modeText = { practice: 'Prática', exam: 'Prova', challenge: 'Desafio' };
        elements.quizSubtitle.textContent = `Modo ${modeText[mode]}`;
        
        resetQuizUI();
        if (mode === 'challenge') {
            startTimer(state.currentQuizData.length * 10); // 10s por questão
        }
        showScreen(elements.quizContainer);
        showQuestion();
    };

    const resetQuizUI = () => {
        elements.resultsArea.classList.add('hidden');
        elements.questionArea.style.display = 'block';
        elements.quizContainer.querySelector('header').style.display = 'flex';
        elements.nextBtn.classList.add('hidden');
        elements.feedbackArea.classList.add('hidden');
        elements.timerContainer.classList.add('hidden');
        if (state.timerInterval) clearInterval(state.timerInterval);
    };

    const startTimer = (duration) => {
        let timer = duration;
        elements.timerContainer.classList.remove('hidden');
        const updateTimerDisplay = () => {
            const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
            const seconds = (timer % 60).toString().padStart(2, '0');
            elements.timer.textContent = `${minutes}:${seconds}`;
            if (--timer < 0) {
                clearInterval(state.timerInterval);
                showResults('time_out');
            }
        };
        updateTimerDisplay();
        state.timerInterval = setInterval(updateTimerDisplay, 1000);
    };

    const updateProgressBar = () => {
        const progress = ((state.currentQuestionIndex) / state.currentQuizData.length) * 100;
        elements.progressBar.style.width = `${progress}%`;
    };

    const showQuestion = () => {
        updateProgressBar();
        elements.feedbackArea.classList.add('hidden');
        elements.optionsContainer.innerHTML = '';
        
        const currentQuestionItem = state.currentQuizData[state.currentQuestionIndex];
        const questionData = currentQuestionItem.questionData;
        
        elements.questionCounter.textContent = `${state.currentQuestionIndex + 1} / ${state.currentQuizData.length}`;
        
        const sourceMatch = questionData.question.match(/^\(.+?\)/);
        const source = sourceMatch ? sourceMatch[0] : '';
        const questionText = source ? questionData.question.substring(source.length).trim() : questionData.question;
        
        elements.questionSource.textContent = source.replace(/[()]/g, '');
        elements.questionText.innerHTML = questionText;
        
        const options = questionData.options || [];
        options.forEach(option => {
            const button = document.createElement('button');
            button.innerHTML = `<span>${option}</span>`;
            button.className = 'option-btn p-4 rounded-lg text-left dark:bg-gray-700 bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-600';
            button.addEventListener('click', () => selectAnswer(button, option));
            elements.optionsContainer.appendChild(button);
        });
        
        elements.nextBtn.classList.add('hidden');
        lucide.createIcons();
    };

    const selectAnswer = (selectedBtn, selectedOption) => {
        if (selectedBtn.disabled) return;
        
        const currentQuestionItem = state.currentQuizData[state.currentQuestionIndex];
        const questionData = currentQuestionItem.questionData;
        const isCorrect = selectedOption.trim() === questionData.answer.trim();

        state.userAnswers[state.currentQuestionIndex] = selectedOption;

        Array.from(elements.optionsContainer.children).forEach(button => {
            button.disabled = true;
        });

        selectedBtn.classList.add('selected');

        if (isCorrect) {
            if(state.quizMode !== 'exam') triggerConfetti();
            selectedBtn.classList.add('correct', 'pulse-animation');
            if(state.quizMode !== 'exam') state.score++;
            
            // Se for o quiz de erros, remove a questão da lista de erros
            if (state.currentQuizKey === 'error_quiz') {
                const { originalQuizKey, originalIndex } = currentQuestionItem;
                if (state.incorrectAnswers[originalQuizKey]) {
                    state.incorrectAnswers[originalQuizKey] = state.incorrectAnswers[originalQuizKey].filter(idx => idx !== originalIndex);
                    if (state.incorrectAnswers[originalQuizKey].length === 0) {
                        delete state.incorrectAnswers[originalQuizKey];
                    }
                }
            }
        } else {
            selectedBtn.classList.add('incorrect', 'shake-animation');
            // Salva a questão como incorreta, se não for do quiz de erros
            if (state.currentQuizKey !== 'error_quiz') {
                const { originalIndex } = currentQuestionItem;
                if (!state.incorrectAnswers[state.currentQuizKey]) {
                    state.incorrectAnswers[state.currentQuizKey] = [];
                }
                if (!state.incorrectAnswers[state.currentQuizKey].includes(originalIndex)) {
                    state.incorrectAnswers[state.currentQuizKey].push(originalIndex);
                }
            }
        }
        
        // No modo prova, calculamos o score apenas no final
        if (state.quizMode === 'exam' && isCorrect) {
            state.score++;
        }

        elements.score.textContent = state.score;

        if (state.quizMode === 'practice' || state.quizMode === 'challenge') {
            if (!isCorrect) {
                Array.from(elements.optionsContainer.children).forEach(button => {
                    if (button.textContent.trim() === questionData.answer.trim()) {
                        button.classList.add('correct');
                    }
                });
            }
            showFeedback(isCorrect, questionData.explanation);
            elements.nextBtn.classList.remove('hidden');
        } else { // Modo Prova
            goToNextQuestion();
        }
    };

    const showFeedback = (isCorrect, explanation) => {
        elements.feedbackTitle.textContent = isCorrect ? "Resposta Correta!" : "Resposta Incorreta!";
        elements.feedbackTitle.className = `text-lg font-bold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`;
        elements.feedbackArea.className = `feedback-card mt-6 p-4 border-l-4 fade-in ${isCorrect ? 'border-green-500' : 'border-red-500'}`;
        elements.feedbackIcon.innerHTML = `<i data-lucide="${isCorrect ? 'check-circle' : 'x-circle'}" class="${isCorrect ? 'text-green-600' : 'text-red-600'}"></i>`;
        elements.explanationText.innerHTML = `<strong>Justificativa:</strong> ${explanation || 'Justificativa não disponível.'}`;
        elements.feedbackArea.classList.remove('hidden');
        lucide.createIcons();
    };

    const goToNextQuestion = () => {
        const isLastQuestion = state.currentQuestionIndex >= state.currentQuizData.length - 1;
        if (isLastQuestion) {
            showResults();
        } else {
            state.currentQuestionIndex++;
            showQuestion();
        }
    };

    const showResults = (reason = 'completed') => {
        if (state.timerInterval) clearInterval(state.timerInterval);
        
        // Marca questões como respondidas (exceto no quiz de erros)
        if (state.currentQuizKey !== 'error_quiz') {
            const answeredInThisQuiz = state.currentQuizData.map(item => item.originalIndex);
            const currentAnsweredForTheme = state.answeredQuestions[state.currentQuizKey] || [];
            const newAnsweredSet = new Set([...currentAnsweredForTheme, ...answeredInThisQuiz]);
            state.answeredQuestions[state.currentQuizKey] = Array.from(newAnsweredSet);
        }
        
        updateStreak(true);
        saveData();

        elements.questionArea.style.display = 'none';
        elements.feedbackArea.classList.add('hidden');
        elements.nextBtn.classList.add('hidden');
        elements.quizContainer.querySelector('header').style.display = 'none';
        
        if (reason === 'time_out') {
            elements.resultsTitle.textContent = "Tempo Esgotado!";
        } else {
            elements.resultsTitle.textContent = "Simulado Finalizado!";
        }
        
        const scorePercent = state.currentQuizData.length > 0 ? Math.round((state.score / state.currentQuizData.length) * 100) : 0;
        elements.finalScore.textContent = `${scorePercent}%`;
        elements.resultsCircle.style.strokeDasharray = `${scorePercent}, 100`;

        let message = "";
        if (scorePercent >= 90) message = "Excelente! Desempenho de alto nível.";
        else if (scorePercent >= 70) message = "Muito bem! Um ótimo resultado.";
        else if (scorePercent >= 50) message = "Bom trabalho. Continue estudando as justificativas.";
        else message = "Não desanime. Use a revisão como guia para seus estudos.";
        
        elements.finalMessage.textContent = message;
        elements.resultsArea.classList.remove('hidden');
        elements.resultsArea.classList.add('fade-in');
    };
    
    const showReview = () => {
        elements.reviewContent.innerHTML = '';
        state.currentQuizData.forEach((item, index) => {
            const question = item.questionData;
            const userAnswer = state.userAnswers[index];
            const isCorrect = userAnswer && userAnswer.trim() === question.answer.trim();

            const questionElement = document.createElement('div');
            questionElement.className = `review-question-item p-4 rounded-lg ${isCorrect ? 'correct' : 'incorrect'}`;
            
            let optionsHtml = (question.options || []).map(option => {
                let classes = 'review-option p-3 mt-2 rounded-md';
                const isCorrectAnswer = option.trim() === question.answer.trim();
                const isUserSelected = userAnswer && option.trim() === userAnswer.trim();

                if (isCorrectAnswer) classes += ' correct-answer';
                if (isUserSelected && !isCorrect) classes += ' user-selected';
                
                return `<div class="${classes}">${option}</div>`;
            }).join('');

            const sourceMatch = question.question.match(/^\(.+?\)/);
            const sourceText = sourceMatch ? sourceMatch[0].replace(/[()]/g, '') : '';
            const questionText = sourceMatch ? question.question.substring(sourceMatch[0].length).trim() : question.question;

            questionElement.innerHTML = `
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${sourceText}</p>
                <h3 class="font-bold text-lg mt-1">${index + 1}. ${questionText}</h3>
                <div class="mt-3 space-y-2">${optionsHtml}</div>
                <div class="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <strong>Justificativa:</strong> ${question.explanation || 'Justificativa não disponível.'}
                </div>
            `;
            elements.reviewContent.appendChild(questionElement);
        });
        showScreen(elements.reviewContainer);
    };

    const resetThemeProgress = (quizKey) => {
        delete state.answeredQuestions[quizKey];
        delete state.incorrectAnswers[quizKey];
        saveData();
        updateSelectionScreen();
    };

    // --- Funções de Carregamento e Transformação de Dados ---
    const transformJsonToQuizzes = (jsonData) => {
        const themeMapping = {
            'Código de Ética Profissional': { key: 'etica', icon: 'shield-check', color: '#2563eb' },
            'Psicologia Educacional': { key: 'educacional', icon: 'graduation-cap', color: '#16a34a' },
            'Psicopatologia - Parte I': { key: 'psicopatologia1', icon: 'brain-circuit', color: '#9333ea' },
            'Psicopatologia - Parte II': { key: 'psicopatologia2', icon: 'heart-pulse', color: '#dc2626' }
        };

        const quizzes = {};

        jsonData.bancoDeQuestoes.forEach(themeData => {
            const themeInfo = themeMapping[themeData.tema];
            if (!themeInfo) return;

            const allQuestionsRaw = [
                ...(themeData.questoesDiretoDoConcurso || []),
                ...(themeData.questoesDeConcurso || [])
            ];

            const formattedQuestions = allQuestionsRaw.map(q => {
                let options = [];
                let answer = '';
                const source = q.fonte || 'Fonte desconhecida';
                const enunciado = `(${source}) ${q.enunciado}`;

                if (q.tipo === 'CERTO_ERRADO') {
                    options = ['Certo', 'Errado'];
                    answer = q.gabarito.toUpperCase().startsWith('C') ? 'Certo' : 'Errado';
                } else if (q.alternativas) {
                    options = q.alternativas.map(alt => alt.text);
                    const correctAlternative = q.alternativas.find(alt => alt.key === q.gabarito);
                    answer = correctAlternative ? correctAlternative.text : '';
                }

                return {
                    question: enunciado,
                    options: options,
                    answer: answer,
                    explanation: `Gabarito: ${q.gabarito}.`
                };
            });

            quizzes[themeInfo.key] = {
                title: themeData.tema,
                theme: { color: themeInfo.color, icon: themeInfo.icon },
                data: formattedQuestions
            };
        });

        return quizzes;
    };

    const loadQuestions = async () => {
        try {
            const response = await fetch('bancoDeQuestoes.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const jsonData = await response.json();
            allQuizzes = transformJsonToQuizzes(jsonData);
        } catch (error) {
            console.error("Não foi possível carregar o arquivo de questões:", error);
            elements.loader.innerHTML = '<p class="text-red-500">Erro ao carregar questões. Verifique o console.</p>';
        }
    };

    // --- Event Listeners ---
    const addEventListeners = () => {
        elements.themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        });
        
        elements.clearHistoryBtn.addEventListener('click', () => {
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Sim, limpar tudo';
            confirmBtn.className = 'action-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg';
            confirmBtn.onclick = () => {
                state.answeredQuestions = {};
                state.incorrectAnswers = {};
                state.streakData = { currentStreak: 0, lastVisit: null };
                saveData();
                updateStreak();
                updateSelectionScreen();
                hideModal();
            };
            showModal(
                '<i data-lucide="alert-triangle" class="w-12 h-12 text-yellow-500"></i>',
                'Confirmar Ação',
                'Tem certeza de que deseja limpar TODO o seu histórico (respostas, erros e sequência)? Esta ação não pode ser desfeita.',
                [confirmBtn]
            );
        });

        elements.selectionGrid.addEventListener('click', (e) => {
            const themeButton = e.target.closest('button[data-quiz]');
            if (themeButton) {
                selectQuizTheme(themeButton.dataset.quiz);
                return;
            }
            const resetButton = e.target.closest('.reset-progress-btn');
            if (resetButton) {
                resetThemeProgress(resetButton.dataset.quiz);
            }
        });
        
        elements.modeSelectionContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.selection-card[data-mode]');
            if (card) startQuiz(card.dataset.mode);
        });
        
        elements.modalCloseBtn.addEventListener('click', hideModal);

        elements.backToThemeSelectionBtn.addEventListener('click', showMenu);
        elements.backToMenuBtnQuiz.addEventListener('click', showMenu);
        elements.backToMenuBtnResults.addEventListener('click', showMenu);
        elements.backToResultsBtn.addEventListener('click', () => showScreen(elements.quizContainer));

        elements.nextBtn.addEventListener('click', goToNextQuestion);
        elements.restartBtn.addEventListener('click', () => {
            if (state.currentQuizKey === 'error_quiz') {
                startErrorQuiz();
            } else {
                startQuiz(state.quizMode);
            }
        });
        elements.reviewAnswersBtn.addEventListener('click', showReview);

        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (elements.quizContainer.classList.contains('hidden') || elements.resultsArea.classList.contains('hidden') === false) return;

            const options = Array.from(elements.optionsContainer.children);
            if (options.length === 0 || options[0].disabled) return;

            if (e.key >= '1' && e.key <= '5') {
                const index = parseInt(e.key) - 1;
                if (options[index]) {
                    options[index].click();
                }
            }
        });
    };

    // --- Inicialização ---
    const initializeApp = async () => {
        elements.loader.classList.remove('hidden');
        const preferredTheme = localStorage.getItem('quizAppTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(preferredTheme);
        loadData();
        updateStreak();
        
        await loadQuestions();
        
        elements.loader.classList.add('hidden');
        if(allQuizzes) {
            addEventListeners();
            showMenu();
        }
    };

    initializeApp();
});
