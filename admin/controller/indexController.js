'use strict';
var express = require('express');
var app = express();
const async = require('async'); 
const moment = require('moment');

exports.dashboard = async function (req, res) {
        if(req.session.admin){
            global.admin = req.session.admin;
			   res.render('home/dashboard', {
                title: 'Dashboard',
        });    
    }else{
        res.redirect('/admin/login');
    }
   
};