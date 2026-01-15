import React, { useState, useMemo, useEffect } from 'react';
import { Check, ExternalLink, Filter, X, RefreshCw } from 'lucide-react';

// =============================================================================
// AIRTABLE CONFIGURATION - ADD YOUR TOKEN HERE
// =============================================================================
const AIRTABLE_CONFIG = {
  baseId: 'appJaKQWORmGpA8Kh',
  personalAccessToken: 'YOUR_TOKEN_HERE', // ⬅️ PASTE YOUR TOKEN HERE (starts with "pat...")
  candidatesTableName: 'Candidates',
  statementsTableName: 'Position Statements'
};
// =============================================================================

export default function VoterGuide() {
  const [candidates, setCandidates] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data from Airtable
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch Candidates
      const candidatesResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.candidatesTableName)}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_CONFIG.personalAccessToken}`,
          }
        }
      );

      if (!candidatesResponse.ok) {
        throw new Error(`Failed to fetch candidates: ${candidatesResponse.status}`);
      }

      const candidatesData = await candidatesResponse.json();
      
      // Transform Airtable data to our format
      const candidatesFormatted = candidatesData.records.map(record => ({
        id: record.fields.CandidateKey,
        firstName: record.fields.FirstName || '',
        lastName: record.fields.LastName || '',
        party: record.fields.Party || '',
        website: record.fields.Website || '',
        email: record.fields.EmailAddress || '',
        facebook: record.fields.Facebook || '',
        twitter: record.fields.Twitter || '',
        instagram: record.fields.Instagram || ''
      }));

      setCandidates(candidatesFormatted);

      // Fetch Position Statements
      const statementsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.statementsTableName)}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_CONFIG.personalAccessToken}`,
          }
        }
      );

      if (!statementsResponse.ok) {
        throw new Error(`Failed to fetch statements: ${statementsResponse.status}`);
      }

      const statementsData = await statementsResponse.json();
      
      // Debug: Log raw data
      console.log('Raw statements from Airtable:', statementsData.records.length, 'records');
      if (statementsData.records.length > 0) {
        console.log('First statement fields:', statementsData.records[0].fields);
      }
      
      // Transform statements data
      const statementsFormatted = statementsData.records.map(record => ({
        key: record.fields.StatementKey,
        candidateId: record.fields.CandidateID,  // Changed from CandidateKey to CandidateID
        topic: record.fields.Topic || '',
        statement: record.fields.Statement || '',
        label: record.fields.Label || '',
        sourceLink: record.fields.SourceLink || '',
        sourceType: record.fields.SourceType || ''
      }));

      console.log('Formatted statements:', statementsFormatted.length, 'records');
      console.log('Sample formatted statement:', statementsFormatted[0]);
      
      setStatements(statementsFormatted);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const allTopics = useMemo(() => {
    return [...new Set(statements.map(s => s.topic))].filter(Boolean).sort();
  }, [statements]);

  const toggleCandidate = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const filteredCandidates = selectedCandidates.length > 0 
    ? candidates.filter(c => selectedCandidates.includes(c.id))
    : candidates;

  const filteredTopics = selectedTopics.length > 0 ? selectedTopics : allTopics;

  const filteredStatements = useMemo(() => {
    return statements.filter(stmt => {
      const candidateMatch = selectedCandidates.length === 0 || selectedCandidates.includes(stmt.candidateId);
      const topicMatch = selectedTopics.length === 0 || selectedTopics.includes(stmt.topic);
      return candidateMatch && topicMatch;
    });
  }, [statements, selectedCandidates, selectedTopics]);

  const getStatementsForCandidate = (candidateId, topic) => {
    return filteredStatements.filter(s => s.candidateId === candidateId && s.topic === topic);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      }}>
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} style={{ color: '#1e40af' }} />
          <p className="text-lg font-semibold" style={{ color: '#1e3a8a' }}>Loading voter guide data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md" style={{ border: '3px solid #ef4444' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#dc2626' }}>Error Loading Data</h2>
          <p className="text-sm mb-4" style={{ color: '#64748b' }}>{error}</p>
          <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
            Make sure you've added your Airtable Personal Access Token to the code.
          </p>
          <button
            onClick={fetchData}
            className="w-full py-2 px-4 rounded-lg font-semibold"
            style={{ background: '#1e40af', color: '#fff' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif'
    }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4" style={{ borderColor: '#1e40af' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ 
                color: '#1e3a8a',
                fontFamily: '"IBM Plex Sans", sans-serif',
                letterSpacing: '-0.02em'
              }}>
                IL-9 Voter Guide 2026
              </h1>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                Compare candidates on the issues that matter to you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: '#10b981', color: '#fff' }}
                title="Refresh data from Airtable"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
                style={{ 
                  background: showFilters ? '#1e40af' : '#fff',
                  color: showFilters ? '#fff' : '#1e40af',
                  border: '2px solid #1e40af'
                }}
              >
                <Filter size={18} />
                {showFilters ? 'Hide' : 'Filters'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:col-span-3 mb-8 lg:mb-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8" style={{ 
              border: '3px solid #e2e8f0'
            }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#1e3a8a' }}>
                Filter Options
              </h2>

              {/* View Toggle */}
              <div className="mb-6 pb-6 border-b-2" style={{ borderColor: '#e2e8f0' }}>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#475569' }}>
                  View Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className="py-2 px-3 rounded-lg font-medium text-sm transition-all"
                    style={{
                      background: viewMode === 'cards' ? '#1e40af' : '#f1f5f9',
                      color: viewMode === 'cards' ? '#fff' : '#475569',
                      border: viewMode === 'cards' ? 'none' : '2px solid #e2e8f0'
                    }}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className="py-2 px-3 rounded-lg font-medium text-sm transition-all"
                    style={{
                      background: viewMode === 'table' ? '#1e40af' : '#f1f5f9',
                      color: viewMode === 'table' ? '#fff' : '#475569',
                      border: viewMode === 'table' ? 'none' : '2px solid #e2e8f0'
                    }}
                  >
                    Table
                  </button>
                </div>
              </div>

              {/* Candidates Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold" style={{ color: '#475569' }}>
                    Candidates ({selectedCandidates.length || 'All'})
                  </label>
                  {selectedCandidates.length > 0 && (
                    <button
                      onClick={() => setSelectedCandidates([])}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#dc2626' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {candidates.map(candidate => (
                    <label
                      key={candidate.id}
                      className="flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => toggleCandidate(candidate.id)}
                        className="mt-1"
                        style={{ accentColor: '#1e40af' }}
                      />
                      <span className="text-sm font-medium" style={{ color: '#1e293b' }}>
                        {candidate.firstName} {candidate.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Topics Filter */}
              <div className="pt-6 border-t-2" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold" style={{ color: '#475569' }}>
                    Topics ({selectedTopics.length || 'All'})
                  </label>
                  {selectedTopics.length > 0 && (
                    <button
                      onClick={() => setSelectedTopics([])}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#dc2626' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {allTopics.map(topic => (
                    <label
                      key={topic}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic)}
                        onChange={() => toggleTopic(topic)}
                        className="mt-0.5"
                        style={{ accentColor: '#1e40af' }}
                      />
                      <span className="text-sm font-medium" style={{ color: '#1e293b' }}>
                        {topic}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {/* Active Filters Summary */}
            {(selectedCandidates.length > 0 || selectedTopics.length > 0) && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border-2" style={{ borderColor: '#3b82f6' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-2" style={{ color: '#1e40af' }}>
                      Active Filters:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidates.map(id => {
                        const candidate = candidates.find(c => c.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                            style={{ background: '#1e40af', color: '#fff' }}
                          >
                            {candidate.firstName} {candidate.lastName}
                            <button
                              onClick={() => toggleCandidate(id)}
                              className="hover:opacity-80"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        );
                      })}
                      {selectedTopics.map(topic => (
                        <span
                          key={topic}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                          style={{ background: '#059669', color: '#fff' }}
                        >
                          {topic}
                          <button
                            onClick={() => toggleTopic(topic)}
                            className="hover:opacity-80"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCandidates([]);
                      setSelectedTopics([]);
                    }}
                    className="text-sm font-semibold hover:underline whitespace-nowrap"
                    style={{ color: '#dc2626' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="space-y-8">
                {filteredTopics.map(topic => {
                  const topicStatements = filteredStatements.filter(s => s.topic === topic);
                  if (topicStatements.length === 0) return null;

                  return (
                    <div key={topic} className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ 
                      border: '3px solid #e2e8f0'
                    }}>
                      <div className="px-6 py-4" style={{ 
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                      }}>
                        <h3 className="text-xl font-bold text-white">
                          {topic}
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        {filteredCandidates.map(candidate => {
                          const statements = getStatementsForCandidate(candidate.id, topic);
                          if (statements.length === 0) return null;

                          return (
                            <div
                              key={candidate.id}
                              className="p-5 rounded-lg border-2 hover:shadow-md transition-shadow"
                              style={{ 
                                borderColor: '#e2e8f0',
                                background: '#fafafa'
                              }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-lg" style={{ color: '#1e3a8a' }}>
                                    {candidate.firstName} {candidate.lastName}
                                  </h4>
                                  {candidate.website && (
                                    <a
                                      href={`https://${candidate.website.replace(/^https?:\/\//, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm flex items-center gap-1 hover:underline mt-1"
                                      style={{ color: '#3b82f6' }}
                                    >
                                      {candidate.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </div>
                              {statements.map(stmt => (
                                <div key={stmt.key} className="mb-4 last:mb-0">
                                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ 
                                    background: '#dbeafe',
                                    color: '#1e40af'
                                  }}>
                                    {stmt.label}
                                  </div>
                                  <p className="text-sm leading-relaxed mb-2" style={{ color: '#475569' }}>
                                    {stmt.statement}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
                                    <span className="font-medium">Source:</span>
                                    <span className="px-2 py-0.5 rounded" style={{ background: '#f1f5f9' }}>
                                      {stmt.sourceType}
                                    </span>
                                    {stmt.sourceLink && (
                                      <>
                                        <span>•</span>
                                        <span>{stmt.sourceLink}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ 
                border: '3px solid #e2e8f0'
              }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}>
                        <th className="sticky left-0 z-10 px-6 py-4 text-left text-sm font-bold text-white" style={{ 
                          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                          minWidth: '200px'
                        }}>
                          Candidate
                        </th>
                        {filteredTopics.map(topic => (
                          <th
                            key={topic}
                            className="px-6 py-4 text-left text-sm font-bold text-white"
                            style={{ minWidth: '300px' }}
                          >
                            {topic}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate, idx) => (
                        <tr
                          key={candidate.id}
                          style={{ 
                            background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                            borderBottom: '2px solid #e2e8f0'
                          }}
                        >
                          <td className="sticky left-0 z-10 px-6 py-4" style={{ 
                            background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                            borderRight: '2px solid #e2e8f0'
                          }}>
                            <div className="font-bold text-sm" style={{ color: '#1e3a8a' }}>
                              {candidate.firstName} {candidate.lastName}
                            </div>
                            {candidate.website && (
                              <a
                                href={`https://${candidate.website.replace(/^https?:\/\//, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 hover:underline mt-1"
                                style={{ color: '#3b82f6' }}
                              >
                                Website
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </td>
                          {filteredTopics.map(topic => {
                            const statements = getStatementsForCandidate(candidate.id, topic);
                            return (
                              <td key={topic} className="px-6 py-4 align-top">
                                {statements.length > 0 ? (
                                  <div className="space-y-3">
                                    {statements.map(stmt => (
                                      <div key={stmt.key}>
                                        <div className="inline-block px-2 py-1 rounded text-xs font-bold mb-2" style={{ 
                                          background: '#dbeafe',
                                          color: '#1e40af'
                                        }}>
                                          {stmt.label}
                                        </div>
                                        <p className="text-xs leading-relaxed mb-1" style={{ color: '#475569' }}>
                                          {stmt.statement}
                                        </p>
                                        <div className="text-xs" style={{ color: '#94a3b8' }}>
                                          <span className="px-1.5 py-0.5 rounded" style={{ background: '#f1f5f9' }}>
                                            {stmt.sourceType}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs italic" style={{ color: '#94a3b8' }}>
                                    No position available
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filteredStatements.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center" style={{ 
                border: '3px solid #e2e8f0'
              }}>
                <div className="text-6xl mb-4">🗳️</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#1e3a8a' }}>
                  No Results Found
                </h3>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  Try adjusting your filters to see more candidates and positions.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t-2 mt-16 py-8" style={{ borderColor: '#e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium" style={{ color: '#64748b' }}>
            Illinois 9th Congressional District • Primary Election: March 17, 2026
          </p>
          <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
            Data updated regularly from Airtable • Sources cited for all positions
          </p>
        </div>
      </footer>
    </div>
  );
}
