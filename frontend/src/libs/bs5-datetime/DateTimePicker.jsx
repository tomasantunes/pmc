import { useEffect, useRef } from "react";
import "./bs5-datetime.min.css";

export default function DateTimePicker({ value, onChange, defaultValue, locale, options }) {
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    (async () => {
      await import("./bs5-datetime.min.js");

      if (window.setDatetimeLocale) window.setDatetimeLocale(locale || 'en-us');

      // create template once
      if (window.createDatetimeTemplate) window.createDatetimeTemplate();
      // initialize picker
      if (window.createDatetimePicker && inputRef.current && toggleRef.current) {
        
        pickerRef.current = window.createDatetimePicker(
          inputRef.current,
          toggleRef.current,
          (newValue) => {
            onChange && onChange(newValue);
          },
          options || {}
        );

        // set initial value
        if (value || defaultValue) {
          pickerRef.current.setDate(value || defaultValue);
        }
      }
    })();
  }, []);

  // update picker if value changes externally
  useEffect(() => {
    if (pickerRef.current && value != null) {
      pickerRef.current.setDate(value);
    }
  }, [value]);

  return (
    <div className="input-group">
      <input
        ref={inputRef}
        type="text"
        className="form-control"
        placeholder="Select date and time"
        defaultValue={defaultValue || ""}
        onChange={(e) => {
          onChange && onChange(e.target.value);
        }}
      />
      <button
        ref={toggleRef}
        className="btn btn-outline-secondary"
        type="button"
      >
        <i className="fa-solid fa-calendar-days"></i>
      </button>
    </div>
  );
}
