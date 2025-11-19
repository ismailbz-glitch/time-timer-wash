import React, { useState } from 'react';
import axios from 'axios';

const ChatPanel = ({ addLog, apiBaseUrl }) => {
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleGeneratePlan = async () => {
    if (!prompt) return;
    addLog({ type: 'info', message: `Generating plan for: "${prompt}"` });
    try {
      const response = await axios.post(`${apiBaseUrl}/llm/plan`, { prompt });
      setPlan(response.data);
      addLog({ type: 'success', message: 'Plan generated successfully.' });
    } catch (error) {
      console.error("Error generating plan:", error);
      addLog({ type: 'error', message: 'Failed to generate plan.' });
    }
  };

  const handleExecutePlan = async () => {
    if (!plan) return;
    setIsExecuting(true);
    addLog({ type: 'info', message: 'Executing plan...' });
    try {
      const response = await axios.post(`${apiBaseUrl}/execute_plan`, plan);
      addLog({ type: 'success', message: 'Plan executed successfully!' });
      response.data.log.forEach(stepLog => {
        addLog({ type: 'info', message: `Step ${stepLog.step}: ${stepLog.details}` });
      });
    } catch (error) {
      console.error("Error executing plan:", error);
      addLog({ type: 'error', message: `Plan execution failed: ${error.response?.data?.detail || error.message}` });
    } finally {
      setIsExecuting(false);
      setPlan(null);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">LLM Agent Control</h2>

      <div className="flex flex-col space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a high-level command (e.g., 'Increase DO by 10% over the next hour')"
          className="bg-gray-700 border border-gray-600 rounded p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={handleGeneratePlan}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Generate Plan
        </button>
      </div>

      {plan && (
        <div className="mt-6 bg-gray-700 p-4 rounded">
          <h3 className="text-xl font-bold mb-2 text-yellow-400">Generated Plan</h3>
          <pre className="bg-gray-900 p-3 rounded text-sm whitespace-pre-wrap">
            {JSON.stringify(plan, null, 2)}
          </pre>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setPlan(null)}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded mr-2 transition duration-300"
            >
              Discard
            </button>
            <button
              onClick={handleExecutePlan}
              disabled={isExecuting}
              className={`font-bold py-2 px-4 rounded transition duration-300 ${isExecuting ? 'bg-green-800 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isExecuting ? 'Executing...' : 'Execute Plan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
