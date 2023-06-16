# Sharing_places_app

- For testing, run npm install then npm start on both backend and frontend
- A web app used to share places to visit/travel to, among its users, based on Node - Express.js for the server-side, and on React.js for the front-end.
- It uses Mongoose as an ODM and it also supports file upload for places and users. The server is stateless, authorization and authentication are
done using JWT.
- It uses Google Maps SDK to render a map with the place’s location, and Geocoding API to convert an address into coordinates when adding a
new place.
- The app has server-side validations using custom errors, which are manipulated by an error handling middle-ware, and it also contains client-
side validations.
- The front-end is deployed as a standalone React SPA on Firebase and the REST API is also standalone but on Heroku. The link to the web-app
is: https://project1-e7d58.web.app
