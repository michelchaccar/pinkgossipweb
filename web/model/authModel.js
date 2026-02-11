'user strict';
var sql = require('../../config');
var async = require('async');

var authModel = function (task) {

};


authModel.checkEmailExists = function (req, email) {
    return new Promise((resolve, reject) => {
      req.getConnection(function (error, conn) {
        if (error) {
          reject(error);
        } else {
          // Modify the query to also check for web_or_app_user = 'web'
          conn.query(
            'SELECT COUNT(*) AS count FROM app_users WHERE email = ? AND web_or_app_user = ?', 
            [email, 'admin'], 
            function (err, result) {
              if (err) {
                reject(err);
              } else {
                const emailExists = result[0].count > 0;
                resolve(emailExists);
              }
            }
          );
        }
      });
    });
  };
  

authModel.user_insert = function (req, addArray, result) {
    req.getConnection(function (error, conn) {
        var sq = conn.query("INSERT INTO app_users SET ?", [addArray], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res.insertId);
            }
        })
    })
};



authModel.user_login = function (req, loginArray, result) {
    req.getConnection(function (error, conn) {
        conn.query("select * from app_users where email = ? and password = ? AND web_or_app_user = ?", [loginArray.email, loginArray.password,'admin'], function (err, res) {
            if (err) {
                result(err, null);
            }else{
                result(null, res);
            }
        })

    })
};


authModel.getUserByEmail = function (req, email) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        conn.query('SELECT * FROM app_users WHERE email = ? AND web_or_app_user = ?', [email,'admin'], function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      }
    });
  });
};


authModel.user_passwordReset = function (req, encrypted_password, email, callback) {
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

authModel.updateFirebaseId = function (req, firebase_id, id, callback) {
  req.getConnection(function (error, conn) {
      if (error) {
          return callback(error, null);
      }
      const updateQuery = "UPDATE app_users SET firebase_id = ? WHERE id = ?";
      conn.query(updateQuery, [firebase_id, id], function (err, result) {
          if (err) {
              return callback(err, null);
          }
          callback(null, result);
      });
  });
};

module.exports = authModel;