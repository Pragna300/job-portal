export const mapFrontendToBackend = (role) => {
  if (role === "user") return "client";
  if (role === "company") return "manager";
  return "admin";
};

export const mapBackendToFrontend = (role) => {
  if (role === "client") return "user";
  if (role === "manager") return "company";
  return "admin";
};