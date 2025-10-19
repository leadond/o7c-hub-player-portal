import React from 'react';

const TestComponent = () => {
  console.log('TestComponent rendered successfully');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 App is Working!
        </h1>
        <p className="text-gray-600 mb-4">
          The O7C Hub Player Portal is running successfully.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 text-sm">
            ✅ React is working<br/>
            ✅ Vite dev server is running<br/>
            ✅ Components are rendering
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;