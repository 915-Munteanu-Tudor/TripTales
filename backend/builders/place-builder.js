const Place = require("../models/place");

class PlaceBuilder {
  constructor() {
    this.address = "";
    this.location = {
      lat: 0,
      lng: 0,
    };
    this.cluster = null;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  setLocation(coordinates) {
    this.location = coordinates;
    return this;
  }

  setCluster(cluster) {
    this.cluster = cluster;
    return this;
  }

  build() {
    return new Place(this);
  }
}

module.exports = PlaceBuilder;
