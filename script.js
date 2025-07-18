document.addEventListener('DOMContentLoaded', () => {
    // --- Variável Global para o Banco de Questões ---
    let allQuizzes = null;

    // --- Mapeamento de Elementos do DOM ---
    const elements = {
        selectionContainer: document.getElementById('selection-container'),
        selectionGrid: document.querySelector('#selection-container .grid'),
        modeSelectionContainer: document.getElementById('mode-selection-container'),
        quizContainer: document.getElementById('quiz-container'),
        reviewContainer: document.getElementById('review-container'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        backToThemeSelectionBtn: document.getElementById('back-to-theme-selection-btn'),
        backToMenuBtnQuiz: document.getElementById('back-to-menu-btn-quiz'),
        backToMenuBtnResults: document.getElementById('back-to-menu-btn-results'),
        nextBtn: document.getElementById('next-btn'),
        restartBtn: document.getElementById('restart-btn'),
        reviewAnswersBtn: document.getElementById('review-answers-btn'),
        backToResultsBtn: document.getElementById('back-to-results-btn'),
        quizTitle: document.getElementById('quiz-title'),
        quizSubtitle: document.getElementById('quiz-subtitle'),
        questionCounter: document.getElementById('question-counter'),
        score: document.getElementById('score'),
        questionArea: document.getElementById('question-area'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        progressBar: document.getElementById('progress-bar'),
        feedbackArea: document.getElementById('feedback-area'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackIcon: document.getElementById('feedback-icon'),
        explanationText: document.getElementById('explanation-text'),
        resultsArea: document.getElementById('results-area'),
        finalScore: document.getElementById('final-score'),
        finalMessage: document.getElementById('final-message'),
        resultsCircle: document.getElementById('results-circle'),
        reviewContent: document.getElementById('review-content'),
        modeSelectionTitle: document.getElementById('mode-selection-title'),
        notificationModal: document.getElementById('notification-modal'),
        modalIcon: document.getElementById('modal-icon'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalCloseBtn: document.getElementById('modal-close-btn'),
    };

    // --- Estado da Aplicação ---
    let state = {
        currentQuizKey: null,
        currentQuizData: [], 
        currentQuestionIndex: 0,
        score: 0,
        quizMode: 'practice',
        userAnswers: [],
        answeredQuestions: {}, 
    };
    
    // --- Funções de Estado (Salvar/Carregar) ---
    const saveState = () => {
        localStorage.setItem('answeredQuestions', JSON.stringify(state.answeredQuestions));
    };
    const loadState = () => {
        const savedState = localStorage.getItem('answeredQuestions');
        state.answeredQuestions = savedState ? JSON.parse(savedState) : {};
    };

    // --- Funções de Navegação e UI ---
    const showScreen = (screenToShow) => {
        [elements.selectionContainer, elements.modeSelectionContainer, elements.quizContainer, elements.reviewContainer].forEach(screen => {
            screen.classList.add('hidden');
        });
        if (screenToShow) {
            screenToShow.classList.remove('hidden');
            screenToShow.classList.add('fade-in');
        }
    };

    const showModal = (icon, title, message) => {
        elements.modalIcon.innerHTML = icon;
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
        elements.notificationModal.classList.remove('hidden');
        lucide.createIcons();
    };

    const hideModal = () => {
        elements.notificationModal.classList.add('hidden');
    };

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
        document.documentElement.style.setProperty('--theme-color-primary', '#16a34a');
    };
    
    const createSelectionCards = () => {
        elements.selectionGrid.innerHTML = '';
        for (const key in allQuizzes) {
            const quiz = allQuizzes[key];
            const card = document.createElement('button');
            card.className = 'selection-card p-6 flex items-center gap-5 text-left';
            card.dataset.quiz = key;

            card.innerHTML = `
                <div class="checkmark-icon absolute top-3 right-3 text-green-500">
                    <i data-lucide="check-circle-2" class="w-7 h-7"></i>
                </div>
                <div class="card-icon flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style="background-color: ${quiz.theme.color}20; color: ${quiz.theme.color};">
                    <i data-lucide="${quiz.theme.icon}" class="w-8 h-8"></i>
                </div>
                <div>
                    <h2 class="card-title text-gray-800 dark:text-white">${quiz.title}</h2>
                    <p class="card-description mt-1">Questões sobre ${quiz.title.toLowerCase()}.</p>
                    <p class="progress-text text-xs font-semibold mt-2 text-gray-500 dark:text-gray-400"></p>
                </div>
            `;
            elements.selectionGrid.appendChild(card);
        }
        lucide.createIcons();
    };
    
    const updateSelectionScreen = () => {
        if (!allQuizzes) return;
        
        document.querySelectorAll('.selection-card').forEach(card => {
            const quizKey = card.dataset.quiz;
            const totalQuestions = allQuizzes[quizKey].data.length;
            const answeredCount = (state.answeredQuestions[quizKey] || []).length;
            
            const progressText = card.querySelector('.progress-text');
            progressText.textContent = `${answeredCount} / ${totalQuestions} respondidas`;

            if (answeredCount === totalQuestions) {
                card.classList.add('completed');
            } else {
                card.classList.remove('completed');
            }
        });
        lucide.createIcons();
    };

    // --- Funções do Simulado ---
    const selectQuizTheme = (quizKey) => {
        state.currentQuizKey = quizKey;
        const quiz = allQuizzes[quizKey];
        if (!quiz) return;

        applyThemeColor(quiz.theme.color);
        elements.modeSelectionTitle.textContent = `Tema: ${quiz.title}`;
        showScreen(elements.modeSelectionContainer);
    };

    const startQuiz = (mode) => {
        state.quizMode = mode;
        const quiz = allQuizzes[state.currentQuizKey];
        if (!quiz) return;

        const fullBank = quiz.data;
        const answeredIndexes = state.answeredQuestions[state.currentQuizKey] || [];
        
        const unansweredBank = fullBank
            .map((questionData, index) => ({ questionData, originalIndex: index }))
            .filter(item => !answeredIndexes.includes(item.originalIndex));

        if (unansweredBank.length === 0) {
            showModal(
                '<i data-lucide="party-popper" class="w-12 h-12 text-green-500"></i>',
                'Parabéns!',
                `Você concluiu todas as ${fullBank.length} questões do tema "${quiz.title}". Tente outro tema ou limpe seu histórico para recomeçar.`
            );
            return;
        }

        unansweredBank.sort(() => 0.5 - Math.random());
        state.currentQuizData = unansweredBank.slice(0, 10);

        state.currentQuestionIndex = 0;
        state.score = 0;
        state.userAnswers = [];

        elements.score.textContent = state.score;
        elements.quizTitle.textContent = quiz.title;
        elements.quizSubtitle.textContent = `Modo ${mode === 'practice' ? 'Prática' : 'Prova'}`;

        elements.resultsArea.classList.add('hidden');
        elements.questionArea.style.display = 'block';
        elements.quizContainer.querySelector('header').style.display = 'flex';
        elements.nextBtn.classList.add('hidden');
        elements.feedbackArea.classList.add('hidden');
        
        showScreen(elements.quizContainer);
        showQuestion();
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
        
        const questionText = questionData.question.replace(/^\d+\.\s*\(.+?\)\s*/, '');
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
        const questionData = state.currentQuizData[state.currentQuestionIndex].questionData;
        const isCorrect = selectedOption.trim() === questionData.answer.trim();

        state.userAnswers[state.currentQuestionIndex] = selectedOption;

        Array.from(elements.optionsContainer.children).forEach(button => {
            button.disabled = true;
        });

        selectedBtn.classList.add('selected');

        if (state.quizMode === 'practice') {
            if (isCorrect) {
                state.score++;
                elements.score.textContent = state.score;
                selectedBtn.classList.add('correct');
                showFeedback(true, questionData.explanation);
            } else {
                selectedBtn.classList.add('incorrect');
                Array.from(elements.optionsContainer.children).forEach(button => {
                    if (button.textContent.trim() === questionData.answer.trim()) {
                        button.classList.add('correct');
                    }
                });
                showFeedback(false, questionData.explanation);
            }
            elements.nextBtn.classList.remove('hidden');
        } else {
            if (isCorrect) {
              state.score++;
            }
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

    const showResults = () => {
        const answeredInThisQuiz = state.currentQuizData.map(item => item.originalIndex);
        const currentAnsweredForTheme = state.answeredQuestions[state.currentQuizKey] || [];
        const newAnsweredSet = new Set([...currentAnsweredForTheme, ...answeredInThisQuiz]);
        state.answeredQuestions[state.currentQuizKey] = Array.from(newAnsweredSet);
        saveState();

        elements.questionArea.style.display = 'none';
        elements.feedbackArea.classList.add('hidden');
        elements.nextBtn.classList.add('hidden');
        elements.quizContainer.querySelector('header').style.display = 'none';
        
        elements.score.textContent = state.score;
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
                const isUserSelected = option.trim() === userAnswer?.trim();

                if (isCorrectAnswer) classes += ' correct-answer';
                if (isUserSelected && !isCorrect) classes += ' user-selected';
                
                return `<div class="${classes}">${option}</div>`;
            }).join('');

            const questionText = question.question.replace(/^\d+\.\s*\(.+?\)\s*/, '');
            questionElement.innerHTML = `
                <h3 class="font-bold text-lg">${index + 1}. ${questionText}</h3>
                <div class="mt-3 space-y-2">${optionsHtml}</div>
                <div class="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <strong>Justificativa:</strong> ${question.explanation || 'Justificativa não disponível.'}
                </div>
            `;
            elements.reviewContent.appendChild(questionElement);
        });
        showScreen(elements.reviewContainer);
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

                if (q.tipo === 'CERTO_ERRADO') {
                    options = ['Certo', 'Errado'];
                    if (q.gabarito.toUpperCase().startsWith('C')) {
                        answer = 'Certo';
                    } else {
                        answer = 'Errado';
                    }
                } else if (q.alternativas) {
                    options = q.alternativas.map(alt => alt.text);
                    const correctAlternative = q.alternativas.find(alt => alt.key === q.gabarito);
                    answer = correctAlternative ? correctAlternative.text : '';
                }

                return {
                    question: q.enunciado,
                    options: options,
                    answer: answer,
                    explanation: `Gabarito: ${q.gabarito}. Fonte: ${q.fonte}` // Adicionando uma explicação padrão
                };
            });

            quizzes[themeInfo.key] = {
                title: themeData.tema,
                theme: {
                    color: themeInfo.color,
                    icon: themeInfo.icon
                },
                data: formattedQuestions
            };
        });

        return quizzes;
    };

    const loadQuestions = async () => {
        try {
            // Você precisa ter um arquivo 'bancoDeQuestoes.json' na mesma pasta.
            const response = await fetch('bancoDeQuestoes.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            allQuizzes = transformJsonToQuizzes(jsonData);
        } catch (error) {
            console.error("Não foi possível carregar o arquivo de questões:", error);
            showModal(
                '<i data-lucide="alert-triangle" class="w-12 h-12 text-red-500"></i>',
                'Erro Crítico',
                'Não foi possível carregar o banco de questões (bancoDeQuestoes.json). Verifique se o arquivo está na mesma pasta que o index.html e se não há erros de sintaxe no JSON.'
            );
        }
    };


    // --- Event Listeners ---
    elements.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    });
    
    elements.clearHistoryBtn.addEventListener('click', () => {
        showModal(
            '<i data-lucide="alert-triangle" class="w-12 h-12 text-yellow-500"></i>',
            'Confirmar Ação',
            'Tem certeza de que deseja limpar todo o seu histórico de questões respondidas? Esta ação não pode ser desfeita.'
        );
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Sim, limpar histórico';
        confirmBtn.className = 'action-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg mt-4';
        confirmBtn.onclick = () => {
            state.answeredQuestions = {};
            saveState();
            updateSelectionScreen();
            hideModal();
        };
        elements.modalMessage.parentElement.appendChild(confirmBtn);
    });

    elements.selectionGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.selection-card');
        if (card && card.dataset.quiz) {
            selectQuizTheme(card.dataset.quiz);
        }
    });
    
    elements.modeSelectionContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.selection-card');
        if (card && card.dataset.mode) {
            startQuiz(card.dataset.mode);
        }
    });
    
    elements.modalCloseBtn.addEventListener('click', () => {
        const confirmBtn = elements.modalMessage.parentElement.querySelector('.action-btn.bg-red-600');
        if (confirmBtn) confirmBtn.remove();
        hideModal();
    });

    elements.backToThemeSelectionBtn.addEventListener('click', () => showMenu());
    elements.backToMenuBtnQuiz.addEventListener('click', () => showMenu());
    elements.backToMenuBtnResults.addEventListener('click', () => showMenu());
    elements.backToResultsBtn.addEventListener('click', () => showScreen(elements.quizContainer));

    elements.nextBtn.addEventListener('click', goToNextQuestion);
    elements.restartBtn.addEventListener('click', () => startQuiz(state.quizMode));
    elements.reviewAnswersBtn.addEventListener('click', showReview);

    // --- Inicialização ---
    const initializeApp = async () => {
        const preferredTheme = localStorage.getItem('quizAppTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(preferredTheme);
        loadState();
        
        await loadQuestions(); // Carrega e processa o JSON
        
        if(allQuizzes) {
            createSelectionCards();
            showMenu();
        }
    };

    initializeApp();
});
