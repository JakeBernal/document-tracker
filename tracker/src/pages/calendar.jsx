import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import "../css/calendar.css";

export default function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");

      if (!token || !userRaw) {
        setMessage("Please sign in first.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userRaw);
      const endpoint =
        user.role === "admin" || user.role === "superadmin"
          ? "http://localhost:5001/api/admin/appointments"
          : "http://localhost:5001/api/appointments/my";

      try {
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage(data.message || "Failed to load appointments.");
          setLoading(false);
          return;
        }

        setAppointments(data.appointments || []);
      } catch (error) {
        console.error("CALENDAR FETCH ERROR:", error);
        setMessage("Cannot connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "No date";

    return new Date(dateValue).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "No time";

    const [hour, minute] = timeValue.split(":");
    const date = new Date();
    date.setHours(Number(hour));
    date.setMinutes(Number(minute));

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Navbar />

      <section className="calendar-page">
        <div className="calendar-header">
          <h1>Pickup Calendar</h1>
          <p>View scheduled document pickup appointments.</p>
        </div>

        <div className="calendar-container">
          {loading && <p className="calendar-message">Loading appointments...</p>}

          {!loading && message && (
            <p className="calendar-message error">{message}</p>
          )}

          {!loading && !message && appointments.length === 0 && (
            <div className="calendar-empty">
              <h2>No Appointments Yet</h2>
              <p>Pickup schedules will appear here once admin sets a date and time.</p>
            </div>
          )}

          {!loading && appointments.length > 0 && (
            <div className="calendar-list">
              {appointments.map((appointment) => (
                <div className="calendar-card" key={appointment.id}>
                  <div className="calendar-date-box">
                    <span>{formatDate(appointment.appointment_date)}</span>
                    <strong>{formatTime(appointment.appointment_time)}</strong>
                  </div>

                  <div className="calendar-details">
                    <h2>{appointment.document_name || "Document Request"}</h2>

                    {appointment.citizen_name && (
                      <p>
                        <strong>Citizen:</strong> {appointment.citizen_name}
                      </p>
                    )}

                    <p>
                      <strong>Purpose:</strong>{" "}
                      {appointment.purpose || "Document Pickup"}
                    </p>

                    <p>
                      <strong>Request Status:</strong>{" "}
                      {appointment.request_status || "Ready for Pickup"}
                    </p>

                    <p>
                      <strong>Appointment Status:</strong>{" "}
                      {appointment.status || "Scheduled"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}