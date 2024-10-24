const path = require(`path`);

module.exports = {
  webpack: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@network": path.resolve(__dirname, "src/network"),
      "@actions": path.resolve(__dirname, "src/actions"),
      "@helpers": path.resolve(__dirname, "src/helpers"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@store": path.resolve(__dirname, "src/store"),
      "@ts": path.resolve(__dirname, "src/ts"),
    },
  },
};