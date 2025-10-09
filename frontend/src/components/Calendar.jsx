import React, {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import axios from 'axios';
import config from '../config.json';
import moment from 'moment';
import FullCalendar from '@fullcalendar/react';
import timeGridWeek from '@fullcalendar/timegrid'

export default function Home() {
  return (
    <>
      <Sidebar />
      <div className="page">
        <FullCalendar
          plugins={[ timeGridWeek ]}
          initialView="timeGridWeek"
        />
      </div>
    </>
  )
}
