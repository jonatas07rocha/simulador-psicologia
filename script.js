document.addEventListener('DOMContentLoaded', () => {
    // --- Mapeamento de Elementos do DOM ---
    const elements = {
        // Contêineres principais
        selectionContainer: document.getElementById('selection-container'),
        modeSelectionContainer: document.getElementById('mode-selection-container'),
        quizContainer: document.getElementById('quiz-container'),
        resultsContainer: document.getElementById('results-container'),
        reviewContainer: document.getElementById('review-container'),
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
        quizHeader: document.getElementById('quiz-header'),
        quizTitle: document.getElementById('quiz-title'),
        quizSubtitle: document.getElementById('quiz-subtitle'),
        questionCounter: document.getElementById('question-counter'),
        scoreContainer: document.getElementById('score-container'),
        score: document.getElementById('score'),
        timerContainer: document.getElementById('timer-container'),
        timer: document.getElementById('timer'),
        cardStackContainer: document.getElementById('card-stack-container'),
        
        // Feedback
        feedbackArea: document.getElementById('feedback-area'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackIcon: document.getElementById('feedback-icon'),
        explanationText: document.getElementById('explanation-text'),
        
        // Controles do Simulado
        backToMenuBtnQuiz: document.getElementById('back-to-menu-btn-quiz'),
        nextBtn: document.getElementById('next-btn'),
        
        // Resultados
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
        allQuizzes: null,
        currentQuizKey: null,
        currentQuizData: [], 
        currentQuestionIndex: 0,
        score: 0,
        quizMode: 'practice',
        userAnswers: [],
        answeredQuestions: {},
        incorrectAnswers: {},
        streakData: { currentStreak: 0, lastVisit: null },
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
                p.x += p.speedX; p.y += p.speedY; p.angle += p.spin; p.speedY += 0.08;
                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.angle * Math.PI / 180);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                confettiCtx.restore();
            }
        });
        if (activeParticles) requestAnimationFrame(animateConfetti);
        else confettiCtx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);
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
        [elements.selectionContainer, elements.modeSelectionContainer, elements.quizContainer, elements.resultsContainer, elements.reviewContainer].forEach(s => s.classList.add('hidden'));
        if (screenToShow) {
            screenToShow.classList.remove('hidden');
            window.scrollTo(0, 0);
        }
    };
    const showModal = (icon, title, message, buttons = []) => {
        elements.modalIcon.innerHTML = icon;
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
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
    const applyThemeColor = (color) => document.documentElement.style.setProperty('--theme-color-primary', color);
    const showMenu = () => {
        showScreen(elements.selectionContainer);
        elements.selectionContainer.classList.add('fade-in');
        updateSelectionScreen();
        applyThemeColor('#0d9488'); // Cor padrão do menu
    };
    
    // --- Funções de Gamificação (Streak) ---
    const updateStreak = (quizCompleted = false) => {
        const today = new Date().toISOString().split('T')[0];
        const lastVisitDate = state.streakData.lastVisit;
        if (quizCompleted && lastVisitDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            state.streakData.currentStreak = lastVisitDate === yesterday ? state.streakData.currentStreak + 1 : 1;
            state.streakData.lastVisit = today;
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

    // --- Lógica de Geração de Cards ---
    const createSelectionCards = () => {
        elements.selectionGrid.innerHTML = '';
        const incorrectCount = Object.values(state.incorrectAnswers).flat().length;
        if (incorrectCount > 0) {
            const errorCard = document.createElement('button');
            errorCard.className = 'selection-card p-6 flex items-center gap-5 text-left md:col-span-2 border-red-500 hover:border-red-600';
            errorCard.dataset.quiz = 'error_quiz';
            errorCard.innerHTML = `<div class="card-icon flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/50 text-red-500"><i data-lucide="target" class="w-8 h-8"></i></div><div><h2 class="card-title text-xl text-gray-800 dark:text-white">Simulado de Erros</h2><p class="card-description mt-1">Refaça as ${incorrectCount} questões que você errou para fortalecer seu conhecimento.</p></div>`;
            elements.selectionGrid.appendChild(errorCard);
        }
        for (const key in state.allQuizzes) {
            const quiz = state.allQuizzes[key];
            const card = document.createElement('div');
            card.className = 'selection-card p-6 flex flex-col justify-between';
            card.innerHTML = `<button class="flex items-center gap-5 text-left w-full" data-quiz="${key}"><div class="checkmark-icon absolute top-3 right-3 text-green-500"><i data-lucide="check-circle-2" class="w-7 h-7"></i></div><div class="card-icon flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style="background-color: ${quiz.theme.color}20; color: ${quiz.theme.color};"><i data-lucide="${quiz.theme.icon}" class="w-8 h-8"></i></div><div><h2 class="card-title text-xl text-gray-800 dark:text-white">${quiz.title}</h2><p class="card-description mt-1">Questões sobre ${quiz.title.toLowerCase()}.</p></div></button><div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50"><p class="progress-text text-xs font-semibold text-gray-500 dark:text-gray-400"></p><button class="reset-progress-btn text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition" data-quiz="${key}"><i data-lucide="rotate-ccw" class="w-4 h-4"></i></button></div>`;
            elements.selectionGrid.appendChild(card);
        }
        lucide.createIcons();
    };
    const updateSelectionScreen = () => {
        if (!state.allQuizzes) return;
        createSelectionCards();
        document.querySelectorAll('.selection-card').forEach(cardWrapper => {
            const button = cardWrapper.querySelector('button[data-quiz]');
            if (!button || button.dataset.quiz === 'error_quiz') return;
            const quizKey = button.dataset.quiz;
            const totalQuestions = state.allQuizzes[quizKey].data.length;
            const answeredCount = (state.answeredQuestions[quizKey] || []).length;
            cardWrapper.querySelector('.progress-text').textContent = `${answeredCount} / ${totalQuestions} respondidas`;
            cardWrapper.querySelector('.reset-progress-btn').style.visibility = answeredCount > 0 ? 'visible' : 'hidden';
            button.classList.toggle('completed', answeredCount === totalQuestions);
        });
        lucide.createIcons();
    };

    // --- Lógica do Simulado ---
    const selectQuizTheme = (quizKey) => {
        if (quizKey === 'error_quiz') {
            startErrorQuiz();
            return;
        }
        state.currentQuizKey = quizKey;
        const quiz = state.allQuizzes[quizKey];
        if (!quiz) return;
        applyThemeColor(quiz.theme.color);
        elements.modeSelectionTitle.textContent = `Tema: ${quiz.title}`;
        showScreen(elements.modeSelectionContainer);
        elements.modeSelectionContainer.classList.add('fade-in');
    };
    const startErrorQuiz = () => {
        const errorQuestions = [];
        for (const quizKey in state.incorrectAnswers) {
            state.incorrectAnswers[quizKey].forEach(originalIndex => {
                errorQuestions.push({
                    questionData: state.allQuizzes[quizKey].data[originalIndex],
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
        state.quizMode = 'practice';
        state.currentQuizData = errorQuestions.sort(() => 0.5 - Math.random());
        initializeQuiz('Simulado de Erros', 'Modo Prática', '#dc2626');
    };
    const startQuiz = (mode) => {
        state.quizMode = mode;
        const quiz = state.allQuizzes[state.currentQuizKey];
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
            confirmBtn.onclick = () => { resetThemeProgress(state.currentQuizKey); hideModal(); startQuiz(mode); };
            showModal('<i data-lucide="party-popper" class="w-12 h-12 text-green-500"></i>', 'Parabéns!', `Você concluiu todas as ${fullBank.length} questões do tema "${quiz.title}". Deseja reiniciar o progresso e jogar novamente?`, [confirmBtn]);
            return;
        }
        availableQuestions.sort(() => 0.5 - Math.random());
        state.currentQuizData = availableQuestions.slice(0, 10);
        const modeText = { practice: 'Prática', exam: 'Prova', challenge: 'Desafio' };
        initializeQuiz(quiz.title, `Modo ${modeText[mode]}`, quiz.theme.color);
        if (mode === 'challenge') startTimer(state.currentQuizData.length * 10);
    };
    const initializeQuiz = (title, subtitle, color) => {
        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];
        applyThemeColor(color);
        elements.quizTitle.textContent = title;
        elements.quizSubtitle.textContent = subtitle;
        elements.score.textContent = state.score;
        elements.quizHeader.classList.remove('hidden');
        elements.feedbackArea.classList.add('hidden');
        elements.timerContainer.classList.add('hidden');
        if (state.timerInterval) clearInterval(state.timerInterval);
        showScreen(elements.quizContainer);
        populateCardStack();
    };

    // --- Lógica do Baralho ---
    const populateCardStack = () => {
        elements.cardStackContainer.innerHTML = '';
        const questionsToRender = state.currentQuizData.slice(state.currentQuestionIndex, state.currentQuestionIndex + 3).reverse();
        questionsToRender.forEach(item => {
            elements.cardStackContainer.appendChild(createQuestionCard(item.questionData));
        });
        updateQuestionCounter();
    };
    const createQuestionCard = (questionData) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        const sourceMatch = questionData.question.match(/^\(.+?\)/);
        const source = sourceMatch ? sourceMatch[0].replace(/[()]/g, '') : '';
        const questionText = source ? questionData.question.substring(source.length).trim() : questionData.question;
        const optionsHtml = (questionData.options || [])
            .map(option => `<button class="option-btn p-4 rounded-lg text-left dark:bg-gray-700 bg-gray-50"><span>${option}</span></button>`)
            .join('');
        card.innerHTML = `<div class="card-content"><p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">${source}</p><h2 class="card-question-text text-gray-800 dark:text-gray-50 mb-6">${questionText}</h2><div class="grid grid-cols-1 gap-4">${optionsHtml}</div></div>`;
        card.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => selectAnswer(btn, btn.textContent));
        });
        return card;
    };
    const updateQuestionCounter = () => {
        elements.questionCounter.textContent = `${Math.min(state.currentQuestionIndex + 1, state.currentQuizData.length)} / ${state.currentQuizData.length}`;
    };
    
    // *** FUNÇÃO CORRIGIDA E REFINADA ***
    const selectAnswer = (selectedBtn, selectedOption) => {
        const topCard = elements.cardStackContainer.querySelector('.question-card:last-child');
        if (!topCard || topCard.dataset.answered) return;
        topCard.dataset.answered = 'true';

        const currentQuestionItem = state.currentQuizData[state.currentQuestionIndex];
        const questionData = currentQuestionItem.questionData;
        const isCorrect = selectedOption.trim() === questionData.answer;
        
        state.userAnswers[state.currentQuestionIndex] = selectedOption;

        // --- Passo 1: Lidar com o feedback visual nos botões ---
        topCard.querySelectorAll('.option-btn').forEach(button => {
            button.disabled = true;
            // Sempre destacar a resposta correta em verde
            if (button.textContent.trim() === questionData.answer) {
                button.classList.add('correct');
            }
        });

        // Se a resposta do usuário estiver incorreta, destacá-la em vermelho
        if (!isCorrect) {
            selectedBtn.classList.add('incorrect');
        }

        // --- Passo 2: Atualizar pontuação e registrar erros ---
        if (isCorrect) {
            state.score++;
            if (state.quizMode !== 'exam') {
                triggerConfetti();
            }
            // Se era um erro, removê-lo da lista de erros
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
            // Se for um novo erro, adicioná-lo à lista de erros
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
        
        // Atualizar a exibição da pontuação (exceto no modo prova)
        if (state.quizMode !== 'exam') {
            elements.score.textContent = state.score;
        }

        // --- Passo 3: Controlar o fluxo com base no modo do quiz ---
        if (state.quizMode === 'practice' || state.quizMode === 'challenge') {
            // No modo prática, mostrar o feedback e esperar o usuário clicar em "Próxima"
            showFeedback(isCorrect, questionData.explanation);
        } else { // Modo Prova
            // No modo prova, avançar automaticamente para a próxima carta após um curto atraso
            setTimeout(() => {
                topCard.classList.add(isCorrect ? 'swipe-correct' : 'swipe-incorrect');
                topCard.addEventListener('animationend', handleCardSwipe, { once: true });
            }, 400);
        }
    };

    const showFeedback = (isCorrect, explanation) => {
        elements.feedbackArea.classList.remove('hidden');
        elements.feedbackTitle.textContent = isCorrect ? "Resposta Correta!" : "Resposta Incorreta!";
        elements.feedbackTitle.className = `text-lg font-bold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`;
        elements.feedbackArea.className = `feedback-card mt-6 p-4 border-l-4 fade-in ${isCorrect ? 'border-green-500' : 'border-red-500'}`;
        elements.feedbackIcon.innerHTML = `<i data-lucide="${isCorrect ? 'check-circle' : 'x-circle'}" class="${isCorrect ? 'text-green-600' : 'text-red-600'}"></i>`;
        elements.explanationText.innerHTML = `<strong>Justificativa:</strong> ${explanation || 'Justificativa não disponível.'}`;
        lucide.createIcons();
    };
    
    const handleCardSwipe = () => {
        state.currentQuestionIndex++;
        if (state.currentQuestionIndex >= state.currentQuizData.length) {
            showResults();
        } else {
            const topCard = elements.cardStackContainer.querySelector('.question-card:last-child');
            if (topCard) topCard.remove();
            updateQuestionCounter();
        }
    };

    // --- Lógica de Resultados e Revisão ---
    const showResults = (reason = 'completed') => {
        if (state.timerInterval) clearInterval(state.timerInterval);
        if (state.currentQuizKey !== 'error_quiz') {
            const answeredInThisQuiz = state.currentQuizData.map(item => item.originalIndex);
            const currentAnswered = state.answeredQuestions[state.currentQuizKey] || [];
            state.answeredQuestions[state.currentQuizKey] = Array.from(new Set([...currentAnswered, ...answeredInThisQuiz]));
        }
        updateStreak(true); saveData();
        showScreen(elements.resultsContainer);
        elements.resultsTitle.textContent = reason === 'time_out' ? "Tempo Esgotado!" : "Simulado Finalizado!";
        const scorePercent = state.currentQuizData.length > 0 ? Math.round((state.score / state.currentQuizData.length) * 100) : 0;
        elements.finalScore.textContent = `${scorePercent}%`;
        elements.resultsCircle.style.strokeDasharray = `${scorePercent}, 100`;
        let message = "";
        if (scorePercent >= 90) message = "Excelente! Desempenho de alto nível.";
        else if (scorePercent >= 70) message = "Muito bem! Um ótimo resultado.";
        else if (scorePercent >= 50) message = "Bom trabalho. Continue estudando as justificativas.";
        else message = "Não desanime. Use a revisão como guia para seus estudos.";
        elements.finalMessage.textContent = message;
    };
    const showReview = () => {
        elements.reviewContent.innerHTML = '';
        state.currentQuizData.forEach((item, index) => {
            const question = item.questionData;
            const userAnswer = state.userAnswers[index];
            const isCorrect = userAnswer && userAnswer.trim() === question.answer;
            const questionElement = document.createElement('div');
            questionElement.className = `review-question-item p-4 rounded-lg ${isCorrect ? 'correct' : 'incorrect'}`;
            let optionsHtml = (question.options || []).map(option => {
                let classes = 'review-option p-3 mt-2 rounded-md';
                if (option.trim() === question.answer) classes += ' correct-answer';
                if (userAnswer && option.trim() === userAnswer.trim() && !isCorrect) classes += ' user-selected';
                return `<div class="${classes}">${option}</div>`;
            }).join('');
            const sourceMatch = question.question.match(/^\(.+?\)/);
            const sourceText = sourceMatch ? sourceMatch[0].replace(/[()]/g, '') : '';
            const questionText = sourceMatch ? question.question.substring(sourceMatch[0].length).trim() : question.question;
            questionElement.innerHTML = `<p class="text-sm font-medium text-gray-500 dark:text-gray-400">${sourceText}</p><h3 class="font-bold text-lg mt-1">${index + 1}. ${questionText}</h3><div class="mt-3 space-y-2">${optionsHtml}</div><div class="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md"><strong>Justificativa:</strong> ${question.explanation || 'Justificativa não disponível.'}</div>`;
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

    // --- Carregamento de Dados ---
    const transformJsonToQuizzes = (jsonData) => {
        const themeMapping = {
            'Código de Ética Profissional': { key: 'etica', icon: 'shield-check', color: '#2563eb' },
            'Psicologia Educacional': { key: 'educacional', icon: 'graduation-cap', color: '#16a34a' },
            'Psicopatologia - Parte I': { key: 'psicopatologia1', icon: 'brain-circuit', color: '#9333ea' },
            'Psicopatologia - Parte II': { key: 'psicopatologia2', icon: 'heart-pulse', color: '#e11d48' }
        };
        const quizzes = {};
        jsonData.bancoDeQuestoes.forEach(themeData => {
            const themeInfo = themeMapping[themeData.tema];
            if (!themeInfo) return;
            const allQuestionsRaw = [...(themeData.questoesDiretoDoConcurso || []), ...(themeData.questoesDeConcurso || [])];
            const formattedQuestions = allQuestionsRaw.map(q => {
                let options = [], answer = '', source = q.fonte || 'Fonte desconhecida', enunciado = `(${source}) ${q.enunciado}`;
                if (q.tipo === 'CERTO_ERRADO') {
                    options = ['Certo', 'Errado'];
                    answer = q.gabarito.toUpperCase().startsWith('C') ? 'Certo' : 'Errado';
                } else if (q.alternativas) {
                    options = q.alternativas.map(alt => alt.text.trim().replace(/\.$/, ''));
                    const correctAlternative = q.alternativas.find(alt => alt.key === q.gabarito);
                    answer = correctAlternative ? correctAlternative.text.trim().replace(/\.$/, '') : '';
                }
                return { question: enunciado, options, answer, explanation: `Gabarito: ${q.gabarito}.` };
            });
            quizzes[themeInfo.key] = { title: themeData.tema, theme: { color: themeInfo.color, icon: themeInfo.icon }, data: formattedQuestions };
        });
        return quizzes;
    };
    const loadQuestions = async () => {
        try {
            const response = await fetch('bancoDeQuestoes.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            state.allQuizzes = transformJsonToQuizzes(await response.json());
        } catch (error) {
            console.error("Não foi possível carregar o arquivo de questões:", error);
            elements.loader.innerHTML = '<p class="text-red-500">Erro ao carregar questões. Verifique o console.</p>';
        }
    };

    // --- Inicialização e Event Listeners ---
    const addEventListeners = () => {
        elements.themeToggleBtn.addEventListener('click', () => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark'));
        elements.clearHistoryBtn.addEventListener('click', () => {
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Sim, limpar tudo';
            confirmBtn.className = 'action-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg';
            confirmBtn.onclick = () => {
                state.answeredQuestions = {}; state.incorrectAnswers = {}; state.streakData = { currentStreak: 0, lastVisit: null };
                saveData(); updateStreak(); updateSelectionScreen(); hideModal();
            };
            showModal('<i data-lucide="alert-triangle" class="w-12 h-12 text-yellow-500"></i>', 'Confirmar Ação', 'Tem certeza de que deseja limpar TODO o seu histórico (respostas, erros e sequência)? Esta ação não pode ser desfeita.', [confirmBtn]);
        });
        elements.selectionGrid.addEventListener('click', (e) => {
            const themeButton = e.target.closest('button[data-quiz]');
            if (themeButton) selectQuizTheme(themeButton.dataset.quiz);
            const resetButton = e.target.closest('.reset-progress-btn');
            if (resetButton) resetThemeProgress(resetButton.dataset.quiz);
        });
        elements.modeSelectionContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.selection-card[data-mode]');
            if (card) startQuiz(card.dataset.mode);
        });
        elements.modalCloseBtn.addEventListener('click', hideModal);
        elements.backToThemeSelectionBtn.addEventListener('click', showMenu);
        elements.backToMenuBtnQuiz.addEventListener('click', showMenu);
        elements.backToMenuBtnResults.addEventListener('click', showMenu);
        elements.backToResultsBtn.addEventListener('click', () => showScreen(elements.resultsContainer));
        elements.nextBtn.addEventListener('click', () => {
            const topCard = elements.cardStackContainer.querySelector('.question-card:last-child');
            if (!topCard) return;
            const isCorrect = !!topCard.querySelector('.option-btn.correct.incorrect') === false; // A bit tricky: if the selected is incorrect, it has both classes. We want to check if the selected button is NOT incorrect.
            topCard.classList.add(isCorrect ? 'swipe-correct' : 'swipe-incorrect');
            topCard.addEventListener('animationend', handleCardSwipe, { once: true });
            elements.feedbackArea.classList.add('hidden');
        });
        elements.restartBtn.addEventListener('click', () => {
            if (state.currentQuizKey === 'error_quiz') startErrorQuiz();
            else startQuiz(state.quizMode);
        });
        elements.reviewAnswersBtn.addEventListener('click', showReview);
    };
    const initializeApp = async () => {
        elements.loader.classList.remove('hidden');
        setTheme(localStorage.getItem('quizAppTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
        loadData(); updateStreak();
        await loadQuestions();
        elements.loader.classList.add('hidden');
        if (state.allQuizzes) {
            addEventListeners();
            showMenu();
        }
    };

    initializeApp();
});
