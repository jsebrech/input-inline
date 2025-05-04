let VALUE_MISSING_MESSAGE = 'Please fill out this field.';
// ugly hack to localize validation message for "required"
// must run before element define to ensure existing elements upgrade with proper l10n
(() => {
    const input = document.createElement('input');
    input.required = true;
    input.reportValidity();
    VALUE_MISSING_MESSAGE = input.validationMessage;
})();

customElements.define('input-inline', class extends HTMLElement {

    #value;
    #internals;
    /** is this field disabled through a parent fieldset? */
    #formDisabled = false;
    /** user input should fire change events on blur */
    #shouldFireChange = false;
    /** current custom validity message */
    #customValidityMessage = '';

    /**
     * What the input's initial value is, also the value it will be reset to
     * @type {string}
     */
    set defaultValue(v) {
        this.setAttribute('value', String(v));
    }
    get defaultValue() {
        return this.getAttribute('value') ?? '';
    }

    /**
     * What the input's current value is
     * @type {string}
     */
    set value(v) {
        if (this.#value !== String(v)) {
            this.#value = String(v);
            this.#update();    
        }
    }
    get value() {
        return this.#value ?? this.defaultValue;
    }

    set name(v) {
        this.setAttribute('name', v);
    }
    get name() {
        return this.getAttribute('name');
    }

    set disabled(v) {
        if (v) {
            this.setAttribute('disabled', 'true');
        } else {
            this.removeAttribute('disabled');
        }
    }
    get disabled() {
        // this value operates independently of whether a parent fieldset is disabled
        return this.hasAttribute('disabled');
    }

    set readOnly(v) {
        if (v) {
            this.setAttribute('readonly', 'true');
        } else {
            this.removeAttribute('readonly');
        }
    }
    get readOnly() {
        return this.hasAttribute('readonly');
    }

    set required(v) {
        if (v) {
            this.setAttribute('required', 'true');
        } else {
            this.removeAttribute('required');
        }
    }
    get required() {
        return this.hasAttribute('required');
    }

    constructor() {
        super();
        this.#internals = this.attachInternals();
        // without this the role is 'generic'
        this.#internals.role = 'textbox';
        // add event listeners
        this.addEventListener('input', this);
        this.addEventListener('keydown', this);
        this.addEventListener('paste', this);
        this.addEventListener('focusout', this);
    }

    handleEvent(e) {
        switch (e.type) {
            // respond to user input (typing, drag-and-drop, paste)
            case 'input':
                this.value = this.textContent
                    // replace newlines and tabs with spaces
                    .replace(/[\n\r\t]+/g, ' ');
                this.#shouldFireChange = true;
                break;
            // enter key should submit form instead of adding a new line
            case 'keydown':
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.#internals.form?.requestSubmit();
                }
                break;
            // prevent pasting rich text (firefox), or newlines (all browsers)
            case 'paste':
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain')
                    // replace newlines and tabs with spaces
                    .replace(/[\n\r\t]+/g, ' ')
                    // limit length of pasted text to something reasonable
                    .substring(0, 1000);
                // shadowRoot.getSelection is non-standard, fallback to document in firefox
                // https://stackoverflow.com/a/70523247
                let selection = this.getRootNode()?.getSelection?.() || document.getSelection();
                let range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                // manually trigger input event to restore default behavior
                this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                break;
            // fire change event on blur
            case 'focusout':
                if (this.#shouldFireChange) {
                    this.#shouldFireChange = false;
                    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                }
                break;
        }
    }

    connectedCallback() {
        this.#update();
    }

    static observedAttributes = [
        'value', /* defaultValue property */
        'disabled',
        'readonly',
        'required',
    ];

    attributeChangedCallback() {
        this.#update();
    }

    #update() {
        if (this.textContent !== this.value) this.textContent = this.value;
        this.#internals.setFormValue(this.value === '' ? null : this.value);
        this.#internals.ariaRequired = this.required;
        this.#internals.ariaDisabled = this.disabled;
        this.#internals.ariaReadOnly = this.readOnly;
        const isDisabled = this.#formDisabled || this.disabled;
        // prevent changes in disabled and readonly states
        // plaintext-only not supported by firefox (becomes equivalent to true)
        // workaround in paste handler, see constructor
        this.contentEditable = !this.readOnly && !isDisabled && 'plaintext-only';
        // focusable when readonly, but not when disabled
        this.tabIndex = isDisabled ? -1 : 0;
        // used to set minimum width in default stylesheet
        const length = this.textContent?.length || 0;
        this.style.setProperty('--current-length', `${length}ch`);
        // update valid state
        this.#updateValidity();
    }

    // necessary to turn this into a form control:

    static formAssociated = true;

    formResetCallback() {
        this.#value = undefined;
        this.#update();
    }
    
    formDisabledCallback(disabled) {
        this.#formDisabled = disabled;
        this.#update();
    }
    
    formStateRestoreCallback(state) {
        this.#value = state ?? undefined;
        this.#update();
    }

    // form validity api

    #updateValidity() {
        // ValidityState object
        const state = {};
        let message = '';

        // custom validity message overrides all else
        if (this.#customValidityMessage) {
            state.customError = true;
            message = this.#customValidityMessage;
        } else {
            if (this.required && !this.value) {
                state.valueMissing = true;
                message = VALUE_MISSING_MESSAGE;
            }
    
            // add other checks here if needed (e.g., pattern, minLength)
        }

        // set the validity state on the internals object
        this.#internals.setValidity(state, message);
    }

    checkValidity() {
        this.#updateValidity();
        return this.#internals.checkValidity();
    }

    reportValidity() {
        this.#updateValidity();
        return this.#internals.reportValidity();
    }

    setCustomValidity(message) {
        this.#customValidityMessage = message ?? '';
        this.#updateValidity();
    }

    get validity() {
        return this.#internals.validity;
    }

    get validationMessage() {
        return this.#internals.validationMessage;
    }

    get willValidate() {
        return this.#internals.willValidate;
    }

});
