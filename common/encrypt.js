'use strict';
// Nodejs encryption with CTR
var encryption = function(task){
    
};
// https://github.com/skavinvarnan/Cross-Platform-AES
const cryptLib = require('@skavinvarnan/cryptlib');

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = 'ARETYHG674HT38HNLQVCIO254KIUYGHB';
const iv = 'UHBDRWTAWN56EGVP';



encryption.encrypt_all = function (data) {
	var encrypted = cryptLib.encryptPlainTextWithRandomIV(data, key);
	return encrypted;
  }

  encryption.decrypt_all = function (data) {
	if(data ==''){
		 return data;
	}else{
		var decryptedString = cryptLib.decryptCipherTextWithRandomIV(data, key);
	  return decryptedString;
	}
}

encryption.encrypt = function (data) {
  var encipher = crypto.createCipheriv('aes-256-cbc', key, iv),
    buffer = Buffer.concat([
      encipher.update(data),
      encipher.final()
    ]);
  return buffer.toString('base64');
}

encryption.decrypt = function (data) {
	if(data ==''){
		 return data;
	}else{
	  var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv),
	    buffer = Buffer.concat([
	      decipher.update(Buffer.from(data, 'base64')),
	      decipher.final()
	    ]);
	  return buffer.toString();
	}
}

module.exports= encryption;
//var hw = encrypt("Some serious stuff")
//console.log(hw)
//console.log(decrypt(hw))

