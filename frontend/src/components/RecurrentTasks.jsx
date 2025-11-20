import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
import moment from "moment";
import TimePicker from "../libs/bs5-timepicker/TimePicker";
import { toLocaleISOString } from "../libs/utils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const weekDays = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function TRow(props) {
  var today = new Date();
  var current_idx = weekDays.findIndex((d) => {
    return d.value == today.getDay();
  });
  const [checks, setChecks] = useState([]);
  const [checksVisible, setChecksVisible] = useState([]);
  const [checksCancelled, setChecksCancelled] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(current_idx);

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
    var checks_cancelled_arr = [];
    for (var i = 0; i < 7; i++) {
      if (props.checks.includes(i)) {
        checks_arr.push(true);
      } else {
        checks_arr.push(false);
      }

      if (props.checks_visible.includes(i)) {
        checks_visible_arr.push(true);
      } else {
        checks_visible_arr.push(false);
      }

      if (props.checks_cancelled.includes(i)) {
        checks_cancelled_arr.push(true);
      } else {
        checks_cancelled_arr.push(false);
      }
    }
    console.log(checks_cancelled_arr);
    console.log(currentIdx);
    checks_visible_arr.push(checks_visible_arr.splice(0, 1)[0]);
    setChecks(checks_arr);
    setChecksVisible(checks_visible_arr);
    setChecksCancelled(checks_cancelled_arr);
  }, []);
  return (
    <tr {...props}>
      <td>{props.description}</td>
      <td>{props.time}</td>
      <td>
        {checksVisible[0] && (
          <input
            type="checkbox"
            checked={checks[0]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 0);
            }}
          />
        )}
      </td>
      <td>
        {checksVisible[1] && (
          <input
            type="checkbox"
            checked={checks[1]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 1);
            }}
          />
        )}
      </td>
      <td>
        {checksVisible[2] && (
          <input
            type="checkbox"
            checked={checks[2]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 2);
            }}
          />
        )}
      </td>
      <td>
        {checksVisible[3] && (
          <input
            type="checkbox"
            checked={checks[3]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 3);
            }}
          />
        )}
      </td>
      <td>
        {checksVisible[4] && (
          <input
            type="checkbox"
            checked={checks[4]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 4);
            }}
          />
        )}
      </td>
      <td>
        {checksVisible[5] && (
          <input
            type="checkbox"
            checked={checks[5]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 5);
            }}
          />
        )}
      </td>
      <td>
        {checksVisible[6] && (
          <input
            type="checkbox"
            checked={checks[6]}
            onChange={(e) => {
              toggleCheck(e, props.task_id, 6);
            }}
          />
        )}
      </td>
      <td>
        <div class="dropdown">
          <button
            class="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownMenuButton1"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Actions
          </button>
          <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            <li>
              <a
                class="dropdown-item"
                href="#"
                onClick={() => {
                  props.openEditTask(props.task_id);
                }}
              >
                Edit
              </a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                onClick={() => {
                  props.deleteTask(props.task_id);
                }}
              >
                Delete
              </a>
            </li>
            {!checksCancelled[currentIdx] ? (
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  onClick={() => {
                    props.cancelTask(props.task_id);
                  }}
                >
                  Cancel Today's Task
                </a>
              </li>
            ) : (
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  onClick={() => {
                    props.uncancelTask(props.task_id);
                  }}
                >
                  Uncancel Today's Task
                </a>
              </li>
            )}
            <li>
              <a
                class="dropdown-item"
                href="#"
                onClick={() => {
                  props.restartTask(props.task_id);
                }}
              >
                Restart Task
              </a>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  );
}

function TBodyPlain(props) {
  return (
    <tbody {...props} className="table-group-divider">
      {props.data.map((task, i) => {
        return (
          <TRow
            key={task.id}
            index={i}
            task_id={task.id}
            description={task.description}
            time={task.time}
            checks={task.checks}
            type={task.type}
            checks_visible={task.checks_visible}
            checks_cancelled={task.checks_cancelled}
            updateTaskDone={props.updateTaskDone}
            openEditTask={props.openEditTask}
            deleteTask={props.deleteTask}
            cancelTask={props.cancelTask}
            uncancelTask={props.uncancelTask}
            restartTask={props.restartTask}
          />
        );
      })}
    </tbody>
  );
}

export default function Tasks({ folder_id, folder }) {
  const [tasks, setTasks] = useState([]);
  const [days, setDays] = useState([]);
  const [dates, setDates] = useState([]);
  const [mondayChecked, setMondayChecked] = useState(false);
  const [tuesdayChecked, setTuesdayChecked] = useState(false);
  const [wednesdayChecked, setWednesdayChecked] = useState(false);
  const [thursdayChecked, setThursdayChecked] = useState(false);
  const [fridayChecked, setFridayChecked] = useState(false);
  const [saturdayChecked, setSaturdayChecked] = useState(false);
  const [sundayChecked, setSundayChecked] = useState(false);
  const newStartTimeRef = useRef(null);
  const newEndTimeRef = useRef(null);
  const editStartTimeRef = useRef(null);
  const editEndTimeRef = useRef(null);
  const [enableNewStartTime, setEnableNewStartTime] = useState(false);
  const [enableNewEndTime, setEnableNewEndTime] = useState(false);
  const [enableEditStartTime, setEnableEditStartTime] = useState(false);
  const [enableEditEndTime, setEnableEditEndTime] = useState(false);
  const [selectedNewStartTime, setSelectedNewStartTime] = useState("00:00");
  const [selectedNewEndTime, setSelectedNewEndTime] = useState("00:00");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskFolderId, setNewTaskFolderId] = useState(folder_id);
  const [newTaskSortIndex, setNewTaskSortIndex] = useState(0);
  const [newTaskType, setNewTaskType] = useState("daily");
  const [newTaskDays, setNewTaskDays] = useState([]);
  const [selectedEditStartTime, setSelectedEditStartTime] = useState("00:00");
  const [selectedEditEndTime, setSelectedEditEndTime] = useState("00:00");
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskFolderId, setEditTaskFolderId] = useState(folder_id);
  const [editTaskSortIndex, setEditTaskSortIndex] = useState(null);
  const [editTaskType, setEditTaskType] = useState("daily");
  const [editTaskDays, setEditTaskDays] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [nrTasksDone, setNrTasksDone] = useState(0);
  const [nrTasksPending, setNrTasksPending] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newAlertActive, setNewAlertActive] = useState(false);
  const [newAlertText, setNewAlertText] = useState("");
  const [editAlertActive, setEditAlertActive] = useState(false);
  const [editAlertText, setEditAlertText] = useState("");
  var navigate = useNavigate();

  function changeEnableNewStartTime(e) {
    setEnableNewStartTime(e.target.checked);
  }

  function changeEnableNewEndTime(e) {
    setEnableNewEndTime(e.target.checked);
  }

  function changeEnableEditStartTime(e) {
    setEnableEditStartTime(e.target.checked);
  }

  function changeEnableEditEndTime(e) {
    setEnableEditEndTime(e.target.checked);
  }

  function toggleMonday(e) {
    setMondayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        console.log("add monday");
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[0]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[0]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 1;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 1;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleTuesday(e) {
    setTuesdayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[1]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[1]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 2;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 2;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleWednesday(e) {
    setWednesdayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[2]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[2]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 3;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 3;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleThursday(e) {
    setThursdayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[3]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[3]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 4;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 4;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleFriday(e) {
    setFridayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[4]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[4]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 5;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 5;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleSaturday(e) {
    setSaturdayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[5]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[5]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 6;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 6;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleSunday(e) {
    setSundayChecked(e.target.checked);
    if (e.target.checked) {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[6]);
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr.push(weekDays[6]);
          return new_arr;
        });
      }
    } else {
      if (showNew) {
        setNewTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 0;
          });
          return new_arr;
        });
      } else if (showEdit) {
        setEditTaskDays((prev) => {
          var new_arr = prev;
          new_arr = new_arr.filter((item) => {
            return item.value != 0;
          });
          return new_arr;
        });
      }
    }
  }

  function toggleNewAlertActive(e) {
    setNewAlertActive(e.target.checked);
  }

  function toggleEditAlertActive(e) {
    setEditAlertActive(e.target.checked);
  }

  function cancelTask(task_id) {
    axios
      .post(config.BASE_URL + "/api/cancel-task", {
        task_id: task_id,
        date: toLocaleISOString(new Date()).split("T")[0],
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          window.location.reload();
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
        alert(err.message);
      });
  }

  function uncancelTask(task_id) {
    axios
      .post(config.BASE_URL + "/api/uncancel-task", {
        task_id: task_id,
        date: toLocaleISOString(new Date()).split("T")[0],
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          window.location.reload();
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
        alert(err.message);
      });
  }

  function restartTask(task_id) {
    axios
      .post(config.BASE_URL + "/api/restart-recurrent-task", {
        task_id: task_id,
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          loadTasks();
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
        alert(err.message);
      });
  }

  function submitAddTask(e) {
    e.preventDefault();
    var days = newTaskDays
      .map((item) => {
        return item.value;
      })
      .join(",");

    var start_time = "";
    var end_time = "";

    if (enableNewStartTime == true) {
      start_time = selectedNewStartTime;
    }

    if (enableNewEndTime == true) {
      end_time = selectedNewEndTime;
    }

    axios
      .post(config.BASE_URL + "/api/add-recurrent-task", {
        task_type: newTaskType,
        sort_index: newTaskSortIndex,
        days: days,
        start_time: moment(start_time, "HH:mm")
          .set({ year: 1970, month: 0, date: 1 })
          .format("YYYY-MM-DD HH:mm"),
        end_time: moment(end_time, "HH:mm")
          .set({ year: 1970, month: 0, date: 1 })
          .format("YYYY-MM-DD HH:mm"),
        description: newTaskDescription,
        folder_id: newTaskFolderId,
        alert_active: newAlertActive,
        alert_text: newAlertText,
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          loadTasks();
          var modal = bootstrap.Modal.getOrCreateInstance(
            document.querySelector(".addTaskModal"),
          );
          modal.hide();
          setNewTaskFolderId(folder_id);
          setNewTaskSortIndex(0);
          setNewTaskType("daily");
          setNewTaskDays([]);
          setNewTaskDescription("");
          setSelectedNewStartTime("00:00");
          setSelectedNewEndTime("00:00");
          clearWeekDayChecks();
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function openAddTask() {
    setEnableNewStartTime(false);
    setEnableNewEndTime(false);
    setSelectedNewStartTime("00:00");
    setSelectedNewEndTime("00:00");
    setNewTaskDescription("");
    setNewTaskDays([]);
    setNewAlertActive(false);
    setNewAlertText("");
    clearWeekDayChecks();
    var modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".addTaskModal"),
    );
    modal.show();
    setShowNew(true);
  }

  function closeAddTask() {
    var modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".addTaskModal"),
    );
    modal.hide();
    setShowNew(false);
  }

  function closeEditTask() {
    var modal = bootstrap.Modal.getOrCreateInstance(
      document.querySelector(".editTaskModal"),
    );
    modal.hide();
    setShowEdit(false);
  }

  function openEditTask(task_id) {
    clearWeekDayChecks();
    axios
      .get(config.BASE_URL + "/api/get-recurrent-task", {
        params: { task_id: task_id },
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          var task = response.data.data;
          console.log(task);
          if (task.start_time != "" && task.end_time != "") {
            setEnableEditStartTime(true);
            setSelectedEditStartTime(
              moment(task.start_time, "YYYY-MM-DD HH:mm:ss").format("HH:mm"),
            );
            setEnableEditEndTime(true);
            setSelectedEditEndTime(
              moment(task.end_time, "YYYY-MM-DD HH:mm:ss").format("HH:mm"),
            );
          }
          setEditTaskId(task.id);
          setEditTaskDescription(task.description);
          setEditTaskFolderId(task.folder_id);
          setEditTaskSortIndex(task.sort_index);
          setEditTaskType(task.type);
          setEditAlertActive(task.alert_active);
          setEditAlertText(task.alert_text);

          if (task.days != "") {
            var days = task.days.split(",");
            days = days.map(Number);
            var selected_days = [];
            for (var i in days) {
              var week_day = weekDays.find((d) => {
                return d.value == days[i];
              });
              setWeekDayCheck(days[i]);
              selected_days.push(week_day);
            }
            setEditTaskDays(selected_days);
          } else {
            setEditTaskDays([]);
          }
          var modal = bootstrap.Modal.getOrCreateInstance(
            document.querySelector(".editTaskModal"),
          );
          modal.show();
          setShowEdit(true);
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function setWeekDayCheck(value) {
    if (value == 0) {
      setSundayChecked(true);
    } else if (value == 1) {
      setMondayChecked(true);
    } else if (value == 2) {
      setTuesdayChecked(true);
    } else if (value == 3) {
      setWednesdayChecked(true);
    } else if (value == 4) {
      setThursdayChecked(true);
    } else if (value == 5) {
      setFridayChecked(true);
    } else if (value == 6) {
      setSaturdayChecked(true);
    }
  }

  function clearWeekDayChecks() {
    setMondayChecked(false);
    setTuesdayChecked(false);
    setWednesdayChecked(false);
    setThursdayChecked(false);
    setFridayChecked(false);
    setSaturdayChecked(false);
    setSundayChecked(false);
  }

  function changeNewTaskDescription(e) {
    setNewTaskDescription(e.target.value);
  }

  function changeEditTaskDescription(e) {
    setEditTaskDescription(e.target.value);
  }

  function changeEditTaskWeekDays(items) {
    var days = [];
    for (var i in items) {
      days.push(items[i].value);
    }
    setEditTaskDays(items);
  }

  function submitEditTask(e) {
    e.preventDefault();
    var days = editTaskDays
      .map((item) => {
        return item.value;
      })
      .join(",");

    var start_time = "";
    var end_time = "";

    if (enableEditStartTime == true) {
      start_time = selectedEditStartTime;
    }

    if (enableEditEndTime == true) {
      end_time = selectedEditEndTime;
    }

    axios
      .post(config.BASE_URL + "/api/edit-recurrent-task", {
        task_id: editTaskId,
        days: days,
        start_time: moment(start_time, "HH:mm")
          .set({ year: 1970, month: 0, date: 1 })
          .format("YYYY-MM-DD HH:mm"),
        end_time: moment(end_time, "HH:mm")
          .set({ year: 1970, month: 0, date: 1 })
          .format("YYYY-MM-DD HH:mm"),
        description: editTaskDescription,
        folder_id: editTaskFolderId,
        sort_index: editTaskSortIndex,
        task_type: editTaskType,
        alert_active: editAlertActive,
        alert_text: editAlertText,
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          loadTasks();
          var modal = bootstrap.Modal.getOrCreateInstance(
            document.querySelector(".editTaskModal"),
          );
          modal.hide();
          setEditTask({
            task_id: 0,
            description: "",
            time: "",
            days: "",
          });
          setSelectedWeekDays([]);
          clearWeekDayChecks();
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function deleteTask(task_id) {
    MySwal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this task?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#7a7a7a",
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .post(config.BASE_URL + "/api/delete-task", { task_id: task_id })
          .then(function (response) {
            if (response.data.status == "OK") {
              loadTasks();
            } else {
              alert(response.data.error);
            }
          })
          .catch(function (err) {
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
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .post(config.BASE_URL + "/api/delete-folder", {
            folder_id: folder_id,
          })
          .then(function (response) {
            if (response.data.status == "OK") {
              navigate("/home");
            } else {
              alert(response.data.error);
            }
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    });
  }

  function updateTaskDone(e, task_id, index) {
    var dt = toLocaleISOString(dates[index]).split("T")[0];
    axios
      .post(config.BASE_URL + "/api/update-recurrent-task-done", {
        task_id: task_id,
        is_done: e.target.checked,
        date: dt,
      })
      .then(function (response) {
        if (response.data.status == "OK") {
          loadTasks();
        } else {
          alert(response.data.error);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function compareDates(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function dateIsLessThan(a, b) {
    return (
      a.getFullYear() < b.getFullYear() ||
      (a.getFullYear() == b.getFullYear() && a.getMonth() < b.getMonth()) ||
      (a.getFullYear() == b.getFullYear() &&
        a.getMonth() == b.getMonth() &&
        a.getDate() < b.getDate())
    );
  }

  async function getChecksVisible(task) {
    if (task.days != "") {
      var checks_visible = task.days.split(",");
      checks_visible = checks_visible.map(Number);
      var idx_arr = [1, 2, 3, 4, 5, 6, 0];
      for (var i in dates) {
        if (dateIsLessThan(dates[i], new Date(task.created_at.split("T")[0]))) {
          checks_visible = checks_visible.filter((item) => {
            return idx_arr.indexOf(item) != Number(i);
          });
        }
      }
      console.log(checks_visible);
      return checks_visible;
    } else {
      return [];
    }
  }

  function loadTasks() {
    axios
      .get(config.BASE_URL + "/api/get-recurrent-tasks", {
        params: {
          folder_id: folder_id,
          dti: toLocaleISOString(dates[0]).split("T")[0],
          dtf: toLocaleISOString(dates[6]).split("T")[0],
        },
      })
      .then(async function (response) {
        if (response.data.status == "OK") {
          var new_data = response.data.data.map((task) => ({
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
      .catch(function (err) {
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
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
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
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
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
    setNewTaskSortIndex(tasks.length);
  }, [tasks]);

  useEffect(() => {
    if (dates.length > 0) {
      loadTasks();
    }
  }, [dates]);

  useEffect(() => {
    if (newStartTimeRef.current) {
      newStartTimeRef.current.setActive(enableNewStartTime);
    }
  }, [enableNewStartTime]);

  useEffect(() => {
    if (newEndTimeRef.current) {
      newEndTimeRef.current.setActive(enableNewEndTime);
    }
  }, [enableNewEndTime]);

  useEffect(() => {
    if (editStartTimeRef.current) {
      editStartTimeRef.current.setActive(enableEditStartTime);
    }
  }, [enableEditStartTime]);

  useEffect(() => {
    if (editEndTimeRef.current) {
      editEndTimeRef.current.setActive(enableEditEndTime);
    }
  }, [enableEditEndTime]);

  useEffect(() => {
    setDays(getDays());
    setDates(getDates());
  }, []);
  return (
    <>
      <div className="row">
        <div className="col-md-6">
          <p>
            <b>Total tasks today:</b> {totalTasks}
          </p>
          <p>
            <b>Tasks done today:</b> {nrTasksDone}
          </p>
          <p>
            <b>Tasks pending today:</b> {nrTasksPending}
          </p>
        </div>
        <div className="col-md-6">
          <div className="buttons-menu-recurrent my-3">
            <button className="btn btn-primary" onClick={previousWeek}>
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button className="btn btn-primary" onClick={nextWeek}>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
            <button className="btn btn-success" onClick={openAddTask}>
              Add Task
            </button>
            <div class="dropdown">
              <button
                class="btn btn-secondary dropdown-toggle"
                type="button"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Options
              </button>
              <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li>
                  <a class="dropdown-item" href="#" onClick={deleteFolder}>
                    Delete folder
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <table className="table table-striped table-bordered align-middle recurrent-tasks">
        <thead class="table-dark">
          <tr>
            <th style={{ width: "45%" }}>Task</th>
            <th style={{ width: "10%" }}>Time</th>
            <th style={{ width: "5%" }}>
              Mon <br />
              {days[0]}
            </th>
            <th style={{ width: "5%" }}>
              Tue <br />
              {days[1]}
            </th>
            <th style={{ width: "5%" }}>
              Wed <br />
              {days[2]}
            </th>
            <th style={{ width: "5%" }}>
              Thu <br />
              {days[3]}
            </th>
            <th style={{ width: "5%" }}>
              Fri <br />
              {days[4]}
            </th>
            <th style={{ width: "5%" }}>
              Sat <br />
              {days[5]}
            </th>
            <th style={{ width: "5%" }}>
              Sun <br />
              {days[6]}
            </th>
            <th style={{ width: "10%" }}>Actions</th>
          </tr>
        </thead>
        <TBodyPlain
          key={Math.random()}
          data={tasks}
          updateTaskDone={updateTaskDone}
          openEditTask={openEditTask}
          deleteTask={deleteTask}
          cancelTask={cancelTask}
          uncancelTask={uncancelTask}
          restartTask={restartTask}
        />
      </table>
      <div class="modal addTaskModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Task</h5>
              <button
                type="button"
                class="btn-close"
                onClick={closeAddTask}
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitAddTask}>
                <div className="form-group py-2">
                  <label className="control-label">Description</label>
                  <div>
                    <textarea
                      className="form-control input-lg"
                      name="description"
                      value={newTaskDescription}
                      onChange={changeNewTaskDescription}
                    ></textarea>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start Time</label>
                  <div>
                    <input
                      type="checkbox"
                      checked={enableNewStartTime}
                      onChange={changeEnableNewStartTime}
                    />
                    <TimePicker
                      ref={newStartTimeRef}
                      format="24"
                      minuteStep={5}
                      defaultValue={selectedNewStartTime}
                      onChange={(str, obj) => setSelectedNewStartTime(str)}
                      className="mx-2"
                      onReady={(pickerInstance) => {
                        pickerInstance.setActive(false);
                      }}
                    />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End Time</label>
                  <div>
                    <input
                      type="checkbox"
                      checked={enableNewEndTime}
                      onChange={changeEnableNewEndTime}
                    />
                    <TimePicker
                      ref={newEndTimeRef}
                      format="24"
                      minuteStep={5}
                      defaultValue={selectedNewEndTime}
                      onChange={(str, obj) => setSelectedNewEndTime(str)}
                      className="mx-2"
                      onReady={(pickerInstance) => {
                        pickerInstance.setActive(false);
                      }}
                    />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Week Days</label>
                  <div className="my-2">
                    <input
                      type="checkbox"
                      checked={mondayChecked}
                      onChange={toggleMonday}
                    />{" "}
                    Monday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={tuesdayChecked}
                      onChange={toggleTuesday}
                    />{" "}
                    Tuesday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={wednesdayChecked}
                      onChange={toggleWednesday}
                    />{" "}
                    Wesnesday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={thursdayChecked}
                      onChange={toggleThursday}
                    />{" "}
                    Thursday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={fridayChecked}
                      onChange={toggleFriday}
                    />{" "}
                    Friday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={saturdayChecked}
                      onChange={toggleSaturday}
                    />{" "}
                    Saturday
                    <br />
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={sundayChecked}
                      onChange={toggleSunday}
                    />{" "}
                    Sunday
                  </div>
                </div>
                <div className="form-group py-2">
                  <input
                    type="checkbox"
                    checked={newAlertActive}
                    onChange={toggleNewAlertActive}
                  />
                  <label>Alert</label>
                </div>
                {newAlertActive && (
                  <div className="form-group py-2">
                    <label>Alert Text</label>
                    <textarea
                      className="form-control"
                      value={newAlertText}
                      onChange={(e) => setNewAlertText(e.target.value)}
                    ></textarea>
                  </div>
                )}
                <div className="form-group">
                  <div style={{ textAlign: "right" }}>
                    <button type="submit" className="btn btn-primary">
                      Add
                    </button>
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
              <button
                type="button"
                class="btn-close"
                onClick={closeEditTask}
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitEditTask}>
                <div className="form-group py-2">
                  <label className="control-label">Description</label>
                  <div>
                    <textarea
                      className="form-control input-lg"
                      name="description"
                      value={editTaskDescription}
                      onChange={changeEditTaskDescription}
                    ></textarea>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Start Time</label>
                  <div>
                    <input
                      type="checkbox"
                      checked={enableEditStartTime}
                      onChange={changeEnableEditStartTime}
                    />
                    <TimePicker
                      ref={editStartTimeRef}
                      format="24"
                      minuteStep={5}
                      defaultValue={selectedEditStartTime}
                      onChange={(str, obj) => setSelectedEditStartTime(str)}
                      className="mx-2"
                      onReady={(pickerInstance) => {
                        pickerInstance.setActive(false);
                      }}
                    />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">End Time</label>
                  <div>
                    <input
                      type="checkbox"
                      checked={enableEditEndTime}
                      onChange={changeEnableEditEndTime}
                    />
                    <TimePicker
                      ref={editEndTimeRef}
                      format="24"
                      minuteStep={5}
                      defaultValue={selectedEditEndTime}
                      onChange={(str, obj) => setSelectedEditEndTime(str)}
                      className="mx-2"
                      onReady={(pickerInstance) => {
                        pickerInstance.setActive(false);
                      }}
                    />
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Week Days</label>
                  <div className="my-2">
                    <input
                      type="checkbox"
                      checked={mondayChecked}
                      onChange={toggleMonday}
                    />{" "}
                    Monday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={tuesdayChecked}
                      onChange={toggleTuesday}
                    />{" "}
                    Tuesday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={wednesdayChecked}
                      onChange={toggleWednesday}
                    />{" "}
                    Wesnesday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={thursdayChecked}
                      onChange={toggleThursday}
                    />{" "}
                    Thursday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={fridayChecked}
                      onChange={toggleFriday}
                    />{" "}
                    Friday
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={saturdayChecked}
                      onChange={toggleSaturday}
                    />{" "}
                    Saturday
                    <br />
                  </div>
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={sundayChecked}
                      onChange={toggleSunday}
                    />{" "}
                    Sunday
                  </div>
                </div>
                <div class="form-group py-2">
                  <input
                    type="checkbox"
                    checked={editAlertActive}
                    onChange={toggleEditAlertActive}
                  />
                  <label>Alert</label>
                </div>
                {editAlertActive && (
                  <div className="form-group py-2">
                    <label>Alert Text</label>
                    <textarea
                      className="form-control"
                      value={editAlertText}
                      onChange={(e) => setEditAlertText(e.target.value)}
                    ></textarea>
                  </div>
                )}
                <div className="form-group">
                  <div style={{ textAlign: "right" }}>
                    <button type="submit" className="btn btn-primary">
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
