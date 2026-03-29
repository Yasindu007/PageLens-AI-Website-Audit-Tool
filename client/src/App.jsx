import React, { useState } from 'react';
import AuditForm from './components/AuditForm';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';

export default function App() {
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditedUrl, setAuditedUrl] = useState('');

  const handleAudit = async (url) => {
    setLoading(true);
    setError(null);
    setAuditResult(null);
    setAuditedUrl(url);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Audit failed');
      }

      setAuditResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAuditResult(null);
    setError(null);
    setAuditedUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!auditResult && !loading && (
          <AuditForm onAudit={handleAudit} error={error} />
        )}
        {loading && <LoadingSpinner url={auditedUrl} />}
        {auditResult && !loading && (
          <Dashboard result={auditResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
