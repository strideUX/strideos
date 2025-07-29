'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';

export default function CounterTest() {
  const [counterName, setCounterName] = useState('test-counter');
  const [newCounterName, setNewCounterName] = useState('');
  const [newCount, setNewCount] = useState(0);

  // Convex queries and mutations
  const counter = useQuery(api.counters.get, { name: counterName });
  const allCounters = useQuery(api.counters.list);
  const incrementMutation = useMutation(api.counters.increment);
  const setMutation = useMutation(api.counters.set);
  const removeMutation = useMutation(api.counters.remove);

  const handleIncrement = () => {
    incrementMutation({ name: counterName });
  };

  const handleSet = () => {
    setMutation({ name: newCounterName, count: newCount });
    setNewCounterName('');
    setNewCount(0);
  };

  const handleRemove = (name: string) => {
    removeMutation({ name });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Convex Real-time Counter Test
        </h2>
        
        {/* Current Counter Display */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Current Counter: {counterName}
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {counter?.count ?? 0}
          </p>
          <button
            onClick={handleIncrement}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Increment
          </button>
        </div>

        {/* Counter Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Counter Name
          </label>
          <input
            type="text"
            value={counterName}
            onChange={(e) => setCounterName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter counter name"
          />
        </div>

        {/* Create New Counter */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Create New Counter
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newCounterName}
              onChange={(e) => setNewCounterName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Counter name"
            />
            <input
              type="number"
              value={newCount}
              onChange={(e) => setNewCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Initial count"
            />
            <button
              onClick={handleSet}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create Counter
            </button>
          </div>
        </div>

        {/* All Counters List */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            All Counters
          </h3>
          {allCounters ? (
            <div className="space-y-2">
              {allCounters.map((counter: { _id: string; name: string; count: number }) => (
                <div
                  key={counter._id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded-md"
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {counter.name}:
                    </span>
                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">
                      {counter.count}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(counter.name)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">Loading counters...</p>
          )}
        </div>

        {/* Connection Status */}
        <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✅ Convex connection established! Changes will update in real-time across all connected clients.
          </p>
        </div>
      </div>
    </div>
  );
} 