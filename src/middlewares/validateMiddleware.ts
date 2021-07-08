export function validateMiddleware(req, res, next) {
  if (req.url.includes("tr:") && req.url.includes("/base/")) {
    next();
  }
}
