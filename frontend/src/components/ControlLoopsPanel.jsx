import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ControlLoopsPanel = ({ apiBaseUrl }) => {
  const [loops, setLoops] = useState({ active_loops: [], status: "Loading..." });

  useEffect(() => {
    const fetchLoops = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/control_loops`);
        setLoops(response.data);
      } catch (error) {
        console.error("Error fetching control loops:", error);
        setLoops({ active_loops: [], status: "Error fetching data." });
      }
    };
    fetchLoops();
  }, [apiBaseUrl]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">Control Loops</h2>
      <div className="text-center p-4">
        <p className="text-gray-400">{loops.status}</p>
        {loops.active_loops.length > 0 && (
          <ul>
            {loops.active_loops.map(loop => (
              <li key={loop.id}>{loop.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ControlLoopsPanel;
