import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);
import SimpleToDoTable from "./SimpleToDoTable";
import { toLocaleISOString } from "../libs/utils";
import DateTimePicker from "../libs/bs5-datetime/DateTimePicker";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function DailyToDos({ folder_id, folder }) {
  const [tasks, setTasks] = useState([]);
  const [defaultDate] = useState(toLocaleISOString(new Date()).slice(0, 10));
  const [selectedDate, setSelectedDate] = useState(
    toLocaleISOString(new Date()).slice(0, 10)
  );
  const [datePickerOptions] = useState({
    format: "YYYY-MM-DD",
    showTime: false,
  });
  const [eisenhowerMode, setEisenhowerMode] = useState(false);

  function handleDateChange(newDate) {
    setSelectedDate(newDate);
    loadTasks(newDate);
  }

  function loadTasks(dt) {
    axios
      .get(config.BASE_URL + "/api/get-daily-todo", {
        params: { dt, folder_id },
      })
      .then(function (response) {
        if (response.data.status === "OK") {
          setTasks(response.data.data);
        } else {
          MySwal.fire("Error: " + response.data.error);
        }
      })
      .catch(function () {
        MySwal.fire("Connection Error");
      });
  }

  useEffect(() => {
    loadTasks(selectedDate);
  }, []);

  const categories = [
    { key: "Urgent and Important", label: "Urgent & Important" },
    { key: "Not Urgent and Important", label: "Not Urgent & Important" },
    { key: "Urgent and Not Important", label: "Urgent & Not Important" },
    { key: "Not Urgent and Not Important", label: "Not Urgent & Not Important" },
  ];

  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId = draggableId;
    const newCategory = destination.droppableId;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id.toString() === taskId ? { ...t, eisenhower_category: newCategory } : t
      )
    );

    // Persist to backend
    axios
      .post(config.BASE_URL + "/api/update-eisenhower-category", {
        id: taskId,
        eisenhower_category: newCategory,
      })
      .catch(() => {
        MySwal.fire("Failed to update category");
        loadTasks(selectedDate);
      });
  }

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <DateTimePicker
            value={selectedDate}
            defaultValue={defaultDate}
            onChange={handleDateChange}
            options={datePickerOptions}
          />
        </div>
        <div className="text-end">
          <button
            className="btn btn-outline-primary ms-2"
            onClick={() => setEisenhowerMode((p) => !p)}
          >
            {eisenhowerMode ? "Normal View" : "Eisenhower View"}
          </button>
        </div>
      </div>

      
      {!eisenhowerMode ? (
        <div className="row">
          <div className="col-md-4"></div>
          <div className="col-md-4">
            <SimpleToDoTable
              title={selectedDate}
              tasks={tasks}
              setTasks={setTasks}
              folder_id={folder_id}
              selectedDate={selectedDate}
              loadTasks={loadTasks}
            />
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="row">
            {categories.map((cat) => {
              const filteredTasks = tasks.filter(
                (t) => t.eisenhower_category === cat.key
              );
              return (
                <div key={cat.key} className="col-md-6 mb-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-light fw-bold text-center">
                      {cat.label}
                    </div>
                    <Droppable droppableId={cat.key}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="p-2"
                          style={{ minHeight: "200px" }}
                        >
                          {filteredTasks.map((task, index) => (
                            <Draggable
                              key={task.id.toString()}
                              draggableId={task.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="card mb-2 shadow-sm p-2"
                                  style={{
                                    ...provided.draggableProps.style,
                                    borderLeft: "4px solid #0d6efd",
                                    userSelect: "none",
                                    background: "white",
                                  }}
                                >
                                  <span>{task.is_done ? "✔" : ""}{task.description}</span>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
