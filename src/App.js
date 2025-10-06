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
  const [errorMessage, setErrorMessage] = useState('Please try again, the AI might be temporarily unavailable due to high load.');
  const AXIOS_REQUEST_TIMEOUT = Number(process.env.REACT_APP_AXIOS_REQUEST_TIMEOUT) || 25000; // Use fallback timeout if no environment variable set

  // For tracking mock UI menu & Panel selections
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState(0);  // Assume 1 to 1 cardinality pairing between Feature - Entity, hence the "EntityIndex" will be interchangeable with "FeatureIndex"

  const handleRoleClick = (index) => {
    setSelectedRoleIndex(index);
    setSelectedEntityIndex(0); // Reset entity selection on role change
  };
  const handleEntityClick = (index) => {
    setSelectedEntityIndex(index);
  };
  const getEntitiesForRole = (role) => {  // Undefined check for React rendering quirks
    if (!role || !Array.isArray(role.Features)) return [];
    return role.Features.map((f) => f.Entity);
  };
  const getFeatureByRoleAndEntityIndex = (role, entityIndex) => {  // Undefined check for React rendering quirks
    if (!role || !Array.isArray(role.Features) || role.Features.length < (entityIndex + 1)) return null;
    return role.Features[entityIndex];
  };

  // For tracking mock UI form input field values
  const [formValues, setFormValues] = useState({});

  const getFieldKey = (role, entity, feature, field) => `${role}|${entity}|${feature}|${field}`;

  // For Google reCAPTCHA
  const GOOGLE_RECAPTCHA_SITE_KEY = process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY;
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
      const res = await axios.post(
        'https://mkim-decoded-intern-2025.onrender.com/extract',
        { description: userInput },
        { timeout: AXIOS_REQUEST_TIMEOUT }
      );

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

      if (err.code === 'ECONNABORTED') {
        setErrorMessage('The AI timed out while thinking. Please consider improving your app description.');
      } else {
        setErrorMessage('Please try again, the AI might be temporarily unavailable due to high load.');
      }

      setShowError(true);
    } finally { // this will always run at the end, even before the "try" clause "return"s
      setIsLoading(false); // Hide loading wheel
      setCaptchaVerified(false);
      recaptchaRef.current.reset(); // Reset the Google reCAPTCHA checkbox visually
      setIsSubmitButtonDisabled(false);  // Submit button will be enabled when the reCAPTCHA is completed again
    }
  };

  // Dynamic mock UI generation for the app
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Mock App Builder</h1>
        <textarea
          ref={descriptionRef}
          rows={4}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          placeholder="Describe your app..."
        />
        {/* Google reCAPTCHA */}
        <div className="mb-4">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={GOOGLE_RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitButtonDisabled || !captchaVerified}
          className={`w-full py-3 rounded-lg font-semibold transition text-white ${
            isSubmitButtonDisabled || !captchaVerified
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          }`}
        >
          Submit
        </button>
        {showError && (
          <div className="text-red-600 mt-4 text-center">
            {errorMessage || 'Please try again, the AI might be temporarily unavailable due to high load.'}
          </div>
        )}

        {/* Loading wheel */}
        {isLoading && (
          <div className="mt-8 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <p className="text-gray-600">Generating your app...</p>
          </div>
        )}

        {/* Main outputs */}
        {output && requirements && (
          <>
            {/* Requirements heading */}
            <h3 className="mt-10 text-xl font-semibold text-gray-800">AI Captured Requirements:</h3>

            {/* Requirements summary box */}
            <div className="border border-gray-200 rounded-lg p-6 mt-2 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowJsonModal(true)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                >
                  View Requirements in JSON
                </button>
              </div>
              <p className="mt-2"><span className="font-semibold">App Name:</span> {requirements.appName}</p>
              <p><span className="font-semibold">Entities:</span> {requirements.entities.join(', ')}</p>
              <p><span className="font-semibold">Roles:</span> {requirements.roles.join(', ')}</p>
              <p><span className="font-semibold">Features:</span> {requirements.features.join(', ')}</p>
            </div>

            {/* Generated UI heading */}
            <h3 className="mt-10 text-xl font-semibold text-gray-800">Generated UI:</h3>

            {/* UI box */}
            <div className="border border-gray-200 rounded-lg p-6 mt-2 bg-gray-50">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{requirements.appName}</h2>

              {/* Top menu bar */}
              <div className="flex gap-2 mb-6 items-center">
                <span className="font-semibold text-gray-700">Menu:</span>
                {output.Roles.map((role, index) => (
                  <button
                    key={index}
                    onClick={() => handleRoleClick(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition border ${
                      index === selectedRoleIndex
                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                        : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'
                    }`}
                  >
                    {role.Role}
                  </button>
                ))}
              </div>

              {/* Forms section */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left vertical nav */}
                <div className="min-w-[150px] md:mr-6">
                  <span className="font-semibold text-gray-700">Forms:</span>
                  <div className="flex flex-col gap-2 mt-3">
                    {output?.Roles?.[selectedRoleIndex]?.Features && output.Roles[selectedRoleIndex].Features.map((featureItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleEntityClick(index)}
                        className={`px-3 py-2 rounded-lg text-left font-medium transition border ${
                          index === selectedEntityIndex
                            ? 'bg-green-600 text-white border-green-600 shadow'
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-green-50'
                        }`}
                      >
                        {`${featureItem.Entity} (${featureItem.Feature})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right form display */}
                <div className="flex-1">
                  {(() => {
                    const role = output?.Roles?.[selectedRoleIndex] && output.Roles[selectedRoleIndex];
                    const entity = role && Array.isArray(role.Features) ? getEntitiesForRole(role)[selectedEntityIndex] || null : null;
                    const feature = getFeatureByRoleAndEntityIndex(role, selectedEntityIndex);
                    if (!feature) return null;

                    return (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">{feature.Feature}</h3>
                        <div className="flex flex-col gap-4">
                          {Array.isArray(feature['Input Fields']) && feature['Input Fields'].map((field, i) => (
                            <div key={i}>
                              <label className="block mb-1 font-medium text-gray-700">{field}</label>
                              {/* Tracked Input Fields with Unique Values */}
                              <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                value={formValues[getFieldKey(role.Role, entity, feature.Feature, field)] || ''}
                                onChange={(e) => {
                                  const key = getFieldKey(role.Role, entity, feature.Feature, field);
                                  setFormValues((prev) => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 flex gap-3">
                          {Array.isArray(feature.Buttons) && feature.Buttons.map((btn, i) => (
                            <button
                              key={i}
                              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                            >
                              {btn}
                            </button>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowJsonModal(false);
              }
            }}
          >
            <div className="bg-white w-auto max-w-[80vw] max-h-[80vh] overflow-y-auto rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Requirements JSON</h3>
              <pre className="whitespace-pre overflow-x-auto font-mono text-sm bg-gray-100 p-4 rounded-lg">
                {JSON.stringify(output, null, 2)}
              </pre>
              <button
                onClick={() => setShowJsonModal(false)}
                className="mt-4 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;