import React, {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import $ from 'jquery';
import axios from 'axios';
import config from '../config.json';
import moment from 'moment';
import WeekCalendar from 'react-week-calendar';
import 'react-week-calendar/dist/style.css';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Home() {
  const [lastUid, setLastUid] = useState(4);
  const [selectedIntervals, setSelectedIntervals] = useState([
    {
      uid: 1,
      start: moment({h: 10, m: 5}),
      end: moment({h: 12, m: 5}),
      value: "Booked by Smith"
    },
    {
      uid: 2,
      start: moment({h: 13, m: 0}).add(2,'d'),
      end: moment({h: 13, m: 45}).add(2,'d'),
      value: "Closed"
    },
    {
      uid: 3,
      start: moment({h: 11, m: 0}),
      end: moment({h: 14, m: 0}),
      value: "Reserved by White"
    },
  ]);

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
    const intervals = newIntervals.map( (interval, index) => {
      return {
        ...interval,
        uid: lastUid + index
      }
    });

    setSelectedIntervals((prev) => selectedIntervals.concat(intervals));
    setLastUid((prev) => lastUid + newIntervals.length);
  }

  return (
    <>
      <Sidebar />
      <div className="page">
        <WeekCalendar
          startTime = {moment({h: 9, m: 0})}
          endTime = {moment({h: 15, m: 30})}
          numberOfDays= {14}
          selectedIntervals = {selectedIntervals}
          onIntervalSelect = {handleSelect}
          onIntervalUpdate = {handleEventUpdate}
          onIntervalRemove = {handleEventRemove}
        />
      </div>
    </>
  )
}
