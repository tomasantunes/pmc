import React, {useState, useEffect} from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);
import SimpleToDoTable from './SimpleToDoTable';

export default function DailyToDos() {
  return (
    <>
      <h1>Daily To-Dos</h1>
    </>
  )
}
