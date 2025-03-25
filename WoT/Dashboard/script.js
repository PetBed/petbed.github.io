var userId, userData;


async function logoutUser() {
  await localStorage.removeItem('userId');
  window.location.href = '/login';
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
        window.location.href = '/login';
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
});