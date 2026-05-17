import { getAuth } from "firebase-admin/auth";

function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  // Accept formats like: "Bearer <token>" (case-insensitive, allow extra whitespace)
  const parts = authHeader.split(/\s+/);
  if (parts.length < 2) return null;
  return parts[1];
}

// Required auth - blocks if no valid token. Also checks token revocation.
export async function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: no token provided" });
  }

  try {
    // `true` here checks whether the token was revoked
    const decodedToken = await getAuth().verifyIdToken(token, true);
    req.user = decodedToken;
    return next();
  } catch (error) {
    // Provide clearer logs and responses for common failure modes
    console.error("Auth Error:", error.code || error.message || error);
    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({ error: "Unauthorized: token revoked" });
    }
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

// Optional auth - allows requests without token, but validates if token is present.
// If validation fails, request continues as anonymous (req.user remains undefined/null).
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  if (!token) return next();

  try {
    // Do not check revocation here to avoid rejecting requests for optional routes;
    // if you want stricter checks, change to `verifyIdToken(token, true)`.
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
  } catch (error) {
    console.warn(
      "Optional auth validation failed:",
      error.code || error.message || error,
    );
    req.user = null;
  }

  return next();
}

export default checkAuth;
