import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

export default function DailyToDos({title, tasks, setTasks}) {
  return (
    <>
      <h2>{title}</h2>
      <table></table>
    </>
  )
}
