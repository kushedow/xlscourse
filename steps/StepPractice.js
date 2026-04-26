﻿(function () {
    const nextTick = Vue.nextTick;
    const watch = Vue.watch;
    const computed = Vue.computed;
    const onMounted = Vue.onMounted;
    const onBeforeUnmount = Vue.onBeforeUnmount;
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
                <div id="formula-panel" class="order-4 md:order-2 py-3 md:py-4 bg-transparent">
                    <div class="relative border border-slate-300 rounded-md bg-transparent overflow-hidden">
                        <pre
                            ref="formulaHighlightRef"
                            aria-hidden="true"
                            class="m-0 whitespace-pre overflow-x-auto overflow-y-hidden pointer-events-none h-[32px]"
                            :style="formulaEditorStyle"
                        ><code ref="formulaCodeRef" class="language-excel-formula"></code></pre>
                        <input
                            id="formula-input"
                            ref="formulaInputRef"
                            v-model="formulaInput"
                            @input="handleFormulaInput"
                            @focus="startFormulaEditMode"
                            @blur="stopFormulaEditMode"
                            @keydown.enter.prevent="handleFormulaEnterKey"
                            @keydown.esc.prevent="handleFormulaEscKey"
                            @keydown.escape.prevent="handleFormulaEscKey"
                            @scroll="syncFormulaScroll"
                            type="text"
                            spellcheck="false"
                            autocomplete="off"
                            autocorrect="off"
                            autocapitalize="off"
                            class="absolute inset-0 w-full h-full bg-transparent text-transparent caret-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            :style="formulaEditorStyle"
                            :placeholder="formulaInputPlaceholder"
                            :disabled="!hasActiveCellSelection"
                        />
                    </div>
                    <div class="flex flex-wrap items-center gap-2 pt-2">
                        <button
                            v-for="token in formulaPaletteTokens"
                            :key="token"
                            @click="insertFormulaToken(token)"
                            type="button"
                            class="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                            :disabled="!hasActiveCellSelection"
                        >
                            {{ token }}
                        </button>
                    </div>
                </div>
                <div v-if="courseStore.sheetNames.length > 1" id="sheet-tabs" class="order-2 md:order-3 flex items-center bg-white border-b border-slate-50 py-2 overflow-x-auto ">
                    <div class="flex gap-1">
                        <button v-for="name in courseStore.sheetNames" :key="name" @click="courseStore.currentSheetName = name"
                            :class="['px-2 py-1 text-xs rounded-md whitespace-nowrap', courseStore.currentSheetName === name ? 'bg-[#e5e7eb] border-black' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600']">
                            {{ name }}
                        </button>
                    </div>
                </div>
                <div class="order-3 md:order-4 table-container-wrapper my-4">
                    <div id="hot-mount-point"></div>
                </div>
                <div id="practice-toolbar" class="order-5 md:order-5 flex items-center justify-start py-4  gap-4 mt-auto ">
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
            // 1) Core dependencies and constants
            const courseStore = useCourseStore();
            const FORMULA_UPDATE_SOURCE = 'formula-editor';
            const EMPTY_FORMULA_PLACEHOLDER = ' ';
            const PLACEHOLDER_PICK_CELL = 'Выберите ячейку';
            const PLACEHOLDER_ENTER_FORMULA = 'Введите формулу';

            // 2) Runtime refs/state
            let hfRaw = null;
            const formulaInput = ref('');
            const formulaCodeRef = ref(null);
            const formulaHighlightRef = ref(null);
            const formulaInputRef = ref(null);
            const selectedRow = ref(null);
            const selectedCol = ref(null);
            const referenceRow = ref(null);
            const referenceCol = ref(null);
            let isSyncingFromTable = false;
            let isFormulaEditMode = false;
            let keepFormulaFocusOnBlur = false;

            // 3) UI config
            const formulaEditorStyle = 'margin:0;padding:4px 12px;font-size:16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-weight:400;line-height:24px;letter-spacing:0;tab-size:4;white-space:pre;word-break:normal;background-color:transparent;';
            const formulaPaletteTokens = ['=', '(', ':', '*', ')', ';', '+', '-', '/',  '""'];

            // 4) Computed state
            const renderedTheory = computed(function () {
                return marked.parse((courseStore.activeStep && courseStore.activeStep.theory) || '');
            });
            const hasTheory = computed(function () {
                const theory = (courseStore.activeStep && courseStore.activeStep.theory) || '';
                return String(theory).trim().length > 0;
            });
            const formulaInputPlaceholder = computed(function () {
                return selectedRow.value === null || selectedCol.value === null
                    ? PLACEHOLDER_PICK_CELL
                    : PLACEHOLDER_ENTER_FORMULA;
            });
            const hasActiveCellSelection = computed(function () {
                return selectedRow.value !== null && selectedCol.value !== null;
            });

            // 5) Helper functions (store and table access)
            const getHot = function () {
                return window.hotRaw || null;
            };

            const setHot = function (instance) {
                window.hotRaw = instance;
            };

            const destroyHot = function () {
                const hot = getHot();
                if (hot) hot.destroy();
                setHot(null);
            };

            const destroyFormulaEngine = function () {
                if (hfRaw) hfRaw.destroy();
                hfRaw = null;
            };

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

            const clearSelectedCellFromStore = function () {
                const bag = ensureSelectionStore();
                delete bag[getSelectionStoreKey()];
            };

            const readSelectedCellFromStore = function () {
                const bag = ensureSelectionStore();
                const saved = bag[getSelectionStoreKey()];
                if (!saved) return null;
                if (!Number.isInteger(saved.row) || !Number.isInteger(saved.col)) return null;
                return saved;
            };

            const clearSelectedCellState = function () {
                selectedRow.value = null;
                selectedCol.value = null;
            };

            const clearReferenceCellState = function () {
                referenceRow.value = null;
                referenceCol.value = null;
            };

            const setSelectedCellState = function (row, col) {
                selectedRow.value = row;
                selectedCol.value = col;
            };

            const hasActiveCell = function () {
                return selectedRow.value !== null && selectedCol.value !== null;
            };

            const isActiveCell = function (row, col) {
                return selectedRow.value === row && selectedCol.value === col;
            };

            const formulaContainsEquals = function () {
                return (formulaInput.value || '').includes('=');
            };

            const refreshFormulaPreview = function () {
                const codeEl = formulaCodeRef.value;
                if (!codeEl) return;
                codeEl.textContent = formulaInput.value || EMPTY_FORMULA_PLACEHOLDER;
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

            const focusFormulaInput = function () {
                const inputEl = formulaInputRef.value;
                if (!inputEl) return;
                inputEl.focus();
                const pos = (formulaInput.value || '').length;
                inputEl.setSelectionRange(pos, pos);
                syncFormulaScroll();
            };

            const forceFormulaFocus = function () {
                keepFormulaFocusOnBlur = true;
                nextTick(function () {
                    focusFormulaInput();
                    setTimeout(function () {
                        focusFormulaInput();
                        keepFormulaFocusOnBlur = false;
                    }, 0);
                });
            };

            const readCellRawValue = function (row, col) {
                const hot = getHot();
                if (!hot || row === null || col === null) return '';
                const value = hot.getSourceDataAtCell(row, col);
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
                const hot = getHot();
                if (!hot || selectedRow.value === null || selectedCol.value === null) return;
                const currentValue = readCellRawValue(selectedRow.value, selectedCol.value);
                const nextValue = formulaInput.value || '';
                if (currentValue === nextValue) return;
                hot.setDataAtCell(selectedRow.value, selectedCol.value, nextValue, FORMULA_UPDATE_SOURCE);
            };

            const handleFormulaInput = function () {
                if (!hasActiveCell()) {
                    formulaInput.value = '';
                    refreshFormulaPreview();
                    syncFormulaScroll();
                    return;
                }
                refreshFormulaPreview();
                syncFormulaScroll();
                applyFormulaToSelectedCell();
            };

            const startFormulaEditMode = function () {
                if (!hasActiveCell()) return;
                isFormulaEditMode = true;
            };

            const stopFormulaEditMode = function () {
                if (keepFormulaFocusOnBlur) {
                    forceFormulaFocus();
                    return;
                }
                isFormulaEditMode = false;
                clearReferenceCellState();
                const hot = getHot();
                if (hot) hot.render();
            };

            const forgetActiveCellSelection = function () {
                clearSelectedCellState();
                clearReferenceCellState();
                clearSelectedCellFromStore();
                formulaInput.value = '';
                refreshFormulaPreview();
                syncFormulaScroll();
                const hot = getHot();
                if (hot) {
                    hot.deselectCell();
                    hot.render();
                }
            };

            const handleFormulaEnterKey = function () {
                forgetActiveCellSelection();
            };

            const handleFormulaEscKey = function () {
                forgetActiveCellSelection();
            };

            const isResetSelectionKey = function (event) {
                if (!event) return false;
                return event.key === 'Enter' || event.key === 'Escape' || event.key === 'Esc';
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
                if (!hasActiveCell()) return;
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

            const buildHotOptions = function () {
                return {
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
                    beforeOnCellMouseDown(event, coords, td, controller) {
                        if (!coords || coords.row < 0 || coords.col < 0) return;
                        controller.row = false;
                        controller.column = false;
                        controller.cell = false;
                        event.preventDefault();

                        const hadActiveCell = hasActiveCell();
                        if (hadActiveCell && isActiveCell(coords.row, coords.col)) {
                            return false;
                        }

                        if (!hadActiveCell) {
                            setSelectedCellState(coords.row, coords.col);
                            clearReferenceCellState();
                            saveSelectedCellToStore();
                            syncFormulaFromSelectedCell();
                            forceFormulaFocus();
                            const hot = getHot();
                            if (hot) hot.render();
                            return false;
                        }

                        if (hadActiveCell && formulaContainsEquals()) {
                            referenceRow.value = coords.row;
                            referenceCol.value = coords.col;
                            forceFormulaFocus();
                            insertFormulaToken(toCellAddress(coords.row, coords.col));
                            const hot = getHot();
                            if (hot) hot.render();
                            return false;
                        }

                        setSelectedCellState(coords.row, coords.col);
                        clearReferenceCellState();
                        saveSelectedCellToStore();
                        syncFormulaFromSelectedCell();
                        const hot = getHot();
                        if (hot) hot.render();
                        return false;
                    },
                    beforeKeyDown(event) {
                        if (!isResetSelectionKey(event)) return;
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        forgetActiveCellSelection();
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
                        if (selectedRow.value === row && selectedCol.value === col) {
                            cellProps.className += ' cell-formula-linked';
                        } else if (referenceRow.value === row && referenceCol.value === col) {
                            cellProps.className += ' cell-reference-picked';
                        }
                        return cellProps;
                    }
                };
            };

            // 6) Main table lifecycle
            const initTable = async function () {
                if (!courseStore.activeStep || courseStore.activeStep.type !== 'practice') return;
                destroyHot();
                destroyFormulaEngine();
                hfRaw = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

                courseStore.sheetNames.forEach(function (name) {
                    hfRaw.addSheet(name);
                    hfRaw.setSheetContent(hfRaw.getSheetId(name), courseStore.runtimeData[courseStore.currentStepId + '_' + name]);
                });

                await nextTick();
                const container = document.getElementById('hot-mount-point');
                if (!container) return;

                setHot(new Handsontable(container, buildHotOptions()));

                clearSelectedCellState();
                clearReferenceCellState();
                formulaInput.value = '';
                refreshFormulaPreview();
            };

            // 7) Watchers and lifecycle
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
            onBeforeUnmount(function () {
                destroyHot();
                destroyFormulaEngine();
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
                hasActiveCellSelection: hasActiveCellSelection,
                refreshFormulaPreview: refreshFormulaPreview,
                syncFormulaScroll: syncFormulaScroll,
                focusFormulaInput: focusFormulaInput,
                handleFormulaInput: handleFormulaInput,
                handleFormulaEnterKey: handleFormulaEnterKey,
                handleFormulaEscKey: handleFormulaEscKey,
                startFormulaEditMode: startFormulaEditMode,
                stopFormulaEditMode: stopFormulaEditMode,
                insertFormulaToken: insertFormulaToken
            };
        }
    };
})();
