import fs from "fs";
import { WranglerAPI } from "./src/wrangler-api";

const wrangler = new WranglerAPI();

const savedTokens = JSON.parse(fs.readFileSync("tokens.json", "utf8"));

await wrangler.restoreSession(
	savedTokens.accessToken,
	savedTokens.refreshToken,
	savedTokens.expiry
);

process.on("beforeExit", async () => {
	const tokens = wrangler.getOAuthTokens();
	fs.writeFileSync("tokens.json", JSON.stringify(tokens, null, 2));
});
