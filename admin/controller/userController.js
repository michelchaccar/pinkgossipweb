'use strict';
var express = require('express');
var app = express();
const async = require('async'); 
//const moment = require('moment');
var userModel = require('../model/userModel');
var encryption = require('../../common/encrypt');
//const Validator = require('validatorjs'); // Import the Validator class
//const nodemailer = require('nodemailer');
//const emailCon = require('../../configuration/emailConfiguration');
const queryString = require('querystring');
const path = require('path');
const fs = require('fs');

exports.showProfile = async function (req, res) {
    
            res.render('users/profile', {
                title: 'Pink Gossip',
            });
    
};
exports.index = async function (req, res) {
    if (req.session.admin) {
        global.admin = req.session.admin;

        userModel.getSalonData(req, function (err, appUserData) {
            if (err) {
                console.error("Error fetching  user data:", err);
                appUserData = []; // Return empty array on error
            }
            res.render('users/index', {
                appUserData: appUserData,
                title: 'Beauty Business List',
            });
        });
    } else {
        res.redirect('/admin/login');
    }
};

exports.indexAppUser = async function (req, res) {
    if (req.session.admin) {
        global.admin = req.session.admin;

        userModel.getAppUserData(req, function (err, appUserData) {
            if (err) {
                console.error("Error fetching App user data:", err);
                appUserData = []; // Return empty array on error
            }
            res.render('users/indexappuser', {
                appUserData: appUserData,
                title: 'Gossiper List',
            });
        });
    } else {
        res.redirect('/admin/login');
    }
};

exports.createAppUser = async function (req, res) {
    if (req.session.admin) {
        global.admin = req.session.admin;

        res.render('users/createappuser', {
            userData: "",
            title: 'Create Gossiper',
        });

    } else {
        res.redirect('/admin/login');
    }
};
exports.editAppUser = async function (req, res) {
    if (req.session.admin) {
        const userId = req.params.id;

        userModel.getAppUserById(req,userId, function (err, userData) {
            if (err || !userData) {
                console.error("Error fetching user:", err);
                return res.redirect('/admin/appusers');
            }
//console.log(userData);
            res.render('users/createappuser', {
                userData:userData[0],
                title: 'Edit Gossiper',
            });
        });
    } else {
        res.redirect('/admin/login');
    }
};
exports.deleteAppUser = (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }

    userModel.deleteAppUserData(req, userId, (err, result) => {
        if (err) {
            res.redirect('/admin/appuser');
           // return res.status(500).json({ success: false, message: "Error deleting user", error: err });
        }

        if (result.affectedRows === 0) {
            res.redirect('/admin/appuser');
           // return res.status(404).json({ success: false, message: "User not found or already deleted" });
        }
        res.redirect('/admin/appuser');
        //return res.status(200).json({ success: true, message: "User deleted successfully" });
    });
};
exports.suspendAppUser = function (req, res) {
    if (!req.session.admin) return res.redirect('/admin/login');

    const userId = req.params.id;
    const suspendStatus = parseInt(req.query.status, 10); // Expecting 1 (suspend) or 0 (unsuspend)

    if (!userId || isNaN(suspendStatus) || (suspendStatus !== 0 && suspendStatus !== 1)) {
        return res.status(400).json({ success: false, message: "Valid User ID and suspend status (0 or 1) are required" });
    }
        userModel.suspendAppUser(req, userId, suspendStatus, (err, result) => {
            if (err) {
                console.error("Error updating suspend status:", err);
                return res.status(500).json({ success: false, message: "Error updating suspend status" });
            }
            if(req.query.p ==1)
            {
                res.redirect('/admin/appuser');
            }
            else
            {
                res.redirect('/admin/salon');
            }
            
        });
    
};

exports.createRewardTemplate = async function (req, res) {
    if (req.session.admin) {
        global.admin = req.session.admin;

        res.render('users/createrewardtemplate', {
            title: 'Create Reward Template',
        });

    } else {
        res.redirect('/admin/login');
    }
};

exports.createSalon = async function (req, res) {
    if (req.session.admin) {
        global.admin = req.session.admin;

        res.render('users/createsalon', {
            userData: "",
            openDays:[],
            title: 'Create Beauty Business',
        });

    } else {
        res.redirect('/admin/login');
    }
};

exports.editSalon = async function (req, res) {
    if (req.session.admin) {
        const salonId = req.params.id;

        userModel.getSalonById(req, salonId, function (err, salonData) {
            if (err || !salonData.user) {
                console.error("Error fetching salon:", err);
                return res.redirect('/admin/salon');
            }

            res.render('users/createsalon', {
                userData: salonData.user,
                openDays: salonData.open_days,  // Pass the first result (since it's an array)
                title: 'Edit Beauty Business',
            });
        });
    } else {
        res.redirect('/admin/login');
    }
};

exports.deleteSalon = (req, res) => {
    const salonId = req.params.id;

    if (!salonId) {
        return res.status(400).json({ success: false, message: "Salon ID is required" });
    }

    userModel.deleteSalonData(req, salonId, (err, result) => {
        if (err) {
            console.error("Error deleting salon:", err);
            return res.redirect('/admin/salon');
        }

        if (result.affectedRows === 0) {
            console.warn("Salon not found or already deleted.");
        }

        res.redirect('/admin/salon');
    });
};

exports.create = async function (req, res) {
    if(req.session.admin){
        global.admin = req.session.admin;
           res.render('users/create', {
            userEditData : "",
            title: 'Beauty Business',
    });    
}else{
    res.redirect('/admin/login');
}

};