import React, {useEffect, useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
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
  const [editEventId, setEditEventId] = useState(null);
  const [editEventTitle, setEditEventTitle] = useState("");
  const [selectedNewStartTime, setSelectedNewStartTime] = useState(null);
  const [selectedNewEndTime, setSelectedNewEndTime] = useState(null);
  const [selectedEditStartTime, setSelectedEditStartTime] = useState(null);
  const [selectedEditEndTime, setSelectedEditEndTime] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();


  const handleSelect = (info) => {
    setNewEventTitle("");
    setSelectedNewStartTime(moment(info.start).format("YYYY-MM-DD HH:mm"));
    setSelectedNewEndTime(moment(info.end).format("YYYY-MM-DD HH:mm"));
    openAddEvent();
  };

  const handleEventClick = (info) => {
    console.log(info.event);
    setEditEventId(info.event.id);
    setEditEventTitle(info.event.title);
    setSelectedEditStartTime(moment(info.event.start).format("YYYY-MM-DD HH:mm"));
    setSelectedEditEndTime(moment(info.event.end).format("YYYY-MM-DD HH:mm"));
    openEditEvent();
  };

  const handleDateClick = (info) => {
    setNewEventTitle("");
    setSelectedNewStartTime(moment(info.date).format("YYYY-MM-DD HH:mm"));
    setSelectedNewEndTime(moment(info.date).add(1, "hour").format("YYYY-MM-DD HH:mm"));
    openAddEvent();
  };

  function newEvent() {
    setNewEventTitle("");
    const now = moment();
    setSelectedNewStartTime(now.format("YYYY-MM-DD HH:mm"));
    setSelectedNewEndTime(now.add(1, "hour").format("YYYY-MM-DD HH:mm"));
    openAddEvent();
  }

  const handleChangeView = (viewName) => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(viewName);
  };

  function openAddEvent() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addEventModal'))
    modal.show();
  }

  function openEditEvent() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editEventModal'))
    modal.show();
  }

  function closeAddEvent() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addEventModal'))
    modal.hide();
    setNewEventTitle("");
    setSelectedNewStartTime(null);
    setSelectedNewEndTime(null);
  }

  function closeEditEvent() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editEventModal'))
    modal.hide();
    setEditEventTitle("");
    setSelectedEditStartTime(null);
    setSelectedEditEndTime(null);
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

  function submitEditEvent(e) {
    e.preventDefault();
    const calendarApi = calendarRef.current.getApi();

    // find the event to edit
    var event = calendarApi.getEvents().find(ev => ev.id === editEventId);
    if (event) {
      event.setProp('title', editEventTitle);
      event.setStart(moment(selectedEditStartTime, "YYYY-MM-DD HH:mm").toDate());
      event.setEnd(moment(selectedEditEndTime, "YYYY-MM-DD HH:mm").toDate());
    }

    var db_event = events.find(ev => ev.id === event.id);
    if (!db_event) {
      alert("Error: Event not found.");
      return;
    }
    axios.post(config.BASE_URL + "/api/edit-event", {
      id: db_event.id,
      start: selectedEditStartTime,
      end: selectedEditEndTime,
      title: editEventTitle
    })
    .then((response) => {
      if (response.data.status == "OK") {
        closeEditEvent();
      }
      else {
        alert("Error: " + response.data.error);
      }
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
  }

  function handleChangeNewStartTime(value) {
    setSelectedNewStartTime(value);
    // set time to an hour later and set it as end time
    var new_end_time = moment(value).add(60, 'minutes').format('YYYY-MM-DD HH:mm');
    setSelectedNewEndTime(new_end_time);
  }

  function handleChangeNewEndTime(value) {
    setSelectedNewEndTime(value);
    // set time to an hour later and set it as end time
    var edit_end_time = moment(value).add(60, 'minutes').format('YYYY-MM-DD HH:mm');
    setSelectedEditEndTime(edit_end_time);
  }

  function handleChangeEditStartTime(value) {
    setSelectedEditStartTime(value);
  }

  function handleChangeEditEndTime(value) {
    setSelectedEditEndTime(value);
  }

  function deleteEvent(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/delete-event", {
      id: editEventId
    })
    .then((response) => {
      if (response.data.status == "OK") {
        closeEditEvent();
        loadEvents();
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
          id: String(e.id),
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

  function checkLogin() {
    axios.post(config.BASE_URL + "/check-login")
    .then(response => {
      if (response.data.status === "OK") {
        setIsLoggedIn(true);
      }
      else {
        navigate('/login');
      }
    })
    .catch(error => {
      navigate('/login');
    });
  }

  useEffect(() => {
    checkLogin();
    loadEvents();
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <h2>Calendar</h2>
          <div className="row mb-2">
            <div className="col-md-6">
              <button className="btn btn-primary me-2" onClick={() => handleChangeView("timeGridWeek")}>Week View</button>
              <button className="btn btn-primary" onClick={() => handleChangeView("listWeek")}>List View</button>
            </div>
            <div className="col-md-6 text-end">
              <button className="btn btn-primary" onClick={newEvent}>New Event</button>
            </div>
          </div>
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable={true}
            select={handleSelect}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
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
                      <DateTimePicker value={selectedNewStartTime} defaultValue={selectedNewStartTime} onChange={handleChangeNewStartTime} />
                    </div>
                  </div>
                  <div className="form-group py-2">
                    <label className="control-label">End</label>
                    <div>
                      <DateTimePicker value={selectedNewEndTime} defaultValue={selectedNewEndTime} onChange={handleChangeNewEndTime} />
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
        <div class="modal editEventModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Event</h5>
                <button type="button" class="btn-close" onClick={closeEditEvent} aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form onSubmit={submitEditEvent}>
                  <div className="form-group py-2">
                    <label className="control-label">Title</label>
                    <div>
                        <input type="text" className="form-control input-lg" name="description" value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)}/>
                    </div>
                  </div>
                  <div className="form-group py-2">
                    <label className="control-label">Start</label>
                    <div>
                      <DateTimePicker value={selectedEditStartTime} defaultValue={selectedEditStartTime} onChange={handleChangeEditStartTime} />
                    </div>
                  </div>
                  <div className="form-group py-2">
                    <label className="control-label">End</label>
                    <div>
                      <DateTimePicker value={selectedEditEndTime} defaultValue={selectedEditEndTime} onChange={handleChangeEditEndTime} />
                    </div>
                  </div>
                  <div className="form-group">
                      <div style={{textAlign: "right"}}>
                        <button className="btn btn-danger me-2" onClick={deleteEvent}>Delete</button>
                        <button type="submit" className="btn btn-primary">Edit</button>
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
  else {
    return (<></>);
  }
}
