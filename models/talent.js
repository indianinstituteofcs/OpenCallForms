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
    type: Number,
    required: true  
  },
  info: {
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
  freeAgentCheck: {
    type: Boolean,
    required: true  
  }
},
  {
    timestamps:true
});

TalentSchema.virtual("fullName").get(function() {
  return `${this.name.first} ${this.name.last}`;
});

TalentSchema.virtual("birthDate").get(function() {
  var d = new Date(this.birthday);
  return d.toISOString().slice(0,10);
});

TalentSchema.virtual("bdYear").get(function() {
  var d = new Date(this.birthday);
  return d.getUTCFullYear();
});

TalentSchema.virtual("bdMonth").get(function() {
  var d = new Date(this.birthday);
  return (d.getUTCMonth() + 1);
});

TalentSchema.virtual("bdDay").get(function() {
  var d = new Date(this.birthday);
  return d.getUTCDate();
});

TalentSchema.virtual("fullHeight").get(function() {
  return `${this.height.feet}' ${this.height.inches}"`;
});

TalentSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("Talent", TalentSchema);;
