import './App.css';
import React, {useEffect, useState} from 'react';
import Home from './components/Home';
import FolderPage from './components/FolderPage';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GithubTasks from './components/GithubTasks';
import Motivation from './components/Motivation';
import Calendar from './components/Calendar';
import RandomTask from './components/RandomTask';
import Schedule from './components/Schedule';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/folder/:id" element={<FolderPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/github-tasks" element={<GithubTasks />} />
        <Route path="/motivation" element={<Motivation />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/random-task" element={<RandomTask />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </Router>
  );
}

export default App;
