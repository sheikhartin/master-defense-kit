import React, { useState } from 'react';
import Header from './components/Header';
import PresentationLab from './components/PresentationLab';
import QALab from './components/QALab';
import ChecklistLab from './components/ChecklistLab';
import CheatSheetLab from './components/CheatSheetLab';
import { OfflineIndicator } from './components/OfflineIndicator';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('presentation');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-indigo-200 selection:text-indigo-900" dir="rtl">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-6xl mx-auto p-4 md:p-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'presentation' && <PresentationLab />}
            {activeTab === 'qa' && <QALab />}
            {activeTab === 'checklist' && <ChecklistLab />}
            {activeTab === 'cheatSheet' && <CheatSheetLab />}
          </motion.div>
        </AnimatePresence>
      </main>
      <OfflineIndicator />
    </div>
  );
}
