import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate} from 'react-router-dom';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  function changeUser(event) {
    setUser(event.target.value);
  }

  function changePass(event) {
    setPass(event.target.value);
  }

  function requestLogin(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/check-login", {user, pass})
    .then(async res => {
      if (res.data.status == "OK") {
        if ("credentials" in navigator) {
          const cred = new PasswordCredential({
            id: user,
            password: pass,
          });
          await navigator.credentials.store(cred);
        }
        navigate("/home");
      }
      else {
        MySwal.fire(res.data.error);
      }
    })
    .catch(err => {
      MySwal.fire(err.message);
    });
  }

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.target.form.dispatchEvent(new Event("submit", {cancelable: true, bubbles: true}));
    }
  };

  return (
    <>
      <form onSubmit={(e) => requestLogin(e)} method="POST" action="/login" autoComplete="on" className="login-box">
        <div style={{textAlign: "center"}}>
          <h3>Login</h3>
        </div>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            value={user}
            onChange={changeUser}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={pass}
            onChange={changePass}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
        </div>

        <div className="text-end">
            <button className="btn btn-primary" type="submit">Login</button>
        </div>
      </form>
    </>
  )
}
