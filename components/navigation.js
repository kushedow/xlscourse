(function () {
    const useCourseStore = window.useCourseStore;
    const useUiStore = window.useUiStore;

    window.NavigationComponent = {
        template: `
            <header class="bg-white border-b border-slate-100 p-3 md:p-5 px-4 md:px-8 flex items-center justify-between mobile-x-tight">
                <div id="nav-left" class="flex items-center gap-3">
                    <div id="excel-logo" class="w-7 h-7 md:w-8 md:h-8 flex-shrink-0">
                        <svg viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                            <path d="M180 32H214C225.046 32 234 40.9543 234 52V204C234 215.046 225.046 224 214 224H180V32Z" fill="#000000"/>
                            <path d="M22 45.5C22 41.6023 24.8143 38.2618 28.6797 37.7464L160.68 20.1464C166.19 19.4117 171 23.6828 171 29.25V226.75C171 232.317 166.19 236.588 160.68 235.854L28.6797 218.254C24.8143 217.738 22 214.398 22 210.5V45.5Z" fill="#000000"/>
                            <path d="M68 93L125 163M125 93L68 163" stroke="#fff" stroke-width="24" stroke-linecap="square"/>
                        </svg>
                    </div>

                    <div id="step-nav" class="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <span id="current-chapter-label" class="text-[10px] font-black text-slate-400 tracking-widest uppercase px-4">{{ courseStore.selectedChapter }}:</span>
                            <button v-for="(s, idx) in courseStore.filteredSteps" :key="s.id" @click="courseStore.setCurrentStep(s.id)"
                                :class="['w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-bold rounded-lg transition-all', courseStore.currentStepId === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']">
                                {{ idx + 1 }}
                            </button>
                        </div>
                    </div>
                </div>

                <button id="open-menu-btn" @click="uiStore.openMenu()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </header>
        `,
        setup() {
            return {
                courseStore: useCourseStore(),
                uiStore: useUiStore()
            };
        }
    };
})();

