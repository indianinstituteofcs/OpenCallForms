"use strict";
const   Talent = require("../models/talent");
const   EmailVerifyToken = require("../models/secret");
const   passport = require("passport");
const   { check, validationResult } = require("express-validator");
const   { session } = require("passport");
var     tempUser = {};
const   fName = "talentController:";
const   sgMail = require('@sendgrid/mail');


function sendVerificationEmailAux(user, currToken){
    console.log(fName + "sendVerificationEmailAux:");

    var flag = false;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    let subjectMsg = "Please verify your email for submission to New York (Students\') Fastion show";
    let bodyText = 'Dear ' + user.name.first + ',<br\><br\> Please verify your email address by clicking on <br\><br\> https://localhost:8080/talent/verify?token=' + currToken + '<br\><br\><br\><br\>From the NY(S)FS Team';
    const msg = {
        to: 'jc@project44laight.com',
        from: 'jc@project44laight.com', // Use the email address or domain you verified above
        subject: subjectMsg,
        text: bodyText,
        html: bodyText,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent');
            flag = true;
        })
        .catch((error) => {
            console.log(error);
            flag = error;
        })

    return flag;
}


function makeToken(){
    console.log(fName + "makeToken:");

    var rV =  '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    let stringLength = 64
    for ( var i = 0; i < stringLength; i++ ) {
        rV += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    let timeStamp = Date.now();
    //console.log(fName + "makeRandomString: {" + rV +"}," + "timeStamp: {" + timeStamp +"}");
    rV = rV + timeStamp;
    //console.log(fName + "makeRandomString: {" + rV +"}");
    return rV;
};


function sendVerificationEmail(talent, next){
    console.log(fName + "sendVerificationEmail:");

    let currToken = makeToken();
    let userParams = {
        token:currToken,
        id:talent._id
    };
    
    const newEmailVerifyToken = new EmailVerifyToken(userParams);
    
    newEmailVerifyToken.save(function (err, result) {
        if (err){
            console.error("ERROR:sendVerificationEmail: Cannot save token" + err)
            next(err);
        }
        console.log("SUCCESS:sendVerificationEmail: " + result.id + " and " + result.token + "saved to EmailVerifyToken collection.");
    });

    sendVerificationEmailAux(talent, currToken);
}


function displayTodbUser(body){
    console.log(fName + "displayTodbUser:body: " + body);

    let d = new Date(body.bdYear, body.bdMonth-1, body.bdDay);
    let calcFreeAgentCheck = (body.freeAgentCheck == 0)? true:false;
    let calcCovidCheck = (body.covidCheck == 0)? true:false;

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
        covidCheck:calcCovidCheck,
        freeAgentCheck:calcFreeAgentCheck,
        password: body.password        
    }
    return userParams;
}


function dbUserToDisplay(titleString, currUser){
    console.log(fName + "dbUserToDisplay:dbUser: " + currUser);
    console.log(currUser.covidSignature);

    let calcFreeAgentCheck = (currUser.freeAgentCheck)? 0:1;
    let calcCovidCheck = (currUser.covidCheck)? 0:1;

    let newData = {   
        title:titleString, 
        firstName:currUser.name.first,
        lastName:currUser.name.last,
        userEmail:currUser.email,
        userInstagram: currUser.instagram,       
        userTikTok: currUser.tiktok,   
        userDressSize: currUser.dress, 
        userHeightFeet: currUser.height.feet, 
        userHeightInches: currUser.height.inches, 
        userBDMonth: currUser.bdMonth, 
        userBDDay: currUser.bdDay, 
        userBDYear: currUser.bdYear,
        userAdditionalInfo: currUser.info, 
        userCovidSignature: currUser.covidSignature, 
        userCovidCheck: calcCovidCheck,
        userFreeAgentCheck:calcFreeAgentCheck,
    };

    console.log(fName + "dbUserToDisplay:newData: ");
    console.log(newData);
    console.log(newData.userCovidSignature);

    return newData;
};


exports.redirectView = (req, res, next) => {
    let redirectPath = res.locals.redirect;
    console.log(fName + "redirectView to: "+ redirectPath);

    if (redirectPath) {
        res.redirect(redirectPath);
    } else {
        next(); 
    }
}


exports.showView = (req, res, next) => {
    console.log(fName + "showView:");
    console.log("showView:Talent Logged In: "+ res.locals.loggedIn); 
    let titleString = "NY(S)FS | View";
    console.log("showView:Talent Info: ");
    console.log(res.locals.currentUser);   
    res.render("talent/show", {title:titleString});        
};


function verifyEmailAux(req, res){
    let flashMsg = `The link used to verify the email has expired. If the user's email is not yet verfied, then please get a new verification email by clicking the "Resend Email" button on the View page`;
    req.flash("error", flashMsg);
    console.log(flashMsg);
    res.redirect("/talent/show");
}


exports.verifyEmail = (req, res, next) => {
    console.log(fName + "verifyEmail:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    let titleString = "NY(S)FS | Verify";
    let currToken = req.query.token;
    console.log("Token: "+ currToken);

    if(currToken === undefined){
        res.redirect("/talent/show");
    } else {
        EmailVerifyToken.findOne({token: currToken})
        .exec()

        .then((data) => {
            if(!data){//token is not in DB. Cannot verify. Suggest resend.
                verifyEmailAux(req, res);
            } else {//token found proceed to verify user. 
                console.log(currToken + " is in DB. Proceeding to verify.");
                Talent.findByIdAndUpdate(data.id, {$set: {emailVerified:true}}, {new:true})
                .exec()

                .then ((user) => {
                    EmailVerifyToken.deleteMany({_id:data._id})
                    .exec()

                    .then(() => {
                        console.log("Record for:" + currToken +" is succeessfully deleted");
                        res.locals.currUser = user;
                        console.log("Verified user: " + user.fullName);
                        console.log(req.query);
                        res.redirect("/talent/show");                        
                    })

                    .catch((errDel) => {
                        verifyEmailAux(req, res);
                    })
                })

                .catch((error) => {
                    verifyEmailAux(req, res);                    
                })                
            }
        })

        .catch((error) => {
            verifyEmailAux(req, res);
        })
    }
};


exports.resendEmail = (req, res, next) => {
    console.log(fName + "resendEmail:");
    let currentUser = res.locals.currentUser;
    let flashMsg = `New email sent to verify the email address for: ${currentUser.fullName}.`;

    EmailVerifyToken.deleteMany({id:currentUser._id})
    .exec()

    .then(() => {
        console.log(`SUCCESS:resendEmail: All tokens for: ${currentUser.fullName} were deleted.`);
        sendVerificationEmail(currentUser, next);
        req.flash("success",flashMsg);
        console.log("SUCCESS:resendEmail: " + flashMsg);
        res.redirect("/talent/show");
    })

    .catch((errDel) => {
        console.log("Tokens for:" + currentUser.fullName +" were NOT deleted. Error message: " + errDel);
        sendVerificationEmail(currentUser, next);
        req.flash("success",flashMsg);
        console.log("SUCCESS:resendEmail: " + flashMsg);
        res.redirect("/talent/show");
    })
};

exports.editInfo = (req, res) => {
    console.log(fName + "editInfo:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(res.locals.currentUser);  
    let titleString = "NY(S)FS | Info Edit";
    let newData = dbUserToDisplay(titleString, res.locals.currentUser);
    res.render("talent/edit-info", newData);
};


exports.editPassword = (req, res) => {
    console.log(fName + "editPassword:");
    console.log("Talent Logged In: "+ res.locals.loggedIn); 
    console.log("Talent Info: ");
    console.log(res.locals.currentUser);
    let titleString = "NY(S)FS | Password Edit";
    res.render("talent/edit-password", {title:titleString});
};


exports.new = (req, res) => { //Take input to create a new talent
    console.log(fName +"new: req.query:");
    console.log(req.query);

    console.log(fName +"new: tempUser:");
    console.log(tempUser);

    var newData = {};

    if(Object.getOwnPropertyNames(tempUser).length == 0) {
        //coming from sign up page
        console.log(fName +"new: tempUser is empty");
        newData = {
            title:"NY(S)FS | New",
            userEmail:req.query.userEmail,
            userBDMonth:req.query.userBDMonth,
            userBDDay:req.query.userBDDay,
            userBDYear:req.query.userBDYear,
            userFreeAgentCheck:req.query.userFreeAgentCheck};
    } else {
        //re-draw after on the new user page, e.g. after erroneous input
        console.log(fName +"new: tempUser is NOT empty");
        newData = {
            title:"NY(S)FS | New",
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
            userCovidCheck:tempUser.covidCheck,
            userCovidSignature:tempUser.covidSignature,
            userFreeAgentCheck:tempUser.freeAgentCheck
        }
    } 

    res.render("talent/new", newData);
    tempUser = {}
};


exports.signUp = (req, res) => {
    console.log(fName+ "signUp:");
    res.render("talent/signup", {
        title:"NY(S)FS | Sign Up",
        userEmail:req.query.userEmail,
        userBDMonth:req.query.userBDMonth,
        userBDDay:req.query.userBDDay,
        userBDYear:req.query.userBDYear,
        userFreeAgentCheck:req.query.userFreeAgentCheck
    });
};


exports.loginUpdate = (req, res) => {
    console.log(fName+ "loginUpdate:");
    //makeToken();
    res.render("talent/login", {title:"NY(S)FS | Log In"});
};


//JC: WHY?!?!passport has to be called like this - stand alone. Moment it is in a function it hangs!!!
const authenticateThenLogin =
    passport.authenticate("local", {
        failureRedirect: `/talent/signup`,
        failureFlash: true,
        successRedirect: `/talent/show/`,
        successFlash: `Logged In!`
    });


const emailErrorMessage = "Invalid email";


 /*User must enter correct password to login, otherwise login will fail */
exports.validationChainLogIn = [
    check("email", emailErrorMessage).normalizeEmail().trim().escape().isEmail(),
    check("password").trim().escape()
];


exports.validateLogIn = (req, res, next) => {
    console.log(fName+"validateLogIn");
    console.log("SessionId: "+session.id);
    console.log("Session: "+session);

    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR:validateLogIn: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/talent/login";
        if(!messageString.includes("Invalid email")){
            redirectPath = redirectPath + "?userEmail=" + req.body.email;
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
                res.redirect("/talent/signup?userEmail=" + inputEmail);
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


exports.validationChainSignUp = [
    check("email", "Invalid Email").trim().normalizeEmail().escape().isEmail()
    // No check for bdMonth, bdDay, bdYear, and freeAgentCheck
];

/*  birthday
    asOfDay
    cutOffAge - in whole years */
function isOverTargetAge(birthday, asOfDay, cutOffAge){
    console.log(fName + "isOverTargetAge:");

    let by = birthday.getFullYear();
    let bm = birthday.getMonth();
    let bd = birthday.getUTCDate();
    let cy = asOfDay.getFullYear();
    let cm = asOfDay.getMonth();
    let cd = asOfDay.getUTCDate();

    //console.log("isOverTargetAge: "+ cutOffAge);
    //console.log("isOverTargetAge:bd: "+by+"/"+bm+"/"+bd+" --- "+birthday.toDateString());
    //console.log("isOverTargetAge:cd: "+cy+"/"+cm+"/"+cd+" --- "+asOfDay.toDateString());

    var flag = false;
    let dy = cy-by;

    console.log("isOverTargetAge:cd: potential Age: " + dy);

    if (dy > cutOffAge){
        flag = true;
    } else if ( dy == cutOffAge){
        if(cm > bm){
            flag = true;
        } else if ( cm == bm){
            if(cd >= bd){
                flag = true;
            } else {
                //console.log("isOverTargetAge: leap year 29/28 case:--- " + (by%2 == 0) + " --- "+(cy%2 != 0));
                //console.log("isOverTargetAge: leap year 29/28 case:--- " + bm + " --- " + bd + " --- " + cd);
                if ((by%2 == 0) && (cy%2 != 0) && (bm == 1) && (bd == 29) && (cd == 28)){
                    flag = true;
                }
            } 
        }
    }
    return flag;
}


function bdCheck(reqBody,dataSet){
    console.log(fName + "bdCheck:");
    let cutOffAge = 18;

    var overAgeCutOff = false;
    var birthdayDateMsg = "";

    let flag = isDateValid(reqBody.bdYear, reqBody.bdMonth, reqBody.bdDay);
    if (!flag){
        birthdayDateMsg = "Birthday is not a valid date";
    } else {
        console.log("Birthday is a valid date: " + reqBody.bdYear +"/"+ reqBody.bdMonth +"/"+ reqBody.bdDay); 
        let birthday = new Date(reqBody.bdYear, reqBody.bdMonth-1, reqBody.bdDay);
        let asOfToday = new Date(2021,0,1); //Jan 1, 2021
        overAgeCutOff = isOverTargetAge(birthday, asOfToday, cutOffAge);
    }

    dataSet.overAgeCutOffFlag = overAgeCutOff;
    dataSet.dateValidMsg = birthdayDateMsg;
};


function signUpErrorMessage(validationError, birthdayDateMsg, overAgeCutOff, freeAgentCheckFlag){
    console.log(fName + "signUpErrorMessage:");

    let messages = validationError.array().map(e => e.msg);
    var messageString = messages.join(" and ");

    if (birthdayDateMsg === ""){ //Birthday is a valid date            
        if (!overAgeCutOff){// Under cut off age
            var tempS = (messageString == "") ? "" : (messageString + " and ");
            messageString = tempS + "Cannot register talent because age is under the cutOffAge";
        }    
    } else { //Birthday is invalid date
        let tempS = (messageString == "") ? "" : messageString + " and ";
        messageString = tempS + birthdayDateMsg;    
    }

    if (freeAgentCheckFlag != 0){ // Refused affirmation to free agent status
        let tempS = (messageString == "") ? "" : messageString + " and ";
        messageString = tempS + "Cannot register talent without consent to REPRESENTATION STATEMENT";    
    }

    return messageString;
};


exports.validateSignUp = (req, res, next) => {
    console.log(fName + "validateSignUp:");
    console.log(req.body);

    let error = validationResult(req);

    var dataSet = {overAgeCutOffFlag:true, dateValidMsg:""};
    bdCheck(req.body,dataSet);
    let overAgeCutOff = dataSet.overAgeCutOffFlag;
    let birthdayDateMsg = dataSet.dateValidMsg;

    let inputEmail = req.body.email;
    let emailInput = "?userEmail=" + inputEmail;
    let bdInput = "userBDYear=" + req.body.bdYear + "&userBDMonth=" + req.body.bdMonth + "&userBDDay=" + req.body.bdDay;
    let freeAgentInput = "userFreeAgentCheck=" + req.body.freeAgentCheck;

    if (!error.isEmpty() || (birthdayDateMsg !== "") || !overAgeCutOff || (req.body.freeAgentCheck != 0)) {
        console.log("validateSignUp: Error found");
        var messageString = signUpErrorMessage(error, birthdayDateMsg, overAgeCutOff, req.body.freeAgentCheck);

        //Build parameter for redirect - registerEmail
        var optionsString = (error.isEmpty()) ? emailInput : "";

        if (overAgeCutOff){//Build parameter for redirect - birthday
            optionsString = (optionsString == "") ? "?" + bdInput : optionsString + "&" + bdInput;
        } 

        if (req.body.freeAgentCheck == 0){ //Build parameter for redirect - freeAgentCheck
            optionsString = (optionsString == "") ? "?" + freeAgentInput : optionsString + "&" + freeAgentInput;
        } 

        console.log("ERROR:validateSignUp: " + messageString);
        req.flash("error", messageString);
        res.redirect("/talent/signup" + optionsString);
    } else {
        console.log("SUCCESS:validateSignUp: email, birthday, age and representation for new Talent are valid");
        Talent.findOne({email: inputEmail})
        .exec()
    
        .then((data)=>{
            if(data){
                req.flash("error",`${inputEmail} is registered. Try logging in with it.`);
                console.log(`ERROR:validateSignUp: ${inputEmail} is registered. Try logging in with it.`);
                res.redirect("/talent/login?userEmail=" + inputEmail);
            } else {
                console.log("SUCCESS:validateSignUp:" +inputEmail + " is new. Register user");
                res.redirect("/talent/new" + emailInput + "&"+ bdInput + "&" + freeAgentInput);
            }
        })
    
        .catch((error) => {
            console.log(`ERROR:validateSignUp: fetching user by email(${inputEmail}): ${error.message}`);
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


exports.validationChainCreate = [
    check("first").trim().escape(),
    check("last").trim().escape(),
    check("email", emailErrorMessage).normalizeEmail().trim().escape().isEmail(),
    check("instagramField").trim().escape(), 
    check("tiktokField").trim().escape(),     
// No check for bdMonth, bdDay, bdYear, dressSize, htFeet, htInches since they are from pickers  
    check("additionalInfoField").trim().escape(),     
    check("covidSignature").trim().escape(),
    check("covidCheck").trim().escape(),
    check("freeAgentCheck").trim().escape(),    
    check("password").trim().escape(),
    check("password", "8 <= password length <= 15.").isLength({min:8, max:15}),
    check("password", "Password is not alphanumeric").isAlphanumeric(),
    check("confirmPassword").trim().escape(),    
    check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password))
];


function isDateValid(year,month,day){
    let d = new Date(year, month-1, day);
    /*console.log("isDateValid:");
    console.log("isDate:input: "+year+"/"+(month-1));
    console.log("isDate:output: "+d.getFullYear()+"/"+d.getMonth());
    console.log("isDate:typeof year: "+ typeof year);
    console.log("isDate:typeof getFullYear: "+ typeof d.getFullYear());
    console.log("isDate:month: "+ (month-1) == d.getMonth());*/
    return (d.getFullYear()==year) && (d.getMonth()==(month-1))  && (d.getUTCDate() == day);
}


exports.validateCreate = (req, res, next) => {
    console.log(fName + "validateCreate:");

    let error = validationResult(req);

    var dataSet = {overAgeCutOffFlag:true, dateValidMsg:""};
    bdCheck(req.body,dataSet);
    let overAgeCutOff = dataSet.overAgeCutOffFlag;
    let birthdayDateMsg = dataSet.dateValidMsg; 

    if (!error.isEmpty() || (birthdayDateMsg !== "") || !overAgeCutOff || (req.body.freeAgentCheck != 0)) {
        console.log("validateCreate: Error found");
        var messageString = signUpErrorMessage(error, birthdayDateMsg, overAgeCutOff, req.body.freeAgentCheck);

        console.log("ERROR:validateCreate: " + messageString);
        req.flash("error", messageString);
        tempUser = req.body;
        res.locals.redirect = "/talent/new";
        next();
    } else {
        console.log("SUCCESS: all submission form inputs are valid");
        create(req,res,next);
    }
}


function create(req, res, next){
    console.log(fName + "create");
    let userParams = displayTodbUser(req.body);

    Talent.findOne({email: userParams.email})
    .exec()

    .then((data)=>{
        if(data){//email is in DB. Send it to login screen with message
            req.flash("error", `${userParams.email} is already registered`);
            console.log("ERROR: " + userParams.email + " is already registered");
            res.locals.redirect = `/talent/login/?userEmail=${userParams.email}`;
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
                    });                        
                    req.user = user;
                    res.locals.currentUser = user;
                    sendVerificationEmail(user, next);
                    res.locals.redirect = "/talent/verify";
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
    check("covidSignature").trim().escape(), //trim is not working properly
    check("covidCheck").trim().escape(),        
    check("freeAgentCheck").trim().escape(),
    check("password").trim().escape(),
];


const authenticateInfoForNewEmail =
    passport.authenticate("local", {
        failureRedirect: `/talent/edit-info`,
        failureFlash: true,
        successRedirect: `/talent/show`
    });


exports.validateUpdateInfo = (req, res, next) => {
    console.log(fName + "validateUpdateInfo: req.body");
    console.log(req.body);


    let error = validationResult(req);

    var dataSet = {overAgeCutOffFlag:true, dateValidMsg:""};
    bdCheck(req.body,dataSet);
    let overAgeCutOff = dataSet.overAgeCutOffFlag;
    let birthdayDateMsg = dataSet.dateValidMsg; 

    if (!error.isEmpty() || (birthdayDateMsg !== "") || !overAgeCutOff || (req.body.freeAgentCheck != 0)) {
        console.log("validateUpdateInfo: Error found");
        var messageString = signUpErrorMessage(error, birthdayDateMsg, overAgeCutOff, req.body.freeAgentCheck);

        console.log("ERROR:validateUpdateInfo: " + messageString);
        req.flash("error", messageString);
        tempUser = req.body;
        res.locals.redirect = "/talent/new";
        //res.locals.tempUser = req.body;
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

    let userParams = displayTodbUser(req.body);
    
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
        console.log("ERROR:validateUpdatePassword: " + messageString);
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
  