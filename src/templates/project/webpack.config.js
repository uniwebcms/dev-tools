/**
 * For configuration details and customization options, see:
 * https://github.com/uniwebcms/framework/blob/main/docs/webpack-config.md
 */
import { createConfig } from "@uniwebcms/framework";
import webpack from "webpack";

export default async (_, argv) => createConfig(webpack, argv, import.meta.url);
