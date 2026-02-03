# 🎬 Lensloria: A React & Tailwind Movie App

**Lensloria** is a sleek, modern web app for discovering and exploring movies and TV shows. Built with **React** and styled with **Tailwind CSS**, it provides a seamless user experience with a fully responsive design, dynamic content from The Movie Database (TMDB) API, and an intuitive interface.

## ✨ Preview

![Lensloria Homepage](https://github.com/user-attachments/assets/36482289-411e-4d03-81c0-9f4e43f90b02)
![Lensloria Details Page](https://github.com/user-attachments/assets/354c69c6-3594-47b3-9e8e-11b5e05b9287)

---

## 🚀 Features

- **Modern UI:** A clean, beautiful, and fully responsive user interface built with Tailwind CSS.
- **Dynamic Content:** Fetches the latest trending movies, TV shows, and detailed information from the TMDB API.
- **Powerful Search:** Instantly find any movie or TV show with a real-time search feature.
- **Detailed Views:** Get comprehensive details for any title, including synopsis, cast, ratings, and trailers.
- **Genre Filtering:** Browse content by specific genres to discover new favorites.
- **Fast & Efficient:** Optimized for a smooth and fast browsing experience.

---

## 🛠️ Tech Stack

- **Framework:** [React](https://reactjs.org/) – A powerful JavaScript library for building user interfaces.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) – A utility-first CSS framework for rapid UI development.
- **Data:** [TMDB API](https://www.themoviedb.org/documentation/api) – The source for all movie and TV show metadata.
- **Routing:** [React Router](https://reactrouter.com/) – For seamless page navigation within the single-page application.

---

## ⚙️ Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A TMDB API Key (You can get one for free by signing up on the [TMDB website](https://www.themoviedb.org/signup).)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Debronejacobs/Movie-Streaming-Site.git
    cd lensloria
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    - Create a file named `.env` in the root of your project.
    - Add your TMDB API key to this file as shown below:

      ```env
      # Replace with your actual TMDB API key
      REACT_APP_TMDB_API_KEY=your_api_key_here
      ```
    > **Important:** This application will not work without a valid TMDB API key.

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

The application should now be running on `http://localhost:3000` (or another port if specified).
