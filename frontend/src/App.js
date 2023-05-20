import './App.css';
import Home from './components/Home';
import FolderPage from './components/FolderPage';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GithubTasks from './components/GithubTasks';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/folder/:id" element={<FolderPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/github-tasks" element={<GithubTasks />} />
      </Routes>
    </Router>
  );
}

export default App;
