﻿﻿(function () {
    const nextTick = Vue.nextTick;
    const watch = Vue.watch;
    const computed = Vue.computed;
    const onMounted = Vue.onMounted;
    const ref = Vue.ref;
    const useCourseStore = window.useCourseStore;

    window.StepPracticeComponent = {
        template: `
            <main id="practice-main" class="flex-grow flex flex-col relative bg-white">
                <div v-if="hasTheory" id="reference-panel" class=" py-3 md:py-4 ">
                    <details class="group">
                        <summary id="theory-summary" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-50 cursor-pointer outline-none shadow-sm transition-colors">
                            <svg class="group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            Теория и справка
                        </summary>
                        <div id="theory-dropdown" class="mt-4 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 prose prose-slate prose-sm max-w-none" v-html="renderedTheory"></div>
                    </details>
                </div>
                <div id="formula-panel" class="py-3 md:py-4">
                    <div class="relative border border-slate-300 rounded-xl bg-transparent overflow-hidden">
                        <pre
                            ref="formulaHighlightRef"
                            aria-hidden="true"
                            class="m-0 whitespace-pre overflow-x-auto overflow-y-hidden pointer-events-none h-[48px]"
                            :style="formulaEditorStyle"
                        ><code ref="formulaCodeRef" class="language-excel-formula"></code></pre>
                        <input
                            id="formula-input"
                            ref="formulaInputRef"
                            v-model="formulaInput"
                            @input="handleFormulaInput"
                            @focus="startFormulaEditMode"
                            @blur="stopFormulaEditMode"
                            @scroll="syncFormulaScroll"
                            type="text"
                            spellcheck="false"
                            class="absolute inset-0 w-full h-full bg-transparent text-transparent caret-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            :style="formulaEditorStyle"
                            :placeholder="formulaInputPlaceholder"
                        />
                    </div>
                    <div class="flex items-center gap-2 pt-2">
                        <button
                            v-for="token in formulaPaletteTokens"
                            :key="token"
                            @click="insertFormulaToken(token)"
                            type="button"
                            class="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                        >
                            {{ token }}
                        </button>
                    </div>
                </div>
                <div v-if="courseStore.sheetNames.length > 1" id="sheet-tabs" class="flex items-center bg-white border-b border-slate-50 py-2 overflow-x-auto ">
                    <div class="flex gap-1">
                        <button v-for="name in courseStore.sheetNames" :key="name" @click="courseStore.currentSheetName = name"
                            :class="['px-2 py-1 text-xs rounded-md whitespace-nowrap', courseStore.currentSheetName === name ? 'bg-[#e5e7eb] border-black' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600']">
                            {{ name }}
                        </button>
                    </div>
                </div>
                <div class="table-container-wrapper">
                    <div id="hot-mount-point"></div>
                </div>
                <div id="practice-toolbar" class="flex items-center justify-start bg-slate-50/50 border-t border-slate-100  py-4  gap-4 mt-auto ">
                    <button
                        id="validate-btn"
                        v-if="courseStore.validationStatus !== 'success'"
                        @click="courseStore.validateCurrentStep"
                        class="bg-black hover:bg-slate-800 text-white px-4 md:px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg"
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
            const formulaInput = ref('');
            const formulaCodeRef = ref(null);
            const formulaHighlightRef = ref(null);
            const formulaInputRef = ref(null);
            const selectedRow = ref(null);
            const selectedCol = ref(null);
            let isSyncingFromTable = false;
            let isFormulaEditMode = false;
            const formulaEditorStyle = 'margin:0;padding:12px;font-size:16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-weight:400;line-height:24px;letter-spacing:0;tab-size:4;white-space:pre;word-break:normal;';
            const formulaPaletteTokens = ['=', '(', ':', '*', ')', ';', 'sum', 'if', 'ifs', 'countif', 'sumifs', '+', '-', '/',  '""'];

            const getSelectionStoreKey = function () {
                return (courseStore.currentStepId || 'unknown') + '_' + (courseStore.currentSheetName || 'Sheet1');
            };

            const ensureSelectionStore = function () {
                if (!courseStore.practiceSelectionBySheet) {
                    courseStore.practiceSelectionBySheet = {};
                }
                return courseStore.practiceSelectionBySheet;
            };

            const saveSelectedCellToStore = function () {
                if (selectedRow.value === null || selectedCol.value === null) return;
                const bag = ensureSelectionStore();
                bag[getSelectionStoreKey()] = { row: selectedRow.value, col: selectedCol.value };
            };

            const readSelectedCellFromStore = function () {
                const bag = ensureSelectionStore();
                const saved = bag[getSelectionStoreKey()];
                if (!saved) return null;
                if (!Number.isInteger(saved.row) || !Number.isInteger(saved.col)) return null;
                return saved;
            };

            const refreshFormulaPreview = function () {
                const codeEl = formulaCodeRef.value;
                if (!codeEl) return;
                codeEl.textContent = formulaInput.value || ' ';
                if (window.Prism && typeof window.Prism.highlightElement === 'function') {
                    window.Prism.highlightElement(codeEl);
                }
            };

            const syncFormulaScroll = function () {
                const inputEl = formulaInputRef.value;
                const highlightEl = formulaHighlightRef.value;
                if (!inputEl || !highlightEl) return;
                highlightEl.scrollTop = inputEl.scrollTop;
                highlightEl.scrollLeft = inputEl.scrollLeft;
            };

            const readCellRawValue = function (row, col) {
                if (!window.hotRaw || row === null || col === null) return '';
                const value = window.hotRaw.getSourceDataAtCell(row, col);
                return value === null || value === undefined ? '' : String(value);
            };

            const syncFormulaFromSelectedCell = function () {
                if (selectedRow.value === null || selectedCol.value === null) return;
                isSyncingFromTable = true;
                formulaInput.value = readCellRawValue(selectedRow.value, selectedCol.value);
                refreshFormulaPreview();
                nextTick(function () {
                    syncFormulaScroll();
                    isSyncingFromTable = false;
                });
            };

            const applyFormulaToSelectedCell = function () {
                if (isSyncingFromTable) return;
                if (!window.hotRaw || selectedRow.value === null || selectedCol.value === null) return;
                const currentValue = readCellRawValue(selectedRow.value, selectedCol.value);
                const nextValue = formulaInput.value || '';
                if (currentValue === nextValue) return;
                window.hotRaw.setDataAtCell(selectedRow.value, selectedCol.value, nextValue, 'formula-editor');
            };

            const handleFormulaInput = function () {
                refreshFormulaPreview();
                syncFormulaScroll();
                applyFormulaToSelectedCell();
            };

            const startFormulaEditMode = function () {
                isFormulaEditMode = true;
            };

            const stopFormulaEditMode = function () {
                isFormulaEditMode = false;
            };

            const columnToLetters = function (col) {
                let n = col + 1;
                let letters = '';
                while (n > 0) {
                    const rem = (n - 1) % 26;
                    letters = String.fromCharCode(65 + rem) + letters;
                    n = Math.floor((n - 1) / 26);
                }
                return letters;
            };

            const toCellAddress = function (row, col) {
                return columnToLetters(col) + String(row + 1);
            };

            const insertFormulaToken = function (token) {
                const inputEl = formulaInputRef.value;
                if (!inputEl) return;
                if (token === '=') {
                    formulaInput.value = '=';
                    handleFormulaInput();
                    nextTick(function () {
                        inputEl.focus();
                        inputEl.setSelectionRange(1, 1);
                        syncFormulaScroll();
                    });
                    return;
                }
                const start = Number.isInteger(inputEl.selectionStart) ? inputEl.selectionStart : formulaInput.value.length;
                const end = Number.isInteger(inputEl.selectionEnd) ? inputEl.selectionEnd : formulaInput.value.length;
                const left = formulaInput.value.slice(0, start);
                const right = formulaInput.value.slice(end);
                formulaInput.value = left + token + right;
                handleFormulaInput();
                nextTick(function () {
                    const nextPos = start + token.length;
                    inputEl.focus();
                    inputEl.setSelectionRange(nextPos, nextPos);
                    syncFormulaScroll();
                });
            };

            const renderedTheory = computed(function () {
                return marked.parse((courseStore.activeStep && courseStore.activeStep.theory) || '');
            });
            const hasTheory = computed(function () {
                const theory = (courseStore.activeStep && courseStore.activeStep.theory) || '';
                return String(theory).trim().length > 0;
            });
            const formulaInputPlaceholder = computed(function () {
                return selectedRow.value === null || selectedCol.value === null
                    ? 'Выберите ячейку'
                    : 'Введите формулу';
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
                    editor: false,
                    outsideClickDeselects: false,
                    formulas: { engine: hfRaw, sheetName: courseStore.currentSheetName, licenseKey: 'gpl-v3' },
                    afterInit: function () {
                        this.deselectCell();
                        if (typeof this.unlisten === 'function') {
                            this.unlisten();
                        }
                    },
                    afterChange(changes, src) {
                        if (src !== 'loadData') {
                            courseStore.validationStatus = null;
                            courseStore.updateRuntimeData(this.getData());
                        }
                        if (!changes || selectedRow.value === null || selectedCol.value === null) return;
                        const selectedChanged = changes.some(function (change) {
                            return change[0] === selectedRow.value && change[1] === selectedCol.value;
                        });
                        if (selectedChanged) {
                            syncFormulaFromSelectedCell();
                        }
                    },
                    afterSelectionEnd(row, col) {
                        if (isFormulaEditMode) return;
                        selectedRow.value = row;
                        selectedCol.value = col;
                        saveSelectedCellToStore();
                        syncFormulaFromSelectedCell();
                    },
                    beforeOnCellMouseDown(event, coords, td, controller) {
                        if (!isFormulaEditMode) return;
                        if (!coords || coords.row < 0 || coords.col < 0) return;
                        controller.row = false;
                        controller.column = false;
                        controller.cell = false;
                        event.preventDefault();
                        insertFormulaToken(toCellAddress(coords.row, coords.col));
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

                selectedRow.value = null;
                selectedCol.value = null;
                formulaInput.value = '';
                refreshFormulaPreview();
            };

            watch([
                function () { return courseStore.currentStepId; },
                function () { return courseStore.currentSheetName; },
                function () { return courseStore.activeStep && courseStore.activeStep.type; }
            ], initTable);
            onMounted(async function () {
                await initTable();
                await nextTick();
                refreshFormulaPreview();
            });

            return {
                courseStore: courseStore,
                renderedTheory: renderedTheory,
                hasTheory: hasTheory,
                formulaInput: formulaInput,
                formulaCodeRef: formulaCodeRef,
                formulaHighlightRef: formulaHighlightRef,
                formulaInputRef: formulaInputRef,
                formulaEditorStyle: formulaEditorStyle,
                formulaPaletteTokens: formulaPaletteTokens,
                formulaInputPlaceholder: formulaInputPlaceholder,
                refreshFormulaPreview: refreshFormulaPreview,
                syncFormulaScroll: syncFormulaScroll,
                handleFormulaInput: handleFormulaInput,
                startFormulaEditMode: startFormulaEditMode,
                stopFormulaEditMode: stopFormulaEditMode,
                insertFormulaToken: insertFormulaToken
            };
        }
    };
})();
