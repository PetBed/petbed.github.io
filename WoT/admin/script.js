var usersData, notesData;

async function createUsersTable() {
  const tableBody = document.getElementById('users-table-body');
  tableBody.innerHTML = '';

  for (i = 0; i < usersData.length; i++) {
    const user = usersData[i];
    console.log(user);
    const row = document.createElement('div');
    row.innerHTML = `
      <p>${user.username}</p>
      <p>${user.password}</p>
      <p>${user.email}</p>
      <div><p>${user._id}<p><i class="fa fa-trash" aria-hidden="true" onclick="deleteUser('${user._id}')"></i></div>
    `;
    row.classList.add('users-table-row');
    tableBody.appendChild(row);
  }
}

async function createNotesTable() {
  const tableBody = document.getElementById('notes-table-body');
  tableBody.innerHTML = '';

  for (i = 0; i < notesData.length; i++) {
    const note = notesData[i];
    const row = document.createElement('div');
    row.innerHTML = `
      <p>${note.title}</p>
      <p>${note.content}</p>
      <p>${note.user}</p>
      <div><p>${note._id}<p><i class="fa fa-trash" aria-hidden="true" onclick="deleteNote('${note._id}')"></i></div>
    `;
    row.classList.add('notes-table-row');
    tableBody.appendChild(row);
  }
}

async function deleteUser(id) {
  console.log(id);
  try {
    const response = await fetch(`${apiUrl}users?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Remove the deleted user from the usersData array
    usersData = usersData.filter(user => user._id !== id);

    createUsersTable();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

async function  deleteNote(id) {
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

    // Remove the deleted note from the notesData array
    notesData = notesData.filter(note => note._id !== id);

    createNotesTable();
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

window.addEventListener('load', async function () {
  await fetchData(`${apiUrl}users`)
  .then(data => {
    usersData = data.user;
    console.log(usersData);
  }).catch(error => console.error('Fetch error:', error));

  await fetchData(`${apiUrl}notes`)
  .then(data => {
    notesData = data.notes;
    console.log(notesData);
  }).catch(error => console.error('Fetch error:', error));

  createUsersTable();
  createNotesTable();
});

// Example function to fetch data using a RESTful API
async function fetchData(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}