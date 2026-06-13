const API_URL = ""; //specify the backend server URL

// ================================
// LOGIN PAGE LOGIC
// ================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginError = document.getElementById("loginError");

    loginError.classList.add("d-none");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.message;
        loginError.classList.remove("d-none");
        return;
      }

      localStorage.setItem("token", data.token);

      window.location.href = "profile.html";
    } catch (error) {
      loginError.textContent = "Could not connect to the server.";
      loginError.classList.remove("d-none");
    }
  });
}

// ================================
// PROFILE PAGE LOGIC
// ================================
const profileForm = document.getElementById("profileForm");

if (profileForm) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
  }

  loadProfile();

  profileForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const dob = document.getElementById("dob").value;

    const messageBox = document.getElementById("profileMessage");

    messageBox.classList.add("d-none");
    messageBox.classList.remove("alert-success", "alert-danger");

    if (!validateEmail(email)) {
      showProfileMessage("Invalid email format.", "danger");
      return;
    }

    if (!validatePhone(phone)) {
      showProfileMessage("Phone number must contain numbers only.", "danger");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          phone,
          dob
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showProfileMessage(data.message, "danger");
        return;
      }

      showProfileMessage("Profile updated successfully.", "success");
    } catch (error) {
      showProfileMessage("Could not update profile.", "danger");
    }
  });
}

// Load profile information
async function loadProfile() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    document.getElementById("profileUsername").textContent = `Logged in as: ${data.username}`;
    document.getElementById("email").value = data.email;
    document.getElementById("phone").value = data.phone;

    const formattedDate = data.dob.substring(0, 10);
    document.getElementById("dob").value = formattedDate;
  } catch (error) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

// Show success or error messages
function showProfileMessage(message, type) {
  const messageBox = document.getElementById("profileMessage");

  messageBox.textContent = message;
  messageBox.classList.remove("d-none");
  messageBox.classList.add(`alert-${type}`);
}

// Validate email
function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Validate phone number
function validatePhone(phone) {
  const phonePattern = /^[0-9]+$/;
  return phonePattern.test(phone);
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}