import React, {useEffect, useState, useRef} from 'react';
import axios from 'axios';
import config from '../config';
import Select from 'react-select';
import {Link, useNavigate} from 'react-router-dom';
import {i18n, getLanguages, setLanguage, getCurrentLanguage} from '../libs/translations';
import {exportMindmapPng} from '../libs/mindmapExport';

var languages_arr = getLanguages();
var user_manual_link = getCurrentLanguage() == "en-us" ? "/static/pmc-user-manual.pdf" : "/static/pmc-user-manual-pt.pdf";

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
  const [languages, setLanguages] = useState(languages_arr);
  const [isExportingMindmap, setIsExportingMindmap] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(
    document.documentElement.scrollHeight
  );
  var navigate = useNavigate();

  const folderTypes = [
    { value: 'simple', label: i18n('Simple') },
    { value: 'recurrent', label: i18n('Recurrent') },
    { value: 'monthly', label: i18n('Monthly') },
    { value: 'list', label: i18n('List') },
    { value: 'daily-todos', label: i18n('Daily To-Dos') },
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

  async function downloadMindmap(e) {
    e.preventDefault();
    if (isExportingMindmap) return;

    setIsExportingMindmap(true);
    try {
      const response = await axios.get(config.BASE_URL + "/api/get-mindmap-overview");
      if (response.data.status !== "OK") {
        alert(response.data.error);
        return;
      }

      await exportMindmapPng(response.data.data);
    } catch (err) {
      console.log(err);
      alert(err.message);
    } finally {
      setIsExportingMindmap(false);
    }
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
      <div
        ref={sidebarRef}
        className={collapseSidebarMobile ? "sidebar" : "sidebar open"}
        style={{ height: documentHeight }}
      >
        <h1><b>PMC</b></h1>
        <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                {i18n("Language")}
            </button>
            <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                {languages.map((l) => (
                    <li><div class="set-language-btn" onClick={() => setLanguage(l.languageCode)}>{l.languageName}</div></li>
                ))}
            </ul>
        </div>
        <ul className="menu">
            <li><Link to="/home">{i18n("Home")}</Link></li>
            <li><a href={user_manual_link} target="_blank" rel="noopener noreferrer">{i18n("User Manual")}</a></li>
            <li><Link to="/calendar">{i18n("Calendar")}</Link></li>
            <li><Link to="/schedule">{i18n("Schedule")}</Link></li>
            <li><Link to="/alerts">{i18n("Alerts")}</Link></li>
            <li><Link to="/workflows">{i18n("Workflows")}</Link></li>
            <li><Link to="/time-tracker">{i18n("Time Tracker")}</Link></li>
            <li><Link to="/random-task">{i18n("Random Task")}</Link></li>
            <li><a href="#" onClick={downloadMindmap}>{isExportingMindmap ? i18n("Exporting Mindmap...") : i18n("Export Mindmap")}</a></li>
            {showGithubPage && <li><Link to="/github-tasks">{i18n("Github Tasks")}</Link></li>}
            {/*<li><Link to="/motivation">{i18n("Motivation")}</Link></li>*/}
            <li><a href="#" onClick={openAddFolder}>{i18n("Add Folder")}</a></li>
            {folders.map((folder) => {
              return (
                <li key={folder.id}><a href="#" onClick={() => goToLink("/folder/" + folder.id)}>{folder.name}</a></li>
              )
            })}
            <li><a href="/api/logout">{i18n("Logout")}</a></li>
        </ul>
      </div>
      <div class="modal addFolderModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{i18n("Add Folder")}</h5>
              <button type="button" class="btn-close" onClick={closeAddFolder} aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form onSubmit={submitAddFolder}>
                <div className="form-group py-2">
                  <label className="control-label">{i18n("Name")}</label>
                  <div>
                      <input type="text" className="form-control input-lg" name="name" value={newFolder.name} onChange={changeNewFolderName}/>
                  </div>
                </div>
                <div className="form-group py-2">
                  <label className="control-label">{i18n("Type")}</label>
                  <Select value={selectedFolderType} options={folderTypes} onChange={changeNewFolderType} />
                </div>
                <div className="form-group">
                    <div style={{textAlign: "right"}}>
                        <button type="submit" className="btn btn-primary">{i18n("Add")}</button>
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
