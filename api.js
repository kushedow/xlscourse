(function () {
    const API_ENDPOINTS = {
        STEPS: 'https://n.kushedow.tech/webhook/xls/steps'
    };

    function parseStructuredValue(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') return value;
        if (typeof value !== 'string') return value;

        const trimmed = value.trim();
        if (!trimmed) return null;

        try {
            return JSON.parse(trimmed);
        } catch (jsonErr) {
            try {
                // Backend may send JS-like object literals (single quotes, trailing commas).
                return Function(`"use strict"; return (${trimmed});`)();
            } catch (evalErr) {
                return value;
            }
        }
    }

    function normalizeStep(step) {
        const parsedSheets = parseStructuredValue(step.sheets);
        const parsedOptions = parseStructuredValue(step.options);
        const parsedSolution = parseStructuredValue(step.solution);

        const normalized = {
            id: step.id,
            order: step.order,
            chapter: step.chapter || '',
            type: step.type,
            title: step.title || '',
            content: step.content || '',
            theory: step.theory || '',
            sheets: parsedSheets && typeof parsedSheets === 'object' ? parsedSheets : null,
            solution: parsedSolution,
            options: Array.isArray(parsedOptions) ? parsedOptions : null
        };

        if (normalized.type === 'quiz') {
            normalized.quiz = [
                {
                    question: normalized.content || '',
                    options: normalized.options || [],
                    answer: normalized.solution
                }
            ];
        }

        if (normalized.type === 'practice') {
            normalized.solutions = normalized.solution && typeof normalized.solution === 'object'
                ? normalized.solution
                : {};
        }

        return normalized;
    }

    async function fetchSteps() {
        const response = await fetch(API_ENDPOINTS.STEPS);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) return [];

        return data
            .map(normalizeStep)
            .sort(function (a, b) {
                const left = Number.isFinite(Number(a.order)) ? Number(a.order) : Number(a.id);
                const right = Number.isFinite(Number(b.order)) ? Number(b.order) : Number(b.id);
                return left - right;
            });
    }

    window.API_ENDPOINTS = API_ENDPOINTS;
    window.courseApi = {
        fetchSteps: fetchSteps
    };
})();
