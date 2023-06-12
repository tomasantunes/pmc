import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';
import Select from 'react-select';
import {Link, useNavigate} from 'react-router-dom';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
var bootprompt = require('bootprompt');

export default function Sidebar() {
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState({
    name: "",
    type: "",
  });
  const [selectedFolderType, setSelectedFolderType] = useState();
  var navigate = useNavigate();

  const folderTypes = [
    { value: 'simple', label: 'Simple' },
    { value: 'recurrent', label: 'Recurrent' },
  ]

  function loadFolders() {
    setFolders([]);
    axios.get(config.BASE_URL + "/api/get-folders")
    .then(function(response) {
      if (response.data.status == "OK") {
        setFolders(response.data.data);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  function submitAddFolder(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/add-folder", newFolder)
    .then(function(response) {
      if (response.data.status == "OK") {
        loadFolders();
        closeAddFolder();
        navigate("/folder/" + response.data.data.insertId);
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

  function openAddFolder() {
    $('.addFolderModal').modal('show');
  }

  function closeAddFolder() {
    $('.addFolderModal').modal('hide');
    setNewFolder({
      name: "",
      type: "",
    });
    setSelectedFolderType({});
  }

  function changeNewFolderType(item) {
    setNewFolder({
      ...newFolder,
      type: item.value
    });
    setSelectedFolderType(item);
  }

  function changeNewFolderName(e) {
    setNewFolder({
      ...newFolder,
      name: e.target.value
    });
  }


  function goToLink(link) {
    navigate(link);
    window.location.reload();
  }

  useEffect(() => {
    loadFolders();
  }, []);
  return (
    <>
      <div className="sidebar">
          <h1><b>PMC</b></h1>
          <ul className="menu">
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/github-tasks">Github Tasks</Link></li>
              <li><a href="#" onClick={openAddFolder}>Add Folder</a></li>
              {folders.map((folder) => {
                return (
                  <li key={folder.id}><a href="#" onClick={() => goToLink("/folder/" + folder.id)}>{folder.name}</a></li>
                )
              })}
          </ul>
      </div>
      <div class="modal addFolderModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Folder</h5>
              <button type="button" class="btn-close" onClick={closeAddFolder} aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitAddFolder}>
                <div className="form-group py-2">
                  <label className="control-label">Name</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="name" value={newFolder.name} onChange={changeNewFolderName}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">Type</label>
                  <Select value={selectedFolderType} options={folderTypes} onChange={changeNewFolderType} />
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
    </>
  )
}
