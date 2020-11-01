const   fName ="homeController:"
const   Talent = require("../models/talent");

exports.getRoot = (req, res) => {
    console.log(fName + "getRoot:/:");
    res.render("index",{title:"NY(S)FS | Home"});
};


exports.getAllTalent = (req, res, next) => {
    console.log(fName + "getAllTalent:");
    Talent.find({}, (error, talentList) => {
        if (error) next(error);
        res.render("home/submitted-talent", {
            talentList: talentList,
            title:"NY(S)FS | All Submissions"
        });
    });
};
