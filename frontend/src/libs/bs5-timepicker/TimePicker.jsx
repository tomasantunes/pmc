import React, { useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './bs5-timepicker.css';

export default function TimePicker({
  format = '24',
  minuteStep = 1,
  defaultValue = '00:00',
  onChange,
  inputClass = 'form-control',
  className = '',
}) {
  const mountRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;

    async function init() {
      if (typeof window === 'undefined' || !mountRef.current) return;

      // Ensure the vanilla library is loaded (dynamic import so this is client-only)
      if (!window.TimePicker) {
        try {
          // Adjust the path if your bundler expects a different path
          await import('./bs5-timepicker.js');
        } catch (err) {
          // If the file cannot be dynamically imported, check your bundler setup.
          console.error('Failed to load bs5-timepicker.js', err);
        }
      }

      if (!mounted) return;
      if (!window.TimePicker) {
        console.error('TimePicker library not available on window.');
        return;
      }

      // instantiate (mount into the inner container)
      instanceRef.current = new window.TimePicker(mountRef.current, {
        format,
        minuteStep,
        inputClass,
      });

      // set default value (supports 'HH:MM' string)
      if (defaultValue) {
        try {
          instanceRef.current.setValue(defaultValue);
        } catch (e) {
          // fallback: ignore invalid defaultValue
          console.warn('Invalid defaultValue for TimePicker:', defaultValue);
        }
      }

      // subscribe to changes
      unsubscribe = instanceRef.current.onChange((val) => {
        if (!mounted) return;
        if (typeof onChange === 'function') {
          onChange(instanceRef.current.toString(), val);
        }
      });
    }

    init();

    // cleanup on unmount or when dependencies change
    return () => {
      mounted = false;
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (_) {}
      if (mountRef.current) mountRef.current.innerHTML = '';
      instanceRef.current = null;
    };
    // Recreate when these core config props change
  }, [format, minuteStep, inputClass, defaultValue, onChange]);

  // This component *always* returns JSX that can be mounted by React
  return (
    <div className={`react-timepicker-wrapper ${className}`}>
      {/* the TimePicker will mount into this element */}
      <div ref={mountRef} />
    </div>
  );
}