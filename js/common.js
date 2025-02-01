//
// Universal JavaScript environment handler supporting Node.js, AMD, and Browser
// Detects the current environment, provides export/import functionality, and assigns the active environment globally.
//
(function () {
    /**
     *
     * @param mod {any}
     * @this {{
     *     define: false | Function,
     *     module: false | NodeModule,
     *     global: false | global,
     * }}
     */
    function export_module(mod) {
        if (!this) {
            console.warn('You should pass filled THIS parameter');
            return false;
        }

        if (typeof this.module?.exports == 'object') {
            return this.module.exports = mod;
        }
        if (!!this.define?.amd) {
            return this.define([], () => mod);
        }

        if (!!this.global) Object.assign(this.global, mod);
    }

    const _this = {
        define: typeof define != 'undefined' && typeof define.amd != 'undefined' && define,
        module: typeof module != 'undefined' && typeof module.exports != 'undefined' && module,
        global: typeof globalThis != 'undefined' && globalThis
            || typeof self != 'undefined' && self
            || typeof global != 'undefined' && global
            || typeof window != 'undefined' && window
    };
    const E = {uni_export: export_module};
    export_module.call(_this, E)

    if (_this.global) Object.assign(_this.global, E)
})();
