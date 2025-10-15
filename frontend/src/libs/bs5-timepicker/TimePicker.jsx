import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './bs5-timepicker.css';

const TimePicker = forwardRef(function TimePicker(
  {
    format = '24',
    minuteStep = 1,
    defaultValue = '00:00',
    onChange,
    onReady,
    inputClass = 'form-control',
    className = '',
  },
  ref
) {
  const mountRef = useRef(null);
  const instanceRef = useRef(null);

  // 🔸 Initialize once
  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    async function init() {
      if (typeof window === 'undefined' || !mountRef.current) return;

      if (!window.TimePicker) {
        await import('./bs5-timepicker.js');
      }

      if (!window.TimePicker) {
        console.error('TimePicker: library not loaded');
        return;
      }

      instanceRef.current = new window.TimePicker(mountRef.current, {
        format,
        minuteStep,
        inputClass,
      });

      // Set initial value
      if (defaultValue) {
        instanceRef.current.setValue(defaultValue);
      }

      // Notify parent that picker is ready
      if (typeof onReady === 'function') {
        onReady(instanceRef.current);
      }

      // Subscribe to value changes
      unsubscribe = instanceRef.current.onChange((val) => {
        if (typeof onChange === 'function') {
          onChange(instanceRef.current.toString(), val);
        }
      });
    }

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (mountRef.current) mountRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, []); // <-- run only once

  // 🔸 Update value if prop changes later (optional)
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setValue(defaultValue, 0, { silent: true });
    }
  }, [defaultValue]);

  useImperativeHandle(ref, () => ({
    getValue(asObject) {
      return instanceRef.current ? instanceRef.current.getValue(asObject) : null;
    },
    setValue(h, m) {
      if (instanceRef.current) instanceRef.current.setValue(h, m);
    },
    toString() {
      return instanceRef.current ? instanceRef.current.toString() : '';
    },
    setActive(isActive) {
      if (instanceRef.current) instanceRef.current.setActive(isActive);
    },
  }));

  return (
    <div className={`react-timepicker-wrapper ${className}`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <div ref={mountRef} />
    </div>
  );
});

export default TimePicker;
