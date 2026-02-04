// Dynamic Expo config to vary the display name by EAS build profile.
//
// EAS sets `EAS_BUILD_PROFILE` during builds (e.g. development/preview/production).
// Locally (expo start), this env var is usually not set, so we default to the base name.

function getAppNameByProfile(profile) {
  const base = "Take Note";

  if (profile === "development") return `${base} (Dev)`;
  if (profile === "preview") return `${base} (Pre)`;

  // production (or unknown)
  return base;
}

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;

  return {
    ...config,
    name: getAppNameByProfile(profile),
  };
};

