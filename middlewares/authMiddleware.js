import { getAuth } from "firebase-admin/auth";

// Required auth - blocks if no valid token
export async function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: NO token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

// Optional auth - allows requests without token, but validates if token is present
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
    } catch (error) {
      console.warn("Optional auth validation failed:", error.message);
      // Still allow the request to continue without auth
    }
  }
  
  return next();
}

export default checkAuth;

