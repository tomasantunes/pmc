import React, {useEffect, useState, useRef} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import axios from 'axios';
import config from '../config.json';
import moment from 'moment';
import DateTimePicker from '../libs/bs5-datetime/DateTimePicker';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import {toLocaleISOString} from '../libs/utils';

export default function Home() {
  const calendarRef = useRef(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedNewStartTime, setSelectedNewStartTime] = useState(null);
  const [selectedNewEndTime, setSelectedNewEndTime] = useState(null);
  const [events, setEvents] = useState([]);


  const handleSelect = (info) => {
    setNewEventTitle("");
    setSelectedNewStartTime(moment(info.start).format("YYYY-MM-DD HH:mm"));
    setSelectedNewEndTime(moment(info.end).format("YYYY-MM-DD HH:mm"));
    openAddEvent();
  };

  const handleDateClick = (info) => {
    setNewEventTitle("");
    setSelectedNewStartTime(moment(info.date).format("YYYY-MM-DD HH:mm"));
    setSelectedNewEndTime(moment(info.date).add(1, "hour").format("YYYY-MM-DD HH:mm"));
    openAddEvent();
  };

  const handleChangeView = (viewName) => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(viewName);
  };

  function openAddEvent() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addEventModal'))
    modal.show();
  }

  function closeAddEvent() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addEventModal'))
    modal.hide();
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
  }

  function loadEvents() {
    axios.get(config.BASE_URL + "/api/get-events")
    .then((response) => {
      if (response.data.status == "OK") {
        const formattedEvents = response.data.data.map((e) => ({
          title: e.value,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(formattedEvents);
      }
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="page">
        <h2>Calendar</h2>
        <div className="mb-2">
          <button className="btn btn-primary me-2" onClick={() => handleChangeView("timeGridWeek")}>Week View</button>
          <button className="btn btn-primary" onClick={() => handleChangeView("listWeek")}>List View</button>
        </div>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          selectable={true}
          select={handleSelect}
          events={events}
          dateClick={handleDateClick}
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
