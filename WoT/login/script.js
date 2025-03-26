async function createUser() {
  console.log("test");
  // Get form values
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  // Create the payload
  const user = {
    username: username,
    email: email,
    password: password
  };

  if (!username || !email || !password) {
    document.getElementById('register-status').innerHTML = 'Please enter your username, email, and password';
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById('register-status').innerHTML = 'Please enter a valid email address';
    return;
  }

  try {
    // Send POST request
    const response = await fetch(`${apiUrl}users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    // Handle response
    if (response.ok) {
      const data = await response.json();
      console.log('User registered successfully:', data);

      // Clear form values
      document.getElementById('register-username').value = '';
      document.getElementById('register-email').value = '';
      document.getElementById('register-password').value = '';

      document.getElementById('register-status').innerHTML = 'User registered successfully';
    } else {
      console.error('Failed to register user:', response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loginUser() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    document.getElementById('login-status').innerHTML = 'Please enter your email and password';
    return;
  }

  try {
    // Determine if input is an email or username
    const isEmail = email.includes('@');
    const queryParam = isEmail ? `email=${encodeURIComponent(email)}` : `username=${encodeURIComponent(email)}`;

    // Send GET request with query parameters
    const response = await fetch(`${apiUrl}users/login?${queryParam}&password=${encodeURIComponent(password)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle response
    if (response.ok) {
      const data = await response.json();
      console.log('User logged in successfully:', data);

      // Clear form values
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';

      // Save user data
      localStorage.setItem('userId', data.userId);
      console.log('Storage IDed:', localStorage.getItem('userId'));

      // Redirect to the dashboard
      window.location.href = '../dashboard';
    } else {
      console.error('Failed to log in user:', response.statusText);
      document.getElementById('login-status').innerHTML = 'Invalid email/username or password';
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

window.addEventListener('load', async function () {
  // Get the user data
  if (localStorage.getItem('userId')) {
    console.log('User ID:', localStorage.getItem('userId'));

    window.location.href = '../dashboard';
  }
});