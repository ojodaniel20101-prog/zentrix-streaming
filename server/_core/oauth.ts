import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Initialize Firebase Admin SDK once
if (!getApps().length) {
  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountEnv) {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp(); // falls back to GOOGLE_APPLICATION_CREDENTIALS
    }
    console.log("[Firebase] Admin SDK initialized");
  } catch (error) {
    console.error("[Firebase] Failed to initialize Admin SDK:", error);
  }
}

async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string;
  email?: string;
  name?: string;
} | null> {
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error) {
    console.error("[Firebase] Token verification failed:", error);
    return null;
  }
}

export function registerOAuthRoutes(app: Express) {
  // Firebase Google Sign-In endpoint
  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    try {
      const firebaseUser = await verifyFirebaseToken(idToken);

      if (!firebaseUser) {
        res.status(401).json({ error: "Invalid Firebase token" });
        return;
      }

      const openId = `google_${firebaseUser.uid}`;

      await db.upsertUser({
        openId,
        name: firebaseUser.name || null,
        email: firebaseUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: firebaseUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Firebase login failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Keep legacy callback route (no-op for compatibility)
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/");
  });
}
