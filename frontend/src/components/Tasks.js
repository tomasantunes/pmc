import React from 'react'

export default function Tasks() {
  return (
    <table className="table table-striped table-bordered align-middle tasks">
        <thead class="table-dark">
            <tr>
                <th style={{width: "10%"}}>Done</th>
                <th style={{width: "70%"}}>Task</th>
                <th style={{width: "20%"}}>Actions</th>
            </tr>
        </thead>
        <tbody class="table-group-divider">
            <tr>
                <td><input type="checkbox" /></td>
                <td>Task 1 - text text text text text text text text text text text text</td>
                <td></td>
            </tr>
        </tbody>
    </table>
  )
}
