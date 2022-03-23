/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWalletProvider = require("@truffle/hdwallet-provider")

const fs = require("fs")
const mnemonic = fs.readFileSync("secretKey").toString().trim()

module.exports = {
	networks: {
		development: {
			host: "127.0.0.1", // Localhost (default: none)
			port: 7545, // Standard Ethereum port (default: none)
			network_id: "*", // Any network (default: none)
		},
		mainnet: {
			provider: () =>
				new HDWalletProvider(
					mnemonic,
					`https://mainnet.infura.io/v3/5b47694285464afc8725d1fdd74b1e8e`
				),
			network_id: 1,
		},
		rinkeby: {
			provider: () =>
				new HDWalletProvider(
					mnemonic,
					`https://rinkeby.infura.io/v3/5b47694285464afc8725d1fdd74b1e8e`
				),
			network_id: 4, // Ropsten's id
		},
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000
	},

	// Configure your compilers
	compilers: {
		solc: {
			version: "0.8.10", // Fetch exact version from solc-bin (default: truffle's version)
			// docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
			settings: {
				// See the solidity docs for advice about optimization and evmVersion
				optimizer: {
					enabled: true,
					runs: 1000,
				},
				evmVersion: "byzantium",
			},
		},
	},

	plugins: ["truffle-plugin-verify"],
	api_keys: {
		etherscan: "SC57PN5C9UFWJRQ1ME8FYSXD12RZXNEHI8",
	},
}
