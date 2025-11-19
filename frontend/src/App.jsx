import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatusPanel from './components/StatusPanel';
import ChatPanel from './components/ChatPanel';
import LogsPanel from './components/LogsPanel';
import ControlLoopsPanel from './components/ControlLoopsPanel';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [status, setStatus] = useState({});
  const [logs, setLogs] = useState([]);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      setStatus(response.data);
    } catch (error) {
      console.error("Error fetching status:", error);
      addLog({ type: 'error', message: 'Failed to fetch bioreactor status.' });
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const addLog = (logEntry) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { ...logEntry, timestamp }]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 font-mono">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-cyan-400">Bioreactor LLM Control</h1>
        <p className="text-gray-500">Powered by TJX Bioengineering Principles</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">
          <StatusPanel status={status} addLog={addLog} apiBaseUrl={API_BASE_URL} />
          <ChatPanel addLog={addLog} apiBaseUrl={API_BASE_URL}/>
        </div>

        <div className="space-y-6">
          <LogsPanel logs={logs} />
          <ControlLoopsPanel apiBaseUrl={API_BASE_URL} />
        </div>

      </main>
    </div>
  );
}

export default App;
