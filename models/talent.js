"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const TalentSchema = new Schema({
  name:{
    first: {
      type: String,
      required: true
    },
    last: {
      type: String,
      required: true
    }
  },
  email: {
    type: String,
    required: true,
    lowercase:true,
    unique:true
  },
  instagram: {
    type: String,
    required: true  
  },
  tiktok: {
    type: String,
    required: true  
  },
  birthday: {
    type: Date,
    required: true  
  },
  height: {
    feet:{
      type: Number,
      required: true  
    },
    inches:{
      type: Number,
      required: true  
    }
  },
  dress: {
    type: String,
    required: true  
  },
  covidSignature: {
    type: String,
    required: true  
  },
  covidCheck: {
    type: Boolean,
    required: true  
  },
  isAMinor: {
    type: Boolean,
    required: true  
  },
  minorSignature: {
    type: String,
    required: true  
  }
},
  {
    timestamps:true
});

TalentSchema.virtual("fullName").get(function() {
  return `${this.name.first} ${this.name.last}`;
});

TalentSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("Talent", TalentSchema);;
