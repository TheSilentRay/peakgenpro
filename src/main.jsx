import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import GarminConnect from './pages/GarminConnect'
import Dashboard from './pages/Dashboard'
import Training from './pages/Training'
import Recovery from './pages/Recovery'
import Nutrition from './pages/Nutrition'
import AICoach from './pages/AICoach'
import Profile from './pages/Profile'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/connect-garmin" element={<GarminConnect />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/training" element={<Training />} />
      <Route path="/recovery" element={<Recovery />} />
      <Route path="/nutrition" element={<Nutrition />} />
      <Route path="/coach" element={<AICoach />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </BrowserRouter>
)
