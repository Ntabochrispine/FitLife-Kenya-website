document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  // Header and back-to-top
  const header = $(".site-header");
  const backTop = $("#backTop");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
    backTop.classList.toggle("show", window.scrollY > 500);
  });
  backTop.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

  // Reveal animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, {threshold:.12});
  $$(".reveal").forEach(el => observer.observe(el));

  // Animated counters
  const counters = $$("[data-count]");
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.done) return;
      entry.target.dataset.done = "true";
      const target = Number(entry.target.dataset.count);
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 45));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        entry.target.textContent = current.toLocaleString();
      }, 25);
    });
  }, {threshold:.7});
  counters.forEach(c => countObserver.observe(c));

  // BMI
  $("#bmiBtn").addEventListener("click", () => {
    const weight = parseFloat($("#weight").value);
    const height = parseFloat($("#height").value);
    const result = $("#bmiResult");
    if (!weight || !height || weight <= 0 || height <= 0) {
      result.innerHTML = "Please enter a valid weight and height.";
      return;
    }
    const bmi = weight / Math.pow(height / 100, 2);
    let category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy range" : bmi < 30 ? "Overweight" : "Obesity range";
    result.innerHTML = `Your BMI: <strong>${bmi.toFixed(1)}</strong><br>${category}`;
  });

  // AI-style fitness assistant prototype
  $("#aiBtn").addEventListener("click", () => {
    const goal = $("#goal").value;
    const days = $("#days").value;
    const result = $("#aiResult");
    if (!goal || !days) {
      result.textContent = "Select a goal and training days first.";
      return;
    }
    const plans = {
      weight: ["Full-body strength", "Brisk walk / intervals", "Lower-body strength", "Cardio + core", "Mobility / recovery"],
      muscle: ["Upper body", "Lower body", "Rest / mobility", "Push + core", "Pull + legs"],
      endurance: ["Easy cardio", "Intervals", "Strength + core", "Tempo session", "Long steady session"],
      wellness: ["Full body", "Mobility + walk", "Full body", "Cardio + stretch", "Recovery"]
    };
    const sessions = plans[goal].slice(0, Number(days));
    result.innerHTML = `<strong>Sample ${days}-day plan</strong><ul>${sessions.map((s,i)=>`<li>Day ${i+1}: ${s}</li>`).join("")}</ul>`;
  });

  // Modal
  const modal = $("#modal");
  const modalTitle = $("#modalTitle");
  const modalContent = $("#modalContent");
  const openModal = (title, html) => {
    modalTitle.textContent = title;
    modalContent.innerHTML = html;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
  };
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
  };
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });

  const programInfo = {
    "Weight Loss": ["4-week starter program", ["2 cardio sessions", "2 strength sessions", "Mobility and recovery work"]],
    "Muscle Building": ["8-week progressive program", ["Upper/lower split", "Progressive resistance", "Recovery guidance"]],
    "Flexibility": ["4-week mobility program", ["Full-body stretching", "Mobility drills", "Breathing and recovery"]],
    "Strength Training": ["6-week strength program", ["Compound movements", "Progressive overload", "Core and conditioning"]],
    "Home Fitness": ["4-week home program", ["Bodyweight circuits", "Minimal equipment", "Short efficient sessions"]],
    "Endurance": ["8-week endurance program", ["Easy aerobic sessions", "Intervals", "Long steady sessions"]]
  };
  $$(".program-btn").forEach(btn => btn.addEventListener("click", () => {
    const name = btn.dataset.program, info = programInfo[name];
    openModal(name, `<p>${info[0]} designed as a sample website program.</p><ul>${info[1].map(x=>`<li>${x}</li>`).join("")}</ul>`);
  }));

  // Pricing buttons
  $$(".join-btn").forEach(btn => btn.addEventListener("click", () => {
    openModal(`Join ${btn.dataset.plan}`, `<p>This prototype can connect this button to a registration or payment workflow in a production version.</p><ul><li>Choose your membership</li><li>Complete registration</li><li>Receive your starter plan</li></ul>`);
  }));

  // Blog buttons
  $$(".blog-btn").forEach(btn => btn.addEventListener("click", () => {
    openModal(btn.dataset.title, `<p>This is sample blog content for the FitLife Kenya prototype. A production website could open a full article page or a CMS-powered post here.</p><p style="margin-top:12px">Start with realistic goals, build a repeatable routine, and adjust your plan as your experience grows.</p>`);  
  }));

  // Contact form -> backend API
  $("#contactForm").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#formMessage");
    msg.textContent = "Sending...";
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          name: $("#name").value.trim(),
          email: $("#email").value.trim(),
          subject: $("#subject").value.trim(),
          message: $("#message").value.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to send message.");
      msg.textContent = data.message;
      e.target.reset();
    } catch (error) {
      msg.textContent = error.message;
    }
  });

  $("#year").textContent = new Date().getFullYear();
});


// ---- Backend authentication helpers ----
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

function showAuthModal(mode = "register") {
  const title = mode === "login" ? "Member Login" : "Create FitLife Account";
  const action = mode === "login" ? "Login" : "Create Account";
  const content = `
    <form id="authForm" class="auth-form">
      ${mode === "register" ? '<label>Full Name<input id="authName" required placeholder="Your name"></label>' : ""}
      <label>Email<input id="authEmail" type="email" required placeholder="you@example.com"></label>
      <label>Password<input id="authPassword" type="password" minlength="6" required placeholder="At least 6 characters"></label>
      <button class="btn btn-primary full" type="submit">${action}</button>
      <p id="authMessage" class="form-message"></p>
    </form>`;
  openModal(title, content);
  const form = $("#authForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const message = $("#authMessage");
    message.textContent = "Please wait...";
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = {
        email: $("#authEmail").value.trim(),
        password: $("#authPassword").value
      };
      if (mode === "register") body.name = $("#authName").value.trim();
      const data = await apiRequest(endpoint, {method:"POST", body:JSON.stringify(body)});
      localStorage.setItem("fitlife_token", data.token);
      localStorage.setItem("fitlife_user", JSON.stringify(data.user));
      message.textContent = mode === "login" ? `Welcome back, ${data.user.name}!` : "Account created successfully!";
      setTimeout(() => { closeModal(); updateMemberButton(); }, 700);
    } catch (err) {
      message.textContent = err.message;
    }
  });
}

async function updateMemberButton() {
  const user = JSON.parse(localStorage.getItem("fitlife_user") || "null");
  const joinButtons = $$(".join-btn");
  if (!user) return;
  joinButtons.forEach(btn => btn.textContent = `Join ${btn.dataset.plan}`);
}

document.querySelector(".nav-cta")?.addEventListener("click", e => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem("fitlife_user") || "null");
  if (user) {
    openModal("Member Area", `<p>Welcome, <strong>${user.name}</strong>. Your account is connected to the FitLife backend.</p><p style="margin-top:12px">You can now register for programs and manage your profile.</p><button class="btn btn-outline" id="logoutBtn" style="margin-top:18px">Log Out</button>`);
    $("#logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("fitlife_token");
      localStorage.removeItem("fitlife_user");
      closeModal();
    });
  } else {
    openModal("FitLife Membership", `<p>Create a member account or sign in to access backend-powered membership features.</p><div style="display:grid;gap:10px;margin-top:20px"><button class="btn btn-primary" id="registerChoice">Create Account</button><button class="btn btn-outline" id="loginChoice">Login</button></div>`);
    $("#registerChoice").addEventListener("click", () => showAuthModal("register"));
    $("#loginChoice").addEventListener("click", () => showAuthModal("login"));
  }
});
updateMemberButton();
