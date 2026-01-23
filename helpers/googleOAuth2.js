import { OAuth2Client } from "google-auth-library";
import path from "node:path";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { HttpError } from "./index.js";
import { fileURLToPath } from "url";

dotenv.config();

const { GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_CLIENT_SECRET } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATH_JSON = path.join(__dirname, "../", "google-oauth.json");

const oauthConfig = JSON.parse(await readFile(PATH_JSON));

const googleOAuthClient = new OAuth2Client({
  clientId: GOOGLE_AUTH_CLIENT_ID,
  clientSecret: GOOGLE_AUTH_CLIENT_SECRET,
  redirectUri: oauthConfig.web.redirect_uris[0],
});

export const generateAuthUrl = () =>
  googleOAuthClient.generateAuthUrl({
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });

export const validateCode = async (code) => {
  const response = await googleOAuthClient.getToken(code);
  if (!response.tokens.id_token) {
    throw HttpError(401, "Unathorized");
  }
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: response.tokens.id_token,
  });

  return ticket;
};

export const getFullNameFromGoogleTokenPayload = (payload) => {
  let fullName = "Guest";
  if (payload.given_name && payload.family_name) {
    fullName = `${payload.given_name} ${payload.family_name}`;
  } else if (payload.given_name) {
    fullName = payload.given_name;
  } else if (payload.family_name) {
    fullName = payload.family_name;
  }
  return fullName;
};
