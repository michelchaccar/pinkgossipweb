'use strict';
var express = require('express');
var app = express();
const async = require('async');
var auth = require('../model/authModel');
var encryption = require('../../common/encrypt');
const Validator = require('validatorjs'); // Import the Validator class
const nodemailer = require('nodemailer');
const emailCon = require('../../configuration/emailConfiguration');
const queryString = require('querystring');


exports.signUp = function (req, res) {

    
        res.render('web/signup', {
            title: 'Salon Registration',
            flash: req.flash()
        });
   

};

exports.loginStore = async function (req, res, next) {

    const validationRules = {
        email: 'required|email',
        password: 'required',
    };
    const validation = new Validator(req.body, validationRules);

    if (validation.fails()) {
        res.status(422).json({ errors: validation.errors.all() });
    } else {
        var encrypted_password = encryption.encrypt(req.body.password);
        var loginArray = {
            email: req.body.email,
            password: encrypted_password
        };

        auth.user_login(req, loginArray, async function (err, response) {
            if (err) {
                console.log(err);
                res.status(500).json({ message: 'something went wrong!' });
            } else {
                if (response.length > 0 && response[0].id > 0) {
                    req.session.admin = response[0];
                    req.session.save();
                    global.admin = req.session.admin;

                    res.json({ message: 'login successfully', is_form_page: '1', back_url: '/admin/dashboard' });
                } else {
                    res.status(422).json({ message: 'These credentials do not match our records!' });
                }
            }
        });

    }
}



// Registration funciton

exports.register = function (req, res) {

    if (req.session.admin) {
        res.redirect('/admin/dashboard');
    }
    else {
        res.render('auth_pages/create-account', {
            title: 'Register',
            base_url: base_url,
            flash: req.flash()
        });
    }
};


exports.insert = async function (req, res, next) {
    const validationRules = {
        first_name: 'required',
        last_name: 'required',
         category: 'required',
        email: 'required|email',
        password: 'required|min:6',
    };
    if(req.body.password != req.body.confirm_password)
    {
        return res.status(422).json({ errors: { email: ['Password and Confirm password does not match.'] } });
    }
    const emailExists = await auth.checkEmailExists(req, req.body.email);
    if (emailExists) {
        return res.status(422).json({ errors: { email: ['Email already exists'] } });
    }

    const validation = new Validator(req.body, validationRules);

    if (validation.fails()) {
        res.status(422).json({ errors: validation.errors.all() });
    } else {
        var encrypted_password = encryption.encrypt(req.body.password);
        
        var addArray = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            user_name: req.body.user_name,
            user_type: 2,
            salon_name: req.body.salon_name,
            category:req.body.category,
            email: req.body.email,
            password: encrypted_password,
            web_or_app_user: 'admin',
            contact_no: req.body.contact_no,
            address: req.body.address,
            site_name: req.body.site_name,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            created_at: new Date(),
            updated_at: new Date()

        };

        auth.user_insert(req, addArray, async function (err, response) {
            if (err) {
                console.log(err);
                res.status(500).json({ message: 'something went wrong!' });
            } else {

console.log("Done");
            const temp_path = '../views/api_pages/welcome-salon-email-temp.ejs';
            const subject = 'Bienvenue dans Pink Gossip  — là où votre talent devient viral | Welcome to Pink Gossip  — where your talent becomes viral'; 
            const sent = await emailCon.sendEmail(req.body.email, temp_path,'api', subject);

                res.json({ message: 'User register succssfully.', is_form_page: '1', back_url: '/websignup' });
              }
        });
    }
}



// forgotPassword funciton


exports.forgotPassword = function (req, res) {
    res.render('auth_pages/forgot-password', {
        title: 'Forgot-password',
        flash: req.flash()
    });
};


exports.resetPassword = async (req, res, next) => {
    const validationRules = {
        email: 'required|email',
    };
    const validation = new Validator(req.body, validationRules);

    if (validation.fails()) {
        return res.status(422).json({ errors: validation.errors.all() });
    }

    const email = req.body.email;

    try {
        const user_data = await auth.getUserByEmail(req, email);
        if (user_data) {
            const temp_path = '../views/auth_pages/reset-email-temp.ejs';
            const subject = 'Password Reset'; 
            const sent = await emailCon.sendEmail(email, temp_path ,'web', subject);
            if (sent) {
                res.json({ message: req.__('email_send_msg'), is_form_page: '1', back_url: '/admin/forgot-password' });
            } else {
                return res.status(500).json({ message: 'email sending error!' });
            }
        } else {
            return res.status(404).json({ message: 'email is not register!' });
        }
    }
    catch (err) {
        return res.status(500).json({ message: 'error: ',err});
    }
};



exports.resetCreate = async function (req, res) {

    const email =  req.query.email;
    const decryptedEmail = encryption.decrypt(email);

    res.render('auth_pages/reset-password', {
        title: 'Reset password',
        decryptedEmail: decryptedEmail, 
    });
}

exports.resetStore = async function (req, res, next) {

    const validationRules = {
        email: 'required|email',
        password: 'required|min:6',
        confirm_password: 'required|min:6|same:password',
    };
    const validation = new Validator(req.body, validationRules);

    if (validation.fails()) {
        return res.status(422).json({ errors: validation.errors.all() });
    } else {
        const encrypted_password = encryption.encrypt(req.body.password);
        const email = req.body.email;

        auth.user_passwordReset(req, encrypted_password, email, function (err, response) {
            if (err) {
                return res.status(500).json({ message: 'error: ',err });
            } else {
                return res.json({ message: 'password reset successfully!' , is_form_page: '1', back_url: '/admin/login' });
            }
        });
    }

}


// Logout funciton

exports.logout = async function (req, res, next) {
    req.session.destroy(); 
    res.redirect('/admin');	
}