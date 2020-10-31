"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const EmailVerifyTokenSchema = new Schema({
  token:{
      type: String,
      required: true,
      unique:true
    },
  id:{
      type: String,
      required: true
    },
  createdAt:{
      type: Date, 
      expires: 43200,
      default: Date.now
    }
});

module.exports = mongoose.model("EmailVerifyToken", EmailVerifyTokenSchema);;
