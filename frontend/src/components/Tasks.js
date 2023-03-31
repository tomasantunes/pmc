import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
var bootprompt = require('bootprompt');

function TRow(props) {
  return (
    <tr {...props}>
      <td><input type="checkbox" checked={props.is_done} onChange={(e) => { props.updateTaskDone(e, props.task_id); }} /></td>
      <td className={props.is_done ? "strikethrough" : ""}>{props.description}</td>
      <td></td>
    </tr>
  )
}

const SortableTRow = SortableElement(TRow);

function TBody(props) {
  return (
    <tbody {...props} className="table-group-divider">
      {props.data.map((task) => {
        return (
          <SortableTRow key={task.id} index={task.sort_index} task_id={task.id} description={task.description} is_done={task.is_done} updateTaskDone={props.updateTaskDone} />
        )
      })}
    </tbody>
  )
}

const SortableTBody = SortableContainer(TBody);

export default function Tasks({folder_id}) {
  const [tasks, setTasks] = useState([]);

  const handleSort = ({ oldIndex, newIndex }) => {
    setTasks(prevState => {
      var new_arr = arrayMove(prevState, oldIndex, newIndex);
      updateSortIndex(new_arr);
      return new_arr;
    });
  };

  function updateSortIndex(new_arr) {
    for (var i in new_arr) {
      var task = new_arr[i];
      axios.post(config.BASE_URL + "/api/handle-sort", {task_id: task.id, sort_index: i})
      .then(function(response) {
        if (response.data.status == "OK") {
          console.log("Sort index has been updated.");
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
  }

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
    axios.post(config.BASE_URL + "/api/add-task", {folder_id: folder_id, description: description, sort_index: tasks.length})
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
          <SortableTBody data={tasks} onSortEnd={handleSort} updateTaskDone={updateTaskDone} />
      </table>
    </>
  )
}
