(function () {
    const defineStore = Pinia.defineStore;

    const useUiStore = defineStore('ui', {
        state: () => ({
            isLoading: true,
            error: null,
            isMenuOpen: false
        }),
        actions: {
            startLoading() {
                this.isLoading = true;
                this.error = null;
            },
            stopLoading() {
                this.isLoading = false;
            },
            setError(message) {
                this.error = message;
            },
            clearError() {
                this.error = null;
            },
            openMenu() {
                this.isMenuOpen = true;
            },
            closeMenu() {
                this.isMenuOpen = false;
            }
        }
    });

    const useCourseStore = defineStore('course', {
        state: () => ({
            currentStepId: 1,
            selectedChapter: '',
            currentSheetName: '',
            validationStatus: null,
            runtimeData: {},
            validationResults: {},
            quizAnswers: {},
            steps: []
        }),
        getters: {
            chapters: (state) => [...new Set(state.steps.map((s) => s.chapter))],
            filteredSteps: (state) => state.steps.filter((s) => s.chapter === state.selectedChapter),
            activeStep: (state) => state.steps.find((s) => s.id === state.currentStepId),
            sheetNames: (state) => (state.activeStep?.sheets ? Object.keys(state.activeStep.sheets) : []),
            activeStepInstruction: (state) => {
                const step = state.steps.find((s) => s.id === state.currentStepId);
                if (!step) return '';
                // For theory the full markdown content is rendered in step component.
                if (step.type === 'theory') return '';
                return step.content || '';
            }
        },
        actions: {
            async fetchSteps(initialStepId) {
                const uiStore = useUiStore();
                uiStore.startLoading();

                try {
                    const data = await window.courseApi.fetchSteps();
                    this.steps = Array.isArray(data) ? data : [];

                    if (this.steps.length > 0) {
                        const preferredStepId = Number(initialStepId);
                        if (Number.isInteger(preferredStepId) && this.steps.some((s) => s.id === preferredStepId)) {
                            this.setCurrentStep(preferredStepId);
                        } else {
                            this.setCurrentStep(this.steps[0].id);
                        }
                    }

                    uiStore.stopLoading();
                } catch (err) {
                    uiStore.setError('Ошибка при загрузке курса.');
                    uiStore.stopLoading();
                }
            },
            setCurrentStep(id) {
                const step = this.steps.find((s) => s.id === id);
                if (!step) return;

                this.currentStepId = id;
                this.selectedChapter = step.chapter;
                this.validationStatus = null;

                if (step.type === 'practice' && step.sheets && typeof step.sheets === 'object') {
                    Object.entries(step.sheets).forEach(([name, data]) => {
                        const key = `${id}_${name}`;
                        if (!this.runtimeData[key]) {
                            this.runtimeData[key] = JSON.parse(JSON.stringify(data));
                        }
                    });
                    this.currentSheetName = this.sheetNames[0] || '';
                }
            },
            selectChapter(chapter) {
                const firstStep = this.steps.find((s) => s.chapter === chapter);
                if (firstStep) this.setCurrentStep(firstStep.id);
            },
            selectQuizOption(qIndex, value) {
                if (!this.quizAnswers[this.currentStepId]) this.quizAnswers[this.currentStepId] = {};
                this.quizAnswers[this.currentStepId][qIndex] = value;

                const step = this.activeStep;
                const quiz = step?.quiz || [];
                if (!quiz.length) {
                    this.validationStatus = null;
                    return;
                }

                const userAns = this.quizAnswers[this.currentStepId];
                const isCorrect = quiz.every((q, i) => userAns[i] === q.answer);
                this.validationStatus = isCorrect
                    ? 'success'
                    : (Object.keys(userAns).length === quiz.length ? 'error' : null);
            },
            updateRuntimeData(newData) {
                this.runtimeData[`${this.currentStepId}_${this.currentSheetName}`] = newData;
            },
            validateCurrentStep() {
                const step = this.activeStep;
                const solutions = step?.solutions || {};
                let correctCount = 0;

                Object.entries(solutions).forEach(([cellRef, expected]) => {
                    const col = cellRef.charCodeAt(0) - 65;
                    const row = parseInt(cellRef.substring(1), 10) - 1;
                    const actual = String(window.hotRaw.getDataAtCell(row, col));
                    const ok = (actual === String(expected));
                    this.validationResults[`${this.currentStepId}_${this.currentSheetName}_${cellRef}`] = ok;
                    if (ok) correctCount++;
                });

                this.validationStatus =
                    correctCount === Object.keys(solutions).length ? 'success' : 'error';
                window.hotRaw.render();
            },
            moveToNextStep() {
                const idx = this.steps.findIndex((s) => s.id === this.currentStepId);
                if (this.steps[idx + 1]) this.setCurrentStep(this.steps[idx + 1].id);
            }
        }
    });

    window.useCourseStore = useCourseStore;
    window.useUiStore = useUiStore;
})();
