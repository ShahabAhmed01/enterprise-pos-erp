import React from 'react';
import { motion } from 'framer-motion';

export function Splash() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 via-rose-600 to-purple-700 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl"><span className="text-5xl">🏪</span></div>
        <h1 className="text-4xl font-bold text-white mb-2">Enterprise POS</h1>
        <p className="text-white/70 text-lg">Loading application...</p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden"><motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} className="h-full bg-white rounded-full" /></div>
      </motion.div>
    </div>
  );
}
export default Splash;
