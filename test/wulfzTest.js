const {
	expectRevert,
	time,
	ether,
	expectEvent,
} = require("@openzeppelin/test-helpers")

const WulfzNFT = artifacts.require("./WulfzNFT")
const StakingPool = artifacts.require("./StakingPool")
const Awoo = artifacts.require("UtilityToken")
const { MerkleTree } = require("merkletreejs")
const keccak256 = require("keccak256")
const whitelistAddress = require("../whitelist/whitelist.json")

const { assert } = require("chai")

require("chai").use(require("chai-as-promised")).should()

contract("WulfzNFT", (accounts) => {
	let contract, stakingPool, utilityToken
	const alice = accounts[0]
	const bob = accounts[1]
	const cat = accounts[2]

	before(async () => {
		contract = await WulfzNFT.deployed()
		stakingPool = await StakingPool.deployed()
		utilityToken = await Awoo.deployed()
	})

	describe("deployment", async () => {
		it("deploys successfully", async () => {
			const address = contract.address
			const poolAddr = stakingPool.address
			const awooAddr = utilityToken.address

			assert.notEqual(address, 0x0)
			assert.notEqual(address, "")
			assert.notEqual(address, null)
			assert.notEqual(address, undefined)

			assert.notEqual(poolAddr, 0x0)
			assert.notEqual(poolAddr, "")
			assert.notEqual(poolAddr, null)
			assert.notEqual(poolAddr, undefined)

			assert.notEqual(awooAddr, 0x0)
			assert.notEqual(awooAddr, "")
			assert.notEqual(awooAddr, null)
			assert.notEqual(awooAddr, undefined)

			let res = await contract.setStakingPool(poolAddr)
			assert.equal(
				res.logs[0].args.addr,
				poolAddr,
				"pool address not matched"
			)

			res = await contract.setUtilitytoken(awooAddr)
			assert.equal(
				res.logs[0].args.addr,
				awooAddr,
				"awoo address not matched"
			)

			res = await stakingPool.setUtilitytoken(awooAddr)
			assert.equal(
				res.logs[0].args.addr,
				awooAddr,
				"awoo address not matched, from Pool"
			)
		})
	})

	xdescribe("PreSale", async () => {
		it("mint token during Private Sale", async () => {
			// time.increase(time.duration.days(300))
			res = await contract.setStartTimeOfPrivateSale(1640582690)

			const leafNodes = whitelistAddress.map((addr) => keccak256(addr))
			const tree = new MerkleTree(leafNodes, keccak256, {
				sortPairs: true,
			})
			const claimingAddress = leafNodes[0]
			const hexProof = tree.getHexProof(claimingAddress)

			// let hexProof = [
			// 	"0x7a06f474f9fb5c277df54de6b91e4045da809858fcfc2a0daa93a7bf5351157a",
			// 	"0xf9d57be254b1a74500472f2516f225b23979e494e8703d36829e807cd0927ea4",
			// 	"0x7b52e78ccfe87af2247502ca3c805bf5c6baff7b44f450a97ca15a230ba8c8e4",
			// 	"0xf589008cb6ebf2c4144088319fb1618c757cbcd9502b1b7054c7916bf3f6b594",
			// ]

			const result = await contract.Presale(hexProof, {
				from: alice,
				value: 80000000000000000,
			})

			const res1 = result.logs[0].args
			const res2 = result.logs[1].args

			assert.equal(res1.tokenId, 1, "Presale is failed")
			// arr.push(event.id)
			assert.equal(
				res1.from,
				"0x0000000000000000000000000000000000000000",
				"from is not correct"
			)
			assert.equal(res1.to, accounts[0], "TO is not correct")
			assert.equal(res2.user, accounts[0], "USER ADDR is not correct")
			assert.equal(res2.tokenId, 1, "Presale is failed")
			assert.equal(res2.wType, 0, "Wulfz type is not correct")
		})
	})

	xdescribe("PublicSale", async () => {
		it("mint token during Public Sale", async () => {
			res = await contract.setStartTimeOfPublicSale(1640582690)

			let res1 = await contract.PublicSale(2, {
				from: bob,
				value: 160000000000000000,
			})

			res1 = res1.logs[3].args
			assert.equal(res1.user, bob, "user mismatched")
			assert.equal(res1.tokenId, 3, "tokenId mismatched")

			let res2 = await contract.PublicSale(1, {
				from: cat,
				value: 160000000000000000,
			})

			res2 = res2.logs[1].args
			assert.equal(res2.user, cat, "user mismatched")
			assert.equal(res2.tokenId, 4, "tokenId mismatched")

			contract.PublicSale(3, {
				from: alice,
				value: 240000000000000000,
			}).should.be.rejected

			contract.PublicSale(2, {
				from: alice,
				value: 159000000000000000,
			}).should.be.rejected
		})
	})

	xdescribe("Staking", async () => {
		it("Stake Wulfz", async () => {
			res = await contract.setStakingTime(1640582690)
			contract.startStaking(3, { from: alice }).should.be.rejected

			await contract.startStaking(3, { from: bob })
			await contract.startStaking(2, { from: bob })

			contract.startStaking(3, { from: bob }).should.be.rejected
			contract.startStaking(2, { from: alice }).should.be.rejected

			contract.changeName(3, "asdf", {
				from: bob,
			}).should.be.rejected

			contract.approve(cat, 2, { from: bob }).should.be.rejected
		})
		it("UnStake Wulfz", async () => {
			time.increase(time.duration.days(2))

			contract.stopStaking(2, {
				from: alice,
			}).should.be.rejected

			await contract.stopStaking(2, {
				from: bob,
			})

			// res = await stakingPool.stakedTokensOf(bob)
			// console.log(res)

			res = await utilityToken.balanceOf(bob)
			console.log(res.toNumber())
			// console.log(await utilityToken.decimals())
		})
		it("Get Reward", async () => {
			time.increase(time.duration.days(120))
			await stakingPool.getReward({ from: bob })
			// console.log(await utilityToken.balanceOf(bob))

			await contract.stopStaking(2, {
				from: bob,
			}).should.be.rejected

			time.increase(time.duration.hours(5))

			await contract.stopStaking(3, {
				from: bob,
			})

			time.increase(time.duration.days(100))
			await stakingPool.getReward({ from: bob })

			res = await utilityToken.balanceOf(bob)
			console.log(res.toNumber())
		})
	})

	xdescribe("Adoption", async () => {
		it("adopting", async () => {
			contract.setAdoptTime(1640582690)
			res = await contract.isAdoptionStart()
			res = await contract.canAdopt(3, { from: bob })
			// console.log(res)
			res = await contract.adopt(3, { from: bob })
			console.log((await utilityToken.balanceOf(bob)).toNumber())
			console.log((await contract.tokenOfOwnerByIndex(bob, 2)).toNumber())
			assert.equal(res.logs[1].args.tokenId, 6001, "Pupz Id mismatched")
		})

		it("cooldown test", async () => {
			time.increase(time.duration.days(10))
			await contract.adopt(3, { from: bob }).should.be.rejected

			time.increase(time.duration.days(5))
			res = await contract.adopt(3, { from: bob })
			assert.equal(res.logs[1].args.tokenId, 6002, "Pupz Id mismatched")
		})

		it("awoo burn test", async () => {})
	})

	xdescribe("Evolution", async () => {
		it("evolution", async () => {
			contract.setEvolveTime(1640582690)
			await contract.evolve(6002, { from: bob }).should.be.rejected
			await contract.startStaking(1, { from: alice })
			time.increase(time.duration.days(300))
			await stakingPool.getReward({ from: alice })
			await contract.stopStaking(1, { from: alice })

			res = await contract.evolve(1, { from: alice })
			assert.equal(res.logs[3].args.tokenId, 5601, "Alpha Id mismatched")
			assert.equal(res.logs[3].args.wType, 2, "Alpha type mismatched")
			console.log((await utilityToken.balanceOf(alice)).toNumber())
			console.log((await contract.balanceOf(alice)).toNumber())
			console.log(
				(await contract.tokenOfOwnerByIndex(alice, 0)).toNumber()
			)
			await contract.tokenOfOwnerByIndex(alice, 1).should.be.rejected

			await contract.adopt(5601, { from: alice })
			time.increase(time.duration.days(8))
			await contract.adopt(5601, { from: alice })
			console.log((await utilityToken.balanceOf(alice)).toNumber())
			console.log((await contract.balanceOf(alice)).toNumber())
		})

		it("awoo & Wulfz burn test 1500", async () => {})
	})

	xdescribe("Change Name & Bio", async () => {
		it("change name", async () => {
			await contract.changeName(5601, "SUPERHIRO", { from: alice })
			console.log(await contract.isNameReserved("SUPERHIRO"))
		})

		it("change bio", async () => {
			console.log((await utilityToken.balanceOf(alice)).toNumber())
			await contract.changeBio(6001, "I am the first Pupz", { from: bob })
				.should.be.rejected
			await contract.changeBio(
				5601,
				"I am the first Genesis having bio",
				{
					from: alice,
				}
			)
			console.log((await utilityToken.balanceOf(alice)).toNumber())
		})
	})
})
