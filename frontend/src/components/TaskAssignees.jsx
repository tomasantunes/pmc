import React, {useEffect, useState} from 'react';
import axios from 'axios';
import Select from 'react-select';
import config from '../config';
import {i18n} from '../libs/translations';

export default function TaskAssignees({value, onChange, taskId}) {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    axios.get(config.BASE_URL + '/api/organization-users').then((response) => {
      if (response.data.status === 'OK') setOptions(response.data.data.map((u) => ({value: u.id, label: `${u.username} (${u.email})`})));
    });
  }, []);
  useEffect(() => {
    if (!taskId) return;
    axios.get(config.BASE_URL + '/api/task-assignees', {params: {task_id: taskId}}).then((response) => {
      if (response.data.status === 'OK') onChange(response.data.data.map((u) => ({value: u.id, label: `${u.username} (${u.email})`})));
    });
  }, [taskId]);
  return <div className="form-group py-2">
    <label className="control-label">{i18n('Responsible users')}</label>
    <Select isMulti options={options} value={value} onChange={(items) => onChange(items || [])} />
  </div>;
}
