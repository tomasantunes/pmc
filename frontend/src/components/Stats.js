import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config';

export default function Stats() {
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [recurrentTasksTotal, setRecurrentTasksTotal] = useState(0);
  const [recurrentTasksDone, setRecurrentTasksDone] = useState(0);

  function loadStats() {
    axios.get(config.BASE_URL + "/api/get-stats")
    .then(function(response) {
      if (response.data.status == "OK") {
        setTasksDone(response.data.data.total_tasks_done);
        setTasksTotal(response.data.data.total_tasks);
        setRecurrentTasksDone(response.data.data.recurrent_tasks_done);
        setRecurrentTasksTotal(response.data.data.recurrent_tasks);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  useEffect(() => {
    loadStats();
  }, []);
  return (
    <>
      <h2>Stats</h2>
      <table className="table table-sm table-bordered small-table">
        <tbody>
          <tr>
            <th className="table-dark bg-blue">Tasks Today</th>
            <td className="text-center">{tasksTotal}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Tasks Done Today</th>
            <td className="text-center">{tasksDone}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Recurrent Tasks Today</th>
            <td className="text-center">{recurrentTasksTotal}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Recurrent Tasks Done Today</th>
            <td className="text-center">{recurrentTasksDone}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
