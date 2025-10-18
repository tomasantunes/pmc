import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);
import SimpleToDoTable from './SimpleToDoTable';
import {toLocaleISOString} from '../libs/utils';

export default function DailyToDos() {
  const [tasks, setTasks] = useState([]);
  const [defaultDate, setDefaultDate] = useState(toLocaleISOString(new Date()).slice(0, 10));
  const [selectedDate, setSelectedDate] = useState(toLocaleISOString(new Date()).slice(0, 10));

  function handleDateChange() {
    loadTasks(selectedDate);
  }

  function loadTasks(dt) {
    axios.get(config.BASE_URL + "/get-daily-todo", {dt})
    .then(function(response) {
      if (response.data.status == "OK") {
        setTasks(response.data.data);
      }
      else {
        MySwal.fire("Error: " + response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire("Connection Error");
    })
  }

  useEffect(() => {
    loadTasks(selectedDate);
  }, []);
  return (
    <>
      <div className="container">
        <h1>Daily To-Dos</h1>
        <DateTimePicker value={selectedDate} defaultValue={defaultDate} onChange={handleDateChange} />
        <SimpleToDoTable title={selectedDate} tasks={tasks} setTasks={setTasks} />
      </div>
      
    </>
  )
}
