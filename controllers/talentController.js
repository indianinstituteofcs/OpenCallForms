"use strict";
const   util = require("util");
const   upload = require("../uploadMW");
const   fs = require("fs");
var     vFile1="";
var     vFile2="";
const   defFile = "/images/upload/image-block.png";

const   Talent = require("../models/talent");
const   passport = require("passport");
const   { check, validationResult } = require("express-validator");
const   { session } = require("passport");
var     tempUser = {};
const fName = "talentController:";

function getUserParams(body){
    console.log(fName + "getUserParams:body: " + body);

    let d = new Date(body.bdYear, body.bdMonth-1, body.bdDay);
    let calcMinorCheck = (body.minorCheck == 0)? false:true;
    let calcMinorSingature = (body.minorCheck == 0)? "NA":body.minorSignature;

    let userParams = {
        name:{
            first: body.first,
            last: body.last
        },
        email: body.email,
        instagram:body.instagramField,
        tiktok:body.tiktokField,
        birthday:d.toISOString().slice(0,10),
        height:{
            feet: body.htFeet,
            inches: body.htInches
        },
        dress:body.dressSize,
        info:body.additionalInfoField,
        covidSignature:body.covidSignature,
        covidCheck:true,
        isAMinor:calcMinorCheck,
        minorSignature:calcMinorSingature,        
        password: body.password        
    }
    return userParams;
}


exports.redirectView = (req, res, next) => {
    let redirectPath = res.locals.redirect;
    console.log(fName + "redirectView to: "+ redirectPath);

    if (redirectPath) {
        res.redirect(redirectPath);
    } else {
        next(); 
    }
}


exports.showView = (req, res) => {
    console.log(fName + "showView:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(res.locals.currentUser);            
    var titleString = "Forms:Not Logged";
    if(res.locals.loggedIn){             
        titleString = "Forms: "+res.locals.currentUser.fullName;
    }
    res.render("talent/show", {title:titleString});
};


exports.editInfo = (req, res) => {
    console.log(fName + "editInfo:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(res.locals.currentUser);            
    var titleString = "Edit:Not Logged";
    if(res.locals.loggedIn){             
        titleString = "Edit: "+res.locals.currentUser.fullName;
    }
    res.render("talent/edit-info", {title:titleString});
};


exports.editPassword = (req, res) => {
    console.log(fName + "editPassword:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(res.locals.currentUser);            
    var titleString = "Edit Password:Not Logged";
    if(res.locals.loggedIn){             
        titleString = "Edit Password: "+res.locals.currentUser.fullName;
    }
    res.render("talent/edit-password", {title:titleString});
};


exports.new = (req, res) => { //Take input to create a new talent
    console.log(fName +"new: req.query:");
    console.log(req.query);

    console.log(fName +"new: tempUser:");
    console.log(tempUser);

    var newData = {};

    if(Object.getOwnPropertyNames(tempUser).length == 0) {
        console.log(fName +"new: tempUser is empty");
        newData = {
            title:"Forms:New",
            userEmail:req.query.userEmail,};
    } else {
        console.log(fName +"new: tempUser is NOT empty");
        newData = {
            title:"Forms:New",
            firstName:tempUser.first,
            lastName:tempUser.last,
            userEmail:tempUser.email,
            userInstagram:tempUser.instagramField,
            userTikTok:tempUser.tiktokField,
            userDressSize:tempUser.dressSize,
            userBDYear:tempUser.bdYear,
            userBDMonth:tempUser.bdMonth,
            userBDDay:tempUser.bdDay,
            userHeightFeet:tempUser.htFeet,
            userHeightInches:tempUser.htInches,
            userAdditionalInfo:tempUser.additionalInfoField,
        }
        console.log(getUserParams(tempUser));
    } 

    res.render("talent/new", newData);
    tempUser = {}
};


exports.signUp = (req, res) => {
    console.log(fName+ "signUp:");
    res.render("talent/signup", {
        title:"Forms:Sign In",
        registerEmail:req.query.registerEmail,
        loginEmail:req.query.loginEmail
    });
};


//JC TO DO WHY?!?!passport has to be called like this - stand alone. Moment it is in a function it hangs!!!
const authenticateThenLogin =
    passport.authenticate("local", {
        failureRedirect: `/talent/signup`,
        failureFlash: true,
        successRedirect: `/talent/show/`,
        successFlash: `Logged In!`
    });


/* No reason to check if password matches regex.
 User is supposed to give right password to logIn.
 If password is incorrect - login will fail.*/
exports.validationChainLogIn = [
    check("email", "Invalid email").normalizeEmail().trim().escape().isEmail(),
    check("password").trim().escape()
];


exports.validateLogIn = (req, res, next) => {
    console.log(fName+"validateLogIn");
    console.log("SessionId: "+session.id);
    console.log("SessionId: "+session);
    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating login information: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/talent/signup";
        if(!messageString.includes("Invalid email")){
            redirectPath = redirectPath + "?loginEmail=" + req.body.email;
        }
        res.redirect(redirectPath);
    } else {
        console.log("SUCCESS: email ("+ req.body.email +") and password ("+ req.body.password +")are valid");

        let inputEmail = req.body.email;
        Talent.findOne({email: inputEmail})
        .exec()
    
        .then((data)=>{
            if(!data){//talent is not in DB. Cannot login. Register the new talent.
                req.flash("error",`${inputEmail} is new. Register user.`);
                console.log(`ERROR: ${inputEmail} is new. Register user.`);
                res.redirect("/talent/signup?registerEmail=" + inputEmail);
            } else {//talent is in DB. Go ahead and log in. 
                console.log(inputEmail + " is in DB. Proceeding to authenticate.");
                authenticateThenLogin(req, res, next);
            }
        })
    
        .catch((error) => {
            console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
            next(error);
        })    
    }
}


exports.validationChainEmailCheck = [
    check("newTalentEmail", "Invalid Email").trim().normalizeEmail().escape().isEmail()
];


exports.validateEmailCheck = (req, res, next) => {
    console.log(fName + "validateEmailCheck:");
    console.log( req.body);

    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messageString = error.array().map(e => e.msg);
        console.log("ERROR: validating email for new Talent: " + messageString);
        req.flash("error", messageString);
        res.locals.redirect = "/talent/signup";
        next();
    } else {
        console.log("SUCCESS: email for new Talent is valid");
        let inputEmail = req.body.newTalentEmail;
        Talent.findOne({email: inputEmail})
        .exec()
    
        .then((data)=>{
            if(data){
                req.flash("error",`${inputEmail} is registered. Try logging in with it.`);
                console.log(`ERROR: ${inputEmail} is registered. Try logging in with it.`);
                res.locals.redirect = "/talent/signup?loginEmail=" + inputEmail;
            } else {
                console.log(inputEmail + " is new. Register user");
                res.locals.redirect = "/talent/new?userEmail=" + inputEmail;
            }
            next();
        })
    
        .catch((error) => {
            console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
            next(error);
        })    
    }
}


exports.logout = (req, res, next) => {
    console.log(fName + "logout:");
    console.log("Talent Logged In: "+ res.locals.loggedIn);
    console.log("Talent Info: ");
    console.log(req.user);
    req.logout(); //Provided by passport js
    console.log("*********** AFTER LOGOUT *************");   
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(req.user);
    req.flash("success", "You have been logged out!");
    res.locals.redirect = "/";
    next();
}


const emailErrorMessage = "Invalid email";

exports.validationChain = [
    check("first").trim().escape(),
    check("last").trim().escape(),
    check("email", emailErrorMessage).normalizeEmail().trim().escape().isEmail(),
    check("instagramField").trim().escape(), 
    check("tiktokField").trim().escape(),     
// No check for bdMonth, bdDay, bdYear, dressSize, htFeet, htInches since they are from pickers  
    check("additionalInfoField").trim().escape(),     
    check("covidSignature").trim().escape(),     
//No check for covidCheck, minorCheck since it comes from checkbox
    check("minorSignature").trim().escape(),
    check("password").trim().escape(),
    check("password", "8 <= password length <= 15.").isLength({min:8, max:15}),
    check("password", "Password is not alphanumeric").isAlphanumeric(),
    check("confirmPassword").trim().escape(),    
    check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password))
];

function isDateValid(year,month,day){
    let d = new Date(year, month-1, day);
    console.log("isDateValid:");
    console.log("isDate:input: "+year+"/"+(month-1));
    console.log("isDate:output: "+d.getFullYear()+"/"+d.getMonth());
    console.log("isDate:typeof year: "+ typeof year);
    console.log("isDate:typeof getFullYear: "+ typeof d.getFullYear());
    console.log("isDate:month: "+ (month-1) == d.getMonth());

    return (d.getFullYear()==year) && (d.getMonth()==(month-1))  && (d.getUTCDate() == day);
}

//temp function to debug inputs to new submissions screen
exports.tempInput = (req, res, next) => {
    console.log("tempInput");
    console.log(req.body);
    let flag = isDateValid(req.body.bdYear, req.body.bdMonth, req.body.bdDay);
    console.log("Birtday is valid? " + flag);
    tempUser = req.body;
    res.redirect(`/talent/new`);
}

//JC DEBUG
exports.validate = (req, res, next) => {
    console.log(fName + "validate:");

    let error = validationResult(req);
    var minorSignatureMsg = "";
    if(req.body.minorCheck == 1){
        if((req.body.minorSignature === null) || (req.body.minorSignature === "")){
            minorSignatureMsg = "Guardian signature missing for a Minor";
            console.log("ERROR: " + minorSignatureMsg);
        }
    }
    var birthdayDateMsg = "";
    let flag = isDateValid(req.body.bdYear, req.body.bdMonth, req.body.bdDay);
    if (!flag){
        birthdayDateMsg = "Birthday is not a valid date";
        console.log("ERROR: " + birthdayDateMsg);
    }

    if (!error.isEmpty() || (minorSignatureMsg !== "") || (birthdayDateMsg !== "")) {
        let messages = error.array().map(e => e.msg);
        var messageString = messages.join(" and ");

        var tempS = (messageString === "") ? "" : messageString + " and ";
        messageString = (minorSignatureMsg !== "") ? messageString : tempS + minorSignatureMsg;

        var tempS = (messageString === "") ? "" : messageString + " and ";
        messageString = (minorSignatureMsg !== "") ? messageString : tempS + birthdayDateMsg;

        console.log("ERROR: validating registration form: " + messageString);
        req.flash("error", messageString);
        tempUser = req.body;
        res.locals.redirect = "/talent/new";
        res.locals.tempUser = req.body;
        next();
    } else {
        console.log("SUCCESS: all submission form inputs are valid");
        create(req,res,next);
    }
}

function create(req, res, next){
    console.log(fName + "create");
    //if (req.skip) next();
    let userParams = getUserParams(req.body);

    Talent.findOne({email: userParams.email})
    .exec()

    .then((data)=>{
        if(data){//email is in DB. Send it to login screen with message
            req.flash("error", `${userParams.email} is already registered`);
            console.log("ERROR: " + userParams.email + " is already registered");
            res.locals.redirect = `/talent/signup/?loginEmail=${userParams.email}`;
            return next();
        } else { //email is NOT in DB. Create new talent object, save to DB and go to talent area.
            console.log("User ("+userParams.email+") is not in DB. Will try to add it.");
            const newTalent = new Talent(userParams);

            Talent.register(newTalent, req.body.password, (error, user) => {
                if (user) {
                    console.log(`SUCCESS: ${user.fullName}'s account created successfully!`);
                    req.flash("success", `${user.fullName}'s account created successfully!`);
                    req.login(user, function(err) {
                        if (err) { 
                            console.log("ERROR: " + user.fullName + "registered but could not log in");
                            return next(err); 
                        }
                        req.user = user;
                        res.locals.currentUser = user;
                      });
                    console.log(req.sessions);
                    res.locals.redirect = "/talent/show";
                } else {
                    req.flash("error", `Failed to create user account because: ${error.message}.`);
                    res.locals.redirect = "/talent/new";
                }
                return next();
            });
        }
    })

    .catch((error) => {
        console.log("Error in searching for "+userParams.email+" in the database");
        console.log(error);
        next(error);
    })
}


exports.validationChainUpdateInfo = [
    check("first").trim().escape(),
    check("last").trim().escape(),
    check("email", emailErrorMessage).normalizeEmail().trim().escape().isEmail(),
    check("instagramField").trim().escape(), 
    check("tiktokField").trim().escape(),     
// No check for bdMonth, bdDay, bdYear, dressSize, htFeet, htInches since they are from pickers  
    check("additionalInfoField").trim().escape(),     
    check("covidSignature").trim().escape(),     
//No check for covidCheck, minorCheck since it comes from checkbox
    check("minorSignature").trim().escape(),
    check("password").trim().escape(),
];


const authenticateInfoForNewEmail =
    passport.authenticate("local", {
        failureRedirect: `/talent/edit-info`,
        failureFlash: true,
        successRedirect: `/talent/show`
    });


exports.validateUpdateInfo = (req, res, next) => {
    console.log(fName + "validateUpdateInfo:");

    let error = validationResult(req);
    var minorSignatureMsg = "";
    if(req.body.minorCheck == 1){
        if((req.body.minorSignature === null) || (req.body.minorSignature === "")){
            minorSignatureMsg = "Guardian signature missing for a Minor";
            console.log("ERROR: " + minorSignatureMsg);
        }
    }
    var birthdayDateMsg = "";
    let flag = isDateValid(req.body.bdYear, req.body.bdMonth, req.body.bdDay);
    if (!flag){
        birthdayDateMsg = "Birthday is not a valid date";
        console.log("ERROR: " + birthdayDateMsg);
    }

    if (!error.isEmpty() || (minorSignatureMsg !== "") || (birthdayDateMsg !== "")) {
        let messages = error.array().map(e => e.msg);
        var messageString = messages.join(" and ");

        var tempS = (messageString === "") ? "" : messageString + " and ";
        messageString = (minorSignatureMsg !== "") ? messageString : tempS + minorSignatureMsg;

        var tempS = (messageString === "") ? "" : messageString + " and ";
        messageString = (minorSignatureMsg !== "") ? messageString : tempS + birthdayDateMsg;

        console.log("ERROR: validating registration form: " + messageString);
        req.flash("error", messageString);
        tempUser = req.body;
        res.locals.redirect = "/talent/new";
        res.locals.tempUser = req.body;
        next();
    }else {
        console.log("SUCCESS: all submission form inputs are valid");
        update(req,res,next);
    }
}

function update(req,res,next){
    console.log(fName + "update:");

    let inputEmail = req.body.email;

    if(inputEmail !== res.locals.currentUser.email){
        Talent.findOne({email: inputEmail})
        .exec()
        
        .then((user)=>{
            if(user){//new email is in DB. Cannot update.
                req.flash("error",`Update aborted: ${inputEmail} is already in use. Try another email.`);
                console.log(`ERROR: Update aborted: ${inputEmail} is already in use. Try another email.`);
                res.redirect("/talent/edit-info");
            } 
        })
        
        .catch((error) => {
            console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
            next(error);
        })    
    }

    let body = req.body;
    let d = new Date(body.bdYear, body.bdMonth-1, body.bdDay);
    let calcMinorCheck = (body.minorCheck == 0)? false:true;
    let calcMinorSingature = (body.minorCheck == 0)? "NA":body.minorSignature;

    let userParams = {
        name:{
            first: body.first,
            last: body.last
        },
        email: body.email,
        instagram:body.instagramField,
        tiktok:body.tiktokField,
        birthday:d.toISOString().slice(0,10),
        height:{
            feet: body.htFeet,
            inches: body.htInches
        },
        dress:body.dressSize,
        info:body.additionalInfoField,
        isAMinor:calcMinorCheck,
        minorSignature:calcMinorSingature,        
    }
    
    Talent.findByIdAndUpdate(res.locals.currentUser._id, {$set: userParams},{new:true})
    .exec()

    .then((user) => {
        if(user){
            req.flash("success",`Updated successfully for ${inputEmail}`);
            console.log(`SUCCESS: Updated successfully for ${inputEmail}`);
            console.log(user);
            if(inputEmail !== res.locals.currentUser.email){
                console.log("Email has been updated");
                authenticateInfoForNewEmail(req, res, next);
                console.log(req.user);
                res.locals.currentUser = req.user;
            } else {             
                req.user = user;
                res.locals.currentUser = user;
                res.redirect("/talent/show");                
            }
        } else {
            req.flash("error",`Update failed for ${inputEmail}`);
            console.log(`ERROR: Update failed for ${inputEmail}`);
            res.redirect("/talent/edit-info");
        }
    })

    .catch((error) => {
        console.log(`Error updating user (${res.locals.currentUser.fullName}): ${error.message}`);
        next(error);
    })
};


exports.validationChainUpdatePassword = [
    check("password").trim().escape(),
    check("newPassword").trim().escape(),
    check("newPassword", "8 <= new password length <= 15.").isLength({min:8, max:15}),
    check("newPassword", "New password is not alphanumeric").isAlphanumeric(),
    check("confirmNewPassword").trim().escape(),
    check('confirmNewPassword', 'New passwords do not match').custom((value, {req}) => (value === req.body.newPassword))
];


exports.validateUpdatePassword = (req, res, next) => {
    console.log(fName+"validateUpdatePassword");

    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating update password request: " + messageString);
        req.flash("error", messageString);
        res.redirect("/talent/edit-password");
    } else {
        console.log("SUCCESS: update password request is valid");
        let inputEmail = res.locals.currentUser.email;
        let currentTalent = res.locals.currentUser;
        currentTalent.changePassword(req.body.password, req.body.newPassword, function(error){
            if(error){
                req.flash("error",`Could not change password for ${inputEmail}`);
                console.log(`ERROR: Could not change password for ${inputEmail}`);
                res.redirect("/talent/edit-password");
            } else {
                req.flash("success",`Updated password for ${inputEmail}`);
                console.log(`SUCCESS: Updated password for ${inputEmail}`);
                res.redirect("/talent/show");
            }
        });    
    }
};


// Image upload and delete.
exports.imageUpload = async (req, res, next) => {
    try {
        console.log(fName+"imageUpload:");
        console.log(req.query);
  
        var uploadFilesMiddleware;
  
        if (req.query.image === "image1"){
            console.log("imageUpload: image1");
            uploadFilesMiddleware = util.promisify(upload.single("file1"));
        } else {
            console.log("imageUpload: image2");
            uploadFilesMiddleware = util.promisify(upload.single("file2"));
        }
  
        await uploadFilesMiddleware(req, res);
        console.log("imageUpload:After upload");
        console.log(req.file);
  
        switch(req.file.fieldname){
            case "file1":
                vFile1 = "/images/upload/" + req.file.filename;
            break;
  
            case "file2":
                vFile2 = "/images/upload/" + req.file.filename;
            break;
        }
  
        return res.redirect("back");
        //return next();
    } catch (error) {
        console.log(error);
        return res.send(`Error when trying upload files: ${error}`);
    }
  };

  
exports.imageDelete = (req, res, next) => {
    console.log(fName + "imageDelete:");
  
    var imageCount;
    var targetFile;
    if(typeof req.body.file1 !== 'undefined'){
        imageCount = 1;
        targetFile = vFile1;
    } else if (typeof req.body.file2 !== 'undefined') {
        imageCount = 2;
        targetFile = vFile2;
    } else {
        console.error(fName + "imageDelete incorrect file parameter");
    }
  
    console.log(fName + "imageDelete:Instruction to Delete Image "+ imageCount + ". TargetFile: [" + targetFile + "]");
    if((targetFile !== defFile) && (targetFile !== "")){
        let fdel = "./public"+targetFile;
        fs.unlink(fdel, (err) => {
            if (err) {
                console.error(err);
                return;
            }
  
            if(typeof req.body.file1 !== 'undefined'){ vFile1="";} else {vFile2="";}
        
            console.log(fName + "imageDelete:Deleted Image " + imageCount);
            res.redirect("back");
        });
    }
};
  