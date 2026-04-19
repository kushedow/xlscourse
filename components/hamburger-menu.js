(function () {
    const useCourseStore = window.useCourseStore;
    const useUiStore = window.useUiStore;

    window.HamburgerMenuComponent = {
        template: `
            <div id="menu-overlay" class="absolute inset-0 z-50 bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
                <div class="flex items-center justify-between mb-10">
                    <h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Главы обучения</h2>
                    <button id="close-menu-btn" @click="uiStore.closeMenu()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav class="flex-grow">
                    <div class="space-y-2">
                        <button
                            v-for="ch in courseStore.chapters"
                            :key="ch"
                            @click="selectChapter(ch)"
                            :class="['w-full text-left px-6 py-4 rounded-2xl text-lg font-bold transition-all', courseStore.selectedChapter === ch ? 'bg-black text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100']"
                        >
                            {{ ch }}
                        </button>
                    </div>
                </nav>
            </div>
        `,
        setup() {
            const courseStore = useCourseStore();
            const uiStore = useUiStore();

            const selectChapter = function (chapter) {
                courseStore.selectChapter(chapter);
                uiStore.closeMenu();
            };

            return {
                courseStore: courseStore,
                uiStore: uiStore,
                selectChapter: selectChapter
            };
        }
    };
})();
