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
      <td>
      <div class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
          Actions
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
          <li><a class="dropdown-item" href="#" onClick={() => { props.openEditTask(props.task_id) }}>Edit</a></li>
          <li><a class="dropdown-item" href="#" onClick={() => { props.deleteTask(props.task_id) }}>Delete</a></li>
        </ul>
      </div>
      </td>
    </tr>
  )
}

const SortableTRow = SortableElement(TRow);

function TBody(props) {
  return (
    <tbody {...props} className="table-group-divider">
      {props.data.map((task, i) => {
        return (
          <SortableTRow key={task.id} index={i} task_id={task.id} description={task.description} is_done={task.is_done} updateTaskDone={props.updateTaskDone} openEditTask={props.openEditTask} deleteTask={props.deleteTask} />
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

  function cancelSort(e) {
    if (e.target.className == "dropdown-item" || e.target.className == "dropdown-menu" || e.target.tagName == "INPUT" || e.target.tagName == "A" || e.target.tagName == "BUTTON") {
      return true;
    }
    return false;
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

  function openEditTask(task_id) {
    axios.get(config.BASE_URL + "/api/get-task", {params: {task_id: task_id}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var task = response.data.data;
        bootprompt.prompt({
          title: "Edit Task",
          value: task.description
        }, (result) => {
          if (result == null) {
            return;
          }
          submitEditTask(task_id, result);
        });
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

  function submitEditTask(task_id, description) {
    axios.post(config.BASE_URL + "/api/edit-task", {task_id: task_id, description: description})
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

  function deleteTask(task_id) {
    bootprompt.confirm({
      title: "Are you sure?",
      message: "Are you sure you want to delete this task?"
    }, (result) => {
      if (result) {
        axios.post(config.BASE_URL + "/api/delete-task", {task_id: task_id})
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
          <SortableTBody data={tasks} onSortEnd={handleSort} updateTaskDone={updateTaskDone} openEditTask={openEditTask} deleteTask={deleteTask} shouldCancelStart={cancelSort} />
      </table>
    </>
  )
}
