document.addEventListener("DOMContentLoaded", () => {
  const eventsList = document.getElementById("events-list");

  const mockEvents = [
    { title: "Team Sync", date: "Oct 28, 2025", time: "2:00 PM", reminder: "30 min before" },
    { title: "Report Deadline", date: "Nov 1, 2025", time: "5:00 PM", reminder: "1 day before" }
  ];

  setTimeout(() => {
    eventsList.innerHTML = mockEvents.map(e => `
      <div class="event-card">
        <h3>${e.title}</h3>
        <p><strong>Date:</strong> ${e.date} | <strong>Time:</strong> ${e.time}</p>
        <p><strong>Reminder:</strong> ${e.reminder}</p>
      </div>
    `).join('');
  }, 800);
});

function syncNow() {
  alert("Syncing with Google Calendar...");
}