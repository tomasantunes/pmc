import React, {useEffect, useState, useRef} from 'react';
import axios from 'axios';
import config from '../config';
import Select from 'react-select';
import {Link, useNavigate} from 'react-router-dom';

export default function Sidebar() {
  const sidebarRef = useRef(null);
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState({
    name: "",
    type: "",
  });
  const [selectedFolderType, setSelectedFolderType] = useState();
  const [collapseSidebarMobile, setCollapseSidebarMobile] = useState(true);
  const [showGithubPage, setShowGithubPage] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(
    document.documentElement.scrollHeight
  );
  var navigate = useNavigate();

  const folderTypes = [
    { value: 'simple', label: 'Simple' },
    { value: 'recurrent', label: 'Recurrent' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'list', label: 'List' },
    { value: 'daily-todos', label: 'Daily To-Dos' },
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
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addFolderModal'))
    modal.show();
  }

  function closeAddFolder() {
    var modal = bootstrap.Modal.getOrCreateInstance(document.querySelector('.addFolderModal'))
    modal.hide();
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

  function checkGithubStatus() {
    axios.get(config.BASE_URL + "/api/check-github-status")
    .then(function(response) {
      if (response.data.status == "OK") {
        setShowGithubPage(response.data.data.hasToken);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  const updateHeight = () => {
      const docHeight = document.documentElement.scrollHeight;
      const sidebarHeight = sidebarRef.current?.scrollHeight || 0;
      setDocumentHeight(Math.max(docHeight, sidebarHeight));
    };

  useEffect(() => {
    updateHeight();
  }, [folders]);

  useEffect(() => {
    loadFolders();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.body);
    if (sidebarRef.current) observer.observe(sidebarRef.current);

    updateHeight();
    checkGithubStatus();

    return () => observer.disconnect();
  }, []);
  return (
    <>
      <nav className="mobile-nav d-md-none">
        <span className="brand">PMC</span>
        <button id="menu-toggle" className="btn text-white" onClick={() => setCollapseSidebarMobile(!collapseSidebarMobile)}>
          <i className="fa-solid fa-bars fa-lg"></i> 
        </button>
      </nav>
      <div className={collapseSidebarMobile ? "sidebar": "sidebar open"} style={{height: documentHeight}}>
          <h1><b>PMC</b></h1>
          <ul className="menu">
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/calendar">Calendar</Link></li>
              <li><Link to="/schedule">Schedule</Link></li>
              <li><Link to="/time-tracker">Time Tracker</Link></li>
              <li><Link to="/random-task">Random Task</Link></li>
              {showGithubPage && <li><Link to="/github-tasks">Github Tasks</Link></li>}
              {/*<li><Link to="/motivation">Motivation</Link></li>*/}
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
