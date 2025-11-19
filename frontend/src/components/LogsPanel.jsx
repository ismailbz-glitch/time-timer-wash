import React, { useRef, useEffect } from 'react';

const LogsPanel = ({ logs }) => {
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info':
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-96 flex flex-col">
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">Event Logs</h2>
      <div className="flex-grow overflow-y-auto pr-2">
        {logs.map((log, index) => (
          <div key={index} className={`flex justify-between items-start ${getLogColor(log.type)} mb-1`}>
            <span className="text-xs text-gray-500 mr-2">{log.timestamp}</span>
            <p className="flex-grow text-sm">{log.message}</p>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default LogsPanel;
