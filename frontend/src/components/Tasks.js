import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';
import {useNavigate} from 'react-router-dom';
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";
import DateTimePicker from 'react-datetime-picker'
import moment from 'moment';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

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
      <td>{props.time}</td>
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
          <SortableTRow key={task.id} index={i} task_id={task.id} description={task.description} time={task.time} is_done={task.is_done} updateTaskDone={props.updateTaskDone} openEditTask={props.openEditTask} deleteTask={props.deleteTask} />
        )
      })}
    </tbody>
  )
}

function TBodyPlain(props) {
  return (
    <tbody {...props} className="table-group-divider">
      {props.data.map((task, i) => {
        return (
          <TRow key={task.id} index={i} task_id={task.id} description={task.description} time={task.time} is_done={task.is_done} updateTaskDone={props.updateTaskDone} openEditTask={props.openEditTask} deleteTask={props.deleteTask} />
        )
      })}
    </tbody>
  )
}

const SortableTBody = SortableContainer(TBody);

export default function Tasks({folder_id, folder}) {
  var dt = new Date();
  const [tasks, setTasks] = useState([]);
  const [selectedStartTime, setSelectedStartTime] = useState(dt);
  const [selectedEndTime, setSelectedEndTime] = useState(dt);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [newTask, setNewTask] = useState({
    description: "",
    start_time: dt,
    end_time: dt
  });
  const [editTask, setEditTask] = useState({
    task_id: 0,
    description: "",
    start_time: null,
    end_time: null
  });
  const [hideDone, setHideDone] = useState(folder.hide_done == 1 ? true : false);
  

  var navigate = useNavigate();

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
        var tasks_arr = response.data.data;
        if (folder.hide_done == 1) {
          tasks_arr = tasks_arr.filter(task => task.is_done == false);
        }
        setTasks(tasks_arr);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function updateTaskDone(e, task_id) {
    axios.post(config.BASE_URL + "/api/update-task-done", {task_id: task_id, is_done: e.target.checked, date_done: new Date().toISOString().slice(0, 19).replace('T', ' ')})
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
    });
  }

  function setAllTasksDone() {
    axios.post(config.BASE_URL + "/api/update-all-tasks-done", {folder_id: folder_id, is_done: 1})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
      }
      else {
        console.log(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function setAllTasksNotDone() {
    axios.post(config.BASE_URL + "/api/update-all-tasks-done", {folder_id: folder_id, is_done: 0})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
      }
      else {
        console.log(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function submitAddTask(e) {
    e.preventDefault();
    var st = newTask.start_time;
    var et = newTask.end_time;
    if (newTask.start_time == null || newTask.end_time == null) {
      st = "";
      et = "";
    }
    else {
      st = st.toISOString().slice(0, 19).replace('T', ' ');
      et = et.toISOString().slice(0, 19).replace('T', ' ');
    }
    axios.post(config.BASE_URL + "/api/add-task", {folder_id: folder_id, description: newTask.description, start_time: st, end_time: et, sort_index: tasks.length})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
        dt = new Date();
        setNewTask({
          description: "",
          start_time: dt,
          end_time: dt
        });
        setSelectedStartTime(dt);
        setSelectedEndTime(dt);
        closeAddTask();
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function submitEditTask(e) {
    e.preventDefault();
    var st = editTask.start_time;
    var et = editTask.end_time;
    if (editTask.start_time == null || editTask.end_time == null) {
      st = "";
      et = "";
    }
    else {
      st = st.toISOString().slice(0, 19).replace('T', ' ');
      et = et.toISOString().slice(0, 19).replace('T', ' ');
    }
    axios.post(config.BASE_URL + "/api/edit-task", {...editTask, start_time: st, end_time: et})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
        setEditTask({
          task_id: 0,
          description: "",
          time: ""
        });
        closeEditTask();
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function openAddTask() {
    $(".addTaskModal").modal("show");
  }

  function closeAddTask() {
    $(".addTaskModal").modal("hide");
  }

  function openEditTask(task_id) {
    axios.get(config.BASE_URL + "/api/get-task", {params: {task_id: task_id}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var task = response.data.data;
        setEditTask({
          task_id: task_id,
          description: task.description,
          time: task.time,
          start_time: moment(task.start_time).toDate(),
          end_time: moment(task.end_time).toDate()
        });
        setSelectedStartTime(moment(task.start_time).toDate());
        setSelectedEndTime(moment(task.end_time).toDate());
        $(".editTaskModal").modal("show");
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function closeEditTask() {
    $(".editTaskModal").modal("hide");
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
        });
      }
    });
  }

  function deleteFolder() {
    bootprompt.confirm({
      title: "Are you sure?",
      message: "Are you sure you want to delete this folder?"
    }, (result) => {
      if (result) {
        axios.post(config.BASE_URL + "/api/delete-folder", {folder_id: folder_id})
        .then(function(response) {
          if (response.data.status == "OK") {
            navigate("/home");
          }
          else {
            alert(response.data.error);
          }
        })
        .catch(function(err) {
          console.log(err);
        });
      }
    });
  }

  function changeNewTaskDescription(e) {
    setNewTask({
      ...newTask,
      description: e.target.value
    });
  }

  function changeEditTaskDescription(e) {
    setEditTask({
      ...editTask,
      description: e.target.value
    });
  }

  function changeEditTaskStartTime(time) {
    setSelectedStartTime(time);
    setEditTask({
      ...editTask,
      start_time: time
    });
  }

  function changeEditTaskEndTime(time) {
    setSelectedEndTime(time);
    setEditTask({
      ...editTask,
      end_time: time
    });
  }

  function changeNewTaskStartTime(time) {
    console.log(time);
    setSelectedStartTime(time);
    setNewTask({
      ...newTask,
      start_time: time
    });
  }

  function changeNewTaskEndTime(time) {
    setSelectedEndTime(time);
    setNewTask({
      ...newTask,
      end_time: time
    });
  }

  function toggleHideDone() {
    axios.post("/api/set-hide-done", {folder_id: folder_id, hide_done: !hideDone})
    .then(function(response) {
      if (response.data.status == "OK") {
        setHideDone(!hideDone);
        window.location.reload();
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
    loadTasks();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <>
      <div className="buttons-menu my-3">
        <button className="btn btn-success" onClick={openAddTask}>Add Task</button>
        <div class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
            Options
          </button>
          <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            <li><a class="dropdown-item" href="#" onClick={deleteFolder}>Delete folder</a></li>
            <li><a class="dropdown-item" href="#" onClick={toggleHideDone}>{hideDone ? "Show Done" : "Hide Done"}</a></li>
          </ul>
        </div>
      </div>
      <table className="table table-striped table-bordered align-middle tasks">
          <thead class="table-dark">
              <tr>
                  <th style={{width: "10%"}}>
                    <input type="checkbox" checked={tasks.filter(task => task.is_done == true).length > 0 && tasks.length > 0} onChange={(e) => { e.target.checked ? setAllTasksDone() : setAllTasksNotDone() }} />
                  </th>
                  <th style={{width: "50%"}}>Task</th>
                  <th style={{width: "20%"}}>Time</th>
                  <th style={{width: "20%"}}>Actions</th>
              </tr>
          </thead>
          {!isMobile ?
            <SortableTBody data={tasks} onSortEnd={handleSort} updateTaskDone={updateTaskDone} openEditTask={openEditTask} deleteTask={deleteTask} shouldCancelStart={cancelSort} />
          :
            <TBodyPlain data={tasks} onSortEnd={handleSort} updateTaskDone={updateTaskDone} openEditTask={openEditTask} deleteTask={deleteTask} shouldCancelStart={cancelSort} />
          }
      </table>
      <div class="modal addTaskModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Task</h5>
              <button type="button" class="btn-close" onClick={closeAddTask} aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitAddTask}>
                <div className="form-group py-2">
                  <label className="control-label">Description</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="description" value={newTask.description} onChange={changeNewTaskDescription}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start</label>
                  <div>
                    <DateTimePicker
                      onChange={changeNewTaskStartTime}
                      value={selectedStartTime}
                    />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End</label>
                  <div>
                    <DateTimePicker
                      onChange={changeNewTaskEndTime}
                      value={selectedEndTime}
                    />
                  </div>
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                      <button type="submit" className="btn btn-primary">Add</button>
                    </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="modal editTaskModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Task</h5>
              <button type="button" class="btn-close" onClick={closeEditTask} aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitEditTask}>
                <div className="form-group py-2">
                  <label className="control-label">Description</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="description" value={editTask.description} onChange={changeEditTaskDescription}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start</label>
                  <div>
                    <DateTimePicker
                      onChange={changeEditTaskStartTime}
                      value={selectedStartTime}
                    />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End</label>
                  <div>
                    <DateTimePicker
                      onChange={changeEditTaskEndTime}
                      value={selectedEndTime}
                    />
                  </div>
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                        <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
