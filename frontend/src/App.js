import './App.css';
import Home from './components/Home';
import FolderPage from './components/FolderPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/folder/:id" element={<FolderPage />} />
      </Routes>
    </Router>
  );
}

export default App;
