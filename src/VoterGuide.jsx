import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, ExternalLink, Filter, X, RefreshCw, Search } from 'lucide-react';
import { AIRTABLE_CONFIG } from './config';

// Tooltip Component
function Tooltip({ children, text }) {
  const [isVisible, setIsVisible] = useState(false);

  if (!text) return children;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '12px 16px',
            background: '#1e293b',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.5',
            maxWidth: '350px',
            width: 'max-content',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            pointerEvents: 'none',
            whiteSpace: 'normal'
          }}
        >
          {text}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1e293b'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function VoterGuide() {
  const [candidates, setCandidates] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for syncing table scroll
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);

  // Fetch data from Airtable
  useEffect(() => {
    fetchData();
  }, []);

  // Sync scroll between top and bottom scrollbars
  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

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
      const candidatesFormatted = candidatesData.records.map(record => {
        console.log('Candidate:', record.fields.FirstName, 'Photo field:', record.fields.Photo);
        return {
          id: record.id, // ✅ Airtable record id
          firstName: record.fields.FirstName || '',
          lastName: record.fields.LastName || '',
          party: record.fields.Party || '',
          website: record.fields.Website || '',
          email: record.fields.EmailAddress || '',
          facebook: record.fields.Facebook || '',
          twitter: record.fields.Twitter || '',
          instagram: record.fields.Instagram || '',
          photoUrl: record.fields.Photo ? record.fields.Photo[0]?.url : null
        };
      });

      // Sort candidates alphabetically by last name
      candidatesFormatted.sort((a, b) => a.lastName.localeCompare(b.lastName));

      setCandidates(candidatesFormatted);

      // Fetch Position Statements with pagination
      let allStatements = [];
      let offset = null;
      
      do {
        const url = offset 
          ? `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.statementsTableName)}?offset=${offset}`
          : `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.statementsTableName)}`;
        
        const statementsResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_CONFIG.personalAccessToken}`,
          }
        });

        if (!statementsResponse.ok) {
          throw new Error(`Failed to fetch statements: ${statementsResponse.status}`);
        }

        const statementsData = await statementsResponse.json();
        allStatements = allStatements.concat(statementsData.records);
        offset = statementsData.offset;
      } while (offset);
      
      // Debug: Log raw data
      console.log('Raw statements from Airtable:', allStatements.length, 'records');
      if (allStatements.length > 0) {
        console.log('First statement fields:', allStatements[0].fields);
      }
      
      const statementsFormatted = allStatements.map(record => ({
        // you renamed StatementKey -> StatementID
        key: record.fields.StatementID || record.fields.StatementKey || record.id,

        // CandidateKey is a Link field => Airtable returns an array of linked record ids
        candidateId: Array.isArray(record.fields.CandidateKey)
          ? record.fields.CandidateKey[0]
          : (record.fields.CandidateKey || ''),

        topic: Array.isArray(record.fields.TopicName)
        ? (record.fields.TopicName[0] || '')
        : (record.fields.TopicName || record.fields.Topic || ''),

        statement: record.fields.Statement || '',
        rawStatement: record.fields['Raw Statement'] || record.fields.RawStatement || '',
        label: record.fields.Label || '',

        // you renamed sourceURL -> SourceURL
        sourceURL: record.fields.SourceURL || record.fields.sourceURL || '',
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

      // Search match - check if query appears in either statement or rawStatement
      const searchMatch = searchQuery.trim() === '' ||
        stmt.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stmt.rawStatement.toLowerCase().includes(searchQuery.toLowerCase());

      return candidateMatch && topicMatch && searchMatch;
    });
  }, [statements, selectedCandidates, selectedTopics, searchQuery]);

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-shrink-0">
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

            {/* Search Bar */}
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}
              />
              <input
                type="text"
                placeholder="Search statements and positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-10 rounded-lg text-sm"
                style={{
                  border: '2px solid #e2e8f0',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 p-1 rounded-full transition-colors"
                  style={{
                    transform: 'translateY(-50%)',
                    background: '#fee2e2',
                    color: '#dc2626'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: '#10b981', color: '#fff' }}
                title="Refresh data from Airtable"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
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
              border: '3px solid #e2e8f0',
              maxHeight: 'calc(100vh - 4rem)',
              overflowY: 'auto'
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
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#3b82f6 #e2e8f0'
                }}>
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
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#3b82f6 #e2e8f0'
                }}>
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
                              <div className="flex items-start gap-4 mb-3">
                                {/* Candidate Photo */}
                                {candidate.photoUrl ? (
                                  <img 
                                    src={candidate.photoUrl} 
                                    alt={`${candidate.firstName} ${candidate.lastName}`}
                                    className="rounded-full"
                                    style={{ 
                                      width: '64px', 
                                      height: '64px', 
                                      objectFit: 'cover',
                                      border: '3px solid #3b82f6'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="rounded-full flex items-center justify-center font-bold text-white"
                                    style={{ 
                                      width: '64px', 
                                      height: '64px',
                                      background: `hsl(${(candidate.id * 137) % 360}, 65%, 55%)`,
                                      border: '3px solid #e2e8f0'
                                    }}
                                  >
                                    {candidate.firstName[0]}{candidate.lastName[0]}
                                  </div>
                                )}
                                
                                <div className="flex-1">
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
                                   {stmt.sourceURL && (
                                      <>
                                      <span>•</span>
                                      <Tooltip text={stmt.rawStatement}>
                                        <a
                                          href={stmt.sourceURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                        >
                                          Source
                                        </a>
                                      </Tooltip>
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
                {/* Scroll hint */}
                <div className="bg-blue-50 px-4 py-2 text-xs font-medium" style={{ color: '#1e40af', borderBottom: '1px solid #3b82f6' }}>
                  💡 Tip: Scroll horizontally to see all topics →
                </div>

                {/* Top Scrollbar */}
                <div
                  ref={topScrollRef}
                  onScroll={handleTopScroll}
                  className="overflow-x-auto"
                  style={{
                    overflowY: 'hidden',
                    height: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#3b82f6 #cbd5e1'
                  }}
                >
                  <div style={{
                    width: `${200 + (filteredTopics.length * 300)}px`,
                    height: '1px'
                  }} />
                </div>

                <div className="table-scroll-container">
                  <div
                    ref={bottomScrollRef}
                    onScroll={handleBottomScroll}
                    className="overflow-x-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#3b82f6 #cbd5e1',
                      overflowX: 'auto'
                    }}
                  >
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
                            <div className="flex items-center gap-3">
                              {/* Candidate Photo */}
                              {candidate.photoUrl ? (
                                <img 
                                  src={candidate.photoUrl} 
                                  alt={`${candidate.firstName} ${candidate.lastName}`}
                                  className="rounded-full"
                                  style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    objectFit: 'cover',
                                    border: '2px solid #3b82f6',
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div 
                                  className="rounded-full flex items-center justify-center font-bold text-white text-xs"
                                  style={{ 
                                    width: '48px', 
                                    height: '48px',
                                    background: `hsl(${(candidate.id * 137) % 360}, 65%, 55%)`,
                                    border: '2px solid #e2e8f0',
                                    flexShrink: 0
                                  }}
                                >
                                  {candidate.firstName[0]}{candidate.lastName[0]}
                                </div>
                              )}
                              
                              <div>
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
                              </div>
                            </div>
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
                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                                          <span className="px-1.5 py-0.5 rounded" style={{ background: '#f1f5f9' }}>
                                            {stmt.sourceType}
                                          </span>
                                          {stmt.sourceURL && (
                                            <>
                                              <span>•</span>
                                              <Tooltip text={stmt.rawStatement}>
                                                <a
                                                  href={stmt.sourceURL}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="hover:underline"
                                                >
                                                  Source
                                                </a>
                                              </Tooltip>
                                            </>
                                          )}
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
