import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState(0);

  const [formValues, setFormValues] = useState({});

  const handleSubmit = async () => {
    // Purge previous run outputs - This is mainly to hide the main output components while loading
    setOutput(null);
    setRequirements(null);
    setShowJsonModal(false);
    setFormValues({});

    setIsLoading(true); // Start loading
    try {
      const res = await axios.post('https://mkim-decoded-intern-2025.onrender.com/extract', { description }); // Shorthand for { description: value }
      const data = res.data;  // res.data will already be a parsed JSON object as long as that's what the backend sent

      setOutput(data);
      setSelectedRoleIndex(0);
      setSelectedEntityIndex(0);

      const rolesSet = new Set();
      const entitiesSet = new Set();
      const featuresSet = new Set();

      data.Roles.forEach((role) => {
        rolesSet.add(role.Role);
        role.Features.forEach((feature) => {
          entitiesSet.add(feature.Entity);
          featuresSet.add(feature.Feature);
        });
      });

      setIsLoading(false); // Stop loading before setting requirements, which will start rendering the main results

      setRequirements({
        appName: data['App Name'],
        roles: [...rolesSet],
        entities: [...entitiesSet],
        features: [...featuresSet],
      });
    } catch (err) {
      console.error('Error fetching AI response:', err);
    } finally {
      setIsLoading(false); // Stop loading  // TODO: Maybe put only in the "catch" clause, don't need finally here?
    }
  };

  const handleRoleClick = (index) => {
    setSelectedRoleIndex(index);
    setSelectedEntityIndex(0); // Reset entity selection on role change
  };

  const handleEntityClick = (index) => {
    setSelectedEntityIndex(index);
  };

  const getEntitiesForRole = (role) => {
    return role.Features.map((f) => f.Entity);
  };

  const getFeatureByEntity = (role, entity) => {
    return role.Features.find((f) => f.Entity === entity);
  };

  const getFieldKey = (role, entity, field) => `${role}|${entity}|${field}`;

  // Simpler Display of JSON App Output from AI
  // return (
  //   <div>
  //     <h1>Mini App Builder</h1>
  //     <textarea onChange={e => setDescription(e.target.value)} />
  //     <button onClick={handleSubmit}>Submit</button>
  //     {output && <pre>{JSON.stringify(output, null, 2)}</pre>}
  //   </div>
  // );

  // Dynamic Mock UI Generation for the App
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Mini App Builder</h1>
      <textarea
        rows={4}
        style={{ width: '100%', marginBottom: '10px' }}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your app..."
      />
      <button onClick={handleSubmit} disabled={isLoading} style={{
        backgroundColor: isLoading ? '#ccc' : '#007bff',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        cursor: isLoading ? 'not-allowed' : 'pointer'
      }}>
        {isLoading ? 'Generating...' : 'Submit'}
      </button>

      {/* Output Loading Wheel */}
      {isLoading && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div className="spinner" />
          <p>Generating your app...</p>
        </div>
      )}

      {/* Main Outputs */}
      {output && requirements && (
        <>
          {/* Requirements Heading */}
          <h3 style={{ marginTop: '30px' }}>AI Captured Requirements:</h3>

          {/* Requirements Summary Box */}
          <div style={{ border: '1px solid #ccc', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJsonModal(true)} style={{ padding: '6px 12px' }}>
                View Requirements in JSON
              </button>
            </div>
            <p><strong>App Name:</strong> {requirements.appName}</p>
            <p><strong>Entities:</strong> {requirements.entities.join(', ')}</p>
            <p><strong>Roles:</strong> {requirements.roles.join(', ')}</p>
            <p><strong>Features:</strong> {requirements.features.join(', ')}</p>
          </div>

          {/* Generated UI Heading */}
          <h3 style={{ marginTop: '30px' }}>Generated UI:</h3>

          {/* UI Box */}
          <div style={{ border: '1px solid #ccc', padding: '20px' }}>
            <h2>{requirements.appName}</h2>

            {/* Top Menu Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <strong>Menu:</strong>
              {output.Roles.map((role, index) => (
                <button
                  key={index}
                  onClick={() => handleRoleClick(index)}
                  style={{
                    backgroundColor: index === selectedRoleIndex ? '#007bff' : '#f0f0f0',
                    color: index === selectedRoleIndex ? '#fff' : '#000',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {role.Role}
                </button>
              ))}
            </div>

            {/* Forms Section */}
            <div style={{ display: 'flex' }}>
              {/* Left Vertical Nav */}
              <div style={{ minWidth: '150px', marginRight: '20px' }}>
                <strong>Forms:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {getEntitiesForRole(output.Roles[selectedRoleIndex]).map((entity, index) => (
                    <button
                      key={index}
                      onClick={() => handleEntityClick(index)}
                      style={{
                        backgroundColor: index === selectedEntityIndex ? '#28a745' : '#f0f0f0',
                        color: index === selectedEntityIndex ? '#fff' : '#000',
                        border: 'none',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {entity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Form Display */}
              <div style={{ flexGrow: 1 }}>
                {(() => {
                  const role = output.Roles[selectedRoleIndex];
                  const entity = getEntitiesForRole(role)[selectedEntityIndex];
                  const feature = getFeatureByEntity(role, entity);

                  return (
                    <div>
                      <h3>{feature.Feature}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {feature['Input Fields'].map((field, i) => (
                          <div key={i}>
                            <label>{field}</label>
                            {/* Non-Tracked Input Fields Sharing Values */}
                            {/* <input type="text" style={{ width: '100%', padding: '6px' }} /> */}
                            {/* Tracked Input Fields with Unique Values */}
                            <input
                              type="text"
                              style={{ width: '100%', padding: '6px' }}
                              value={formValues[getFieldKey(role.Role, entity, field)] || ''}
                              onChange={(e) => {
                                const key = getFieldKey(role.Role, entity, field);
                                setFormValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        {feature.Buttons.map((btn, i) => (
                          <button key={i} style={{ padding: '8px 12px' }}>{btn}</button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for JSON View */}
      {showJsonModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            width: 'auto',  // content-driven width
            maxWidth: '80%',  // prevents overflow
            maxHeight: '80%',
            overflowY: 'auto',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              margin: '20px',
              'margin-left': '42px',    // Widen the Modal
              'margin-right': '42px'
            }}>
              <h3>Requirements JSON</h3>
              <pre style={{
                whiteSpace: 'pre',         // preserves line breaks, disables wrapping
                overflowX: 'auto',         // enables horizontal scroll
                fontFamily: 'monospace',   // consistent character spacing
                fontSize: '14px',          // optional: adjust for readability
              }}>
                {JSON.stringify(output, null, 2)}
              </pre>
              <button onClick={() => setShowJsonModal(false)} style={{ marginTop: '10px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;