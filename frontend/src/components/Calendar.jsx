import React, {useEffect, useState, useRef} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import axios from 'axios';
import config from '../config.json';
import moment from 'moment';
import DateTimePicker from '../libs/bs5-datetime/DateTimePicker';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {toLocaleISOString} from '../libs/utils';

export default function Home() {
  const calendarRef = useRef(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedNewStartTime, setSelectedNewStartTime] = useState(null);
  const [selectedNewEndTime, setSelectedNewEndTime] = useState(null);


  const handleSelect = (info) => {
    setNewEventTitle("");
    setSelectedNewStartTime(moment(info.start).format("YYYY-MM-DD HH:mm"));
    setSelectedNewEndTime(moment(info.end).format("YYYY-MM-DD HH:mm"));
    openAddEvent();
  };

  function openAddEvent() {
    var myModal = new bootstrap.Modal(document.querySelector('.addEventModal'));
    myModal.show();
  }

  function closeAddEvent() {
    var myModal = bootstrap.Modal.getInstance(document.querySelector('.addEventModal'));
    myModal.hide();
    setNewEventTitle("");
    setSelectedNewStartTime(null);
    setSelectedNewEndTime(null);
  }

  function submitAddEvent(e) {
    e.preventDefault();
    const calendarApi = calendarRef.current.getApi();

    calendarApi.addEvent({
      title: newEventTitle,
      start: moment(selectedNewStartTime, "YYYY-MM-DD HH:mm").toDate(),
      end: moment(selectedNewEndTime, "YYYY-MM-DD HH:mm").toDate(),
    });

    /*
    axios.post(config.BASE_URL + "/api/add-event", {
      start: selectedNewStartTime,
      end: selectedNewEndTime,
      value: newEventTitle
    })
    .then((response) => {
      if (response.data.status == "OK") {
        closeAddEvent();
      }
      else {
        alert("Error: " + response.data.error);
      }
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
    */

    closeAddEvent();
  }

  return (
    <>
      <Sidebar />
      <div className="page">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          selectable={true}
          select={handleSelect}
        />
      </div>
      <div class="modal addEventModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Event</h5>
              <button type="button" class="btn-close" onClick={closeAddEvent} aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitAddEvent}>
                <div className="form-group py-2">
                  <label className="control-label">Title</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="description" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start</label>
                  <div>
                    <DateTimePicker value={selectedNewStartTime} defaultValue={selectedNewStartTime} onChange={setSelectedNewStartTime} />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End</label>
                  <div>
                    <DateTimePicker value={selectedNewEndTime} defaultValue={selectedNewEndTime} onChange={setSelectedNewEndTime} />
                  </div>
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                      <button type="submit" className="btn btn-primary">Add</button>
                    </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
