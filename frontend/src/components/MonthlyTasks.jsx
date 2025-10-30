import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../config";
import { toLocaleISOString } from '../libs/utils';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import moment from "moment";

const MySwal = withReactContent(Swal);

const initialMonthsOfYear = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const now = new Date();
const currentMonthIndex = now.getMonth();

function TRow({
  task,
  monthsOfYear,
  updateTaskDone,
  openEditTask,
  deleteTask,
  restartTask,
  cancelTask,
  uncancelTask,
}) {
  const [checks, setChecks] = useState(Array(12).fill(false));
  const [checksVisible, setChecksVisible] = useState(Array(12).fill(false));
  const [checksCancelled, setChecksCancelled] = useState(Array(12).fill(false));

  useEffect(() => {
    const initChecks = Array(12).fill(false);
    const initVisible = Array(12).fill(false);
    const initCancelled = Array(12).fill(false);

    for (let i = 0; i < 12; i++) {
      if (task.checks.includes(i)) initChecks[i] = true;
      if (task.checks_visible.includes(i)) initVisible[i] = true;
      if (task.checks_cancelled.includes(i)) initCancelled[i] = true;
    }

    setChecks(initChecks);
    setChecksVisible(initVisible);
    setChecksCancelled(initCancelled);
  }, [task]);

  function toggleCheck(e, index) {
    const newChecks = [...checks];
    newChecks[index] = e.target.checked;
    setChecks(newChecks);
    updateTaskDone(task.id, index, e.target.checked);
  }

  return (
    <tr>
      <td>{task.description}</td>
      {monthsOfYear.map((m, i) => (
        <td key={i}>
          {checksVisible[i] && (
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={(e) => toggleCheck(e, i)}
            />
          )}
        </td>
      ))}
      <td>
        <div className="dropdown">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            Actions
          </button>
          <ul className="dropdown-menu">
            <li>
              <a className="dropdown-item" onClick={() => openEditTask(task.id)}>
                Edit
              </a>
            </li>
            <li>
              <a className="dropdown-item" onClick={() => deleteTask(task.id)}>
                Delete
              </a>
            </li>
            {/*
            <li>
              <a
                className="dropdown-item"
                onClick={() =>
                  checksCancelled[currentMonthIndex]
                    ? uncancelTask(task.id)
                    : cancelTask(task.id)
                }
              >
                {checksCancelled[currentMonthIndex] ? "Uncancel" : "Cancel"} Current Month
              </a>
            </li>
            <li>
              <a className="dropdown-item" onClick={() => restartTask(task.id)}>
                Restart Task
              </a>
            </li>
            */}
          </ul>
        </div>
      </td>
    </tr>
  );
}

export default function MonthlyTasks({ folder_id, folder }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskMonths, setEditTaskMonths] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [nrTasksDone, setNrTasksDone] = useState(0);
  const [nrTasksPending, setNrTasksPending] = useState(0);
  
  // State variables for year navigation
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthsOfYear, setMonthsOfYear] = useState(initialMonthsOfYear);
  const [dates, setDates] = useState(Array.from({ length: 12 }, (_, i) => new Date(new Date().getFullYear(), i, 1)));
  const [firstDay, setFirstDay] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [lastDay, setLastDay] = useState(new Date(new Date().getFullYear(), 11, 31));

  useEffect(() => {
    loadTasks();
  }, [firstDay, lastDay]);

  // Update dates when year changes
  useEffect(() => {
    const newFirstDay = new Date(currentYear, 0, 1);
    const newLastDay = new Date(currentYear, 11, 31);
    const newDates = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
    
    setFirstDay(newFirstDay);
    setLastDay(newLastDay);
    setDates(newDates);
  }, [currentYear]);

  function previousYear() {
    setCurrentYear(prevYear => prevYear - 1);
  }

  function nextYear() {
    setCurrentYear(prevYear => prevYear + 1);
  }

  function loadTasks() {
    axios
      .get(config.BASE_URL + "/api/get-monthly-tasks", {
        params: { 
          folder_id,
          dti: toLocaleISOString(firstDay).split('T')[0], 
          dtf: toLocaleISOString(lastDay).split('T')[0]
        },
      })
      .then(async (response) => {
        if (response.data.status === "OK") {
          for (var i in response.data.data) {
            console.log(response.data.data[i]);
          }
          var new_data = response.data.data.map(task => ({
            ...task,
            checks: [...task.checks],
          }));

          var count_tasks = 0;
          var count_tasks_done = 0;
          var count_tasks_pending = 0;
          var today = new Date();

          for (var i in new_data) {
            var checks = [];
            var checks_cancelled = [];
            var checks_visible = await getChecksVisible(new_data[i]);
            for (var j in new_data[i].checks) {
              const check = new_data[i].checks[j];
              const checkDate = new Date(check.date.split("T")[0]);
              if (compareDates(checkDate, today)) {
                count_tasks++;
                if (check.is_done) count_tasks_done++;
                else count_tasks_pending++;
              }

              for (var k in dates) {
                if (compareDates(checkDate, dates[k]) && check.is_done) {
                  checks.push(Number(k));
                }
                if (compareDates(checkDate, dates[k]) && check.is_cancelled) {
                  checks_cancelled.push(Number(k));
                }
              }
            }
            console.log(checks);
            new_data[i].checks = checks;
            new_data[i].checks_cancelled = checks_cancelled;
            new_data[i].checks_visible = checks_visible;
          }

          setTotalTasks(count_tasks);
          setNrTasksDone(count_tasks_done);
          setNrTasksPending(count_tasks_pending);
          setTasks(new_data);
        } else {
          alert(response.data.error);
        }
      })
      .catch((err) => alert(err.message));
  }

  async function getChecksVisible(task) {
    if (task.months != "") {
      var checks_visible = task.months.split(",");
      checks_visible = checks_visible.map(Number);
      var idx_arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      for (var i in dates) {
        if (dateIsLessThan(dates[i], new Date(task.created_at.split("T")[0]))) {
          checks_visible = checks_visible.filter((item) => {
            return idx_arr.indexOf(item) != Number(i);
          });
        }
      }
      console.log(checks_visible);
      return checks_visible;
    }
    else {
      return [];
    }
  }

  function compareDates(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function dateIsLessThan(a, b) {
    return a.getFullYear() < b.getFullYear() || (a.getFullYear() == b.getFullYear() && a.getMonth() < b.getMonth()) || (a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() < b.getDate());
  }

  function updateTaskDone(task_id, monthIndex, is_done) {
    const month = monthIndex;
    axios
      .post(config.BASE_URL + "/api/update-monthly-task-done", {
        task_id,
        date: toLocaleISOString(dates[month]).split('T')[0],
        is_done,
      })
      .then((res) => {
        if (res.data.status === "OK") loadTasks();
      })
      .catch((err) => alert(err.message));
  }

  function submitEditTask(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/edit-monthly-task", {
      task_id: editTaskId,
      description: editTaskDescription,
      months: editTaskMonths.map((m) => m.value).join(","),
    })
    .then(function(response) {
      if (response.data.status == "OK") {
        MySwal.fire("Task has been edited successfully.");
        loadTasks();
        closeEditTask();
        setEditTaskDescription("");
        setEditTaskMonths([]);
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire(err.message);
    })
  }

  function submitAddTask(e) {
    e.preventDefault();
    axios
      .post(config.BASE_URL + "/api/add-monthly-task", {
        folder_id,
        description: newTaskDescription,
        months: selectedMonths.map((m) => m.value).join(","),
        sort_index: tasks.length,
      })
      .then((response) => {
        if (response.data.status === "OK") {
          loadTasks();
          closeAddTask();
          setNewTaskDescription("");
          setSelectedMonths([]);
        } else {
          alert(response.data.error);
        }
      })
      .catch((err) => alert(err.message));
  }

  function deleteTask(task_id) {
    MySwal.fire({
      title: "Are you sure?",
      text: "Delete this task?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .post(config.BASE_URL + "/api/delete-task", { task_id })
          .then(() => loadTasks())
          .catch((err) => alert(err.message));
      }
    });
  }

  function openAddTask() {
    setShowNew(true);
    const modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".addMonthlyTaskModal")
    );
    modal.show();
  }

  function openEditTask(task_id) {
    setShowEdit(true);
    setEditTaskId(task_id);
    const task = tasks.find((t) => t.id === task_id);
    console.log(task);
    setEditTaskDescription(task.description);
    var months = [];
    for (var i in task.months.split(",")) {
      months.push(monthsOfYear[Number(task.months.split(",")[i])]);
    }
    setEditTaskMonths(months);
    const modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".editMonthlyTaskModal")
    );
    modal.show();
  }

  function closeAddTask() {
    setShowNew(false);
    const modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".addMonthlyTaskModal")
    );
    modal.hide();
  }

  function closeEditTask() {
    setShowEdit(false);
    const modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".editMonthlyTaskModal")
    );
    modal.hide();
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-3">
        Monthly Tasks {folder ? `— ${folder.name}` : ""}
      </h3>
      <button className="btn btn-primary mb-3" onClick={openAddTask}>
        Add Monthly Task
      </button>

      <div className="d-flex justify-content-center align-items-center mb-3">
        <button 
          className="btn btn-outline-primary me-3" 
          onClick={previousYear}
          title="Previous Year"
        >
          ← Previous Year
        </button>
        <h4 className="mb-0 mx-3">{currentYear}</h4>
        <button 
          className="btn btn-outline-primary ms-3" 
          onClick={nextYear}
          title="Next Year"
        >
          Next Year →
        </button>
      </div>

      <table className="table table-bordered table-striped align-middle">
        <thead>
          <tr>
            <th>Task</th>
            {monthsOfYear.map((m) => (
              <th key={m.value}>{m.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TRow
              key={task.id}
              task={task}
              monthsOfYear={monthsOfYear}
              updateTaskDone={updateTaskDone}
              openEditTask={openEditTask}
              deleteTask={deleteTask}
              restartTask={() => {}}
              cancelTask={() => {}}
              uncancelTask={() => {}}
            />
          ))}
        </tbody>
      </table>

      {/* Add Task Modal */}
      <div
        className="modal fade addMonthlyTaskModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={submitAddTask}>
              <div className="modal-header">
                <h5 className="modal-title">Add Monthly Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAddTask}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Select Months</label>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {monthsOfYear.map((m) => (
                      <label key={m.value} className="me-3">
                        <input
                          type="checkbox"
                          className="form-check-input me-1"
                          checked={selectedMonths.some(
                            (x) => x.value === m.value
                          )}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedMonths((prev) => [...prev, m]);
                            else
                              setSelectedMonths((prev) =>
                                prev.filter((x) => x.value !== m.value)
                              );
                          }}
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeAddTask}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <div
        className="modal fade editMonthlyTaskModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={submitEditTask}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Monthly Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditTask}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Select Months</label>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {monthsOfYear.map((m) => (
                      <label key={m.value} className="me-3">
                        <input
                          type="checkbox"
                          className="form-check-input me-1"
                          checked={editTaskMonths.some(
                            (x) => x.value === m.value
                          )}
                          onChange={(e) => {
                            if (e.target.checked)
                              setEditTaskMonths((prev) => [...prev, m]);
                            else
                              setEditTaskMonths((prev) =>
                                prev.filter((x) => x.value !== m.value)
                              );
                          }}
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditTask}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Edit Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
