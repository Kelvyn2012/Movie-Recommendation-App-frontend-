# CineVerse - Movie Recommendation Frontend

A beautiful, modern, and intuitive movie recommendation frontend with excellent UI/UX and dark mode support.

## Features

- **Beautiful UI/UX**: Clean, modern design with smooth animations and transitions
- **Dark Mode**: Full dark mode support with persistent theme selection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Movie Discovery**: Browse trending, popular, and personalized movie recommendations
- **User Authentication**: Register, login, and manage your account
- **Favorites & Watchlist**: Save movies to your favorites and watchlist
- **Movie Ratings**: Rate movies and write reviews
- **Search**: Powerful search functionality to find any movie
- **Pagination**: Easy navigation through large movie collections

## Tech Stack

- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Vanilla JavaScript**: No framework dependencies
- **Font Awesome**: Beautiful icons
- **TMDb API**: Movie data and images

## Getting Started

### Prerequisites

- A running Django backend server (see `movie_recomendation` directory)
- A modern web browser

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   cd /Users/aoamacsplace/Documents/Backend/Movie-Recommendation-App
   ```

2. **Start the Django backend**:
   ```bash
   cd movie_recomendation
   source venv/bin/activate
   export DATABASE_URL=""
   python manage.py runserver
   ```

3. **Open the frontend**:
   - Open `frontend/index.html` directly in your browser, OR
   - Use a local development server:
     ```bash
     cd frontend
     # Using Python
     python3 -m http.server 3000
     # OR using Node.js (if you have it)
     npx serve
     ```

4. **Access the application**:
   - If opened directly: `file:///path/to/frontend/index.html`
   - If using Python server: `http://localhost:3000`
   - If using npx serve: `http://localhost:3000` (or the port shown in terminal)

## Configuration

### API Base URL

The frontend is configured to connect to the Django backend at `http://localhost:8000/api`. If your backend runs on a different URL, update the configuration in `assets/js/app.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### CORS Configuration

Make sure your Django backend allows CORS requests from your frontend origin. This is already configured in the Django settings.

## Usage

### First Time Setup

1. **Register an account**:
   - Click "Sign Up" in the navigation bar
   - Fill in your username, email, and password
   - Click "Sign Up" to create your account

2. **Login**:
   - Click "Login" in the navigation bar
   - Enter your email and password
   - Click "Login"

### Browsing Movies

- **Trending**: See what's trending right now
- **Popular**: Browse the most popular movies
- **Recommended** (requires login): Get personalized recommendations
- **Search**: Use the search bar to find specific movies

### Interacting with Movies

- **View Details**: Click on any movie card to see full details
- **Add to Favorites**: Click the heart icon when viewing movie details
- **Add to Watchlist**: Click the bookmark icon when viewing movie details
- **Rate a Movie**: Click the star icon and select a rating (1-10)

### Managing Your Collection

- **My Favorites**: View all movies you've favorited
- **Watchlist**: See your watchlist
- **Profile**: Access your profile from the user menu

## Project Structure

```
frontend/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css      # Custom styles
│   ├── js/
│   │   └── app.js          # Main application logic
│   └── img/                # Images (add no-poster.jpg here)
└── README.md               # This file
```

## Features in Detail

### Dark Mode

The application supports both light and dark themes. The theme preference is saved in localStorage and persists across sessions.

- **Toggle**: Click the sun/moon icon in the navigation bar
- **Default**: Dark mode is enabled by default
- **Persistence**: Your choice is remembered

### Authentication

The frontend uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Stored in localStorage, used for API requests
- **Refresh Token**: Stored in localStorage, used to get new access tokens
- **Auto Logout**: Automatically logs out on 401 responses

### Responsive Design

The application is fully responsive:

- **Mobile**: Single column layout, hamburger menu
- **Tablet**: Two column grid
- **Desktop**: Four column grid with full navigation

### API Integration

All API calls go through the `apiCall()` function which:

- Adds authentication headers automatically
- Handles errors gracefully
- Shows user-friendly error messages
- Auto-refreshes tokens when needed

## Customization

### Colors

The primary color scheme uses red/pink gradients. To change colors, edit the Tailwind config in `index.html`:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    // Your custom colors here
                }
            }
        }
    }
}
```

### Styling

Custom styles are in `assets/css/styles.css`. You can add your own styles there.

### Logo

Replace the Font Awesome film icon with your own logo by editing the navigation section in `index.html`.

## Troubleshooting

### Movies not loading

- **Check backend**: Make sure Django server is running on `http://localhost:8000`
- **Check CORS**: Ensure CORS is enabled in Django settings
- **Check console**: Open browser DevTools and check for error messages

### Authentication issues

- **Clear localStorage**: Try clearing localStorage and logging in again
- **Check tokens**: Ensure access and refresh tokens are being saved
- **Check API**: Test the login endpoint directly

### Images not loading

- **TMDb API**: Ensure your Django backend has a valid TMDb API key
- **CORS**: Check that image URLs are accessible
- **Fallback**: A fallback image should show if the poster is unavailable

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

## Contact

For questions or support, please contact the development team.

---

**Enjoy discovering your next favorite movie with CineVerse!**
