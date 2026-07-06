import React from 'react';

export function TestComponent() {
  return (
    <div className="p-4 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-lg">
      <h2 className="text-xl font-bold text-green-800 dark:text-green-200">React 组件测试</h2>
      <p className="text-green-700 dark:text-green-300">如果你看到这个，说明 React 组件正常工作！</p>
    </div>
  );
}