# How to get started

1. Please visit the live frontend site at https://decoded-2025-intern-task-reactjs-frontend.onrender.com/
2. Inside the Text Input box, enter any description of an app.
3. Click "Submit" and wait for the Mock App to generate and the loading wheel to disappear. You may be prompted to retry in the case of a temporary AI API outage or rate limiting (Currently using a Free AI Model with inherently slow and fluctuant response times).
5. Under the "AI Captured Requirements" section, note the extracted App Requirements including (App Name, Entities, Roles, Features).
6. (Optional) Click "View Requirements in JSON" Button to view the hierarchical structure among the Roles, Features and Entities extracted.
7. Under the "Generated UI" section, explore the generated Mock UI, containing a top menu for the "Roles" selection, side panel for the "Forms" selection, and the dynamically generated forms containing relevant input fields and buttons.

## Project Deployment Structure

Frontend Site (App's Main Entry): https://decoded-2025-intern-task-reactjs-frontend.onrender.com/  
Frontend GitHub Repository: https://github.com/mkim87404/decoded-2025-intern-task-reactjs-frontend  
Backend GitHub Repository: https://github.com/mkim87404/decoded-2025-intern-task-nodejs-backend  
Backend Webservice Domain: https://mkim-decoded-intern-2025.onrender.com/  
Backend Webservice Resource Endpoint URL: https://mkim-decoded-intern-2025.onrender.com/extract

This project is deployed on the "Render" hosting platform in 2 separate GitHub repositories, 1 for the frontend, and 1 for the backend.  
The frontend is deployed as a Static Site written in React.js, bootstrapped with [Create React App](https://github.com/facebook/create-react-app).  
The backend is deployed as a Web Service written in Node.js, utilizing the Express framework to expose a REST API (POST) which the frontend interacts with to display dynamic content.

## Project Design & Features

1. **Main flow of execution:** When the user enters an app description and clicks submit on the frontend site, the frontend JavaScript sends this description as a POST REST HTTP Request to the Backend Webservice endpoint. The backend Node.js app will then parse this description and wrap it in a template prompt instruction, sending the combined prompt as a request to an AI API facilitated by the "openrouter.ai" RESTful API. The backend will then receive a JSON-structured response from the AI API containing the extracted App Requirements in a hierarchical structure, parsing and validating this JSON data using my pre-configured JSON Schema definition utilizing the "AJV" package. If the JSON data passes my schema validation, the backend will send this JSON object back to the frontend, and the frontend JavaScript will parse and use this JSON object to dynamically generate the Mock App, and display the extracted requirements including (App Name, Entities, Roles, Features) both in a flat table display, as well as an optional modal that shows a prettified JSON display of these extracted requirements, revealing the hierarchical associations among "Roles", "Features", and "Entities".
2. **Data validation:** implemented on both the front and backend, such that when a user enters only whitespaces on the frontend text box, they are prompted to enter a valid description again, and likewise on the backend, where the AI API is invoked only if the received description is a non-empty string.
3. **Error-handling:** implemented on both the front and backend, such that when the backend fails to generate an AI response or the frontend fails to receive the backend response, this error is handled gracefully and propagates from the backend to the frontend as a descriptive "Please try again ~" alert message on the frontend.
4. **Security remarks:** I deemed the current design of my web app not particularly vulnerable to any prompt-injection attacks, because my backend logic is making requests to a stateless AI API that has no access to any of my app's or its users' sensitive information, and is accepting the AI's response only if the returned JSON data strictly passes my JSON schema validation. Also, I'm simply transporting and surfacing this generated JSON content on my frontend UI without using any of its contents for further page generation or data-access/manipulation logic, so even if a malicious user is able to inject and generate a JSON response containing inappropriate content, this content will not interact with or be reproducable by any other users of my web app.
5. **Spam prevention:** When a user hits "Submit" on the frontend and the text box input passes minimal validation, the "Submit" button becomes disabled from further clicking while the app is generating, and becomes enabled only when the current app finishes generating or returns with a failure, in which case a descriptive error message will prompt the user to try again.

## Future Improvement Backlogs

1. **Authentication layer via Database providers such as MongoDB, Supabase, Firebase, etc.:** Because the current web app is accessible to the global public, anyone with the frontend site url can interact with the app and quickly exhaust the AI API's usage quota. So, a login mechanism can be implemented to allow only the authenticated users that have enough credits or an active subscription status on their account to be able to access and use the App portal. Hence, the backend will also need to verify the requesting user's authority before invoking the AI API.

2. **Save & Load previously created mock apps for each logged in user, stored in JSON format using NoSQL Database providers such as MongoDB, Firebase, etc.:** After implementing the Login mechanism and hooking up a NoSQL Database to the backend, I could create a new collection on the database where each document will represent a single pairing between a User and a Mock App they have created and saved in the past, with fields such as "userID", "generatedApp", etc. where the "generatedApp" field will store the JSON data of the created app. Here, the "userID" field could be indexed to allow for faster query performance. When a user logs into the App portal, the app could initiate a query against this database collection filtering by the indexed "userID" field, fetching all "generatedApp" JSON data belonging to this user, and display a selection panel on the frontend named like "My Saved Apps" where each button represents a historic app labelled with its "App Name" & "Creation Date". When a user clicks on a particular historic app, the chosen app's JSON data will be used to dynamically construct and display its Mock UI and extracted requirements on the page, replacing any previously generated App data.

3. **Premium AI Model Subscription or a Pooled-Connection mechanism to bypass rate-limiting and/or enhance response quality:** Currently I'm using a free AI model through "openrouter.ai" which is inherently slow in its response generation and occasionally misbehaves. So, one way to improve this is to pay for a premium AI model subscription, or implement a pooled-connection mechanism on the backend where it will detect rate-limited or any persisting error responses being returned from the AI API, and automatically switch to a different AI Model in my prepared pool of compatible AI models. I would verify that all pooled AI models produce the same output payload structure and hence are compatible with my backend parsing logic.

4. **Make the web app more pretty with CSS frameworks and libraries such as TailwindCSS, etc.**
