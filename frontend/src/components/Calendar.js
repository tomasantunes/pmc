import React, {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import $ from 'jquery';
import axios from 'axios';
import config from '../config.json';
import moment from 'moment';
import WeekCalendar from 'react-week-calendar';
import CustomEvent from './CustomEvent';
import 'react-week-calendar/dist/style.css';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Home() {
  const [lastUid, setLastUid] = useState(4);
  const [selectedIntervals, setSelectedIntervals] = useState([]);
  const [firstDay, setFirstDay] = useState(moment().day(1));
  const [selectedWeek, setSelectedWeek] = useState(moment());

  async function addEvent(interval) {
    const newEvent = {
      uid: lastUid + 1,
      start: interval.start.toISOString().slice(0, 19).replace('T', ' '),
      end: interval.end.toISOString().slice(0, 19).replace('T', ' '),
      value: interval.value
    }

    var response = await axios.post(config.BASE_URL + '/api/add-event', newEvent)
    if (response.data.status == "OK") {
      return response.data.data.id;
    }
    else {
      alert(response.data.error);
    }
  }

  const handleEventRemove = (event) => {
    const index = selectedIntervals.findIndex((interval) => interval.uid === event.uid);
    if (index > -1) {
      setSelectedIntervals((prev) => selectedIntervals.splice(index, 1));
    }

  }

  const handleEventUpdate = (event) => {
    const index = selectedIntervals.findIndex((interval) => interval.uid === event.uid);
    if (index > -1) {
      selectedIntervals[index] = event;
      setSelectedIntervals((prev) => selectedIntervals[index] = event);
    }
  }

  const handleSelect = (newIntervals) => {
    const intervals = newIntervals.map( async (interval, index) => {
      var id = await addEvent(interval);
      return {
        ...interval,
        uid: lastUid + index,
        id: id
      }
    });

    console.log(intervals);

    Promise.all(intervals)
    .then(results => {
      setSelectedIntervals((prev) => selectedIntervals.concat(results));
      setLastUid((prev) => lastUid + newIntervals.length);
    })
    .catch(err => {
      console.log(err);
    });
  }

  function previousWeek() {
    setSelectedWeek(moment(selectedWeek).add('-1', 'week'));
  }

  function nextWeek() {
    setSelectedWeek(moment(selectedWeek).add('1', 'week'));
  }

  function loadEvents() {
    axios.get(config.BASE_URL + '/api/get-events')
    .then((response) => {
      if (response.data.status == "OK") {
        var events_arr = response.data.data;
        for (var i in events_arr) {
          events_arr[i].uid = Number(i) + 1;
          console.log(events_arr[i].start);
          events_arr[i].start = moment(events_arr[i].start);
          events_arr[i].end = moment(events_arr[i].end);
        }
        console.log(events_arr);
        setSelectedIntervals(events_arr);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch((error) => {
      alert(error);
    })
  }

  useEffect(() => {
    console.log(selectedWeek);
    console.log(moment(selectedWeek).day(1));
    setFirstDay(moment(selectedWeek).day(1));
  }, [selectedWeek])

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="page">
        <button className="btn btn-primary m-2" onClick={previousWeek}>Previous</button>
        <button className="btn btn-primary m-2" onClick={nextWeek}>Next</button>
        <WeekCalendar
          startTime = {moment({h: 7, m: 0})}
          endTime = {moment({h: 23, m: 59})}
          numberOfDays= {7}
          scaleUnit={30}
          cellHeight={50}
          firstDay={firstDay}
          selectedIntervals = {selectedIntervals}
          onIntervalSelect = {handleSelect}
          onIntervalUpdate = {handleEventUpdate}
          onIntervalRemove = {handleEventRemove}
          eventComponent = {CustomEvent}
        />
      </div>
    </>
  )
}
