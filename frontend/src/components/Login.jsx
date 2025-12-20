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
      <form
        onSubmit={requestLogin}
        method="POST"
        action="/login"
        autoComplete="on"
        className="card shadow-sm p-4 mx-auto mt-5"
        style={{ maxWidth: "420px" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-0">PMC</h1>
          <small className="text-muted">Productivity Management Center</small>
        </div>

        <h4 className="text-center mb-3">Login</h4>

        {/* Username */}
        <div className="form-floating mb-3">
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            value={user}
            onChange={changeUser}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder="Username"
            required
          />
          <label htmlFor="username">Username</label>
        </div>

        {/* Password */}
        <div className="form-floating mb-4">
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={pass}
            onChange={changePass}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder="Password"
            required
          />
          <label htmlFor="password">Password</label>
        </div>

        {/* Submit */}
        <button className="btn btn-primary w-100 py-2" type="submit">
          Login
        </button>

        {/* Links */}
        <div className="text-center mt-4">
          <a href="/sign-up" className="text-muted d-block mb-1">
            Don&apos;t have an account? Sign up
          </a>
          <a href="/forgot-password" className="text-muted d-block mb-1">
            Forgot your password?
          </a>
        </div>
      </form>

    </>
  )
}
