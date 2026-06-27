import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/shared/Navbar';
import { Home } from './pages/Home';
import { Inspect } from './pages/Inspect';
import { Results } from './pages/Results';
import { History } from './pages/History';
import { Bulk } from './pages/Bulk';
import { About } from './pages/About';

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-page text-text-primary min-h-screen font-sans flex flex-col">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inspect" element={<Inspect />} />
            <Route path="/results/:scanId" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/bulk" element={<Bulk />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="w-full bg-card border-t border-border-card py-6 px-6 text-center text-xs text-text-muted relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <span>© {new Date().getFullYear()} PhishGarud Threat Intelligence Platform. All rights reserved.</span>
            <div className="flex gap-4 font-semibold text-text-secondary">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-accent-blue transition-colors">
                GitHub Repository
              </a>
              <span className="text-border-card">|</span>
              <span>Open Source Portfolio Project</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
