'use strict';
var express = require('express');
var app = express();
const async = require('async'); 
var userModel = require('../model/userModel');

exports.salons = async function (req, res) {

        userModel.getSalonData(req, function (err, appUserData) {
                    if (err) {
                        console.error("Error fetching  user data:", err);
                        appUserData = []; // Return empty array on error
                    }
                    res.render('web/salon/index', {
                        appUserData: appUserData,
                        title: 'Beauty Business List',
                    });
                });   
};
exports.salon = async function (req, res) {
if (req.session.user) {
        userModel.getSalonData(req, function (err, appUserData) {
                    if (err) {
                        console.error("Error fetching  user data:", err);
                        appUserData = []; // Return empty array on error
                    }
                    res.render('web/salon/list', {
                        appUserData: appUserData,
                        title: 'Beauty Business List',
                        session: req.session
                    });
                });   
                 } else {
        res.redirect('/web/login');
    }
};
exports.home = async function (req, res) {

    console.log(req.session.user);

    if (req.session.user) {
        res.render('web/home/index', {
            title: 'Home',
            session: req.session
        });
    } else {
        res.redirect('/web/login');
    }
};
exports.searchSalons = function (req, res) {

    const keyword = req.query.keyword || "";
if (req.session.user) {
    userModel.searchSalon(keyword, req, function(err, salonData) {
        if (err) {
            console.error(err);
            return res.status(500).json([]);
        }
        return res.json(salonData);
    });

} else {
        res.redirect('/web/login');
    }
};


exports.search = async function (req, res) {

    console.log(req.session.user);

    if (req.session.user) {
         userModel.getEnthusiasts(req, function (err1, enthusiasts) {
        if (err1) enthusiasts = [];

        userModel.getSalonUsers(req, function (err2, salons) {
            if (err2) salons = [];

            res.render("web/salon/search", {
                title: "Search",
                enthusiasts: enthusiasts,
                salons: salons,
                session: req.session
            });
            //salons: salons,
        });
    });
    } else {
        res.redirect('/web/login');
    }
};

exports.message = async function (req, res) {
if (req.session.user) {
         res.render('web/message/message', {
                        title: 'Messages',
                        session: req.session
                    });  
                    } else {
        res.redirect('/web/login');
    }
};
exports.notification = async function (req, res) {
if (req.session.user) {
         res.render('web/home/notification', {
                        title: 'Notification',
                        session: req.session
                    });  
                    } else {
        res.redirect('/web/login');
    }
};

exports.showProfile = async function (req, res) {
    if (req.session.user) {
            res.render('users/profile', {
                title: 'Pink Gossip',
            });
             } else {
        res.redirect('/web/login');
    }
    
};