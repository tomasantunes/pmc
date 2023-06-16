import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";
import Select from 'react-select';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
var bootprompt = require('bootprompt');

function TRow(props) {
  const [checks, setChecks] = useState([]);
  const [checksVisible, setChecksVisible] = useState([]);

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
    var checks_visible_arr = [];
    for (var i = 0; i < 7; i++) {
      if (props.checks.includes(i)) {
        checks_arr.push(true);
      }
      else {
        checks_arr.push(false);
      }

      if (props.checks_visible.includes(i)) {
        checks_visible_arr.push(true);
      }
      else {
        checks_visible_arr.push(false);
      }
    }
    if (props.type == "week_day" || props.type == "weekly") {
      checks_visible_arr.push(checks_visible_arr.splice(0, 1)[0]);
    }
    setChecks(checks_arr);
    setChecksVisible(checks_visible_arr);
  }, []);
  return (
    <tr {...props}>
      <td>{props.description}</td>
      <td>{props.time}</td>
      <td>{checksVisible[0] && <input type="checkbox" checked={checks[0]} onChange={(e) => {toggleCheck(e, props.task_id, 0)}} />}</td>
      <td>{checksVisible[1] && <input type="checkbox" checked={checks[1]} onChange={(e) => {toggleCheck(e, props.task_id, 1)}} />}</td>
      <td>{checksVisible[2] && <input type="checkbox" checked={checks[2]} onChange={(e) => {toggleCheck(e, props.task_id, 2)}} />}</td>
      <td>{checksVisible[3] && <input type="checkbox" checked={checks[3]} onChange={(e) => {toggleCheck(e, props.task_id, 3)}} />}</td>
      <td>{checksVisible[4] && <input type="checkbox" checked={checks[4]} onChange={(e) => {toggleCheck(e, props.task_id, 4)}} />}</td>
      <td>{checksVisible[5] && <input type="checkbox" checked={checks[5]} onChange={(e) => {toggleCheck(e, props.task_id, 5)}} />}</td>
      <td>{checksVisible[6] && <input type="checkbox" checked={checks[6]} onChange={(e) => {toggleCheck(e, props.task_id, 6)}} />}</td>
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
          <SortableTRow key={task.id} index={i} task_id={task.id} description={task.description} time={task.time} checks={task.checks} type={task.type} checks_visible={task.checks_visible} updateTaskDone={props.updateTaskDone} openEditTask={props.openEditTask} deleteTask={props.deleteTask} />
        )
      })}
    </tbody>
  )
}

const SortableTBody = SortableContainer(TBody);

export default function Tasks({folder_id, folder}) {
  const [tasks, setTasks] = useState([]);
  const [days, setDays] = useState([]);
  const [dates, setDates] = useState([]);
  const [newTask, setNewTask] = useState({
    description: "",
    folder_id: folder_id,
    sort_index: 0,
    task_type: "daily",
    week_day: "",
    month_day: "",
    month: "",
    time: "",
  });
  const [editTask, setEditTask] = useState({
    task_id: "",
    description: "",
    time: "",
    task_type: "",
    week_day: "",
    month_day: "",
    month: "",
  });
  const [selectedTaskType, setSelectedTaskType] = useState({value: "daily", label: "Daily"});
  const [showWeekDaySelector, setShowWeekDaySelector] = useState(false);
  const [showMonthDaySelector, setShowMonthDaySelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState();
  const [selectedMonthDay, setSelectedMonthDay] = useState();
  const [selectedMonth, setSelectedMonth] = useState();
  const [hideNotThisWeek, setHideNotThisWeek] = useState();
  var navigate = useNavigate();

  const taskTypes = [
    {value: "daily", label: "Daily"},
    {value: "weekly", label: "Weekly"},
    {value: "monthly", label: "Monthly"},
    {value: "yearly", label: "Yearly"},
    {value: "week_day", label: "Week Day"},
    {value: "month_day", label: "Month Day"},
    {value: "year_day", label: "Year Day"},
  ];

  const weekDays = [
    {value: 1, label: "Monday"},
    {value: 2, label: "Tuesday"},
    {value: 3, label: "Wednesday"},
    {value: 4, label: "Thursday"},
    {value: 5, label: "Friday"},
    {value: 6, label: "Saturday"},
    {value: 0, label: "Sunday"},
  ];

  var monthDays = [];

  for (var i = 1; i <= 31; i++) {
    monthDays.push({value: i, label: i});
  }

  const months = [
    {value: 1, label: "January"},
    {value: 2, label: "February"},
    {value: 3, label: "March"},
    {value: 4, label: "April"},
    {value: 5, label: "May"},
    {value: 6, label: "June"},
    {value: 7, label: "July"},
    {value: 8, label: "August"},
    {value: 9, label: "September"},
    {value: 10, label: "October"},
    {value: 11, label: "November"},
    {value: 12, label: "December"}
  ];

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

  function submitAddTask(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/add-recurrent-task", {...newTask, sort_index: tasks.length})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
        $(".addTaskModal").modal("hide");
        setNewTask({
          description: "",
          time: "",
          folder_id: folder_id,
          sort_index: 0,
          task_type: "daily",
          week_day: "",
          month_day: "",
          month: "",
        });
        setSelectedTaskType({value: "daily", label: "Daily"});
        setSelectedWeekDay({});
        setSelectedMonthDay({});
        setSelectedMonth({});
        setShowWeekDaySelector(false);
        setShowMonthDaySelector(false);
        setShowMonthSelector(false);
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

  function closeEditTask() {
    $(".editTaskModal").modal("hide");
  }

  function openEditTask(task_id) {
    axios.get(config.BASE_URL + "/api/get-task", {params: {task_id: task_id}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var task = response.data.data;
        setEditTask({
          task_id: task.id,
          description: task.description,
          time: task.time,
          task_type: task.type,
          week_day: task.week_day,
          month_day: task.month_day,
          month: task.month,
        });
        var taskType = taskTypes.find(item => item.value == task.type);
        setSelectedTaskType(taskType);
        if (task.type == "week_day") {
          var weekDay = weekDays.find(item => item.value == task.week_day);
          setSelectedWeekDay(weekDay);
        }
        else if (task.type == "month_day") {
          var monthDay = monthDays.find(item => item.value == task.month_day);
          setSelectedMonthDay(monthDay);
        }
        else if (task.type == "year_day") {
          var month = months.find(item => item.value == task.month);
          setSelectedMonth(month);
          var monthDay = monthDays.find(item => item.value == task.month_day);
          setSelectedMonthDay(monthDay);
        }
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

  function changeNewTaskDescription(e) {
    setNewTask({
      ...newTask,
      description: e.target.value
    });
  }

  function changeNewTaskTime(e) {
    setNewTask({
      ...newTask,
      time: e.target.value
    });
  }

  function changeNewTaskType(item) {
    setNewTask({
      ...newTask,
      task_type: item.value
    });
    setSelectedTaskType(item);
  }

  function changeWeekDay(item) {
    setNewTask({
      ...newTask,
      week_day: item.value
    });
    setSelectedWeekDay(item);
  }

  function changeMonthDay(item) {
    setNewTask({
      ...newTask,
      month_day: item.value
    });
    setSelectedMonthDay(item);
  }

  function changeMonth(item) {
    setNewTask({
      ...newTask,
      month: item.value
    });
    setSelectedMonth(item);
  }

  function changeEditTaskDescription(e) {
    setEditTask({
      ...editTask,
      description: e.target.value
    });
  }

  function changeEditTaskTime(e) {
    setEditTask({
      ...editTask,
      time: e.target.value
    });
  }

  function changeEditTaskType(item) {
    setEditTask({
      ...editTask,
      task_type: item.value
    });
    setSelectedTaskType(item);
  }

  function changeEditTaskWeekDay(item) {
    setEditTask({
      ...editTask,
      week_day: item.value
    });
    setSelectedWeekDay(item);
  }

  function changeEditTaskMonthDay(item) {
    setEditTask({
      ...editTask,
      month_day: item.value
    });
    setSelectedMonthDay(item);
  }

  function changeEditTaskMonth(item) {
    setEditTask({
      ...editTask,
      month: item.value
    });
    setSelectedMonth(item);
  }

  function submitEditTask(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/edit-recurrent-task", editTask)
    .then(function(response) {
      if (response.data.status == "OK") {
        loadTasks();
        $(".editTaskModal").modal("hide");
        setEditTask({
          task_id: 0,
          description: "",
          time: "",
          task_type: "",
          week_day: "",
          month_day: "",
          month: ""
        })
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
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

  function toggleHideNotThisWeek() {
    axios.post("/api/set-hide-not-this-week", {folder_id: folder_id, hide_not_this_week: !hideNotThisWeek})
    .then(function(response) {
      if (response.data.status == "OK") {
        setHideNotThisWeek(!hideNotThisWeek);
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
    });
  }

  function compareDates(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function dateIsLessThan(a, b) {
    return a.getFullYear() < b.getFullYear() || (a.getFullYear() == b.getFullYear() && a.getMonth() < b.getMonth()) || (a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() < b.getDate());
  }

  function getChecksVisible(task) {
    var checks_visible = [];
    if (task.type == "daily") {
      checks_visible = [0, 1, 2, 3, 4, 5, 6];
    }
    else if (task.type == "weekly") {
      checks_visible = [6];
    }
    else if (task.type == "monthly") {
      for (var i in dates) {
        if (dates[i].getDate() == 1) {
          checks_visible = [Number(i)];
        }
      }
    }
    else if (task.type == "yearly") {
      for (var i in dates) {
        if (dates[i].getMonth() == 0 && dates[i].getDate() == 1) {
          checks_visible = [Number(i)];
        }
      }
    }
    else if (task.type == "week_day") {
      checks_visible = [Number(task.week_day)];
    }
    else if (task.type == "month_day") {
      for (var i in dates) {
        if (dates[i].getDate() == task.month_day) {
          checks_visible = [Number(i)];
        }
      }
    }
    else if (task.type == "year_day") {
      for (var i in dates) {
        if (dates[i].getDate() == task.month_day && dates[i].getMonth() == task.month - 1) {
          checks_visible = [Number(i)];
        }
      }
    }

    if (task.type != "week_day") {
      for (var i in dates) {
        if (dateIsLessThan(dates[i], new Date(task.created_at.split("T")[0]))) {
          checks_visible = checks_visible.filter((item) => {
            return item != Number(i);
          });
        }
      }
    }
    else {
      var idx_arr = [1, 2, 3, 4, 5, 6, 0];
      for (var i in dates) {
        if (dateIsLessThan(dates[i], new Date(task.created_at.split("T")[0]))) {
          checks_visible = checks_visible.filter((item) => {
            return idx_arr.indexOf(item) != Number(i);
          });
        }
      }
    }
    return checks_visible;
  }

  function loadTasks() {
    setTasks([]);
    axios.get(config.BASE_URL + "/api/get-recurrent-tasks", {params: {folder_id: folder_id, dti: dates[0].toISOString().split('T')[0], dtf: dates[6].toISOString().split('T')[0]}})
    .then(function(response) {
      if (response.data.status == "OK") {
        var data = response.data.data;
        for (var i in data) {
          var checks = [];
          var checks_visible = getChecksVisible(data[i]);
          for (var j in data[i].checks) {
            for (var k in dates) {
              if (compareDates(new Date(data[i].checks[j].date.split("T")[0]), dates[k]) && data[i].checks[j].is_done) {
                checks.push(Number(k));
              }
            }
          }
          data[i].checks = checks;
          data[i].checks_visible = checks_visible;
        }
        var new_data = data;
        if (hideNotThisWeek) {
          new_data = new_data.filter((task) => {
            return checkIfTaskIsThisWeek(task);
          });
        }
        setTasks(new_data);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function checkIfTaskIsThisWeek(task) {
    if (task.type == "daily") {
      return true;
    }
    else if (task.type == "weekly") {
      return true;
    }
    else if (task.type == "monthly") {
      for (var i in dates) {
        if (dates[i].getDate() == 1) {
          return true;
        }
      }
    }
    else if (task.type == "yearly") {
      for (var i in dates) {
        if (dates[i].getMonth() == 0 && dates[i].getDate() == 1) {
          return true;
        }
      }
    }
    else if (task.type == "week_day") {
      return true;
    }
    else if (task.type == "month_day") {
      for (var i in dates) {
        if (dates[i].getDate() == task.month_day) {
          return true;
        }
      }
    }
    else if (task.type == "year_day") {
      for (var i in dates) {
        if (dates[i].getDate() == task.month_day && dates[i].getMonth() == task.month - 1) {
          return true;
        }
      }
    }
    return false;
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

  function convertDatesToDays(dates_arr) {
    var days = [];
    for (var i in dates_arr) {
      var date = dates_arr[i];
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

  function previousWeek() {
    var new_dates = [];
    for (var i in dates) {
      var date = new Date(dates[i]);
      date.setDate(date.getDate() - 7);
      new_dates.push(date);
    }
    setDates(new_dates);
    setDays(convertDatesToDays(new_dates));
  }

  function nextWeek() {
    var new_dates = [];
    for (var i in dates) {
      var date = new Date(dates[i]);
      date.setDate(date.getDate() + 7);
      new_dates.push(date);
    }
    setDates(new_dates);
    setDays(convertDatesToDays(new_dates));
  }

  useEffect(() => {
    if (dates.length > 0 && hideNotThisWeek != undefined) {
      loadTasks();
    }
  }, [dates, hideNotThisWeek]);

  useEffect(() => {
    if (selectedTaskType.value == "week_day") {
      setShowWeekDaySelector(true);
      setShowMonthDaySelector(false);
      setShowMonthSelector(false);
    }
    else if (selectedTaskType.value == "month_day") {
      setShowWeekDaySelector(false);
      setShowMonthDaySelector(true);
      setShowMonthSelector(false);
    }
    else if (selectedTaskType.value == "year_day") {
      setShowWeekDaySelector(false);
      setShowMonthDaySelector(true);
      setShowMonthSelector(true);
    }
    else if (selectedTaskType.value == "daily" || selectedTaskType.value == "weekly" || selectedTaskType.value == "monthly" || selectedTaskType.value == "yearly") {
      setShowWeekDaySelector(false);
      setShowMonthDaySelector(false);
      setShowMonthSelector(false);
    }
  }, [selectedTaskType]);

  useEffect(() => {
    if (folder != undefined && folder != null) {
      setHideNotThisWeek(folder.hide_not_this_week == 1 ? true : false);
    }
  }, [folder]);

  useEffect(() => {
    setDays(getDays());
    setDates(getDates());
  }, []);
  return (
    <>
      <div className="buttons-menu-recurrent my-3">
        <button className="btn btn-primary" onClick={previousWeek}><i class="fa-solid fa-arrow-left"></i></button>
        <button className="btn btn-primary" onClick={nextWeek}><i class="fa-solid fa-arrow-right"></i></button>
        <button className="btn btn-success" onClick={openAddTask}>Add Task</button>
        <div class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
            Options
          </button>
          <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            <li><a class="dropdown-item" href="#" onClick={deleteFolder}>Delete folder</a></li>
            <li><a class="dropdown-item" href="#" onClick={toggleHideNotThisWeek}>{hideNotThisWeek == true ? "Disable Only This Week" : "Only This Week"}</a></li>
          </ul>
        </div>
      </div>
      <table className="table table-striped table-bordered align-middle recurrent-tasks">
          <thead class="table-dark">
              <tr>
                  
                  <th style={{width: "45%"}}>Task</th>
                  <th style={{width: "10%"}}>Time</th>
                  <th style={{width: "5%"}}>Mon <br/>{days[0]}</th>
                  <th style={{width: "5%"}}>Tue <br/>{days[1]}</th>
                  <th style={{width: "5%"}}>Wed <br/>{days[2]}</th>
                  <th style={{width: "5%"}}>Thu <br/>{days[3]}</th>
                  <th style={{width: "5%"}}>Fri <br/>{days[4]}</th>
                  <th style={{width: "5%"}}>Sat <br/>{days[5]}</th>
                  <th style={{width: "5%"}}>Sun <br/>{days[6]}</th>
                  <th style={{width: "10%"}}>Actions</th>
              </tr>
          </thead>
          <SortableTBody data={tasks} onSortEnd={handleSort} updateTaskDone={updateTaskDone} openEditTask={openEditTask} deleteTask={deleteTask} shouldCancelStart={cancelSort} />
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
                  <label className="control-label">Time</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="time" value={newTask.time} onChange={changeNewTaskTime}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Type</label>
                  <Select value={selectedTaskType} options={taskTypes} onChange={changeNewTaskType} />
                </div>
                {showWeekDaySelector &&
                <div className="form-group py-2">
                  <label className="control-label">Week Day</label>
                  <Select value={selectedWeekDay} options={weekDays} onChange={changeWeekDay} />
                </div>}
                {showMonthDaySelector &&
                <div className="form-group py-2">
                  <label className="control-label">Month Day</label>
                  <Select value={selectedMonthDay} options={monthDays} onChange={changeMonthDay} />
                </div>} 
                {showMonthSelector &&
                <div className="form-group py-2">
                  <label className="control-label">Month</label>
                  <Select value={selectedMonth} options={months} onChange={changeMonth} />
                </div>}
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
                  <label className="control-label">Time</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="time" value={editTask.time} onChange={changeEditTaskTime}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Type</label>
                  <Select value={selectedTaskType} options={taskTypes} onChange={changeEditTaskType} />
                </div>
                {showWeekDaySelector &&
                <div className="form-group py-2">
                  <label className="control-label">Week Day</label>
                  <Select value={selectedWeekDay} options={weekDays} onChange={changeEditTaskWeekDay} />
                </div>}
                {showMonthDaySelector &&
                <div className="form-group py-2">
                  <label className="control-label">Month Day</label>
                  <Select value={selectedMonthDay} options={monthDays} onChange={changeEditTaskMonthDay} />
                </div>} 
                {showMonthSelector &&
                <div className="form-group py-2">
                  <label className="control-label">Month</label>
                  <Select value={selectedMonth} options={months} onChange={changeEditTaskMonth} />
                </div>}
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
