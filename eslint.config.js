export default [
  {
    files: ["worker/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        URL: "readonly",
        crypto: "readonly",
        btoa: "readonly",
        atob: "readonly",
        Response: "readonly",
        fetch: "readonly",
        console: "readonly",
      },
    },

    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",
    },
  },
];
