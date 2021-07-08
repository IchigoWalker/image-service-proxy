export function validateMiddleware(req, res, next) {
  if (req.url.includes("tr:") && req.url.includes("/base/")) {
    next();
  } else {
    return res.status(404).json({ error: true });
  }
}
