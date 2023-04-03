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
  const [checks, setChecks] = useState([]);

  function toggleCheck(e, task_id, index) {
    setChecks((prev) => {
      var new_checks = prev;
      new_checks[index] = e.target.checked;
      return new_checks;
    }); 
    props.updateTaskDone(e, props.task_id, index);
  }

  useEffect(() => {
    var checks_arr = [];
    for (var i = 0; i < 7; i++) {
      if (props.checks.includes(i)) {
        checks_arr.push(true);
      }
      else {
        checks_arr.push(false);
      }
    }
    setChecks(checks_arr);
  }, []);
  return (
    <tr {...props}>
      <td>{props.description}</td>
      <td><input type="checkbox" checked={checks[0]} onChange={(e) => {toggleCheck(e, props.task_id, 0)}} /></td>
      <td><input type="checkbox" checked={checks[1]} onChange={(e) => {toggleCheck(e, props.task_id, 1)}} /></td>
      <td><input type="checkbox" checked={checks[2]} onChange={(e) => {toggleCheck(e, props.task_id, 2)}} /></td>
      <td><input type="checkbox" checked={checks[3]} onChange={(e) => {toggleCheck(e, props.task_id, 3)}} /></td>
      <td><input type="checkbox" checked={checks[4]} onChange={(e) => {toggleCheck(e, props.task_id, 4)}} /></td>
      <td><input type="checkbox" checked={checks[5]} onChange={(e) => {toggleCheck(e, props.task_id, 5)}} /></td>
      <td><input type="checkbox" checked={checks[6]} onChange={(e) => {toggleCheck(e, props.task_id, 6)}} /></td>
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
          <SortableTRow key={task.id} index={i} task_id={task.id} description={task.description} checks={task.checks} updateTaskDone={props.updateTaskDone} openEditTask={props.openEditTask} deleteTask={props.deleteTask} />
        )
      })}
    </tbody>
  )
}

const SortableTBody = SortableContainer(TBody);

export default function Tasks({folder_id}) {
  const [tasks, setTasks] = useState([]);
  const [days, setDays] = useState([]);
  const [dates, setDates] = useState([]);
  const [checks, setChecks] = useState([]);

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

  function updateTaskDone(e, task_id, index) {
    axios.post(config.BASE_URL + "/api/update-recurrent-task-done", {task_id: task_id, is_done: e.target.checked, date: dates[index].toISOString().split('T')[0]})
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

  function compareDates(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function loadTasks() {
    setTasks([]);
    axios.get(config.BASE_URL + "/api/get-recurrent-tasks", {params: {folder_id: folder_id, dti: dates[0].toISOString().split('T')[0], dtf: dates[6].toISOString().split('T')[0]}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var data = response.data.data;
        for (var i in data) {
          var checks = [];
          for (var j in data[i].checks) {
            for (var k in dates) {
              if (compareDates(new Date(data[i].checks[j].date.split("T")[0]), dates[k]) && data[i].checks[j].is_done) {
                checks.push(Number(k));
              }
            }
          }
          data[i].checks = checks;
        }
        console.log(data);
        setTasks(data);
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

  function addLeadingZeros(n) {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  }

  function getDays() {
    var days = [];
    for (var i = 0; i < 7; i++) {
      var date = new Date();
      date.setDate(date.getDate() - (date.getDay() + 6) % 7);
      date.setDate(date.getDate() + i);
      var mm = date.getMonth() + 1;
      var dd = date.getDate();
      days.push(addLeadingZeros(dd) + "/" + addLeadingZeros(mm));
    }
    return days;
  }

  function getDates() {
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var date = new Date();
      date.setDate(date.getDate() - (date.getDay() + 6) % 7);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  useEffect(() => {
    if (dates.length > 0) {
      loadTasks();
    }
  }, [dates]);

  useEffect(() => {
    setDays(getDays());
    setDates(getDates());
  }, []);
  return (
    <>
      <div className="my-3" style={{textAlign: "right", maxWidth: "1000px", margin: "0 auto"}}>
        <button className="btn btn-success" onClick={openAddTask}>Add Task</button>
      </div>
      <table className="table table-striped table-bordered align-middle recurrent-tasks">
          <thead class="table-dark">
              <tr>
                  
                  <th style={{width: "20%"}}>Task</th>
                  <th style={{width: "10%"}}>Mon <br/>{days[0]}</th>
                  <th style={{width: "10%"}}>Tue <br/>{days[1]}</th>
                  <th style={{width: "10%"}}>Wed <br/>{days[2]}</th>
                  <th style={{width: "10%"}}>Thu <br/>{days[3]}</th>
                  <th style={{width: "10%"}}>Fri <br/>{days[4]}</th>
                  <th style={{width: "10%"}}>Sat <br/>{days[5]}</th>
                  <th style={{width: "10%"}}>Sun <br/>{days[6]}</th>
                  <th style={{width: "10%"}}>Actions</th>
              </tr>
          </thead>
          <SortableTBody data={tasks} onSortEnd={handleSort} updateTaskDone={updateTaskDone} openEditTask={openEditTask} deleteTask={deleteTask} shouldCancelStart={cancelSort} />
      </table>
    </>
  )
}
