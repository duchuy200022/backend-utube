"use strict";

//!dmbg
const { model, Schema, Types } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Key"; // database
const COLLECTION_NAME = "Keys"; // table

// Declare the Schema of the Mongo model

const keyTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "Shop",
    },
    privateKey: {
      type: String,
      require: true,
    },
    publicKey: {
      type: String,
      require: true,
    },
    refreshToken: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, keyTokenSchema); // colection: keys
