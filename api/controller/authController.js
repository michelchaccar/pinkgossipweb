'use strict';
var express = require('express');
var app = express();
const config = require('../../config');
const async = require('async');
const auth = require('../model/authModel');
const appUser = require('../model/userModel');
var encryption = require('../../common/encrypt');
const Validator = require('validatorjs');
const emailCon = require('../../configuration/emailConfiguration');
const e = require('express');
const post = require('../model/postModel');


exports.signUp = async function (req, res, next) {
    const validationRules = {
        first_name: 'required',
        last_name: 'required',
        email: 'required|email',
        password: 'required',
        user_type: 'required',

    };
    const validation = new Validator(req.body, validationRules);
    if (validation.fails()) {
        const validationErrors = {
            first_name: validation.errors.first('first_name'),
            last_name: validation.errors.first('last_name'),
            email: validation.errors.first('email'),
            password: validation.errors.first('password'),
            user_type: validation.errors.first('user_type'),
        };

        return res.status(422).json({ success: false, message: validationErrors });
    } else {
        const emailExists = await auth.checkUserEmailExist(req, req.body.email);
        if (emailExists) {
            res.status(200).send({ success: false, message: 'Email already exists' });
        } else {
            var encrypted_password = encryption.encrypt(req.body.password);
            var addArray = {
                user_name: req.body.user_name,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                salon_name: req.body.first_name,
                email: req.body.email,
                password: encrypted_password,
                user_type: req.body.user_type,
                category: req.body.category,
                created_at: new Date(),
                updated_at: new Date()
            };
            auth.store(req, addArray, async function (err, response) {
                if (err) {
                    res.json({ success: false, message: 'Something went wrong' });
                } else {
                    var notificationArray = {
                                        from_user_id: response.id,
                                        to_user_id: response.id,	
                                        text: 'Welcome to Pink Gossip! Every visit, every selfie, every review = rewards Start exploring salons near you!',
                                        text_fr: "Chaque visite, chaque selfie, chaque avis = des récompenses.Commencez à explorer les salons près de chez vous !",
                                        type: 'signup',
                                        created_at: new Date(),
                                        updated_at: new Date()
                                    };
                    var temp_path = '';
                    var subject = 'Bienvenue dans Pink Gossip  — là où votre talent devient viral | Welcome to Pink Gossip  — where your talent becomes viral'; 
                                               
                                    
                    if(req.body.user_type == 1)
                    {
                        temp_path = './admin/views/api_pages/welcome-gossiper-email-temp.ejs';
                        subject = '💖 Welcome to Pink Gossip, Gossiper! 💖';
                        notificationArray.text = "Welcome to Pink Gossip! Every visit, every selfie, every review = rewards Start exploring salons near you!";
                        notificationArray.text_fr = "Chaque visite, chaque selfie, chaque avis = des récompenses.Commencez à explorer les salons près de chez vous!";
                    }
                    else
                    {
                        temp_path = './admin/views/api_pages/welcome-salon-email-temp.ejs';
                        notificationArray.text = "Welcome to Pink Gossip for  Business! Your salon is now part of the  beauty spotlight. Complete your profile to  start attracting clients.";
                        notificationArray.text_fr = "Votre salon fait désormais partie des lumières de la beauté.Complétez votre profil pour commencer à attirer des clients.";
                    }

                    console.log("Done");
                     const sent = await emailCon.sendEmail(req.body.email, temp_path,'api', subject);
                    await post.notification_store(req, notificationArray);
                    res.json({ success: true, response: response, message: 'Registration successfully' });
                }
            });
        }
    }
}

exports.userExists = async function (req, res) {
    var social_id = req.params.social_id;
    const gmailIdExists = await auth.checkSocialIdExists(req,social_id);
    if (gmailIdExists.socialIdExists) {
        res.json({ success: true});
    } else{
        res.json({ success: false});
    }

}

exports.userNameExists = async function (req, res) {
    var user_name = req.body.user_name;
    const userNameExists = await auth.checkUserNameExists(req, user_name);
    if (userNameExists.exists) {
        res.json({ success: true});
    } else{
        res.json({ success: false});
    }

}

exports.login = async function (req, res, next) {

    const validationRules = {
        social_type: 'required',
    };

    const validation = new Validator(req.body, validationRules);

    if (validation.fails()) {
        const validationErrors = {
            social_type: validation.errors.first('social_type'),
        };
        return res.status(422).json({ success: false, message: validationErrors });

    } else {
        if (req.body.social_type == 'login') {
            const validationRules = {
                email: 'required|email',
                password: 'required',
            };
            const validation = new Validator(req.body, validationRules);

            if (validation.fails()) {
                const validationErrors = {
                    email: validation.errors.first('email'),
                    password: validation.errors.first('password'),
                };
                return res.status(422).json({ success: false, message: validationErrors });
            } else {
                var encrypted_password = encryption.encrypt(req.body.password);
                var loginArray = {
                    email: req.body.email,
                    password: encrypted_password
                };

                auth.app_login(req, loginArray, async function (err, response) {
                    if (err) {
                        res.status(500).json({ message: 'Something went wrong' });
                    } else {
                        if (response.length > 0 && response[0].id > 0) {
                            res.json({ success: true, response: response[0], message: 'Login successfully' });
                        } else {
                            res.status(422).json({ success: false, message: 'Invalid credentials' });
                        }
                    }
                });

            }
        } 
    
        else if (req.body.social_type == 'google') {

            const validationRules = {
                social_id: 'required',
            };
            const validation = new Validator(req.body, validationRules);

            if (validation.fails()) {
                const validationErrors = {
                    social_id: validation.errors.first('social_id'),
                };

                return res.status(422).json({ success: false, message: validationErrors });
            } else {
                const gmailIdExists = await auth.checkSocialIdExists(req, req.body.social_id);
                if (gmailIdExists.socialIdExists) {
                    res.json({ success: true, response: gmailIdExists.userData, message: 'Login successfully' });
                } else {
                    var encrypted_password = encryption.encrypt(req.body.password);
                    var addArray = {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        user_type: req.body.user_type,
                        password: encrypted_password,
                        social_id: req.body.social_id,
                        social_type: req.body.social_type,
                        created_at: new Date(),
                        updated_at: new Date()
                    };
                    auth.store(req, addArray, async function (err, response) {
                        if (err) {
                            res.json({ success: false, message: 'Something went wrong' });
                        } else {
                            res.json({ success: true, response: response, message: 'Login successfully' });
                        }
                    });
                }
            }
        } else if (req.body.social_type == 'apple') {
            const validationRules = {
                social_id: 'required',
            };
            const validation = new Validator(req.body, validationRules);

            if (validation.fails()) {
                const validationErrors = {
                    social_id: validation.errors.first('social_id'),
                };
                return res.status(422).json({ success: false, message: validationErrors });
            } else {
                const appleIdExists = await auth.checkSocialIdExists(req, req.body.social_id);

                if (appleIdExists.socialIdExists) {
                    res.json({ success: true, response: appleIdExists.userData, message: 'Login successfully', userExists: true });
                } else {
                    var addArray = {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        user_type: req.body.user_type,
                        social_id: req.body.social_id,
                        social_type: req.body.social_type,
                        created_at: new Date(),
                        updated_at: new Date()
                    };
                    auth.store(req, addArray, async function (err, response) {
                        if (err) {
                            res.json({ success: false, message: 'Something went wrong' });
                        } else {
                            res.json({ success: true, response: response, message: 'Login successfully', userExists: false});
                        }
                    });
                }
            }
        }else {
            res.status(422).json({ success: false, message: 'Invalid social type' });
        }
    }
}


exports.forgotPassword = async function (req, res, next) {
    const validationRules = {
        email: 'required|email',
    };
    const validation = new Validator(req.body, validationRules);
    if (validation.fails()) {
        const validationErrors = {
            email: validation.errors.first('email'),
        };

        return res.status(422).json({ success: false, message: validationErrors });
}else{
    const email = req.body.email;
	try {
		// const user_data = await auth.checkUserEmailExist(req, email);
		// if (user_data) {
			const temp_path = './admin/views/api_pages/reset-email-temp.ejs';
            const subject = 'Password Reset'; 
			const sent = await emailCon.sendEmail(email, temp_path,'api', subject);
			if (sent) {
                res.json({ success: true, message: 'The reset password link has been sent to your email address' });
			} else {
                res.status(422).json({ success: false, message: 'Failed to send email' });
			}
		// } else {
        //     res.status(422).json({ success: false, message: 'The Email is not registered with us' });
		// }
	}
	catch (err) {
		return res.status(500).json({success: false, message: 'Internal server error' });
	}
}
}


exports.resetCreate = async function (req, res) {

	const email =  req.query.email;
	const decryptedEmail = encryption.decrypt(email);

	res.render('api_pages/reset-password', {
		title: 'Reset password',
		decryptedEmail: decryptedEmail, 
	});
}


exports.passwordStore = async function (req, res, next) {

	const validationRules = {
		email: 'required|email',
		password: 'required',
		confirm_password: 'required|same:password',
	};
	const validation = new Validator(req.body, validationRules);

	if (validation.fails()) {
        return res.status(422).json({ errors: validation.errors.all() });
    } else {
		const encrypted_password = encryption.encrypt(req.body.password);
		const email = req.body.email;

		auth.app_passwordReset(req, encrypted_password, email, function (err, response) {
			if (err) {
                return res.status(500).json({success: false, message: 'Something went wrong!' });
			} else {
                return res.json({ message: 'Password reset successful!'});
			}
		});
	}

}



exports.updateFbData = async function (req, res) {
    var profileArray = {
        firebase_id: req.body.firebase_id,
        fcm_token: req.body.fcm_token,
        updated_at: new Date()
    };
    appUser.profile_update(req, profileArray, req.params.u_id, async function (err, response) {
        if (err) {
            res.json({success: false, message: 'Something went wrong!' });
        } else {
            res.json({success: true,  message: 'Update firebase data.'});
        }
    });
};
