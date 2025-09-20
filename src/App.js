// import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState(null);

  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState(0);

  const handleSubmit = async () => {
    try {
      const res = await axios.post('https://mkim-decoded-intern-2025.onrender.com/extract', { description }); // Shorthand for { description: value }
      setOutput(res.data);  // res.data will already be a parsed JSON object as long as that's what the backend sent
      setSelectedRoleIndex(0);
      setSelectedEntityIndex(0);
    } catch (err) {
      console.error('Error fetching AI response:', err);
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
      <button onClick={handleSubmit}>Submit</button>

      {output && (
        <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
          <h2>{output['App Name']}</h2>

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
                          <input type="text" style={{ width: '100%', padding: '6px' }} />
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
      )}
    </div>
  );
}

export default App;