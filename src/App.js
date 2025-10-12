import './App.css';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { WrenchScrewdriverIcon, SparklesIcon, ArrowPathIcon, CheckCircleIcon, ArrowUpIcon } from '@heroicons/react/24/solid';

function App() {
  // App general assets
  const descriptionRef = useRef(null);
  const [description, setDescription] = useState(''); // Not actively used in the current version, but good to persist this data for future features
  const [isBuildButtonDisabled, setIsBuildButtonDisabled] = useState(false);
  const [output, setOutput] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // HTTP REST request configurations
  const AXIOS_REQUEST_TIMEOUT = Number(process.env.REACT_APP_AXIOS_REQUEST_TIMEOUT) || 25000; // Use fallback timeout if no environment variable set
  const BACKEND_WEBSERVICE_RESOURCE_URL = process.env.REACT_APP_BACKEND_WEBSERVICE_RESOURCE_URL;

  // For Google reCAPTCHA
  const GOOGLE_RECAPTCHA_SITE_KEY = process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY;
  const recaptchaRef = useRef(null);
  const [captchaResult, setCaptchaResult] = useState(null);

  const handleCaptchaChange = (result) => { setCaptchaResult(result); };

  // Build button click handler
  const handleBuild = async () => {
    // Capture the current text area input & and CAPTCHA result
    const userInput = descriptionRef.current?.value;
    const captchaValue = captchaResult;

    // Do minimal validation of acceptable user input
    if (typeof userInput !== 'string' || userInput.trim() === '') {
      // alert('Please enter a valid description.');  // Old alert design, but functional
      setErrorMessage('Please enter a valid description.');
      setShowError(true);
      return;
    } else if (!captchaValue) {
      setErrorMessage('Please try again, the reCAPTCHA expired.');
      setShowError(true);
      return;
    }

    // Disable the build button
    setIsBuildButtonDisabled(true);

    // Purge previous build outputs - This is mainly to hide the main output components while loading
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
      // Send the app description to the backend and wait for the AI response
      const res = await axios.post(
        BACKEND_WEBSERVICE_RESOURCE_URL,
        { 
          description: userInput,
          recaptcha: captchaValue
        },
        { timeout: AXIOS_REQUEST_TIMEOUT }
      );

      if (res.status !== 200) {
        setErrorMessage('Please try again, the AI might be temporarily unavailable due to high load.');
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
      setCaptchaResult(null);  // Clear the stored captcha result
      recaptchaRef.current?.reset(); // Reset the Google reCAPTCHA checkbox visually
      setIsBuildButtonDisabled(false);  // Build button will be enabled when the reCAPTCHA is completed again
    }
  };

  // Auto-scrolling to the main output after DOM mutations finish (and before the browser paints) with "useLayoutEffect", to ensure correct calculation.
  const mainOutputRef = useRef(null);

  useLayoutEffect(() => {
    if (requirements && mainOutputRef.current) {
      const mainOutputScrollPosition = window.scrollY + mainOutputRef.current.getBoundingClientRect().top - 20; // 20px offset from top for aesthetics
      const maxScrollPosition = document.body.scrollHeight - window.innerHeight;

      const idealScrollPosition = Math.min(mainOutputScrollPosition, maxScrollPosition);

      window.scrollTo({
        top: idealScrollPosition,
        behavior: 'smooth',
      });

      // Don't need to register any cleanup function here, as the only thing that changes from this effect is the scroll position
    }
  }, [requirements]); // "requirements" is the main state that signals the rendering of the main output components

  // Dynamically display the "Back to Top" button
  const [showBackToTop, setShowBackToTop] = useState(false);

  useLayoutEffect(() => {
    const handleScroll = () => {
      if (descriptionRef.current) {
        const pageIsScrollable = document.body.scrollHeight > window.innerHeight;
        const distanceFromTopOfViewportToTopOfDescriptionBox = descriptionRef.current.getBoundingClientRect().top;
        setShowBackToTop(pageIsScrollable && distanceFromTopOfViewportToTopOfDescriptionBox < 0); // Show 'Back to Top' button if user has scrolled past the description box
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check in case the user is already scrolled down when the component mounts. This check is what caused the migration from "useEffect" to "useLayoutEffect"

    // Cleanup function to remove the event listener on component unmount (where 'component' means the entire App here)
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Modal scroll focus (i.e. disable background scroll) & closing mechanism
  const modalRef = useRef(null);

  useEffect(() => {
    // When modal opens
    if (showJsonModal) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';

      // Attach event listener for clicks outside the modal to close it
      const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          setShowJsonModal(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside); // "mousedown" is more responsive than "click"

      // Register cleanup function to restore background scrolling and release event listeners before next run of this effect
      // Cleanup is not registered when this effect is triggered on modal close, to avoid unnecessary execution
      return () => {
        document.body.style.overflow = 'auto';
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showJsonModal]);

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

  // Dynamic mock UI generation for the app
  return (
      // 1. Static Gradient Background
      // <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 font-sans transition-colors duration-700 animate-fade-in animate-in fade-in">
      // 2. Swinging Gradient Background
      // <div className="min-h-screen animated-gradient py-8 px-4 font-sans transition-colors duration-700 animate-fade-in animate-in fade-in">
      // 3. Flowing Gradient Background
      <div className="min-h-screen gradient-wrapper py-8 px-4 font-sans transition-colors duration-700 animate-fade-in animate-in fade-in">
        <div className="max-w-3xl mx-auto bg-white/30 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700 rounded-3xl shadow-2xl p-8 relative overflow-hidden animate-fade-in-slow animate-in fade-in">
          {/* Glassy animated background blobs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-400 opacity-30 rounded-full blur-3xl animate-blob z-0" style={{ animationDelay: '0s' }}></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-400 opacity-30 rounded-full blur-3xl animate-blob z-0" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-fuchsia-400 via-cyan-400 to-lime-400 opacity-10 rounded-full blur-3xl animate-blob z-0" style={{ animationDelay: '4s', transform: 'translate(-50%, -50%)' }}></div>
          <div className="relative z-10 animate-fade-in animate-in fade-in">
            {/* 1. Colorful Gradient Heading */}
            {/* <h1 className="counter-hue text-4xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-lime-400 drop-shadow-lg tracking-tight animate-fade-in flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-10 w-10 text-fuchsia-400 animate-bounce" />
              Mock App Builder
            </h1> */}
            {/* 2. Dark Solid Heading */}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-800 dark:text-white drop-shadow-lg tracking-tight animate-fade-in flex items-center gap-2">
              {/* Colorful Counter-BG Hue for just the Heading Icon */}
              <WrenchScrewdriverIcon className="h-10 w-10 text-fuchsia-400 counter-hue-bounce" />
              Mock App Builder
            </h1>
            <textarea
              ref={descriptionRef}
              rows={4}
              className="w-full mb-4 p-4 border border-white/30 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 shadow-inner focus:outline-none focus:ring-4 focus:ring-fuchsia-400/40 dark:focus:ring-cyan-400/40 transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-lg text-black dark:text-white hover:scale-105 hover:shadow-2xl animate-in fade-in"
              placeholder="Describe your app..."
            />
            {/* Google reCAPTCHA */}
            <div className="mb-4 animate-fade-in animate-in fade-in">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={GOOGLE_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}  // This triggers when CAPTCHA passes (either silently or through challenge success) or when it expires
                                                // When CAPTCHA passes, the handler receives a token string, and when it expires, the handler receives null
              />
            </div>
            {/* Build Button */}
            <button
              onClick={handleBuild}
              disabled={isBuildButtonDisabled || !captchaResult}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/50 dark:focus:ring-cyan-400/50 group relative overflow-hidden animate-in fade-in ${
                isBuildButtonDisabled || !captchaResult
                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed text-gray-500'
                  : 'bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-lime-400 hover:from-cyan-400 hover:to-fuchsia-500 text-white shadow-xl hover:scale-105 hover:shadow-2xl active:scale-95'
              }`}
            >
              <span className="relative z-10 animate-fade-in flex justify-center items-center">
                Build
              </span>
              <span className={`absolute left-0 top-0 w-full h-full transition-opacity duration-300 ${
                isBuildButtonDisabled || !captchaResult
                  ? 'opacity-0'
                  : 'opacity-0 group-hover:opacity-100 bg-white/10'
              }`}></span>
            </button>
            {/* Error Message */}
            {showError && (
              <div className="text-red-600 dark:text-red-400 mt-4 font-semibold text-center animate-shake animate-fade-in animate-in fade-in">
                {errorMessage || 'Please try again, the AI might be temporarily unavailable due to high load.'}
              </div>
            )}

            {/* Loading wheel */}
            {isLoading && (
              <div className="mt-8 flex flex-col items-center animate-fade-in">
                <ArrowPathIcon className="h-10 w-10 text-fuchsia-500 mb-2 drop-shadow-lg animate-spin" />
                <p className="text-gray-700 dark:text-gray-200 font-medium">Generating your app...</p>
              </div>
            )}

            {/* Main outputs */}
            {output && requirements && (
              <>
                {/* App Requirements heading */}
                <h3 ref={mainOutputRef} className="mt-10 text-2xl font-bold text-gray-800 dark:text-white tracking-tight animate-fade-in animate-in fade-in flex items-center gap-2">
                  <CheckCircleIcon className="h-7 w-7 text-lime-400 animate-bounce" />
                  AI Captured App Requirements:
                </h3>

                {/* Requirements summary box with glassmorphism and glowing border */}
                <div className="border-2 border-gradient-to-r from-fuchsia-400 via-cyan-400 to-lime-400 dark:from-cyan-500 dark:via-fuchsia-500 dark:to-lime-500 rounded-2xl p-6 mt-2 bg-white/60 dark:bg-gray-800/60 shadow-xl backdrop-blur-md relative animate-fade-in hover:shadow-2xl transition-all duration-300 animate-in fade-in">
                  <div className="flex justify-end animate-fade-in animate-in fade-in">
                    <button
                      onClick={() => setShowJsonModal(true)}
                      className="px-3 py-1 rounded bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 hover:from-fuchsia-200 hover:to-cyan-200 dark:hover:from-fuchsia-700 dark:hover:to-cyan-700 text-sm font-medium text-black dark:text-white shadow transition-all hover:scale-105 hover:shadow-xl animate-in fade-in"
                    >
                      View Requirements in JSON
                    </button>
                  </div>
                  <p className="mt-2 animate-fade-in animate-in fade-in text-black dark:text-white"><span className="font-semibold">App Name:</span> {requirements.appName}</p>
                  <p className="animate-fade-in animate-in fade-in text-black dark:text-white"><span className="font-semibold">Entities:</span> {requirements.entities.join(', ')}</p>
                  <p className="animate-fade-in animate-in fade-in text-black dark:text-white"><span className="font-semibold">Roles:</span> {requirements.roles.join(', ')}</p>
                  <p className="animate-fade-in animate-in fade-in text-black dark:text-white"><span className="font-semibold">Features:</span> {requirements.features.join(', ')}</p>
                </div>

                {/* Generated App UI heading */}
                <h3 className="mt-10 text-2xl font-bold text-gray-800 dark:text-white tracking-tight animate-fade-in animate-in fade-in flex items-center gap-2">
                  <SparklesIcon className="h-7 w-7 text-cyan-400 animate-bounce" />
                  Generated App UI:
                </h3>

                {/* UI box with glassmorphism and glowing border */}
                <div className="border-4 border-gradient-to-r from-fuchsia-400 via-cyan-400 to-lime-400 dark:from-cyan-500 dark:via-fuchsia-500 dark:to-lime-500 rounded-3xl p-6 mt-2 bg-white/70 dark:bg-gray-900/70 shadow-2xl backdrop-blur-lg relative animate-fade-in hover:shadow-2xl transition-all duration-300 animate-in fade-in">
                  <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-lime-400 drop-shadow-lg tracking-tight animate-fade-in-slow animate-in fade-in flex items-center gap-2">
                    <SparklesIcon className="h-8 w-8 text-lime-400 animate-bounce" />
                    {requirements.appName}
                  </h2>

                  {/* Top menu bar */}
                  <div className="flex gap-2 mb-6 items-center animate-fade-in animate-in fade-in">
                    <span className="font-semibold text-gray-700 dark:text-gray-200 animate-fade-in animate-in fade-in">Menu:</span>
                    {output.Roles.map((role, index) => (
                      <button
                        key={index}
                        onClick={() => handleRoleClick(index)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 border shadow-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 dark:focus:ring-cyan-400/40 group relative overflow-hidden hover:scale-105 hover:shadow-2xl active:scale-95 animate-in fade-in ${
                          index === selectedRoleIndex
                            ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-lime-400 text-white border-cyan-400 scale-105 ring-2 ring-fuchsia-400/40 dark:ring-cyan-400/40 animate-pop'
                            : 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gradient-to-r hover:from-fuchsia-100 hover:to-cyan-100 dark:hover:from-fuchsia-900 dark:hover:to-cyan-900'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          <SparklesIcon className="h-5 w-5 text-cyan-400 animate-bounce" />
                          {role.Role}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Forms section */}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left vertical nav */}
                    <div className="min-w-[150px] md:mr-6">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">Forms:</span>
                      <div className="flex flex-col gap-2 mt-3">
                        {output?.Roles?.[selectedRoleIndex]?.Features && output.Roles[selectedRoleIndex].Features.map((featureItem, index) => (
                          <button
                            key={index}
                            onClick={() => handleEntityClick(index)}
                            className={`px-3 py-2 rounded-xl text-left font-semibold transition-all duration-200 border shadow focus:outline-none focus:ring-2 focus:ring-lime-400/40 dark:focus:ring-fuchsia-400/40 group relative overflow-hidden animate-in fade-in ${
                              index === selectedEntityIndex
                                ? 'bg-gradient-to-r from-lime-400 to-cyan-400 text-white border-lime-400 scale-105 ring-2 ring-lime-400/40 dark:ring-fuchsia-400/40 animate-pop'
                                : 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gradient-to-r hover:from-lime-100 hover:to-cyan-100 dark:hover:from-lime-900 dark:hover:to-cyan-900'
                            }`}
                          >
                            <span className="relative z-10 flex items-center gap-1">
                              <SparklesIcon className="h-4 w-4 text-lime-400 animate-bounce" />
                              {`${featureItem.Entity} (${featureItem.Feature})`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right form display */}
                    <div className="flex-1 min-w-0">
                      {(() => {
                        const role = output?.Roles?.[selectedRoleIndex] && output.Roles[selectedRoleIndex];
                        const entity = role && Array.isArray(role.Features) ? getEntitiesForRole(role)[selectedEntityIndex] || null : null;
                        const feature = getFeatureByRoleAndEntityIndex(role, selectedEntityIndex);
                        if (!feature) return null;

                        return (
                          <div className="animate-fade-in-slow animate-in fade-in">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow flex items-center gap-2 animate-in fade-in">
                              <SparklesIcon className="h-6 w-6 text-cyan-400 animate-bounce" />
                              {feature.Feature}
                            </h3>
                            <div className="flex flex-col gap-4">
                              {Array.isArray(feature['Input Fields']) && feature['Input Fields'].map((field, i) => (
                                <div key={i} className="animate-in fade-in">
                                  <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200 animate-fade-in animate-in fade-in">{field}</label>
                                  {/* Tracked Input Fields with Unique Values */}
                                  <input
                                    type="text"
                                    className="w-full p-3 border border-white/30 dark:border-gray-700 rounded-xl bg-white/70 dark:bg-gray-800/70 shadow-inner focus:outline-none focus:ring-4 focus:ring-fuchsia-400/40 dark:focus:ring-cyan-400/40 transition text-lg text-black dark:text-white animate-fade-in animate-in fade-in"
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
                            <div className="mt-6 flex flex-wrap gap-3 max-w-full">
                              {Array.isArray(feature.Buttons) && feature.Buttons.map((btn, i) => (
                                <button
                                  key={i}
                                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-lime-400 text-white font-bold shadow-xl hover:from-cyan-400 hover:to-fuchsia-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/50 dark:focus:ring-cyan-400/50 active:scale-95 animate-pop animate-in fade-in flex items-center gap-2"
                                >
                                  <SparklesIcon className="h-5 w-5 text-lime-400 animate-bounce" />
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
            {showJsonModal && createPortal(
              <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex justify-center items-center z-50 animate-fade-in animate-in fade-in">
                <div ref={modalRef} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 w-auto max-w-[80vw] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-8 border-2 border-gradient-to-r from-fuchsia-400 via-cyan-400 to-lime-400 dark:from-cyan-500 dark:via-fuchsia-500 dark:to-lime-500 animate-fade-in-slow animate-in fade-in">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">App Requirements JSON</h3>
                  <pre className="whitespace-pre overflow-x-auto font-mono text-base bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-gray-800 dark:text-gray-200">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                  <button
                    onClick={() => setShowJsonModal(false)}
                    className="mt-6 px-6 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 hover:from-fuchsia-200 hover:to-cyan-200 dark:hover:from-fuchsia-700 dark:hover:to-cyan-700 font-bold text-black dark:text-white shadow transition-all animate-in fade-in"
                  >
                    Close
                  </button>
                </div>
              </div>,
              document.getElementById('modal-root')
            )}
          </div>{/* end relative z-10 */}
        </div>
        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full bg-white/30 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700 shadow font-bold text-gray-800 dark:text-white hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowUpIcon className="h-6 w-6" />
            Back to Top
          </button>
        )}
      </div>
  );
}

export default App;