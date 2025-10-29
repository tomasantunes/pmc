import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Tasks from './Tasks';
import RecurrentTasks from './RecurrentTasks';
import MonthlyTasks from './MonthlyTasks';
import TasksList from './TasksList';
import DailyToDos from './DailyToDos';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

export default function TasksPage({folder_id}) {
  const [folder, setFolder] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  function getFolderInfo(folder_id) {
    axios.get(config.BASE_URL + "/api/get-folder", {
      params: {
        folder_id: folder_id
      }
    })
    .then(function(response) {
      if (response.data.status === "OK") {
        setFolder(response.data.data);
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error: " + err.message);
    });

  }

  function submitEditFolderName(name) {
    axios.post(config.BASE_URL + "/api/edit-folder-name", {
      folder_id: folder_id,
      name: name
    })
    .then(function(response) {
      if (response.data.status === "OK") {
        getFolderInfo(folder_id);
      }
    })
    .catch(function(err) {
      console.log(err);
      MySwal.fire("Error: " + err.message);
    });
  }

  function openEditFolderName() {
    MySwal.fire({
      title: 'Edit Folder Name',
      input: 'text',
      inputLabel: 'Folder Name',
      inputPlaceholder: 'Type your folder name here...',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        submitEditFolderName(result.value);
      }
    });
  }

  function renderTasksElement() {
    switch(folder.type) {
      case "simple":
        return (<Tasks folder_id={folder_id} folder={folder} />);
        break;
      case "list":
        return (<TasksList folder_id={folder_id} folder={folder} />);
        break;
      case "recurrent":
        return (<RecurrentTasks folder_id={folder_id} folder={folder} />);
        break;
      case "monthly":
        return (<MonthlyTasks folder_id={folder_id} folder={folder} />);
        break;
      case "daily-todos":
        return (<DailyToDos folder_id={folder_id} folder={folder} />);
        break;
      default:
        // do nothing
    }
  }

  function checkLogin() {
    axios.post(config.BASE_URL + "/check-login")
    .then(response => {
      if (response.data.status === "OK") {
        setIsLoggedIn(true);
      }
      else {
        navigate('/login');
      }
    })
    .catch(error => {
      navigate('/login');
    });
  }

  useEffect(() => {
    checkLogin();
    getFolderInfo(folder_id);
  }, []);


  if (isLoggedIn) {
    return (
      <div className="page">
          <div style={{textAlign: "center"}}>
              <h3>{folder.name}<a href="#" className="edit-folder-name-btn" onClick={openEditFolderName}><i class="fa-solid fa-pencil"></i></a></h3>
          </div>
          {renderTasksElement()}
      </div>
    );
  }
  else {
    return (<></>);
  }
}
