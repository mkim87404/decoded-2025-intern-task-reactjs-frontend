import './App.css';
import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';

function App() {
  // App general assets
  const descriptionRef = useRef();
  const [description, setDescription] = useState(''); // Not actively used in the current version, but good to persist this data for future features
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState(false);
  const [output, setOutput] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showError, setShowError] = useState(false);

  // For tracking mock UI menu & Panel selections
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState(0);

  // For tracking mock UI form input field values
  const [formValues, setFormValues] = useState({});
  
  // For Google reCAPTCHA
  const REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY = process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY;
  const recaptchaRef = useRef();
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleCaptchaChange = (value) => { setCaptchaVerified(!!value); };

  // Submit button click handler
  const handleSubmit = async () => {
    // Capture the current text area input & and do minimal validation of acceptable user input for the app description
    const userInput = descriptionRef.current.value
    if (typeof userInput !== 'string' || userInput.trim() === '') {
      alert('Please enter a valid description.');
      return;
    }

    // Disable the submit button
    setIsSubmitButtonDisabled(true);

    // Purge previous submit outputs - This is mainly to hide the main output components while loading
    setOutput(null);
    setRequirements(null);
    setShowJsonModal(false);
    setSelectedRoleIndex(0);
    setSelectedEntityIndex(0);
    setFormValues({});
    setShowError(false);

    // Show the loading wheel
    setIsLoading(true);

    // Store the captured app description and begin processing
    setDescription(userInput);  // Not actively used in the current version, but good to persist this data for future features

    try {
      const res = await axios.post('https://mkim-decoded-intern-2025.onrender.com/extract', { description: userInput });
      
      if (res.status !== 200) {
        setShowError(true);
        return;
      }
      
      const data = res.data;  // res.data will already be a parsed JSON object as long as that's what the backend sent
      setOutput(data);  // this update is not immediate in React

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

      setIsLoading(false); // Hide loading wheel before setting requirements, which will start rendering the main results

      setRequirements({
        appName: data['App Name'],
        roles: [...rolesSet],
        entities: [...entitiesSet],
        features: [...featuresSet],
      }); // This will kick off the dynamic rendering of the main mock ui component section
    } catch (err) {
      console.error('Error fetching AI response:', err);
      setShowError(true);
    } finally { // this will always run at the end, even before the "try" clause "return"s
      setIsLoading(false); // Hide loading wheel
      setCaptchaVerified(false);
      recaptchaRef.current.reset(); // Reset the Google reCAPTCHA checkbox visually
      setIsSubmitButtonDisabled(false);  // Submit button will be enabled when the reCAPTCHA is completed again
    }
  };

  // Helper functions for the mock UI generation & panel selection state tracking
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

  // Dynamic mock UI generation for the app
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Mock App Builder</h1>
      <textarea
        ref={descriptionRef}
        rows={4}
        style={{ width: '100%', marginBottom: '10px' }}
        placeholder="Describe your app..."
      />
      {/* Google reCAPTCHA */}
      <div style={{ marginBottom: '10px' }}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY}
          onChange={handleCaptchaChange}
        />
      </div>
      <button onClick={handleSubmit} disabled={isSubmitButtonDisabled || !captchaVerified} style={{
        backgroundColor: isSubmitButtonDisabled ? '#ccc' : '#007bff',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        cursor: isSubmitButtonDisabled ? 'not-allowed' : 'pointer'
      }}>
        {isSubmitButtonDisabled ? 'Generating...' : 'Submit'}
      </button>
      {showError && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Please try again, the AI might be temporarily unavailable.
        </div>
      )}

      {/* Loading wheel */}
      {isLoading && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div className="spinner" />
          <p>Generating your app...</p>
        </div>
      )}

      {/* Main outputs */}
      {output && requirements && (
        <>
          {/* Requirements heading */}
          <h3 style={{ marginTop: '30px' }}>AI Captured Requirements:</h3>

          {/* Requirements summary box */}
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

          {/* Generated UI heading */}
          <h3 style={{ marginTop: '30px' }}>Generated UI:</h3>

          {/* UI box */}
          <div style={{ border: '1px solid #ccc', padding: '20px' }}>
            <h2>{requirements.appName}</h2>

            {/* Top menu bar */}
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

            {/* Forms section */}
            <div style={{ display: 'flex' }}>
              {/* Left vertical nav */}
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

              {/* Right form display */}
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

      {/* Modal for JSON view of app requirements */}
      {showJsonModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJsonModal(false);
            }
          }}
        >
          <div style={{
            backgroundColor: '#fff',
            width: 'auto',  // content-driven width
            maxWidth: '80%',  // prevents overflow
            maxHeight: '80%',
            overflowY: 'auto',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)'
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
      )}
    </div>
  );
}

export default App;