(function () {
    window.LoaderStateComponent = {
        template: `
            <div id="loader-container" class="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-xl border border-slate-100">
                <div class="loader ease-linear rounded-full border-4 border-t-4 border-slate-200 h-12 w-12 mb-4"></div>
                <p class="text-slate-500 font-medium">Загрузка учебных материалов...</p>
            </div>
        `
    };
})();

