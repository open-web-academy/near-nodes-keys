import React from 'react';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Tailwind CSS Test Page
      </h1>
      <p className="mb-6 text-gray-800">
        This page is to verify that Tailwind CSS is working properly.
      </p>
      <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg mb-6">
        Click me!
      </button>
      <div className="w-full max-w-md bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Sample Card</h2>
        <p className="text-gray-600">
          This is a sample card component styled using Tailwind CSS. If you can see these styles, Tailwind is working as expected.
        </p>
      </div>
    </div>
  );
}