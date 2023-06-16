const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema({
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    cluster: { type: mongoose.Types.ObjectId, required: true, ref: "Cluster" },
});

module.exports = mongoose.model('Place', placeSchema);