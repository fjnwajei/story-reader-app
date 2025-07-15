// --- Fetch stories from backend API ---
let stories = [];

async function fetchStories() {
  // Fetch story titles from the backend
  const res = await fetch('http://localhost:8081/api/stories');
  stories = await res.json();
  // Add placeholder properties for demo UI (genre, likes, views, read, description)
  stories.forEach((story, idx) => {
    story.genre = ["Fantasy", "Adventure", "Sci-Fi"][idx % 3];
    story.likes = 100 + idx * 10;
    story.views = 200 + idx * 20;
    story.read = false;
    story.description = "Click the title to read the full story.";
  });
  renderStories();
}


// --- Data for Motivation Section ---
const dailyQuotes = [
  "Believe you can and you're halfway there.",
  "Every day is a new beginning.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
];
const inspirationalStories = [
  "Once, a young athlete overcame all odds to win the race, teaching everyone that perseverance pays off.",
  "A small act of kindness changed a stranger's life forever, reminding us to always help others.",
];
const boosts = [
  "Take a deep breath and smile!",
  "Write down one thing you're grateful for.",
  "Do a quick stretch break!",
];

// --- Section Switching Logic ---
const navLibrary = document.getElementById('nav-library');
const navMotivation = document.getElementById('nav-motivation');
const sectionLibrary = document.getElementById('section-library');
const sectionMotivation = document.getElementById('section-motivation');

navLibrary.addEventListener('click', () => {
  sectionLibrary.classList.remove('hidden');
  sectionMotivation.classList.add('hidden');
  navLibrary.classList.add('bg-blue-200');
  navMotivation.classList.remove('bg-blue-200');
});
navMotivation.addEventListener('click', () => {
  sectionMotivation.classList.remove('hidden');
  sectionLibrary.classList.add('hidden');
  navMotivation.classList.add('bg-blue-200');
  navLibrary.classList.remove('bg-blue-200');
});

// --- Genre and Filter Logic ---
const genreBtns = document.querySelectorAll('.genre-btn');
const filterSort = document.getElementById('filter-sort');
const filterStatus = document.getElementById('filter-status');
const storyCards = document.getElementById('story-cards');

let selectedGenre = 'All';
let selectedSort = 'popular';
let selectedStatus = 'all';

// Render story cards based on filters
function renderStories() {
  let filtered = stories.filter(story =>
    (selectedGenre === 'All' || story.genre === selectedGenre) &&
    (selectedStatus === 'all' || (selectedStatus === 'read' ? story.read : !story.read))
  );
  if (selectedSort === 'popular') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else if (selectedSort === 'recent') {
    filtered.sort((a, b) => b.id - a.id);
  } else if (selectedSort === 'liked') {
    filtered.sort((a, b) => b.likes - a.likes);
  }
  storyCards.innerHTML = '';
  // Create card for each story
  filtered.forEach(story => {
    const card = document.createElement('div');
    card.className = `bg-white rounded shadow p-4 flex flex-col gap-2 border ${story.read ? 'opacity-60' : ''}`;
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <h3 class="font-bold text-lg transition-colors duration-150 cursor-pointer hover:text-blue-600 story-title" data-id="${story.id}">${story.title}</h3>
        <span class="text-xs px-2 py-1 rounded ${story.read ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}">
          ${story.read ? 'Read' : 'Unread'}
        </span>
      </div>
      <p class="text-gray-600">${story.description}</p>
      <div class="flex gap-4 text-sm text-gray-500">
        <span>👍 ${story.likes} Likes</span>
        <span>👁️ ${story.views} Views</span>
        <button class="ml-auto text-blue-600 underline mark-read-btn" data-id="${story.id}">${story.read ? 'Mark Unread' : 'Mark Read'}</button>
      </div>
    `;
    // Story title now has a modern hover effect and pointer cursor
    storyCards.appendChild(card);
  });
  // Add mark read/unread logic
  document.querySelectorAll('.mark-read-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.getAttribute('data-id'));
      const story = stories.find(s => s.id === id);
      story.read = !story.read;
      renderStories();
    });
  });
}

// Genre button click
genreBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    genreBtns.forEach(b => b.classList.remove('bg-blue-300'));
    btn.classList.add('bg-blue-300');
    selectedGenre = btn.getAttribute('data-genre');
    renderStories();
  });
});
// Filter selects
filterSort.addEventListener('change', e => {
  selectedSort = e.target.value;
  renderStories();
});
filterStatus.addEventListener('change', e => {
  selectedStatus = e.target.value;
  renderStories();
});

// --- Motivation Section Logic ---
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// Daily quote
const quoteEl = document.getElementById('motivation-quote');
quoteEl.textContent = randomFrom(dailyQuotes);
// Inspirational story
const storyEl = document.getElementById('motivation-story');
storyEl.textContent = randomFrom(inspirationalStories);
// Boost of the Day
const boostEl = document.getElementById('motivation-boost');
const boostRefresh = document.getElementById('boost-refresh');
function setBoost() {
  boostEl.textContent = randomFrom(boosts);
}
setBoost();
boostRefresh.addEventListener('click', setBoost);

// --- Story Title Click: Show Full Text in Modal ---
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('story-title')) {
    const id = e.target.getAttribute('data-id');
    // Fetch full story from backend
    const res = await fetch(`http://localhost:8081/api/stories/${id}`);
    const story = await res.json();
    showModal(story.title, story.full_text);
  }
});

// --- Modal for Full Story ---
function showModal(title, text) {
  let modal = document.getElementById('story-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'story-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button id="close-modal" class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        <h2 class="font-bold text-xl mb-4">${title}</h2>
        <div class="text-gray-700 whitespace-pre-line">${text}</div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-modal').onclick = () => modal.remove();
    modal.onclick = (ev) => { if (ev.target === modal) modal.remove(); };
  }
}

// --- Create Story Form Logic ---
const toggleCreateFormBtn = document.getElementById('toggle-create-form-btn');
const createStoryForm = document.getElementById('create-story-form');

toggleCreateFormBtn.addEventListener('click', () => {
  createStoryForm.classList.toggle('hidden');
});

createStoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('new-story-title').value;
  const full_text = document.getElementById('new-story-text').value;

  if (title && full_text) {
    const res = await fetch('http://localhost:8081/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, full_text }),
    });

    if (res.ok) {
      // Reset form and refresh stories
      createStoryForm.reset();
      createStoryForm.classList.add('hidden');
      fetchStories(); // Refresh the story list
    } else {
      alert('Failed to save story. Please try again.');
    }
  }
});

// --- Initial Render ---
fetchStories(); // Fetch stories from backend on load
// Default to Story Library section
sectionLibrary.classList.remove('hidden');
sectionMotivation.classList.add('hidden');
navLibrary.classList.add('bg-blue-200');

// Initial rendering
