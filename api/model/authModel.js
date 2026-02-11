'user strict';
var sql = require('../../config');
var async = require('async');

var authModel = function (task) {

};


authModel.checkUserEmailExist = function (req, email) {
    return new Promise((resolve, reject) => {
      req.getConnection(function (error, conn) {
        if (error) {
          reject(error);
        } else {
          conn.query('SELECT COUNT(*) AS count FROM app_users WHERE email = ? AND web_or_app_user = ? and deleted_at IS NULL', [email,'app'], function (err, result) {
            if (err) {
              reject(err);
            } else {
                // console.log(result);
              const emailExists = result[0].count > 0; 
              resolve(emailExists);
            }
          });
        }
      });
    });
  };


  authModel.checkUserNameExists = function (req, userName) {
    return new Promise((resolve, reject) => {
        req.getConnection(function (error, conn) {
            if (error) {
                reject(error);
            } else {
                conn.query('SELECT * FROM app_users WHERE user_name = ? and deleted_at IS NULL', [userName], function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        if (result.length > 0) {
                            resolve({ exists: true, userData: result[0] });
                        } else {
                            resolve({ exists: false, userData: null });
                        }
                    }
                });
            }
        });
    });
  };



  authModel.store = function (req, addArray, result) {
    req.getConnection(function (error, conn) {
        var sql = conn.query("INSERT INTO app_users SET ?", [addArray], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                conn.query("SELECT * FROM app_users WHERE id = ?", [res.insertId], function (err, user) {
                    if (err) {
                        result(err, null);
                    } else {
                        result(null, user[0]);
                    }
                });
            }
        });
    });
};

  

authModel.app_login = function (req, loginArray, result) {
    req.getConnection(function (error, conn) {
        conn.query("select * from app_users where email = ? and password = ? and deleted_at IS NULL", [loginArray.email, loginArray.password], function (err, res) {
            if (err) {
                result(err, null);
            }else{
                result(null, res);
            }
        })

    })
};


authModel.checkSocialIdExists = function (req, social_id) {
  return new Promise((resolve, reject) => {
      req.getConnection(function (error, conn) {
          if (error) {
              reject(error);
          } else {
              conn.query('SELECT * FROM app_users WHERE social_id = ? and deleted_at IS NULL', [social_id], function (err, result) {
                  if (err) {
                      reject(err);
                  } else {
                      if (result.length > 0) {
                          resolve({ socialIdExists: true, userData: result[0] });
                      } else {
                          resolve({ socialIdExists: false, userData: null });
                      }
                  }
              });
          }
      });
  });
};


authModel.app_passwordReset = function (req, encrypted_password, email, callback) {
    req.getConnection(function (error, conn) {
        if (error) {
            return callback(error, null);
        }
        const updateQuery = "UPDATE app_users SET password = ? WHERE email = ?";
        conn.query(updateQuery, [encrypted_password, email], function (err, result) {
            if (err) {
                return callback(err, null);
            }
            callback(null, result);
        });
    });
  };

module.exports = authModel;