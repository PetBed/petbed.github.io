const link = "https://wot-tau.vercel.app/api/";
var posts = [];
const randomSpread = 10;

async function fetchPosts() {
  try {
    const response = await fetch(`${link}postboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    posts = await response.json();
    posts = posts.posts;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function showPosts() {
  let groupContainer = null;
  var i = 0;
  shuffle(posts); 
  posts.forEach((post, index) => {
    if (index % 3 === 0) {
      i++;
      groupContainer = document.createElement('div');
      groupContainer.classList.add('post-group');
      if (getRandomInt(0, 1) === 0) {
        groupContainer.style.paddingLeft = `${getRandomFloat(3, 15)}em`;
      } else {
        groupContainer.style.paddingRight = `${getRandomFloat(8, 15)}em`;
      }
      document.getElementById('posts-container').appendChild(groupContainer);
    }

    const postElement = document.createElement('div');
    const postDate = new Date(post.date);
    postElement.classList.add('post');
    postElement.innerHTML = `<p>${post.content}</p><span>${postDate.getDate()}/${postDate.getMonth() + 1}</span>`;
    postElement.style.marginTop = `${getRandomFloat(-3, randomSpread)}em`;
    postElement.style.marginLeft = `${getRandomFloat(-3, randomSpread)}em`;

    // Set a random pastel background color
    postElement.style.backgroundColor = getRandomPastelColor();

    groupContainer.appendChild(postElement);

    // Ensure the element is within the screen
    adjustElementPosition(postElement);

    if (i >= 3) {
      throw {};
    }
  });
}

async function newPost() {
  const postContent = document.getElementById("post-content");
  const postDate = new Date();
  if (postContent.value.trim() === "") {
    return;
  }
  postDate.setDate(postDate.getDate() + 1);

  try {
    const response = await fetch(`${link}postboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: postContent.value,
        date: postDate.toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Post created successfully:', data);

    document.getElementById("new-post").style.display = "none";
    
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `<p>${postContent.value}</p><span>${postDate.getDate()}/${postDate.getMonth() + 1}</span>`;
    postElement.style.position = 'absolute';
    postElement.style.top = '50%';
    postElement.style.left = '50%';
    postElement.style.transform = 'translate(-50%, -50%)';
    postElement.style.backgroundColor = document.getElementById('new-post').style.backgroundColor;

    document.getElementById('posts-container').appendChild(postElement);
  } catch (error) {
    console.error('Error creating note:', error);
  }
}

function getRandomPastelColor() {
  const r = Math.floor((Math.random() * 127) + 127); // Random value between 127 and 255
  const g = Math.floor((Math.random() * 127) + 127);
  const b = Math.floor((Math.random() * 127) + 127);
  return `rgb(${r}, ${g}, ${b})`;
}

// Function to adjust element position if it's out of the screen
function adjustElementPosition(element) {
  const rect = element.getBoundingClientRect();
  const postsContainer = document.getElementById('posts-container');
  const allPosts = postsContainer.querySelectorAll('.post');
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  let maxAttempts = 10; // Limit the number of attempts to reposition the element

  while (maxAttempts > 0) {
    const rect = element.getBoundingClientRect();

    // Check if the element is out of the screen
    if (rect.left < 0) {
      element.style.marginLeft = `${parseFloat(element.style.marginLeft) - rect.left}px`;
    }
    if (rect.top < 0) {
      element.style.marginTop = `${parseFloat(element.style.marginTop) - rect.top}px`;
    }
    if (rect.right > screenWidth) {
      element.style.marginLeft = `${parseFloat(element.style.marginLeft) - (rect.right - screenWidth)}px`;
    }
    if (rect.bottom > screenHeight) {
      element.style.marginTop = `${parseFloat(element.style.marginTop) - (rect.bottom - screenHeight)}px`;
    }

    // Check for overlap or proximity with other posts
    let isOverlapping = false;
    for (const otherPost of allPosts) {
      if (otherPost === element) continue; // Skip the current element

      const otherRect = otherPost.getBoundingClientRect();
      const distanceX = Math.abs(rect.left - otherRect.left);
      const distanceY = Math.abs(rect.top - otherRect.top);

      // Check if overlapping or within 3em proximity
      if (
        rect.left < otherRect.right &&
        rect.right > otherRect.left &&
        rect.top < otherRect.bottom &&
        rect.bottom > otherRect.top
      ) {
        isOverlapping = true;
        break;
      }
      if (distanceX < 48 && distanceY < 48) { // 3em = 48px (assuming 1em = 16px)
        isOverlapping = true;
        break;
      }
    }

    if (!isOverlapping) {
      return; // Element is positioned correctly
    }

    // Reposition the element randomly
    element.style.marginTop = `${getRandomFloat(-3, randomSpread)}em`;
    element.style.marginLeft = `${getRandomFloat(-3, randomSpread)}em`;

    maxAttempts--;
  }

  // If no valid position is found, remove the element
  element.remove();
}

window.onload = async function() {
  document.getElementById("new-post").style.backgroundColor = getRandomPastelColor();
  await fetchPosts();
  await showPosts();
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function shuffle(array) {
  let currentIndex = array.length;

  while (currentIndex != 0) {

    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}