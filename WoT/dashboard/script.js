var userId, userData;
var notes = [];

async function createNote() {
  // Get form elements
  const title = document.getElementById('note-title');
  const content = document.getElementById('note-content');

  const note = {
    title: title.value,
    content: content.value,
    userId: userId
  };

  if (!title.value) {
    document.getElementById('note-status').innerHTML = 'Please enter a title';
    return;
  }

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
    document.getElementById('note-status').innerHTML = 'Note created successfully';

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

async function editNote(id) {
  const titleInput = document.querySelectorAll(`.note-item-title`);
  const contentInput = document.querySelectorAll(`.note-item-content`);

  console.log(titleInput, contentInput);
  titleInput.forEach((titleElement, index) => {
    titleElement.addEventListener('blur', async () => {
      updateNote(titleElement);
    });
  });

  contentInput.forEach((contentElement, index) => {
    contentElement.addEventListener('blur', async () => {
      updateNote(contentElement);
    });
  });

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
    } catch (error) {
      console.error('Error updating note:', error);
    }
  
  }
}

async function showNotes() {
  const notesContainer = document.getElementById('notes-body');
  notesContainer.innerHTML = '';

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const noteElement = document.createElement('div');
    noteElement.classList.add('note-item');
    noteElement.setAttribute('id', note._id);
    noteElement.innerHTML = `
      <input type="text" value="${note.title}" class="note-item-title" placeholder="Title"></input>
      <hr>
      <textarea type="text" class="note-item-content">${note.content}</textarea>
      <i class="fa fa-trash" aria-hidden="true" onclick="deleteNote('${note._id}')"></i>
    `;
    notesContainer.appendChild(noteElement);
  }
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

  // Phrase Data 
  try {
    const response = await fetch(`${apiUrl}users?id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application'
      }
    });
    if (!response.ok) {
      this.setTimeout(() => {
        window.location.href = '../login';
      }, 1000);

      throw new Error(`HTTP error! status: ${response.status}`);
    }
    userData = await response.json();
    userData = userData.user
    console.log('User Data:', userData);

    document.getElementById('title-username').innerHTML = `Hello ${userData.username}!`;
  } catch (error) {
    console.error('Error fetching data:', error);
  }

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

  // Genereate Notes
  showNotes();
  editNote();
});

window.onbeforeunload = function(event) {
  const unsavedChanges = Array.from(document.querySelectorAll('.note-item-title, .note-item-content'))
    .some(input => document.activeElement === input);

  if (unsavedChanges) {
    event.preventDefault();
    event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
};