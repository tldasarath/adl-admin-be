import express from "express";
import { body } from "express-validator";
import { subscribe, unsubscribe } from "../../controllers/publicController/newsletterController.js";
import verifyRecaptcha from "../../middleware/verifyRecaptcha.js";



const newsletterRoute = express.Router();

newsletterRoute.post(
  "/subscribe",
  [body("email").isEmail().normalizeEmail()],
    verifyRecaptcha({ action: "newsletter_subscribe", minScore: 0.5 }),
  subscribe
);

newsletterRoute.get("/unsubscribe", unsubscribe);

newsletterRoute.post("/unsubscribe", unsubscribe);


export default newsletterRoute;
