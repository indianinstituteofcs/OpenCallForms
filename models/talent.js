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
  height: {
    feet:{
      type: Number,
      required: true  
    },
    inches:{
      type: Number,
      required: true  
    }
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
