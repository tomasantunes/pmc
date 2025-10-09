import React, {useEffect, useState, useRef} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import axios from 'axios';
import config from '../config.json';
import moment from 'moment';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Home() {
  const calendarRef = useRef(null);


  const handleSelect = (info) => {
    const calendarApi = calendarRef.current.getApi();

    const title = prompt('New event title:');
    if (title) {
      calendarApi.addEvent({
        title,
        start: info.start,
        end: info.end,
      });
    }
  };

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
    </>
  )
}
