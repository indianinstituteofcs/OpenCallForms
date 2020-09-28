"use strict";

const   Talent = require("../models/talent");
const   passport = require("passport");
const { check, validationResult } = require("express-validator");
const { session } = require("passport");
const { findByIdAndRemove } = require("../models/talent");

const fName = "talentController:";

function getUserParams(body){
    let userParams = {
        name:{
            first: body.first,
            last: body.last
        },
        email: body.email,
        height:{
            feet: body.feet,
            inches: body.inches
        },
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
        titleString = "Forms:"+req.user.fullName;
    }
    res.render("talent/show", {title:titleString});
};


exports.editInfo = (req, res) => {
    console.log(fName + "editInfo:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(req.user);            
    var titleString = "Forms:Not Logged";
    if(req.user){             
        titleString = "Forms:Edit Info";
    }
    res.render("talent/edit-info", {title:titleString});
};


exports.editPassword = (req, res) => {
    console.log(fName + "editPassword:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(req.user);            
    var titleString = "Forms:Not Logged";
    if(req.user){             
        titleString = "Forms:Edit Password";
    }
    res.render("talent/edit-password", {title:titleString});
};


exports.new = (req, res) => { //Take input to create a new talent
    console.log(fName +"new: req.query:");
    console.log(req.query);

    res.render("talent/new", {
        title:"Forms:New",
        firstName:req.query.firstName,
        lastName:req.query.lastName,
        userEmail:req.query.userEmail
        //,userHeightFeet:6  //JC DEBUG
    });
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
    check("password").trim().escape(),
    check("password", "8 <= password length <= 15.").isLength({min:8, max:15}),
    check("password", "Password is not alphanumeric").isAlphanumeric(),
    check("password", "Password must have at least 1 number").matches(/\d{1}/),
    check("password", "Password must have at least 1 letter").matches(/[A-Z]{1}/i),
    check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password))
];


exports.validate = (req, res, next) => {
    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating registration form: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/Talent/new?firstName=" + req.body.first + "&lastName=" + req.body.last;
        if(!messageString.includes(emailErrorMessage)){
            redirectPath = redirectPath + "&userEmail=" + req.body.email;
        }
        res.locals.redirect = redirectPath;
        next();
    } else {
        console.log("SUCCESS: all registration form input are valid");
        create(req,res,next);
    }
}

function create(req, res, next){
    console.log(fName + "create");
    //if (req.skip) next();
    let userParams = getUserParams(req.body);
    userParams.enrolled = false;

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
];


const authenticateInfoForNewEmail =
    passport.authenticate("local", {
        failureRedirect: `/talent/edit-info`,
        failureFlash: true,
        successRedirect: `/talent/show`
    });


exports.validateUpdateInfo = (req, res, next) => {
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

    let userParams = {
        name:{
            first: req.body.first,
            last: req.body.last
        },
        email: req.body.email,
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
    check("newPassword", "New password must have at least 1 number").matches(/\d{1}/),
    check("newPassword", "New password must have at least 1 letter").matches(/[A-Z]{1}/i),
    check("confirmNewPassword").trim().escape(),
    check('confirmNewPassword', 'New passwords do not match').custom((value, {req}) => (value === req.body.newPassword))
];


const authenticateForNewPassword =
    passport.authenticate("local", {
        failureRedirect: `/talent/edit-password`,
        failureFlash: true,
        successRedirect: `/talent/show`
    });


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

    