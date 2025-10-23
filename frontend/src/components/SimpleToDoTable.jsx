import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

export default function SimpleToDoTable({title, tasks, setTasks, folder_id, selectedDate}) {
  const [newTaskDescription, setNewTaskDescription] = useState("");

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
      tdate: selectedDate
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

  return (
    <>
      <h2>{title}</h2>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th></th>
            <th>Task</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td><input type="checkbox" /></td>
              <td>{t.description}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td><input type="text" className="form-control" value={newTaskDescription} onChange={changeNewTaskDescription} /></td>
            <td><button className="btn btn-success" onClick={addTask}><i className="fas fa-plus" /></button></td>
          </tr>
        </tfoot>
      </table>
    </>
  )
}
