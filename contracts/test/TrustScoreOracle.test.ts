import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { TrustScoreOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrustScoreOracle", function () {
  let oracle: TrustScoreOracle;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  const QUERY_FEE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const TrustScoreOracle = await ethers.getContractFactory("TrustScoreOracle");
    oracle = (await upgrades.deployProxy(TrustScoreOracle, [owner.address, QUERY_FEE], {
      initializer: "initialize",
      kind: "uups",
    })) as unknown as TrustScoreOracle;
  });

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await oracle.owner()).to.equal(owner.address);
    });

    it("should set the correct query fee", async function () {
      expect(await oracle.queryFee()).to.equal(QUERY_FEE);
    });
  });

  describe("Score Updates", function () {
    const agentId = ethers.id("agent1");

    it("should allow owner to update score", async function () {
      await oracle.updateScore(agentId, 8500);

      const [score, , exists] = await oracle.getScoreView(agentId);
      expect(score).to.equal(8500);
      expect(exists).to.be.true;
    });

    it("should reject score update from non-owner", async function () {
      await expect(oracle.connect(user).updateScore(agentId, 8500))
        .to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("should reject score above 10000", async function () {
      await expect(oracle.updateScore(agentId, 10001))
        .to.be.revertedWith("Score must be <= 10000");
    });

    it("should emit ScoreUpdated event", async function () {
      await expect(oracle.updateScore(agentId, 8500))
        .to.emit(oracle, "ScoreUpdated")
        .withArgs(agentId, 0, 8500);
    });
  });

  describe("Batch Updates", function () {
    const agentIds = [ethers.id("agent1"), ethers.id("agent2"), ethers.id("agent3")];
    const scores = [8500, 7200, 6000];

    it("should update multiple scores", async function () {
      await oracle.updateScoreBatch(agentIds, scores);

      for (let i = 0; i < agentIds.length; i++) {
        const [score] = await oracle.getScoreView(agentIds[i]);
        expect(score).to.equal(scores[i]);
      }
    });

    it("should reject mismatched array lengths", async function () {
      await expect(oracle.updateScoreBatch(agentIds, [8500, 7200]))
        .to.be.revertedWith("Array length mismatch");
    });
  });

  describe("Paid Queries", function () {
    const agentId = ethers.id("agent1");

    beforeEach(async function () {
      await oracle.updateScore(agentId, 8500);
    });

    it("should return score with correct payment", async function () {
      const tx = await oracle.connect(user).getScore(agentId, { value: QUERY_FEE });
      await tx.wait();

      expect(await oracle.totalQueries()).to.equal(1);
      expect(await oracle.totalRevenue()).to.equal(QUERY_FEE);
    });

    it("should reject insufficient payment", async function () {
      await expect(oracle.connect(user).getScore(agentId, { value: QUERY_FEE - 1n }))
        .to.be.revertedWith("Insufficient fee");
    });

    it("should refund excess payment", async function () {
      const excess = ethers.parseEther("0.002");
      const balanceBefore = await ethers.provider.getBalance(user.address);

      const tx = await oracle.connect(user).getScore(agentId, { value: excess });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user.address);
      const expectedBalance = balanceBefore - QUERY_FEE - gasUsed;

      expect(balanceAfter).to.equal(expectedBalance);
    });

    it("should emit ScoreQueried event", async function () {
      await expect(oracle.connect(user).getScore(agentId, { value: QUERY_FEE }))
        .to.emit(oracle, "ScoreQueried")
        .withArgs(agentId, user.address, 8500);
    });
  });

  describe("Batch Queries", function () {
    const agentIds = [ethers.id("agent1"), ethers.id("agent2")];

    beforeEach(async function () {
      await oracle.updateScoreBatch(agentIds, [8500, 7200]);
    });

    it("should return scores with correct total payment", async function () {
      const totalFee = QUERY_FEE * BigInt(agentIds.length);
      await oracle.connect(user).getScoreBatch(agentIds, { value: totalFee });

      expect(await oracle.totalQueries()).to.equal(agentIds.length);
    });

    it("should reject insufficient batch payment", async function () {
      await expect(oracle.connect(user).getScoreBatch(agentIds, { value: QUERY_FEE }))
        .to.be.revertedWith("Insufficient fee for batch");
    });
  });

  describe("Withdrawals", function () {
    const agentId = ethers.id("agent1");

    beforeEach(async function () {
      await oracle.updateScore(agentId, 8500);
      await oracle.connect(user).getScore(agentId, { value: QUERY_FEE });
    });

    it("should allow owner to withdraw", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await oracle.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.equal(balanceBefore + QUERY_FEE - gasUsed);
    });

    it("should reject withdrawal from non-owner", async function () {
      await expect(oracle.connect(user).withdraw())
        .to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("should emit FundsWithdrawn event", async function () {
      await expect(oracle.withdraw())
        .to.emit(oracle, "FundsWithdrawn")
        .withArgs(owner.address, QUERY_FEE);
    });
  });

  describe("Fee Management", function () {
    it("should allow owner to change fee", async function () {
      const newFee = ethers.parseEther("0.002");
      await oracle.setQueryFee(newFee);
      expect(await oracle.queryFee()).to.equal(newFee);
    });

    it("should emit QueryFeeUpdated event", async function () {
      const newFee = ethers.parseEther("0.002");
      await expect(oracle.setQueryFee(newFee))
        .to.emit(oracle, "QueryFeeUpdated")
        .withArgs(QUERY_FEE, newFee);
    });
  });
});
