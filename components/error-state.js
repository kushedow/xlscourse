(function () {
    const useCourseStore = window.useCourseStore;
    const useUiStore = window.useUiStore;

    window.ErrorStateComponent = {
        setup() {
            return {
                courseStore: useCourseStore(),
                uiStore: useUiStore()
            };
        },
        template: `
            <div id="error-container" class="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center">
                <div class="bg-rose-50 text-rose-500 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Произошла ошибка</h2>
                <p class="text-slate-500 mb-6">{{ uiStore.error }}</p>
                <button id="retry-btn" @click="courseStore.fetchSteps(courseStore.currentStepId)" class="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Попробовать снова
                </button>
            </div>
        `
    };
})();

