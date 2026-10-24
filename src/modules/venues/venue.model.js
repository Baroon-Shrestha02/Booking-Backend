import mongoose from "mongoose";
import venueSchema from "./venue.schema.js";

const Venue = mongoose.models.Venue || mongoose.model("Venue", venueSchema);

export default Venue;
