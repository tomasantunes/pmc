import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
import Sidebar from "./Sidebar";
import { i18n } from "../libs/translations";

const stateRadius = 34;

const emptyWorkflow = {
  states: [],
  transitions: [],
};

function encodeWorkflow(workflow) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(workflow))));
}

function decodeWorkflow(encoded) {
  if (!encoded) return emptyWorkflow;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    return {
      states: Array.isArray(parsed.states) ? parsed.states : [],
      transitions: Array.isArray(parsed.transitions) ? parsed.transitions : [],
    };
  } catch (err) {
    console.log(err);
    return emptyWorkflow;
  }
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function findStateAt(workflow, point) {
  for (let i = workflow.states.length - 1; i >= 0; i -= 1) {
    if (distance(workflow.states[i], point) <= stateRadius) {
      return workflow.states[i];
    }
  }
  return null;
}

function findTransitionAt(workflow, point) {
  for (let i = workflow.transitions.length - 1; i >= 0; i -= 1) {
    const transition = workflow.transitions[i];
    const from = workflow.states.find((state) => state.id === transition.from);
    const to = workflow.states.find((state) => state.id === transition.to);
    if (!from || !to) continue;

    const midpoint = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
    };
    if (distance(midpoint, point) <= 24) {
      return transition;
    }
  }
  return null;
}

function drawArrow(context, from, to, selected) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const start = {
    x: from.x + Math.cos(angle) * stateRadius,
    y: from.y + Math.sin(angle) * stateRadius,
  };
  const end = {
    x: to.x - Math.cos(angle) * stateRadius,
    y: to.y - Math.sin(angle) * stateRadius,
  };

  context.strokeStyle = selected ? "#d9480f" : "#3d4f63";
  context.fillStyle = selected ? "#d9480f" : "#3d4f63";
  context.lineWidth = selected ? 3 : 2;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - 12 * Math.cos(angle - Math.PI / 6), end.y - 12 * Math.sin(angle - Math.PI / 6));
  context.lineTo(end.x - 12 * Math.cos(angle + Math.PI / 6), end.y - 12 * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

export default function Workflows() {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [workflowId, setWorkflowId] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [workflow, setWorkflow] = useState(emptyWorkflow);
  const [mode, setMode] = useState("select");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedTransitionId, setSelectedTransitionId] = useState("");
  const [connectFromId, setConnectFromId] = useState("");
  const [transitionLabel, setTransitionLabel] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const selectedState = workflow.states.find((state) => state.id === selectedStateId);
  const selectedTransition = workflow.transitions.find((transition) => transition.id === selectedTransitionId);

  function checkLogin() {
    axios
      .post(config.BASE_URL + "/check-login")
      .then((response) => {
        if (response.data.status === "OK") {
          setIsLoggedIn(true);
        } else {
          navigate("/login");
        }
      })
      .catch(() => {
        navigate("/login");
      });
  }

  async function loadWorkflows() {
    try {
      const response = await axios.get(`${config.BASE_URL}/api/workflows`);
      if (response.data.status === "OK") {
        setWorkflows(response.data.data);
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function loadWorkflow(id) {
    if (!id) {
      setWorkflowId("");
      setWorkflowName("");
      setWorkflow(emptyWorkflow);
      return;
    }

    try {
      const response = await axios.get(`${config.BASE_URL}/api/workflows/${id}`);
      if (response.data.status === "OK") {
        setWorkflowId(String(response.data.data.id));
        setWorkflowName(response.data.data.name);
        setWorkflow(decodeWorkflow(response.data.data.workflow_json_base64));
        clearSelection();
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function createWorkflow() {
    const name = workflowName.trim() || i18n("New Workflow");
    const initialWorkflow = {
      states: [
        {
          id: makeId("state"),
          label: "Start",
          x: 180,
          y: 160,
          initial: true,
          final: false,
        },
      ],
      transitions: [],
    };

    try {
      const response = await axios.post(`${config.BASE_URL}/api/workflows`, {
        name,
        workflow_json_base64: encodeWorkflow(initialWorkflow),
      });
      if (response.data.status === "OK") {
        await loadWorkflows();
        await loadWorkflow(response.data.data.insertId);
        setStatusMessage("Workflow created.");
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function saveWorkflow() {
    if (!workflowId) {
      await createWorkflow();
      return;
    }

    try {
      const response = await axios.post(`${config.BASE_URL}/api/workflows/${workflowId}`, {
        name: workflowName.trim() || i18n("Workflow"),
        workflow_json_base64: encodeWorkflow(workflow),
      });
      if (response.data.status === "OK") {
        await loadWorkflows();
        setStatusMessage("Workflow saved.");
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function deleteWorkflow() {
    if (!workflowId || !window.confirm(i18n("Are you sure?"))) return;

    try {
      const response = await axios.post(`${config.BASE_URL}/api/workflows/${workflowId}/delete`);
      if (response.data.status === "OK") {
        setWorkflowId("");
        setWorkflowName("");
        setWorkflow(emptyWorkflow);
        clearSelection();
        await loadWorkflows();
        setStatusMessage("Workflow deleted.");
      } else {
        alert(response.data.error);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function clearSelection() {
    setSelectedStateId("");
    setSelectedTransitionId("");
    setConnectFromId("");
  }

  function addState() {
    const nextIndex = workflow.states.length + 1;
    setWorkflow({
      ...workflow,
      states: [
        ...workflow.states,
        {
          id: makeId("state"),
          label: `S${nextIndex}`,
          x: 160 + (nextIndex % 4) * 110,
          y: 140 + Math.floor(nextIndex / 4) * 100,
          initial: workflow.states.length === 0,
          final: false,
        },
      ],
    });
  }

  function updateSelectedState(changes) {
    if (!selectedStateId) return;
    setWorkflow({
      ...workflow,
      states: workflow.states.map((state) => (
        state.id === selectedStateId ? { ...state, ...changes } : state
      )),
    });
  }

  function updateSelectedTransition(changes) {
    if (!selectedTransitionId) return;
    setWorkflow({
      ...workflow,
      transitions: workflow.transitions.map((transition) => (
        transition.id === selectedTransitionId ? { ...transition, ...changes } : transition
      )),
    });
  }

  function deleteSelectedElement() {
    if (selectedStateId) {
      setWorkflow({
        states: workflow.states.filter((state) => state.id !== selectedStateId),
        transitions: workflow.transitions.filter((transition) => (
          transition.from !== selectedStateId && transition.to !== selectedStateId
        )),
      });
      clearSelection();
    } else if (selectedTransitionId) {
      setWorkflow({
        ...workflow,
        transitions: workflow.transitions.filter((transition) => transition.id !== selectedTransitionId),
      });
      clearSelection();
    }
  }

  function handleCanvasMouseDown(event) {
    const canvas = canvasRef.current;
    const point = getCanvasPoint(canvas, event);
    const clickedState = findStateAt(workflow, point);

    if (mode === "connect") {
      if (!clickedState) return;
      setSelectedStateId(clickedState.id);
      setSelectedTransitionId("");

      if (!connectFromId) {
        setConnectFromId(clickedState.id);
      } else if (connectFromId !== clickedState.id) {
        setWorkflow({
          ...workflow,
          transitions: [
            ...workflow.transitions,
            {
              id: makeId("transition"),
              from: connectFromId,
              to: clickedState.id,
              label: transitionLabel || "event",
            },
          ],
        });
        setConnectFromId("");
      }
      return;
    }

    if (clickedState) {
      setSelectedStateId(clickedState.id);
      setSelectedTransitionId("");
      dragRef.current = {
        id: clickedState.id,
        offsetX: point.x - clickedState.x,
        offsetY: point.y - clickedState.y,
      };
      return;
    }

    const clickedTransition = findTransitionAt(workflow, point);
    if (clickedTransition) {
      setSelectedTransitionId(clickedTransition.id);
      setSelectedStateId("");
      return;
    }

    clearSelection();
  }

  function handleCanvasMouseMove(event) {
    if (!dragRef.current) return;

    const canvas = canvasRef.current;
    const point = getCanvasPoint(canvas, event);
    const dragged = dragRef.current;
    setWorkflow({
      ...workflow,
      states: workflow.states.map((state) => (
        state.id === dragged.id
          ? { ...state, x: point.x - dragged.offsetX, y: point.y - dragged.offsetY }
          : state
      )),
    });
  }

  function handleCanvasMouseUp() {
    dragRef.current = null;
  }

  useEffect(() => {
    checkLogin();
    loadWorkflows();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#d8dee6";
    context.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    workflow.transitions.forEach((transition) => {
      const from = workflow.states.find((state) => state.id === transition.from);
      const to = workflow.states.find((state) => state.id === transition.to);
      if (!from || !to) return;

      drawArrow(context, from, to, transition.id === selectedTransitionId);
      context.fillStyle = transition.id === selectedTransitionId ? "#d9480f" : "#1f2937";
      context.font = "13px Arial";
      context.textAlign = "center";
      context.fillText(transition.label || "", (from.x + to.x) / 2, (from.y + to.y) / 2 - 8);
    });

    workflow.states.forEach((state) => {
      const selected = state.id === selectedStateId || state.id === connectFromId;
      context.fillStyle = selected ? "#fff4e6" : "#ffffff";
      context.strokeStyle = selected ? "#d9480f" : "#154775";
      context.lineWidth = selected ? 4 : 2;
      context.beginPath();
      context.arc(state.x, state.y, stateRadius, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      if (state.final) {
        context.beginPath();
        context.arc(state.x, state.y, stateRadius - 7, 0, Math.PI * 2);
        context.stroke();
      }

      if (state.initial) {
        context.strokeStyle = "#198754";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(state.x - stateRadius - 28, state.y);
        context.lineTo(state.x - stateRadius - 4, state.y);
        context.stroke();
        context.fillStyle = "#198754";
        context.beginPath();
        context.moveTo(state.x - stateRadius - 4, state.y);
        context.lineTo(state.x - stateRadius - 14, state.y - 6);
        context.lineTo(state.x - stateRadius - 14, state.y + 6);
        context.closePath();
        context.fill();
      }

      context.fillStyle = "#111827";
      context.font = "bold 14px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(state.label || "", state.x, state.y);
    });
  }, [workflow, selectedStateId, selectedTransitionId, connectFromId]);

  if (!isLoggedIn) {
    return <></>;
  }

  return (
    <>
      <Sidebar />
      <div className="page workflows-page">
        <div className="workflow-header">
          <div>
            <h1>{i18n("Workflows")}</h1>
            <p className="text-muted mb-0">
              {i18n("Drag states to move them. Use Connect, then click two states to add a transition.")}
            </p>
          </div>
          <div className="workflow-actions">
            <button className="btn btn-primary" onClick={createWorkflow}>
              <i className="fa-solid fa-plus me-1"></i>{i18n("New Workflow")}
            </button>
            <button className="btn btn-success" onClick={saveWorkflow} disabled={!workflowName.trim()}>
              <i className="fa-regular fa-floppy-disk me-1"></i>{i18n("Save")}
            </button>
            <button className="btn btn-danger" onClick={deleteWorkflow} disabled={!workflowId}>
              <i className="fa-regular fa-trash-can me-1"></i>{i18n("Delete")}
            </button>
          </div>
        </div>

        <div className="workflow-layout">
          <aside className="workflow-panel">
            <label className="form-label">{i18n("Workflow")}</label>
            <select
              className="form-select mb-3"
              value={workflowId}
              onChange={(event) => loadWorkflow(event.target.value)}
            >
              <option value="">{i18n("No workflow selected.")}</option>
              {workflows.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <label className="form-label">{i18n("Workflow Name")}</label>
            <input
              className="form-control mb-3"
              value={workflowName}
              onChange={(event) => setWorkflowName(event.target.value)}
              placeholder={i18n("New Workflow")}
            />

            <div className="workflow-tool-grid">
              <button className="btn btn-outline-primary" onClick={addState} disabled={!workflowId}>
                <i className="fa-regular fa-circle me-1"></i>{i18n("Add State")}
              </button>
              <button
                className={mode === "connect" ? "btn btn-primary" : "btn btn-outline-primary"}
                onClick={() => setMode(mode === "connect" ? "select" : "connect")}
                disabled={!workflowId}
              >
                <i className="fa-solid fa-arrow-right-long me-1"></i>{i18n("Connect")}
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setMode("select")} disabled={!workflowId}>
                <i className="fa-solid fa-arrow-pointer me-1"></i>{i18n("Select")}
              </button>
              <button className="btn btn-outline-secondary" onClick={clearSelection} disabled={!workflowId}>
                <i className="fa-solid fa-xmark me-1"></i>{i18n("Clear Selection")}
              </button>
            </div>

            <label className="form-label mt-3">{i18n("Transition Label")}</label>
            <input
              className="form-control"
              value={selectedTransition ? selectedTransition.label : transitionLabel}
              onChange={(event) => {
                if (selectedTransition) {
                  updateSelectedTransition({ label: event.target.value });
                } else {
                  setTransitionLabel(event.target.value);
                }
              }}
              disabled={!workflowId}
            />

            {selectedState && (
              <div className="workflow-inspector">
                <h5>{i18n("Selected State")}</h5>
                <label className="form-label">{i18n("State Label")}</label>
                <input
                  className="form-control mb-2"
                  value={selectedState.label}
                  onChange={(event) => updateSelectedState({ label: event.target.value })}
                />
                <label className="workflow-check">
                  <input
                    type="checkbox"
                    checked={selectedState.initial}
                    onChange={(event) => updateSelectedState({ initial: event.target.checked })}
                  />
                  <span>{i18n("Initial")}</span>
                </label>
                <label className="workflow-check">
                  <input
                    type="checkbox"
                    checked={selectedState.final}
                    onChange={(event) => updateSelectedState({ final: event.target.checked })}
                  />
                  <span>{i18n("Final")}</span>
                </label>
              </div>
            )}

            {(selectedStateId || selectedTransitionId) && (
              <button className="btn btn-outline-danger w-100 mt-3" onClick={deleteSelectedElement}>
                <i className="fa-regular fa-trash-can me-1"></i>{i18n("Delete")}
              </button>
            )}

            {statusMessage && <div className="alert alert-info mt-3 py-2">{statusMessage}</div>}
          </aside>

          <main className="workflow-canvas-wrap">
            {!workflowId && (
              <div className="workflow-empty">
                <h4>{i18n("No workflow selected.")}</h4>
                <p>{i18n("Create or select a workflow to start drawing.")}</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width="1100"
              height="680"
              className="workflow-canvas"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </main>
        </div>
      </div>
    </>
  );
}
