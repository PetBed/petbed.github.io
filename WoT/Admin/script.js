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

var userData;

async function createTable() {
  const tableBody = document.getElementById('users-table-body');
  tableBody.innerHTML = '';

  for (i = 0; i < userData.length; i++) {
    const user = userData[i];
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

    // Remove the deleted user from the userData array
    userData = userData.filter(user => user._id !== id);

    createTable();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}


window.addEventListener('load', async function () {
  await fetchData(`${apiUrl}users`)
  .then(data => {
    userData = data.user;
    console.log(userData);
  })
  .catch(error => console.error('Fetch error:', error));

  createTable();
});