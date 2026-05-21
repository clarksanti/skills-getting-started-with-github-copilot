document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function participantItemTemplate(activityName, email) {
    return `
      <li class="participant-item">
        <span class="participant-email">${email}</span>
        <button
          type="button"
          class="remove-participant-btn"
          data-activity="${activityName}"
          data-email="${email}"
          aria-label="Unregister ${email} from ${activityName}"
          title="Unregister participant"
        >
          <span aria-hidden="true">&#128465;</span>
        </button>
      </li>
    `;
  }

  function addParticipantToCard(activityName, email) {
    const activityCards = Array.from(document.querySelectorAll(".activity-card"));
    const card = activityCards.find((item) => {
      const title = item.querySelector("h4");
      return title && title.textContent === activityName;
    });

    if (!card) {
      return;
    }

    const participantsList = card.querySelector(".participants-list");
    if (!participantsList) {
      return;
    }

    // Remove empty-state row when adding the first participant.
    const emptyState = participantsList.querySelector(".participant-empty");
    if (emptyState) {
      emptyState.remove();
    }

    const alreadyListed = Array.from(participantsList.querySelectorAll(".participant-email")).some(
      (el) => el.textContent === email
    );
    if (!alreadyListed) {
      participantsList.insertAdjacentHTML("beforeend", participantItemTemplate(activityName, email));
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants.length
          ? details.participants
              .map(
                (email) => participantItemTemplate(name, email)
              )
              .join("")
          : '<li class="participant-empty">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ul class="participants-list">
              ${participants}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        addParticipantToCard(activity, email);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Handle participant removal from activity cards
  activitiesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-participant-btn");
    if (!button) {
      return;
    }

    const activity = button.dataset.activity;
    const email = button.dataset.email;

    if (!activity || !email) {
      return;
    }

    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Unable to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    } finally {
      button.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
