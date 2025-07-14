import React from 'react';
import { Gamepad2 } from 'lucide-react';

export const GameHeader: React.FC = () => {
  return (
    <div className="text-center mb-6 sm:mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <Gamepad2 className="w-8 h-8 text-blue-600" />
        <div className="flex space-x-1">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full"></div>
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2">
        Strike 4
      </h1>
      <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto px-4">
        Connect four of your discs in a row to win! Drop discs by clicking on columns.
      </p>
    </div>
  );
};