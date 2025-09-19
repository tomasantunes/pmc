import React, {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TasksPage from './TasksPage';

export default function FolderPage() {
  var params = useParams();
  const id = params.id;
  
  return (
    <>
      <Sidebar />
      <TasksPage folder_id={id} />
    </>
  )
}
