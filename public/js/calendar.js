// FullCalendar & Timetable View Initializer
document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('fullCalendarContainer');
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    nowIndicator: true,
    height: 'auto',
    expandRows: true,
    events: '/timetable/api/events',
    eventClick: function(info) {
      const props = info.event.extendedProps;
      if (props.type === 'class') {
        alert(`🎓 Class: ${info.event.title}\n📍 Location: ${props.location || 'Not specified'}`);
      } else {
        const modalEl = document.getElementById('viewEntryModal');
        if (modalEl) {
          document.getElementById('modalEntryTitle').textContent = info.event.title;
          document.getElementById('modalEntryCourse').textContent = props.courseTitle || 'General';
          document.getElementById('modalEntryType').textContent = props.type.toUpperCase();
          document.getElementById('modalEntryStart').textContent = new Date(info.event.start).toLocaleString();
          document.getElementById('modalEntryNotes').textContent = props.notes || 'No extra notes provided.';
          
          const editBtn = document.getElementById('modalEntryDeleteForm');
          if (editBtn) {
            editBtn.action = `/timetable/${props.entryId}/delete`;
          }
          
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
        }
      }
    }
  });

  calendar.render();
});
