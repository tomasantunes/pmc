import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import {useNavigate} from 'react-router-dom';
import moment from 'moment';
import {toLocaleISOString} from '../libs/utils';
import DateTimePicker from '../libs/bs5-datetime/DateTimePicker';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

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

export default function Tasks({folder_id, folder}) {
  var dt = new Date();
  const [tasks, setTasks] = useState([]);
  const [selectedNewStartTime, setSelectedNewStartTime] = useState(null);
  const [selectedNewEndTime, setSelectedNewEndTime] = useState(null);
  const [selectedEditStartTime, setSelectedEditStartTime] = useState(null);
  const [selectedEditEndTime, setSelectedEditEndTime] = useState(null);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskId, setEditTaskId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [hideDone, setHideDone] = useState(folder.hide_done == 1 ? true : false);
  const [totalTasks, setTotalTasks] = useState(0);
  

  var navigate = useNavigate();

  /*
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
  */

  function loadTasks() {
    axios.get(config.BASE_URL + "/api/get-tasks-from-folder", {params: {folder_id: folder_id}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var tasks_arr = response.data.data;
        setTotalTasks(tasks_arr.length);
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
    axios.post(config.BASE_URL + "/api/update-task-done", {task_id: task_id, is_done: e.target.checked, date_done: toLocaleISOString(new Date()).slice(0, 19).replace('T', ' ')})
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
    var st = selectedNewStartTime;
    var et = selectedNewEndTime;
    console.log(st);
    console.log(et);
    if (st == null || et == null) {
      st = "";
      et = "";
    }
    axios.post(config.BASE_URL + "/api/add-task", {folder_id: folder_id, description: newTaskDescription, start_time: st, end_time: et, sort_index: totalTasks})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
        dt = new Date();
        setNewTaskDescription("");
        setSelectedNewStartTime(null);
        setSelectedNewEndTime(null);
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
    var st = selectedEditStartTime;
    var et = selectedEditEndTime;
    if (st == null || et == null) {
      st = "";
      et = "";
    }
    axios.post(config.BASE_URL + "/api/edit-task", {id: editTaskId, start_time: st, end_time: et})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
        setEditTaskId(null);
        setEditTaskDescription("");
        setSelectedEditStartTime(null);
        setSelectedEditEndTime(null);
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
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addTaskModal'))
    modal.show();
    setShowNew(true);
  }

  function closeAddTask() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addTaskModal'))
    modal.hide();
    setShowNew(false);
  }

  function openEditTask(task_id) {
    axios.get(config.BASE_URL + "/api/get-task", {params: {task_id: task_id}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var task = response.data.data;
        setEditTaskId(task.task_id);
        setEditTaskDescription(task.description);
        setSelectedEditStartTime(moment(task.start_time).format('YYYY-MM-DD HH:mm'));
        setSelectedEditEndTime(moment(task.end_time).format('YYYY-MM-DD HH:mm'));
        var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editTaskModal'))
        modal.show();
        setShowEdit(true);
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
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.editTaskModal'))
    modal.hide();
    setShowEdit(false);
  }

  function deleteTask(task_id) {
    MySwal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this task?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes"
    }).then((result) => {
      if (result.isConfirmed) {
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
    MySwal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this folder?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes"
    }).then((result) => {
      if (result.isConfirmed) {
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
    setNewTaskDescription(e.target.value);
  }

  function changeEditTaskDescription(e) {
    setEditTaskDescription(e.target.value);
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
          <TBodyPlain data={tasks} updateTaskDone={updateTaskDone} openEditTask={openEditTask} deleteTask={deleteTask} />
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
                      <input type="text" className="form-control input-lg" name="description" value={newTaskDescription} onChange={changeNewTaskDescription}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start</label>
                    <div>
                      <DateTimePicker defaultValue={selectedNewStartTime} onChange={setSelectedNewStartTime} />
                    </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End</label>
                  <div>
                    <DateTimePicker defaultValue={selectedNewEndTime} onChange={setSelectedNewEndTime} />
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
                      <input type="text" className="form-control input-lg" name="description" value={editTaskDescription} onChange={changeEditTaskDescription}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start</label>
                  <div>
                    <DateTimePicker defaultValue={selectedEditStartTime} onChange={setSelectedEditStartTime} />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End</label>
                  <div>
                    <DateTimePicker defaultValue={selectedEditEndTime} onChange={setSelectedEditEndTime} />
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
