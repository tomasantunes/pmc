import React, {useEffect, useState} from 'react';
import Chart from "react-apexcharts";
import axios from 'axios';
import config from '../config';

export default function Stats() {
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [recurrentTasksTotal, setRecurrentTasksTotal] = useState(0);
  const [recurrentTasksDone, setRecurrentTasksDone] = useState(0);
  const [totalAllTasks, setTotalAllTasks] = useState(0);
  const [totalAllTasksDone, setTotalAllTasksDone] = useState(0);
  const [totalAllRecurrentTasks, setTotalAllRecurrentTasks] = useState(0);
  const [totalAllRecurrentTasksDone, setTotalAllRecurrentTasksDone] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [recurrentTasksTodayProgressPercentage, setRecurrentTasksTodayProgressPercentage] = useState(0);

  const [tasksLast15Days, setTasksLast15Days] = useState({
    series: [{ name: "Tasks Done", data: [] }],
    options: {
      chart: {
        type: "bar",
        height: 350,
        toolbar: { show: false },
      },
      xaxis: {
        categories: [],
        title: { text: "Date" },
      },
      yaxis: {
        title: { text: "Tasks Done" },
        min: 0,
        forceNiceScale: true,
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: "50%",
        },
      },
      dataLabels: {
        enabled: true,
      },
      title: {
        text: "Tasks Done in the Last 15 Days",
        align: "center",
      },
      subtitle: {
        text: "Includes both simple and recurrent tasks",
        align: "center",
      }
    },
  });

  function loadStats() {
    axios.get(config.BASE_URL + "/api/get-stats")
    .then(function(response) {
      if (response.data.status == "OK") {
        setTasksDone(response.data.data.total_tasks_done);
        setTasksTotal(response.data.data.total_tasks);
        setRecurrentTasksDone(response.data.data.recurrent_tasks_done);
        setRecurrentTasksTotal(response.data.data.recurrent_tasks);

        var total_tasks = response.data.data.total_tasks;
        var total_tasks_done = response.data.data.total_tasks_done;
        var perc = Math.round((total_tasks_done / total_tasks) * 100);
        if (isNaN(perc)) {
          perc = 0;
        }
        setProgressPercentage(perc);

        var perc2 = Math.round((response.data.data.recurrent_tasks_done / response.data.data.recurrent_tasks) * 100);
        if (isNaN(perc2)) {
          perc2 = 0;
        }
        setRecurrentTasksTodayProgressPercentage(perc2);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });

    /*
    axios.get(config.BASE_URL + "/api/get-stats2")
    .then(function(response) {
      console.log(response.data);
      if (response.data.status == "OK") {
        setTotalAllTasks(response.data.data.total_all_tasks);
        setTotalAllTasksDone(response.data.data.total_all_tasks_done);
        setTotalAllRecurrentTasks(response.data.data.total_recurrent_tasks);
        setTotalAllRecurrentTasksDone(response.data.data.total_recurrent_tasks_done);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
    */
  }

  function loadTasksLast15Days() {
    axios.get(config.BASE_URL + "/api/get-count-tasks-last-15-days")
    .then(function(response) {
      if (response.data.status == "OK") {
        const sorted = response.data.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setTasksLast15Days((prev) => ({
          ...prev,
          series: [{ name: "Tasks Done", data: sorted.map((d) => d.done_count) }],
          options: {
            ...prev.options,
            xaxis: { ...prev.options.xaxis, categories: sorted.map((d) => d.date) },
          },
        }));
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  useEffect(() => {
    loadStats();
    loadTasksLast15Days();
  }, []);
  return (
    <>
      <h2>Stats</h2>
      <table className="table table-sm table-bordered small-table">
        <tbody>
          <tr>
            <th className="table-dark bg-blue">Total Simple Tasks</th>
            <td className="text-center">{tasksTotal}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Total Simple Tasks Done</th>
            <td className="text-center">{tasksDone}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Recurrent Tasks Today</th>
            <td className="text-center">{recurrentTasksTotal}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Recurrent Tasks Done Today</th>
            <td className="text-center">{recurrentTasksDone}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Total Tasks Progress</th>
            <td className="text-center">{progressPercentage}%</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Recurrent Tasks Today Progress</th>
            <td className="text-center">{recurrentTasksTodayProgressPercentage}%</td>
          </tr>
          {/*}
          <tr>
            <th className="table-dark bg-blue">Total Tasks</th>
            <td className="text-center">{totalAllTasks}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Total Tasks Done</th>
            <td className="text-center">{totalAllTasksDone}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Total Recurrent Tasks</th>
            <td className="text-center">{totalAllRecurrentTasks}</td>
          </tr>
          <tr>
            <th className="table-dark bg-blue">Total Recurrent Tasks Done</th>
            <td className="text-center">{totalAllRecurrentTasksDone}</td>
          </tr>*/}
        </tbody>
      </table>
      <Chart
        options={tasksLast15Days.options}
        series={tasksLast15Days.series}
        type="bar"
        height={500}
      />
    </>
  )
}
