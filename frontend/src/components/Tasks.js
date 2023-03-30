import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Tasks({folder_id}) {
  const [tasks, setTasks] = useState([]);

  function loadTasks() {
    setTasks([]);
    axios.get(config.BASE_URL + "/api/get-tasks-from-folder", {params: {folder_id: folder_id}})
    .then(function(response) {
      if (response.data.status == "OK") {
        setTasks(response.data.data);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
      alert(err.message);
    });
  }

  useEffect(() => {
    loadTasks();
  }, []);
  return (
    <table className="table table-striped table-bordered align-middle tasks">
        <thead class="table-dark">
            <tr>
                <th style={{width: "10%"}}>Done</th>
                <th style={{width: "70%"}}>Task</th>
                <th style={{width: "20%"}}>Actions</th>
            </tr>
        </thead>
        <tbody className="table-group-divider">
          {tasks.map((task) => {
            return (
              <tr>
                  <td><input type="checkbox" /></td>
                  <td>{task.description}</td>
                  <td></td>
              </tr>
            )
          })}
        </tbody>
    </table>
  )
}
