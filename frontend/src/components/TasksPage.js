import React from 'react';
import Tasks from './Tasks';

export default function TasksPage() {
  return (
    <div className="page">
        <div style={{textAlign: "center"}}>
            <h3>Tasks</h3>
        </div>
        <Tasks />
    </div>
  )
}
