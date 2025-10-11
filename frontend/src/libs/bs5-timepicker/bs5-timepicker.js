(function(global) {
  'use strict';

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  class TimePicker {
    constructor(root, options) {
      this.root = (typeof root === 'string') ? document.querySelector(root) : root;
      if (!this.root) throw new Error('TimePicker: root element not found');
      this.options = Object.assign({
        format: '24',       // '24' or '12'
        hourMin: 0,
        hourMax: 23,
        minuteStep: 1,
        showSeconds: false, // not implemented (kept for future)
        required: false,
        inputClass: 'form-control', // bootstrap class applied to inputs
      }, options || {});

      this._build();
      this._attachEvents();
    }

    _build() {
      // allow passing a .form-control input as root: replace it
      if (this.root.tagName === 'INPUT' && this.root.type === 'text') {
        // convert to a container
        const cont = document.createElement('div');
        this.root.parentNode.insertBefore(cont, this.root);
        cont.className = this.root.className;
        this.root.parentNode.removeChild(this.root);
        this.root = cont;
      }

      // create input group
      this.container = document.createElement('div');
      this.container.className = 'tp-input-group';

      // hours
      this.hourInput = document.createElement('input');
      this.hourInput.type = 'number';
      this.hourInput.className = this.options.inputClass + ' tp-number';
      this.hourInput.min = this.options.hourMin;
      this.hourInput.max = this.options.hourMax;
      this.hourInput.step = 1;
      this.hourInput.setAttribute('aria-label', 'Hours');

      // separator
      this.sep = document.createElement('span');
      this.sep.className = 'tp-separator';
      this.sep.textContent = ':';

      // minutes
      this.minuteInput = document.createElement('input');
      this.minuteInput.type = 'number';
      this.minuteInput.className = this.options.inputClass + ' tp-number';
      this.minuteInput.min = 0;
      this.minuteInput.max = 59;
      this.minuteInput.step = this.options.minuteStep;
      this.minuteInput.setAttribute('aria-label', 'Minutes');

      // optional AM/PM
      if (this.options.format === '12') {
        this.ampmGroup = document.createElement('div');
        this.ampmGroup.className = 'tp-ampm btn-group';

        this.amBtn = document.createElement('button');
        this.amBtn.type = 'button';
        this.amBtn.className = 'btn btn-outline-secondary btn-sm';
        this.amBtn.textContent = 'AM';

        this.pmBtn = document.createElement('button');
        this.pmBtn.type = 'button';
        this.pmBtn.className = 'btn btn-outline-secondary btn-sm';
        this.pmBtn.textContent = 'PM';

        this.ampmGroup.appendChild(this.amBtn);
        this.ampmGroup.appendChild(this.pmBtn);
      }

      // append
      this.container.appendChild(this.hourInput);
      this.container.appendChild(this.sep);
      this.container.appendChild(this.minuteInput);
      if (this.ampmGroup) this.container.appendChild(this.ampmGroup);

      // put inside root (replace contents)
      this.root.innerHTML = '';
      this.root.appendChild(this.container);

      // internal state
      this._changeHandlers = [];
      this.setValue(0, 0, { silent: true });
    }

    _attachEvents() {
      const onInput = (e) => {
        this._normalizeInputs();
        this._emitChange();
      };

      this.hourInput.addEventListener('change', onInput);
      this.minuteInput.addEventListener('change', onInput);

      // keep valid on typing
      this.hourInput.addEventListener('input', () => this._sanitizeInput(this.hourInput));
      this.minuteInput.addEventListener('input', () => this._sanitizeInput(this.minuteInput));

      // keyboard arrow support
      [this.hourInput, this.minuteInput].forEach((inp) => {
        inp.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
            ev.preventDefault();
            const delta = (ev.key === 'ArrowUp') ? 1 : -1;
            const step = (inp === this.minuteInput) ? this.options.minuteStep : 1;
            const newVal = Number(inp.value || 0) + delta * step;
            inp.value = newVal;
            inp.dispatchEvent(new Event('change'));
          }
        });
      });

      if (this.options.format === '12') {
        this.amBtn.addEventListener('click', () => { this._setAmPm('AM'); });
        this.pmBtn.addEventListener('click', () => { this._setAmPm('PM'); });
      }
    }

    _sanitizeInput(inp){
      // remove leading zeros and non-numeric
      const raw = inp.value;
      const num = raw === '' ? '' : parseInt(raw, 10);
      if (raw === '') return;
      if (isNaN(num)) { inp.value = ''; return; }
      // clamp
      if (inp === this.hourInput) {
        inp.value = clamp(num, this.options.hourMin, this.options.hourMax);
      } else {
        inp.value = clamp(num, 0, 59);
      }
    }

    _normalizeInputs(){
      // ensure both are integers and in range
      let h = parseInt(this.hourInput.value, 10);
      let m = parseInt(this.minuteInput.value, 10);
      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;

      // apply minuteStep rounding
      if (this.options.minuteStep > 1) {
        m = Math.round(m / this.options.minuteStep) * this.options.minuteStep;
        if (m >= 60) m = 60 - this.options.minuteStep;
      }

      // clamp
      h = clamp(h, this.options.hourMin, this.options.hourMax);
      m = clamp(m, 0, 59);

      // if 12h format and hour is 0 -> convert to 12
      if (this.options.format === '12') {
        if (h === 0) h = 12;
        if (h > 12) h = ((h - 1) % 12) + 1; // fold into 1-12
      }

      this.hourInput.value = h;
      this.minuteInput.value = m;
    }

    _setAmPm(which){
      if (!this.ampmGroup) return;
      if (which === 'AM') {
        this.amBtn.classList.add('active');
        this.amBtn.classList.remove('btn-outline-secondary');
        this.pmBtn.classList.remove('active');
        this.pmBtn.classList.add('btn-outline-secondary');
        this._ampm = 'AM';
      } else {
        this.pmBtn.classList.add('active');
        this.pmBtn.classList.remove('btn-outline-secondary');
        this.amBtn.classList.remove('active');
        this.amBtn.classList.add('btn-outline-secondary');
        this._ampm = 'PM';
      }
      this._emitChange();
    }

    _emitChange(){
      const v = this.getValue();
      this._changeHandlers.forEach(fn => fn(v));
    }

    onChange(fn){
      if (typeof fn === 'function') this._changeHandlers.push(fn);
      return () => { // return unsubscribe
        this._changeHandlers = this._changeHandlers.filter(f => f !== fn);
      };
    }

    getValue(asObject){
      let h = parseInt(this.hourInput.value, 10);
      let m = parseInt(this.minuteInput.value, 10);
      if (isNaN(h)) h = 0; if (isNaN(m)) m = 0;
      if (this.options.format === '12') {
        const ampm = this._ampm || 'AM';
        // convert to 24h in numeric value
        let h24 = h % 12;
        if (ampm === 'PM') h24 += 12;
        if (asObject) return { hours: h, minutes: m, ampm };
        return { hours24: h24, minutes: m, ampm };
      }
      if (asObject) return { hours: h, minutes: m };
      return { hours: h, minutes: m };
    }

    setValue(h, m, opts){
      opts = opts || {};
      if (typeof h !== 'number') {
        // allow 'HH:MM' string
        if (typeof h === 'string' && h.indexOf(':') !== -1) {
          const parts = h.split(':').map(p => parseInt(p,10));
          h = parts[0]; m = parts[1] || 0;
        } else return;
      }
      h = Math.floor(h);
      m = Math.floor(m || 0);

      if (this.options.format === '12') {
        // store internal am/pm (default AM)
        let ampm = 'AM';
        if (h >= 12) { ampm = 'PM'; }
        let h12 = h % 12; if (h12 === 0) h12 = 12;
        this.hourInput.value = clamp(h12, 1, 12);
        this._ampm = ampm;
        if (this.amBtn && this.pmBtn) {
          if (ampm === 'AM') this._setAmPm('AM'); else this._setAmPm('PM');
        }
      } else {
        this.hourInput.value = clamp(h, this.options.hourMin, this.options.hourMax);
      }

      this.minuteInput.value = clamp(m, 0, 59);

      if (!opts.silent) this._emitChange();
    }

    // convenience: returns a string HH:MM (zero padded)
    toString(){
      const v = this.getValue(true);
      const hh = String(v.hours).padStart(2,'0');
      const mm = String(v.minutes).padStart(2,'0');
      if (this.options.format === '12') return `${hh}:${mm} ${v.ampm}`;
      return `${hh}:${mm}`;
    }

    setActive(isActive) {
      if (isActive === false) {
        console.log('Disabling TimePicker inputs');
        console.log('hourInput:', this.hourInput);
        this.hourInput.setAttribute('disabled', '');
        this.minuteInput.setAttribute('disabled', '');
        if (this.amBtn) this.amBtn.setAttribute('disabled', '');
        if (this.pmBtn) this.pmBtn.setAttribute('disabled', '');
      } else {
        this.hourInput.removeAttribute('disabled');
        this.minuteInput.removeAttribute('disabled');
        if (this.amBtn) this.amBtn.removeAttribute('disabled');
        if (this.pmBtn) this.pmBtn.removeAttribute('disabled');
      }
    }
  }

  // expose globally
  global.TimePicker = TimePicker;

})(window);