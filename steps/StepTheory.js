(function () {
    const computed = Vue.computed;
    const useCourseStore = window.useCourseStore;

    window.StepTheoryComponent = {
        props: ['step'],
        setup(props) {
            const courseStore = useCourseStore();
            const renderedContent = computed(function () {
                return marked.parse(props.step.content || '');
            });
            return { courseStore: courseStore, renderedContent: renderedContent };
        },
        template: `
            <div class="space-y-4">
                <div id="theory-content" class="prose prose-slate prose-sm max-w-none" v-html="renderedContent"></div>
                <div id="theory-toolbar" class="flex items-center justify-start">
                    <button
                        id="continue-btn"
                        @click="courseStore.moveToNextStep"
                        class="bg-black hover:bg-slate-800 text-white px-6 md:px-8 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-lg"
                    >
                        Перейти дальше
                    </button>
                </div>
            </div>
        `
    };
})();
