(function () {
    const useCourseStore = window.useCourseStore;

    window.StepQuizComponent = {
        props: ['step'],
        template: `
            <div class="space-y-4 md:space-y-6">
                <div id="quiz-container" class="space-y-4 md:space-y-6">
                    <div v-for="(q, idx) in step.quiz" :key="idx" class="py-4">
                       
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button v-for="opt in q.options" :key="opt" @click="courseStore.selectQuizOption(idx, opt)"
                                :class="['text-left px-4 md:px-5 py-3 border-2 rounded-xl transition-all font-medium text-xs md:text-sm', getBtnClass(idx, opt)]">
                                <div class="flex items-center justify-between">
                                    <span>{{ opt }}</span>
                                    <span v-if="isSelected(idx, opt)">
                                         <svg v-if="isCorrect(idx, opt)" class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                                         <svg v-else class="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
                                    </span>
                                </div>
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
                <div id="quiz-toolbar" class="flex items-center justify-start gap-4">
                    <button
                        id="continue-btn"
                        @click="courseStore.moveToNextStep"
                        :disabled="courseStore.validationStatus !== 'success'"
                        :class="['px-6 md:px-8 py-3 rounded-2xl font-extrabold text-sm transition-all', courseStore.validationStatus !== 'success' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-black hover:bg-slate-800 text-white shadow-lg']"
                    >
                        Завершить проверку
                    </button>
                    <span v-if="courseStore.validationStatus === 'success'" class="text-emerald-600 font-bold text-sm">Отлично!</span>
                </div>
            </div>
        `,
        setup(props) {
            const courseStore = useCourseStore();
            const isSelected = function (idx, opt) {
                return courseStore.quizAnswers[courseStore.currentStepId] && courseStore.quizAnswers[courseStore.currentStepId][idx] === opt;
            };
            const isCorrect = function (idx, opt) {
                return props.step.quiz[idx].answer === opt;
            };
            const getBtnClass = function (idx, opt) {
                if (!isSelected(idx, opt)) return 'border-slate-100 bg-white hover:border-slate-300 text-slate-600';
                return isCorrect(idx, opt) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700';
            };
            return { courseStore: courseStore, isSelected: isSelected, isCorrect: isCorrect, getBtnClass: getBtnClass };
        }
    };
})();
