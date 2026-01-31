# FRC Scouting Dashboard 2025

A modern, fast dashboard for scouting FRC events using Statbotics and The Blue Alliance APIs.

## Features
- **Event Search**: View team rankings for any event.
- **Team Details**: Deep dive into team stats and match videos.
- **Alliance Selection Helper**: Create weighted ranking lists for picking alliances.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure API Keys**
    Create a `.env` file in the root directory and add your The Blue Alliance API Key:
    ```env
    VITE_TBA_API_KEY=your_tba_api_key_here
    ```
    (You can get a key from [The Blue Alliance Account](https://www.thebluealliance.com/account))

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## Tech Stack
- React
- Vite
- Statbotics API (Rankings & EPA)
- The Blue Alliance API (Match Videos)
