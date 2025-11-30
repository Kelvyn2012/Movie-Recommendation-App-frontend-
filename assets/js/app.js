// Configuration
const API_BASE_URL = 'http://localhost:8000/api';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

// State
let currentUser = null;
let currentToken = null;
let currentSection = 'trending';
let currentPage = 1;
let totalPages = 1;

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const moviesGrid = document.getElementById('moviesGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const movieModal = document.getElementById('movieModal');
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const sectionTitle = document.getElementById('sectionTitle');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
    loadMovies('trending');
    setupEventListeners();
});

// Theme Management
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
}

themeToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });

    // Search
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length > 2) {
            searchTimeout = setTimeout(() => {
                searchMovies(query);
            }, 500);
        } else if (query.length === 0) {
            loadMovies(currentSection);
        }
    });

    // Pagination
    prevPageBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadMovies(currentSection, currentPage);
        }
    });

    nextPageBtn?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadMovies(currentSection, currentPage);
        }
    });

    // Auth Modal
    document.getElementById('loginBtn')?.addEventListener('click', () => showAuthModal('login'));
    document.getElementById('registerBtn')?.addEventListener('click', () => showAuthModal('register'));
    document.getElementById('closeAuthModal')?.addEventListener('click', () => authModal.classList.remove('active'));
    document.getElementById('switchToRegister')?.addEventListener('click', () => switchAuthForm('register'));
    document.getElementById('switchToLogin')?.addEventListener('click', () => switchAuthForm('login'));

    // Auth Forms
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // User Menu
    document.getElementById('userMenuBtn')?.addEventListener('click', () => {
        document.getElementById('userDropdown')?.classList.toggle('hidden');
    });

    // Profile Link
    document.getElementById('profileLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        showProfileModal();
        document.getElementById('userDropdown')?.classList.add('hidden');
    });

    // Close modals on outside click
    movieModal?.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            movieModal.classList.remove('active');
        }
    });

    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        if (userMenu && !userMenu.contains(e.target)) {
            userDropdown?.classList.add('hidden');
        }
    });
}

// Section Management
function switchSection(section) {
    currentSection = section;
    currentPage = 1;

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });

    // Update section title
    const titles = {
        'trending': 'Trending Now',
        'popular': 'Popular Movies',
        'recommended': 'Recommended For You',
        'favorites': 'My Favorites',
        'watchlist': 'My Watchlist'
    };
    sectionTitle.textContent = titles[section] || section;

    // Load movies
    loadMovies(section);
}

// API Calls
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (currentToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers },
    });

    if (response.status === 401) {
        handleLogout();
        throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || data.message || 'An error occurred');
    }

    return data;
}

// Movie Loading
async function loadMovies(section, page = 1) {
    showLoading();

    try {
        let data;

        switch(section) {
            case 'trending':
                data = await apiCall(`/movies/trending/?page=${page}`);
                break;
            case 'popular':
                data = await apiCall(`/movies/popular/?page=${page}`);
                break;
            case 'recommended':
                if (!currentToken) {
                    showToast('Please login to see recommendations', 'error');
                    showAuthModal('login');
                    return;
                }
                data = await apiCall(`/movies/recommended/?page=${page}`);
                break;
            case 'favorites':
                if (!currentToken) {
                    showToast('Please login to see favorites', 'error');
                    showAuthModal('login');
                    return;
                }
                data = await apiCall(`/users/favorites/?page=${page}`);
                // Transform favorites data
                if (data.results) {
                    data.results = data.results.map(f => f.movie);
                }
                break;
            case 'watchlist':
                if (!currentToken) {
                    showToast('Please login to see watchlist', 'error');
                    showAuthModal('login');
                    return;
                }
                data = await apiCall(`/users/watchlist/?page=${page}`);
                // Transform watchlist data
                if (data.results) {
                    data.results = data.results.map(w => w.movie);
                }
                break;
            default:
                data = await apiCall(`/movies/trending/?page=${page}`);
        }

        displayMovies(data.results || []);
        updatePagination(data);
    } catch (error) {
        console.error('Error loading movies:', error);
        showEmpty();
        showToast(error.message, 'error');
    }
}

async function searchMovies(query) {
    showLoading();

    try {
        const data = await apiCall(`/movies/search/?query=${encodeURIComponent(query)}`);
        displayMovies(data.results || []);
        updatePagination(data);
        sectionTitle.textContent = `Search Results for "${query}"`;
    } catch (error) {
        console.error('Error searching movies:', error);
        showEmpty();
        showToast(error.message, 'error');
    }
}

// Display Functions
function displayMovies(movies) {
    hideLoading();

    if (!movies || movies.length === 0) {
        showEmpty();
        return;
    }

    hideEmpty();
    moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');

    // Add click listeners
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            showMovieDetails(card.dataset.movieId);
        });
    });
}

function createMovieCard(movie) {
    const posterUrl = movie.poster_url || `${TMDB_IMAGE_BASE}w500${movie.poster_path}` || 'assets/img/no-poster.jpg';
    const rating = (movie.vote_average || 0).toFixed(1);
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

    return `
        <div class="movie-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer fade-in" data-movie-id="${movie.id || movie.tmdb_id}">
            <div class="relative aspect-[2/3] overflow-hidden">
                <img src="${posterUrl}" alt="${movie.title}"
                    class="w-full h-full object-cover"
                    onerror="this.src='assets/img/no-poster.jpg'">
                <div class="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded-lg flex items-center space-x-1">
                    <i class="fas fa-star text-yellow-400 text-sm"></i>
                    <span class="text-white text-sm font-bold">${rating}</span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 line-clamp-1">${movie.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${year}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">${movie.overview || 'No description available.'}</p>
            </div>
        </div>
    `;
}

async function showMovieDetails(movieId) {
    try {
        const movie = await apiCall(`/movies/${movieId}/`);
        const backdropUrl = movie.backdrop_url || `${TMDB_IMAGE_BASE}w1280${movie.backdrop_path}` || '';
        const posterUrl = movie.poster_url || `${TMDB_IMAGE_BASE}w500${movie.poster_path}` || 'assets/img/no-poster.jpg';
        const rating = (movie.vote_average || 0).toFixed(1);
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A';

        const modalContent = `
            <div class="relative">
                ${backdropUrl ? `
                    <div class="h-64 overflow-hidden">
                        <img src="${backdropUrl}" alt="${movie.title}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
                    </div>
                ` : ''}
                <button onclick="document.getElementById('movieModal').classList.remove('active')"
                    class="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <div class="p-8">
                <div class="flex flex-col md:flex-row gap-6">
                    <img src="${posterUrl}" alt="${movie.title}"
                        class="w-48 rounded-lg shadow-xl"
                        onerror="this.src='assets/img/no-poster.jpg'">

                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-2">${movie.title}</h2>
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-star text-yellow-400"></i>
                                <span class="font-bold">${rating}</span>
                                <span class="text-gray-500">/10</span>
                            </div>
                            <span class="text-gray-500">${year}</span>
                            <span class="text-gray-500">${genres}</span>
                        </div>

                        <p class="text-gray-600 dark:text-gray-400 mb-6">${movie.overview || 'No description available.'}</p>

                        ${currentToken ? `
                            <div class="flex flex-wrap gap-3">
                                <button onclick="addToFavorites(${movie.tmdb_id || movie.id})"
                                    class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2">
                                    <i class="fas fa-heart"></i>
                                    <span>Add to Favorites</span>
                                </button>
                                <button onclick="addToWatchlist(${movie.tmdb_id || movie.id})"
                                    class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2">
                                    <i class="fas fa-bookmark"></i>
                                    <span>Add to Watchlist</span>
                                </button>
                                <button onclick="showRatingForm(${movie.tmdb_id || movie.id})"
                                    class="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2">
                                    <i class="fas fa-star"></i>
                                    <span>Rate Movie</span>
                                </button>
                            </div>
                        ` : `
                            <p class="text-gray-500 italic">Login to add to favorites, watchlist, or rate this movie</p>
                        `}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContent').innerHTML = modalContent;
        movieModal.classList.add('active');
    } catch (error) {
        console.error('Error loading movie details:', error);
        showToast(error.message, 'error');
    }
}

// User Actions
async function addToFavorites(tmdbId) {
    try {
        await apiCall('/users/favorites/', {
            method: 'POST',
            body: JSON.stringify({ tmdb_id: tmdbId }),
        });
        showToast('Added to favorites!', 'success');
    } catch (error) {
        console.error('Error adding to favorites:', error);
        showToast(error.message, 'error');
    }
}

async function addToWatchlist(tmdbId) {
    try {
        await apiCall('/users/watchlist/', {
            method: 'POST',
            body: JSON.stringify({ tmdb_id: tmdbId }),
        });
        showToast('Added to watchlist!', 'success');
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        showToast(error.message, 'error');
    }
}

function showRatingForm(tmdbId) {
    const ratingHTML = `
        <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mt-4">
            <h3 class="font-bold mb-3">Rate this movie</h3>
            <div class="flex items-center space-x-2 mb-3">
                ${[1,2,3,4,5,6,7,8,9,10].map(i => `
                    <button onclick="submitRating(${tmdbId}, ${i})"
                        class="rating-star w-8 h-8 bg-gray-300 dark:bg-gray-600 hover:bg-yellow-400 rounded flex items-center justify-center font-bold">
                        ${i}
                    </button>
                `).join('')}
            </div>
            <textarea id="reviewText" placeholder="Write a review (optional)"
                class="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
        </div>
    `;

    const actionsDiv = document.querySelector('#modalContent .flex.flex-wrap');
    if (actionsDiv && !document.getElementById('ratingForm')) {
        actionsDiv.insertAdjacentHTML('afterend', `<div id="ratingForm">${ratingHTML}</div>`);
    }
}

async function submitRating(tmdbId, rating) {
    try {
        const review = document.getElementById('reviewText')?.value || '';
        await apiCall('/users/ratings/', {
            method: 'POST',
            body: JSON.stringify({
                tmdb_id: tmdbId,
                rating: rating,
                review: review
            }),
        });
        showToast(`Rated ${rating}/10!`, 'success');
        document.getElementById('ratingForm')?.remove();
    } catch (error) {
        console.error('Error submitting rating:', error);
        showToast(error.message, 'error');
    }
}

// Authentication
function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const recommendedNav = document.getElementById('recommendedNav');
    const favoritesNav = document.getElementById('favoritesNav');
    const watchlistNav = document.getElementById('watchlistNav');

    if (currentToken) {
        authButtons?.classList.add('hidden');
        userMenu?.classList.remove('hidden');
        recommendedNav?.classList.remove('hidden');
        favoritesNav?.classList.remove('hidden');
        watchlistNav?.classList.remove('hidden');

        if (currentUser) {
            document.getElementById('userName').textContent = currentUser.username;
        }
    } else {
        authButtons?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
        recommendedNav?.classList.add('hidden');
        favoritesNav?.classList.add('hidden');
        watchlistNav?.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiCall('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        currentToken = data.access;
        currentUser = data.user;

        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        updateAuthUI();
        authModal.classList.remove('active');
        showToast('Login successful!', 'success');
        loadMovies('trending');
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const password2 = document.getElementById('registerPassword2').value;

    if (password !== password2) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const data = await apiCall('/auth/register/', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, password2 }),
        });

        currentToken = data.access;
        currentUser = data.user;

        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        updateAuthUI();
        authModal.classList.remove('active');
        showToast('Registration successful!', 'success');
        loadMovies('trending');
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message, 'error');
    }
}

function handleLogout() {
    currentToken = null;
    currentUser = null;

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    updateAuthUI();
    showToast('Logged out successfully', 'success');
    loadMovies('trending');
    switchSection('trending');
}

// Profile Modal
async function showProfileModal() {
    if (!currentUser) {
        showToast('Please login to view profile', 'error');
        return;
    }

    try {
        // Fetch user profile from API
        const profile = await apiCall('/auth/profile/');

        const modalContent = `
            <div class="p-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold">My Profile</h2>
                    <button onclick="document.getElementById('movieModal').classList.remove('active')"
                        class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <div class="space-y-6">
                    <!-- Profile Info -->
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-3xl text-white"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold">${profile.username}</h3>
                                <p class="text-gray-600 dark:text-gray-400">${profile.email}</p>
                            </div>
                        </div>
                        ${profile.bio ? `<p class="text-gray-700 dark:text-gray-300">${profile.bio}</p>` : ''}
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-gradient-to-br from-red-500 to-pink-500 rounded-lg p-4 text-white text-center">
                            <div class="text-3xl font-bold">${profile.favorites_count || 0}</div>
                            <div class="text-sm">Favorites</div>
                        </div>
                        <div class="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-4 text-white text-center">
                            <div class="text-3xl font-bold">${profile.watchlist_count || 0}</div>
                            <div class="text-sm">Watchlist</div>
                        </div>
                        <div class="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-4 text-white text-center">
                            <div class="text-3xl font-bold">${profile.ratings_count || 0}</div>
                            <div class="text-sm">Ratings</div>
                        </div>
                    </div>

                    <!-- Favorite Genres -->
                    ${profile.favorite_genres && profile.favorite_genres.length > 0 ? `
                        <div>
                            <h4 class="text-lg font-bold mb-3">Favorite Genres</h4>
                            <div class="flex flex-wrap gap-2">
                                ${profile.favorite_genres.map(genre => `
                                    <span class="px-3 py-1 bg-red-500 text-white rounded-full text-sm">${genre}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Account Info -->
                    <div class="border-t border-gray-300 dark:border-gray-600 pt-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Member since: ${new Date(profile.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContent').innerHTML = modalContent;
        movieModal.classList.add('active');
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

// UI Helpers
function showAuthModal(type) {
    authModal.classList.add('active');
    switchAuthForm(type);
}

function switchAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authModalTitle.textContent = 'Login';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authModalTitle.textContent = 'Sign Up';
    }
}

function showLoading() {
    loadingState.classList.remove('hidden');
    moviesGrid.innerHTML = '';
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

function showEmpty() {
    emptyState.classList.remove('hidden');
    moviesGrid.innerHTML = '';
}

function hideEmpty() {
    emptyState.classList.add('hidden');
}

function updatePagination(data) {
    currentPage = data.page || 1;
    totalPages = data.total_pages || 1;

    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;

    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle text-2xl text-green-500';
    } else {
        toastIcon.className = 'fas fa-exclamation-circle text-2xl text-red-500';
    }

    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
