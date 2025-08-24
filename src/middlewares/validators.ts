import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateCreatePayment = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Le montant doit être un nombre positif"),
  body("currency")
    .optional()
    .isIn(["eur", "usd", "gbp"])
    .withMessage("La devise doit être eur, usd ou gbp"),
  body("userId").notEmpty().withMessage("L'ID utilisateur est requis"),
  body("description").notEmpty().withMessage("La description est requise"),
];

export const validateCreateSubscription = [
  body("userId").notEmpty().withMessage("L'ID utilisateur est requis"),
  body("email").isEmail().withMessage("L'email doit être valide"),
  body("amount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Le montant doit être un nombre positif"),
  body("currency")
    .optional()
    .isIn(["eur", "usd", "gbp"])
    .withMessage("La devise doit être eur, usd ou gbp"),
];

export const validateWebhook = [
  body("type").notEmpty().withMessage("Le type d'événement est requis"),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Erreurs de validation",
      errors: errors.array(),
    });
  }
  next();
};
