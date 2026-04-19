(function () {
    const API_ENDPOINTS = {
        STEPS: 'https://n.kushedow.tech/webhook/xls/steps'
    };

    async function fetchSteps() {
        const response = await fetch(API_ENDPOINTS.STEPS);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        return response.json();
    }

    window.API_ENDPOINTS = API_ENDPOINTS;
    window.courseApi = {
        fetchSteps: fetchSteps
    };
})();

