README.md Content
# 📚 AI-Based Study Planner
> An intelligent Python + React study scheduling system that generates optimized day-by-day study plans using a custom weighted time-distribution algorithm.

## 🚀 Features
•	Smart weighted scheduling based on subject difficulty and exam proximity
•	Priority formula: priority = difficulty × (1 / days_left)
•	Fatigue-aware hour capping (max 2.5h per subject per day)
•	Mood-based adjustments (Tired 60% / Normal 100% / Focused 130%)
•	Crash Mode: auto 30% boost when exam is 3 or fewer days away
•	Adaptive rescheduling — missed hours redistributed across remaining days
•	Performance tracking: planned vs. completed hours + self-rating
•	DS recommendation layer: adjusts hours based on 7-day consistency
•	Gamification: points, streaks, badges, 4 level system
•	Pomodoro timer with 3 presets (Classic / Short / Deep Work)
•	Past plans history — view all previously generated timetables
•	localStorage persistence — data saved across browser sessions

## 🧠 Algorithm Design
•	Time Distribution: hours weighted by subject difficulty / total weight
•	Priority Formula: difficulty × (1 / days_left) — closer exam gets more weight
•	Revision Buffer: last N days auto-switch to revision mode (+20% hours)
•	Adaptive Weights: completion rate < 60% → weight multiplier increases by 20%
•	ML Recommendation: rule-based → upgradeable to LinearRegression

## 🛠 Tech Stack
Layer	Technology
Backend	Python, Flask, flask-cors
Frontend	React, Recharts, localStorage
Algorithm	Custom weighted time-distribution
Data Science	Performance tracking, adaptive weights, ML recommendations
Deployment	Vercel (Frontend) + Render (Backend)

## 📂 Project Structure
ai-study-planner/
├── app.py               # Flask API with 6 routes
├── performance.py       # DS/ML performance tracking
├── requirements.txt     # Python dependencies
└── study-planner/       # React frontend
    └── src/
        ├── StudyPlanner.js   # Main planner + past plans
        ├── Dashboard.js      # Analytics + charts
        └── Features.js       # Mood, Pomodoro, Gamification

## ⚙️ How to Run Locally
Backend:
pip install flask flask-cors
py app.py
Frontend:
cd study-planner
npm install
npm start

## 👩💻 Made By
Drisya Raju — Data Science Student
github.com/drisyaraju

