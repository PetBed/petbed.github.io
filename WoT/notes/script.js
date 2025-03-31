var userId, userData;
var notes = [];

async function createNote(event) {
  console.log("ENDING THING")
  // Get form elements
  const title = document.getElementById('note-title');
  const content = document.getElementById('note-content');

  console.log(title.value);
  console.log(content.value);

  const note = {
    title: (title.value) ? title.value : "Untitled Note",
    content: (content.value) ? content.value : "",
    userId: userId
  };

  try {
    const response = await fetch(`${apiUrl}notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Note created successfully:', data);

    notes.push(data.note);
    title.value = '';
    content.value = '';

    showNotes();
  } catch (error) {
    console.error('Error creating note:', error);
  }
}

async function deleteNote(id) {
  try {
    const response = await fetch(`${apiUrl}notes?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    notes = notes.filter(note => note._id !== id);
    showNotes();
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

async function updateNote(element) {
  console.log('Parent ID:', element.closest('.note-item').id);
  const noteId = element.closest('.note-item').id;
  const note = notes.find(note => note._id === noteId);
  const updatedNote = {
    title: element.parentElement.querySelector('.note-item-title').value,
    content: element.parentElement.querySelector('.note-item-content').value,
    user: userId
  };

  try {
    const response = await fetch(`${apiUrl}notes?id=${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedNote),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Note updated successfully:', data);
    hasUnsavedChanges = false;
  } catch (error) {
    console.error('Error updating note:', error);
  }
}

async function editNote() {
  const titleInput = document.querySelectorAll(`.note-item-title`);
  const contentInput = document.querySelectorAll(`.note-item-content`);

  // Debounce the updateNote function
  const debouncedUpdateNote = debounce(updateNote, 150);
  
  titleInput.forEach((titleElement) => {
    titleElement.addEventListener('input', () => {
      hasUnsavedChanges = true;
      debouncedUpdateNote(titleElement);
    });
  });
  
  contentInput.forEach((contentElement) => {
    contentElement.addEventListener('input', () => {
      hasUnsavedChanges = true;
      debouncedUpdateNote(contentElement);
    });
  });

  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
}

async function showNotes() {
  try {
    const response = await fetch(`${apiUrl}notes?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    notes = await response.json();
    notes = notes.notes;
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  const notesContainer = document.getElementById('notes-body');
  notesContainer.innerHTML = '';

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const noteElement = document.createElement('div');
    noteElement.classList.add('note-item');
    noteElement.setAttribute('id', note._id);
    noteElement.innerHTML = `
      <input type="text" value="${note.title}" class="note-item-title" placeholder="Title"></input>
      <textarea type="text" class="note-item-content">${note.content}</textarea>
      <i class="fa fa-trash" aria-hidden="true" onclick="deleteNote('${note._id}')"></i>
    `;
    notesContainer.appendChild(noteElement);
  }

  editNote();
}

async function logoutUser() {
  await localStorage.removeItem('userId');
  window.location.href = '../login';
}

window.addEventListener('load', async function () {
  // Get the user data
  if (localStorage.getItem('userId')) {
    console.log('User ID:', localStorage.getItem('userId'));
    userId = localStorage.getItem('userId');
  }

  await showNotes();
});

let hasUnsavedChanges = false;

function trackChanges() {
  const inputs = document.querySelectorAll('.note-item-title, .note-item-content');
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      hasUnsavedChanges = true; // Set the flag when the user edits a note
    });
  });
}

window.onbeforeunload = function (event) {
  if (hasUnsavedChanges) {
    // Show confirmation dialog only if there are unsaved changes
    event.returnValue = 'You have unsaved changes. Do you really want to leave?';
  }
};