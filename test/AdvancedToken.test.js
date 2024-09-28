const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AdvancedToken", function () {
  let AdvancedToken, advancedToken, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    AdvancedToken = await ethers.getContractFactory("AdvancedToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    advancedToken = await AdvancedToken.deploy("AdvancedToken", "ADV");
    await advancedToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await advancedToken.hasRole(await advancedToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await advancedToken.balanceOf(owner.address);
      expect(await advancedToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await advancedToken.transfer(addr1.address, 50);
      const addr1Balance = await advancedToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(49); // 50 - 1% fee

      await advancedToken.connect(addr1).transfer(addr2.address, 49);
      const addr2Balance = await advancedToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(48); // 49 - 1% fee
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await advancedToken.balanceOf(owner.address);
      await expect(
        advancedToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      expect(await advancedToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow minting up to max supply", async function () {
      const mintAmount = ethers.utils.parseEther("900000"); // 900,000 tokens
      await advancedToken.mint(addr1.address, mintAmount);
      expect(await advancedToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should fail when trying to mint more than max supply", async function () {
      const mintAmount = ethers.utils.parseEther("900001"); // 900,001 tokens
      await expect(advancedToken.mint(addr1.address, mintAmount)).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause", async function () {
      await advancedToken.pause();
      await expect(advancedToken.transfer(addr1.address, 50)).to.be.revertedWith("Pausable: paused");
      await advancedToken.unpause();
      await expect(advancedToken.transfer(addr1.address, 50)).to.not.be.reverted;
    });
  });

  describe("Blacklist", function () {
    it("Should blacklist and unblacklist addresses", async function () {
      await advancedToken.blacklist(addr1.address);
      await expect(advancedToken.transfer(addr1.address, 50)).to.be.revertedWith("Blacklisted address");
      await advancedToken.unBlacklist(addr1.address);
      await expect(advancedToken.transfer(addr1.address, 50)).to.not.be.reverted;
    });
  });
});