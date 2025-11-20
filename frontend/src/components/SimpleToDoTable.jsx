import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

export default function SimpleToDoTable({title, tasks, setTasks, folder_id, selectedDate, loadTasks}) {
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingDescription, setEditingDescription] = useState("");

  function changeNewTaskDescription(e) {
    setNewTaskDescription(e.target.value);
  }

  function addTask() {
    if (!newTaskDescription) return;

    const newTask = {
      folder_id: folder_id,
      description: newTaskDescription,
      is_done: false,
      sort_index: tasks.length,
      tdate: selectedDate,
      eisenhower_category: 'Not Urgent and Not Important'
    };

    axios.post(config.BASE_URL + "/api/add-daily-todo-task", newTask)
    .then(function(response) {
      if (response.data.status == "OK") {
        setTasks([...tasks, {
          id: response.data.data.insertId,
          ...newTask
        }]);
        setNewTaskDescription("");
      }
      else {
        MySwal.fire("Error: " + response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire("Connection Error");
    });
  }

  function updateTaskDone(e, task_id) {
    console.log(e.target.checked);
    let data = {
      task_id,
      is_done: e.target.checked
    }
    axios.post("/api/update-daily-todo-task-done", data)
    .then(function(response) {
      if (response.data.status == "OK") {
        console.log("Task has been updated.");
        loadTasks(selectedDate);
      }
      else {
        MySwal.fire("Error updating task.");
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error updating task.");
    })
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setEditingDescription(task.description);
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setEditingDescription("");
  }

  function saveTaskDescription(task_id) {
    if (!editingDescription.trim()) {
      MySwal.fire("Task description cannot be empty");
      return;
    }

    const data = {
      task_id: task_id,
      description: editingDescription
    };

    axios.post(config.BASE_URL + "/api/update-daily-todo-task-description", data)
    .then(function(response) {
      if (response.data.status == "OK") {
        // Update the task in the local state
        setTasks(tasks.map(task => 
          task.id === task_id 
            ? { ...task, description: editingDescription }
            : task
        ));
        setEditingTaskId(null);
        setEditingDescription("");
      }
      else {
        MySwal.fire("Error: " + response.data.error);
      }
    })
    .catch(function(err) {
      MySwal.fire("Connection Error");
    });
  }

  function deleteTask(task_id) {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          task_id: task_id
        };

        axios.delete(config.BASE_URL + "/api/delete-daily-todo-task", { data })
        .then(function(response) {
          if (response.data.status == "OK") {
            // Remove the task from the local state
            setTasks(tasks.filter(task => task.id !== task_id));
            MySwal.fire(
              'Deleted!',
              'Your task has been deleted.',
              'success'
            );
          }
          else {
            MySwal.fire("Error: " + response.data.error);
          }
        })
        .catch(function(err) {
          MySwal.fire("Connection Error");
        });
      }
    });
  }

  return (
    <>
      <h2>{title}</h2>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th></th>
            <th>Task</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td><input type="checkbox" checked={t.is_done} onChange={(e) => { updateTaskDone(e, t.id) }} /></td>
              <td>
                {editingTaskId === t.id ? (
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={editingDescription} 
                    onChange={(e) => setEditingDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveTaskDescription(t.id);
                      }
                      if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                  />
                ) : (
                  <span onDoubleClick={() => startEditingTask(t)}>{t.description}</span>
                )}
              </td>
              <td>
                {editingTaskId === t.id ? (
                  <div>
                    <button 
                      className="btn btn-success btn-sm me-2" 
                      onClick={() => saveTaskDescription(t.id)}
                    >
                      <i className="fas fa-check" />
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={cancelEditing}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button 
                      className="btn btn-primary btn-sm me-2" 
                      onClick={() => startEditingTask(t)}
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => deleteTask(t.id)}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td>
              <textarea className="form-control mt-2" rows="2" placeholder="Enter task description..." value={newTaskDescription} onChange={changeNewTaskDescription}></textarea>
            </td>
            <td><button className="btn btn-success" onClick={addTask}><i className="fas fa-plus" /></button></td>
          </tr>
        </tfoot>
      </table>
    </>
  )
}
