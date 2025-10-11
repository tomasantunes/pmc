// TimePicker.jsx
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

  // Initialize vanilla TimePicker
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    async function loadAndInit() {
      if (!mountRef.current) return;

      if (!window.TimePicker) {
        await import('./bs5-timepicker.js');
      }

      if (!isMounted || !window.TimePicker) return;

      instanceRef.current = new window.TimePicker(mountRef.current, {
        format,
        minuteStep,
        inputClass,
      });

      // set default value
      instanceRef.current.setValue(defaultValue);

      // notify parent when instance is ready
      if (typeof onReady === 'function') onReady(instanceRef.current);

      unsubscribe = instanceRef.current.onChange((val) => {
        if (!isMounted) return;
        if (typeof onChange === 'function') {
          onChange(instanceRef.current.toString(), instanceRef.current.getValue(true));
        }
      });
    }

    loadAndInit();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (mountRef.current) mountRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, [format, minuteStep, defaultValue, inputClass, onChange, onReady]);


  // Forward methods to parent via ref
  useImperativeHandle(
    ref,
    () => ({
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
      // getter always returns latest instance
      get instance() {
        return instanceRef.current;
      },
    }),
    []
  );

  return (
    <div className={`react-timepicker-wrapper ${className}`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <div ref={mountRef} />
    </div>
  );
});

export default TimePicker;
