"use strict";

const bcrypt = require("bcrypt");
const shopModel = require("../models/shop.model");
const crypto = require("crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./shop.service");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "WRITER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
};

class AccessService {
  /*
  check this token used ?
  */
  static handleRefreshToken = async (refreshToken) => {
    const foundToken = KeyTokenService.findByRefreshTokenUsed(refreshToken);
    if (foundToken) {
      // decode
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );
      console.log({ userId, email });
      //xoa
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something Wrong !! Please re login");
    }

    const holderToken = KeyTokenService.findByRefreshToken(refreshToken);
    if (!holderToken) throw new AuthFailureError("Shop not registered");

    //verify Token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );
    console.log(`[2]--`, { userId, email });
    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new AuthFailureError("Shop not registered");

    //create 1 cap moi
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    //update
    await holderToken.update({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addtoset: {
        refreshTokensUsed: refreshToken,
      },
    });
    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = KeyTokenService.removeKeyById(keyStore._id);
    return delKey;
  };
  static login = async ({ email, password, refreshToken = null }) => {
    /*
      1- check email in dbs
      2- match password
      3- create AT and RT and save
      4- generate tokens
      5- get data return login
    */

    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new BadRequestError("Shop not registered");
    }

    const match = bcrypt.compare(password, foundShop.password);
    if (!match) {
      throw new AuthFailureError("Authentication error");
    }

    //3 -
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    //4
    const tokens = await createTokenPair(
      { userId: foundShop._id, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId: foundShop._id,
    });

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email"],
        object: foundShop,
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    // check mail exist ?
    const holderShop = await shopModel.findOne({ email }).lean();
    if (holderShop) {
      throw new BadRequestError(`Error: Shop already registereddd`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      //Create privateKey: tra cho nguoi dung dung` de sign token, publicKey: dung` de verify token
      // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      //   // key type buffer
      //   modulusLength: 4096,
      //   publicKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      //   privateKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      // }); //save collection KeyStore

      //level 0
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      // console.log({ publicKey, privateKey });

      //Tao cap token: accessToken va refreshToken
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );
      console.log(`Created Token Success::`, tokens);

      const keyStore = await KeyTokenService.createKeyToken({
        refreshToken: tokens.refreshToken,
        privateKey,
        publicKey,
        userId: newShop._id,
      });

      if (!keyStore) {
        return {
          code: "xxxx",
          message: "KeyStore error",
        };
      }

      return {
        shop: getInfoData({
          fields: ["_id", "name", "email"],
          object: newShop,
        }),
        tokens,
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = AccessService;
