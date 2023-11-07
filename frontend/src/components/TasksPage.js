import React, {useEffect, useState} from 'react';
import Tasks from './Tasks';
import RecurrentTasks from './RecurrentTasks';
import TasksList from './TasksList';
import $ from 'jquery';
import axios from 'axios';
import config from '../config';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
var bootprompt = require('bootprompt');

export default function TasksPage({folder_id}) {
  const [folder, setFolder] = useState({});

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
    });
  }

  function openEditFolderName() {
    bootprompt.prompt({
      title: "Edit Folder Name",
      value: folder.name
    }, (result) => {
      if (result == null) {
        return;
      }
      submitEditFolderName(result);
    });
  }

  function renderTasksElement() {
    if (folder.type == "simple") {
      return (<Tasks folder_id={folder_id} folder={folder} />);
    }
    else if (folder.type == "list") {
      return (<TasksList folder_id={folder_id} folder={folder} />);
    }
    else {
      return (<RecurrentTasks folder_id={folder_id} folder={folder} />);
    }
  }

  useEffect(() => {
    getFolderInfo(folder_id);
  }, []);
  return (
    <div className="page">
        <div style={{textAlign: "center"}}>
            <h3>{folder.name}<a href="#" className="edit-folder-name-btn" onClick={openEditFolderName}><i class="fa-solid fa-pencil"></i></a></h3>
        </div>
        {renderTasksElement()}
    </div>
  )
}
