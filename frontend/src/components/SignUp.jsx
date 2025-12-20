import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate} from 'react-router-dom';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default function SignUp() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const navigate = useNavigate();

  function changeUser(event) {
    setUser(event.target.value);
  }

  function changePass(event) {
    setPass(event.target.value);
  }

  function requestSignUp(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/sign-up", {user, email, pass, confirmPass})
    .then(async res => {
      if (res.data.status == "OK") {
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
        onSubmit={(e) => requestSignUp(e)} 
        autoComplete="on" 
        className="card shadow-sm p-4 mx-auto mt-5"
        style={{ maxWidth: "420px" }}
      >
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-0">PMC</h1>
          <small className="text-muted">Productivity Management Center</small>
        </div>

        <h4 className="text-center mb-3">Sign Up</h4>

        <div className="form-floating mb-3">
          <input
            type="text"
            id="username"
            name="username"
            value={user}
            onChange={changeUser}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder="Username"
            required
          />
          <label htmlFor="username">Username</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder="Email"
            required
          />
          <label htmlFor="email">Email</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="password"
            id="password"
            name="password"
            value={pass}
            onChange={changePass}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
          <label htmlFor="password">Password</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
          <label htmlFor="password">Confirm Password</label>
        </div>

        <button className="btn btn-primary w-100 py-2" type="submit">
          Sign Up
        </button>
      </form>
    </>
  )
}
