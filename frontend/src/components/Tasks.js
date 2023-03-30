import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
var bootprompt = require('bootprompt');

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

  function updateTaskDone(e, task_id) {
    axios.post(config.BASE_URL + "/api/update-task-done", {task_id: task_id, is_done: e.target.checked})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
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

  function submitAddTask(description) {
    axios.post(config.BASE_URL + "/api/add-task", {folder_id: folder_id, description: description})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
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

  function openAddTask() {
    bootprompt.prompt("Add Task", (result) => {
      if (result == null) {
        return;
      }
      submitAddTask(result);
    });
  }

  useEffect(() => {
    loadTasks();
  }, []);
  return (
    <>
      <div className="my-3" style={{textAlign: "right", width: "500px", margin: "0 auto"}}>
        <button className="btn btn-success" onClick={openAddTask}>Add Task</button>
      </div>
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
                    <td><input type="checkbox" checked={task.is_done} onChange={(e) => { updateTaskDone(e, task.id); }} /></td>
                    <td>{task.description}</td>
                    <td></td>
                </tr>
              )
            })}
          </tbody>
      </table>
    </>
  )
}
