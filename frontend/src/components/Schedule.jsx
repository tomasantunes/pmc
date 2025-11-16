import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import config from '../config.json';
import { toLocaleISOString } from "../libs/utils";
import Sidebar from './Sidebar';
import axios from 'axios';

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dates, setDates] = useState([]);
  const navigate = useNavigate();

  function getDates() {
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var date = new Date();
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function loadSchedule() {
    axios.get(config.BASE_URL + "/api/get-schedule")
    .then((response) => {
      var data = response.data.data;
      let finalObj = {};
      let weekDates = getDates();

      for (let i in weekDates) {
        let dt = toLocaleISOString(weekDates[i]).substring(0, 10);
        finalObj[dt] = [];
      }

      data.forEach((item) => {
        const date = item.start_date.split(' ')[0]
        finalObj[date].push(item);
      });

      console.log(finalObj);
      setSchedule(finalObj);
    })
    .catch((error) => {
      console.log(error);
    });
  }

  function sortByDate(arr) {
    return arr.sort((a, b) => {
      return new Date(a) - new Date(b);
    });
  }

  function checkLogin() {
    axios.post(config.BASE_URL + "/check-login")
    .then(response => {
      if (response.data.status === "OK") {
        setIsLoggedIn(true);
      }
      else {
        navigate('/login');
      }
    })
    .catch(error => {
      navigate('/login');
    });
  }

  useEffect(() => {
    checkLogin();
    loadSchedule();
    setDates(getDates());
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <h2>Schedule</h2>
          <table className="table col-table">
            <thead>
              <tr>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
                <th>Sunday</th>
              </tr>
            </thead>
            <tbody>
                {sortByDate(Object.keys(schedule)).map((day, index) => {
                  let today = toLocaleISOString(dates[index]).substring(0, 10);
                  console.log(today);
                  console.log(day);
                  if (day == today) {
                    return (
                      <tr>
                        {schedule[day].map((item, index) => {
                          return (
                            <td key={index}><div><b>{item.start_date.split(' ')[1].slice(0, 5)} - {item.end_date.split(' ')[1].slice(0, 5)}</b></div>{item.description}</td>
                          )
                        })}
                      </tr>
                    );
                  }
                })}
            </tbody>
          </table>
        </div>
      </>
    )
  }
  else {
    return (<></>);
  }
}
