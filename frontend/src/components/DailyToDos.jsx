import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);
import SimpleToDoTable from './SimpleToDoTable';
import {toLocaleISOString} from '../libs/utils';
import DateTimePicker from '../libs/bs5-datetime/DateTimePicker';

export default function DailyToDos({folder_id, folder}) {
  const [tasks, setTasks] = useState([]);
  const [defaultDate, setDefaultDate] = useState(toLocaleISOString(new Date()).slice(0, 10));
  const [selectedDate, setSelectedDate] = useState(toLocaleISOString(new Date()).slice(0, 10));
  const [datePickerOptions, setDatePickerOptions] = useState({
    format: 'YYYY-MM-DD',
    showTime: false,
  });

  function handleDateChange() {
    loadTasks(selectedDate);
  }

  function loadTasks(dt) {
    axios.get(config.BASE_URL + "/api/get-daily-todo", {
      params: { dt, folder_id }
    })
    .then(function(response) {
      console.log(response);
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
        <div className="row">
          <div className="col-md-4"></div>
          <div className="col-md-4">
            <DateTimePicker value={selectedDate} defaultValue={defaultDate} onChange={handleDateChange} options={datePickerOptions} />
            <SimpleToDoTable title={selectedDate} tasks={tasks} setTasks={setTasks} folder_id={folder_id} selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </>
  )
}
