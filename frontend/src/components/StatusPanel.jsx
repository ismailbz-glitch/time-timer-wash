import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ParameterRow = ({ name, pv, sp, onSpChange, onSpSubmit }) => {
  return (
    <div className="grid grid-cols-4 gap-4 items-center p-2 hover:bg-gray-700 rounded">
      <span className="font-bold text-cyan-400">{name}</span>
      <span className={`text-xl ${Math.abs(pv - sp) > sp * 0.05 ? 'text-yellow-400' : 'text-green-400'}`}>{pv.toFixed(2)}</span>
      <input
        type="number"
        value={sp}
        onChange={(e) => onSpChange(name, e.target.value)}
        onBlur={() => onSpSubmit(name)}
        onKeyPress={(e) => e.key === 'Enter' && onSpSubmit(name)}
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(pv / (sp * 1.5)) * 100}%` }}></div>
      </div>
    </div>
  );
};

const StatusPanel = ({ status, addLog, apiBaseUrl }) => {
  const [setpoints, setSetpoints] = useState({});

  useEffect(() => {
    // Initialize setpoints from status
    const initialSPs = {};
    for (const key in status) {
      initialSPs[key] = status[key].SP;
    }
    setSetpoints(initialSPs);
  }, [status]);

  const handleSpChange = (name, value) => {
    setSetpoints(prev => ({ ...prev, [name]: value }));
  };

  const handleSpSubmit = async (name) => {
    const value = parseFloat(setpoints[name]);
    if (isNaN(value)) {
      addLog({ type: 'error', message: `Invalid setpoint for ${name}.` });
      return;
    }

    try {
      addLog({type: 'info', message: `Writing ${name} SP -> ${value}`});
      const response = await axios.post(`${apiBaseUrl}/write_multi_real`, {
        values: { [name]: value }
      });
      addLog({type: 'success', message: `Successfully set ${name}: ${response.data[name]}`});
    } catch (error) {
      console.error(`Error setting ${name}:`, error);
      addLog({type: 'error', message: `Failed to set ${name}.`});
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">Bioreactor Status</h2>
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-4 font-bold text-gray-400 px-2">
          <span>Parameter</span>
          <span>PV</span>
          <span>SP</span>
          <span>Indicator</span>
        </div>
        {Object.entries(status).map(([key, values]) => (
          <ParameterRow
            key={key}
            name={key}
            pv={values.PV}
            sp={setpoints[key] || values.SP}
            onSpChange={handleSpChange}
            onSpSubmit={handleSpSubmit}
          />
        ))}
      </div>
    </div>
  );
};

export default StatusPanel;
