import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import {i18n, getLanguages, setLanguage} from '../libs/translations';

var languages_arr = getLanguages();

export default function LandingPage() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState(languages_arr);

  return (
    <>
      {/* HERO */}
      <section className="bg-dark text-light py-5">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">
            {i18n("PMC – Productivity Management Center")}
          </h1>
          <p className="lead mb-4">
            {i18n("One centralized system to organize your tasks, time, and schedule — designed for clarity, consistency, and long-term productivity.")}
          </p>

          <button
            className="btn btn-primary btn-lg px-4"
            onClick={() => window.location.href = 'mailto:general@paken.xyz'}
          >
            {i18n("Choose your PMC plan")}
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">{i18n("Everything you need to stay productive")}</h2>
            <p className="text-muted">
              {i18n("PMC adapts to your workflow instead of forcing you into one.")}
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                title: i18n("Tasks"),
                text: i18n("Create, organize, and track tasks with clarity and focus.")
              },
              {
                title: i18n("Recurrent Tasks"),
                text: i18n("Manage repeating work without mental overhead.")
              },
              {
                title: i18n("Monthly Tasks"),
                text: i18n("Plan higher-level objectives and long-term commitments.")
              },
              {
                title: i18n("Daily To-Dos"),
                text: i18n("Stay grounded with a clear daily execution list.")
              },
              {
                title: i18n("Schedule"),
                text: i18n("Structure your time intentionally and avoid chaos.")
              },
              {
                title: i18n("Time Tracker"),
                text: i18n("Understand where your time really goes.")
              },
              {
                title: i18n("Calendar"),
                text: i18n("Visualize tasks, events, and workload in one place.")
              }
            ].map((feature, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title fw-semibold">
                      {feature.title}
                    </h5>
                    <p className="card-text text-muted">
                      {feature.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-light py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-4">{i18n("Licenses")}</h2>
          <div className="row g-4 justify-content-center mb-5">
            {[
              { name: "Individual", price: "50€", users: "1 user" },
              { name: "Small Teams", price: "200€", users: "Up to 10 users" },
              { name: "Enterprise", price: "500€", users: "Up to 100 users" }
            ].map((plan) => <div className="col-md-4" key={plan.name}>
              <div className="card h-100 shadow-sm"><div className="card-body d-flex flex-column">
                <h3 className="fw-bold">{i18n(plan.name)}</h3>
                <div className="display-6 my-2">{i18n(plan.price + " / Year")}</div>
                <p className="text-muted">{i18n(plan.users)}</p>
                <p>{i18n("Full access to all current and future features.")}</p>
                <button className="btn btn-success btn-lg mt-auto" onClick={() => window.location.href = `mailto:general@paken.xyz?subject=PMC ${plan.name} license`}>
                  {i18n("Contact to Subscribe")}
                </button>
              </div></div>
            </div>)}
          </div>
          <div>
            <p className="text-muted mb-3">
              {i18n("Already have an account?")}
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/login')}
              style={{maxWidth: "350px", width: "100%"}}
            >
              {i18n("Login")}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-4 bg-dark text-light">
        <div className="container text-center">
          <small style={{color: "white"}}>
            © {new Date().getFullYear()} Paken
            <br />
            {i18n("Contact")}: general@paken.xyz
          </small>
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                {i18n("Language")}
            </button>
            <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                {languages.map((l) => (
                    <li><div class="set-language-btn" onClick={() => setLanguage(l.languageCode)}>{l.languageName}</div></li>
                ))}
            </ul>
        </div>
        </div>
      </footer>
    </>
  )
}
