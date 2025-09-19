// import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState(null);

  const handleSubmit = async () => {
    const res = await axios.post('https://mkim-decoded-intern-2025.onrender.com/extract', { description }); // Shorthand for { description: value }
    setOutput(res.data);  // res.data will already be a parsed JSON object as long as that's what the backend sent
  };

  return (
    <div>
      <h1>Mini App Builder</h1>
      <textarea onChange={e => setDescription(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
      {output && <pre>{JSON.stringify(output, null, 2)}</pre>}
    </div>
  );
}

export default App;