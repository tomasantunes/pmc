import React, {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import axios from 'axios';
import config from '../config.json';

export default function Home() {
  return (
    <>
      <Sidebar />
      <div className="page">
        <Stats />
      </div>
    </>
  )
}
