(function () {
    const nextTick = Vue.nextTick;
    const watch = Vue.watch;
    const computed = Vue.computed;
    const onMounted = Vue.onMounted;
    const useCourseStore = window.useCourseStore;

    window.StepPracticeComponent = {
        template: `
            <main id="practice-main" class="flex-grow flex flex-col relative bg-white">
                <div id="reference-panel" class=" py-3 md:py-4 bg-white border-b border-slate-100 mobile-tight">
                    <details class="group">
                        <summary id="theory-summary" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-50 cursor-pointer outline-none shadow-sm transition-colors">
                            <svg class="group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            Теория и справка
                        </summary>
                        <div id="theory-dropdown" class="mt-4 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 prose prose-slate prose-sm max-w-none" v-html="renderedTheory"></div>
                    </details>
                </div>
                <div id="sheet-tabs" class="flex items-center bg-white border-b border-slate-50 py-2 overflow-x-auto mobile-x-tight">
                    <div class="flex gap-1">
                        <button v-for="name in courseStore.sheetNames" :key="name" @click="courseStore.currentSheetName = name"
                            :class="['px-4 py-2 text-[10px] md:text-xs font-bold rounded-xl transition-all border whitespace-nowrap', courseStore.currentSheetName === name ? 'bg-black border-black text-white' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600']">
                            {{ name }}
                        </button>
                    </div>
                </div>
                <div class="table-container-wrapper">
                    <div id="hot-mount-point"></div>
                </div>
                <div id="practice-toolbar" class="flex items-center justify-start bg-slate-50/50 border-t border-slate-100  py-4 md:py-5 gap-4 mt-auto mobile-x-tight">
                    <button
                        id="validate-btn"
                        v-if="courseStore.validationStatus !== 'success'"
                        @click="courseStore.validateCurrentStep"
                        class="bg-black hover:bg-slate-800 text-white px-6 md:px-8 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-lg"
                    >
                        Проверить
                    </button>
                    <button
                        id="next-step-btn"
                        v-else
                        @click="courseStore.moveToNextStep"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 md:px-8 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-lg"
                    >
                        Продолжить
                    </button>
                    <div
                        v-if="courseStore.validationStatus"
                        :class="['px-4 py-2 text-sm font-bold rounded-xl border transition-all', courseStore.validationStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700']"
                    >
                        {{ courseStore.validationStatus === 'success' ? 'Верно!' : 'Есть ошибки' }}
                    </div>
                </div>
            </main>
        `,
        setup() {
            const courseStore = useCourseStore();
            let hfRaw = null;
            const renderedTheory = computed(function () {
                return marked.parse((courseStore.activeStep && courseStore.activeStep.theory) || '');
            });

            const initTable = async function () {
                if (!courseStore.activeStep || courseStore.activeStep.type !== 'practice') return;
                if (window.hotRaw) window.hotRaw.destroy();
                if (hfRaw) hfRaw.destroy();
                hfRaw = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

                courseStore.sheetNames.forEach(function (name) {
                    hfRaw.addSheet(name);
                    hfRaw.setSheetContent(hfRaw.getSheetId(name), courseStore.runtimeData[courseStore.currentStepId + '_' + name]);
                });

                await nextTick();
                const container = document.getElementById('hot-mount-point');
                if (!container) return;

                window.hotRaw = new Handsontable(container, {
                    data: courseStore.runtimeData[courseStore.currentStepId + '_' + courseStore.currentSheetName],
                    rowHeaders: true,
                    colHeaders: true,
                    height: 'auto',
                    stretchH: 'all',
                    licenseKey: 'non-commercial-and-evaluation',
                    formulas: { engine: hfRaw, sheetName: courseStore.currentSheetName, licenseKey: 'gpl-v3' },
                    afterChange(changes, src) {
                        if (src !== 'loadData') {
                            courseStore.validationStatus = null;
                            courseStore.updateRuntimeData(this.getData());
                        }
                    },
                    cells(row, col) {
                        const cellProps = { className: '' };
                        const cellRef = String.fromCharCode(65 + col) + (row + 1);
                        if (row === 0) cellProps.className += ' font-bold';

                        const solutions = (courseStore.activeStep && courseStore.activeStep.solutions) || {};
                        if (solutions[cellRef] !== undefined) {
                            const res = courseStore.validationResults[courseStore.currentStepId + '_' + courseStore.currentSheetName + '_' + cellRef];
                            cellProps.className += res === true ? ' cell-correct' : (res === false ? ' cell-incorrect' : ' cell-target');
                        }
                        return cellProps;
                    }
                });
            };

            watch([
                function () { return courseStore.currentStepId; },
                function () { return courseStore.currentSheetName; },
                function () { return courseStore.activeStep && courseStore.activeStep.type; }
            ], initTable);
            onMounted(initTable);

            return { courseStore: courseStore, renderedTheory: renderedTheory };
        }
    };
})();
