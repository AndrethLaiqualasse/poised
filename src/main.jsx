import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TaskFlow from './TaskFlow.jsx'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TaskFlow />
  </StrictMode>
)
