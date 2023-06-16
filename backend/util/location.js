const axios = require("axios");

const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError("This location does not exist.", 422);
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

async function getAddressForCoords(lat, lng) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS" || data.results.length === 0) {
    const error = new HttpError(
      "Could not find the address for the specified coordinates.",
      422
    );
    throw error;
  }

  const address = data.results[0].formatted_address;

  return address;
}

module.exports = {
  getCoordsForAddress,
  getAddressForCoords,
};
