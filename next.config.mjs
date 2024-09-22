import CopyPlugin from "copy-webpack-plugin";
import createJiti from "jiti";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti("./src/env/server.ts");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, "src", "app", "data"),
            to: path.join(__dirname, ".next", "server", "app", "data")
          },
        ],
      }),
    );
    return config;
  },
};

export default nextConfig;
