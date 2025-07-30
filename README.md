# 🏃‍♂️ Edge GPS Tracker - Take Home Test

Welcome to the Edge take-home test! This challenge is designed to simulate a real-world feature we might build in the
Edge app. It focuses on mobile location tracking and front-end feature implementation.

---

## 📦 Overview
This mobile app allows users to track their running/walking workouts, and displays a summary of metrics once the workout has
ended. The features implemented in this app include:
- GPS tracking with start and stop functionalities
- Display average speed and time elapsed while tracking the user's route
- When workout is finished, displays a summary page with:
    - Total time, distance and average speed
    - Split times bar chart (pace per km)
- If app crashes, a previous session can be resumed
- Handle permission errors gracefully


## 📦 Project Structure
├── src/
│   ├── components/
│   │   ├── MapCard.tsx           # Map view with polyline and start/end markers
│   │   ├── StatsRow.tsx          # Display for time, distance, speed
│   │   └── SplitTimesList.tsx    # Split bar chart and pace list
│   └── utils/
│       └── trackingHelpers.ts    # Provides Haversine, distance calc, splits, pace formatting
│
├── MapScreen.tsx                 # Screen that allows user to record route
├── WorkoutComplete.tsx           # Workout summary screen
└── README.md                     # Project overview



## 📦 Usage
- Tap Start Tracking to start a workout
- Give permissions for locationTracker to use your location
- The app records your route on the map and displays elapsed time and distance
- End tracking to view your workout summary: total time, distance, speed, route taken and split breakdown.
- If the session was interrupted (app closes/crashes), you 

## 🧪 Project Setup

###

```bash
cd location-tracker 
npm install
cd ios && pod install && cd ..
npm run start
npm run ios
```


