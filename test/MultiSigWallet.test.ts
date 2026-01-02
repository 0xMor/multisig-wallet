import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigWallet", function () {
  it("requires confirmations before execution (2-of-3)", async () => {
    const [owner1, owner2, owner3, recipient] = await ethers.getSigners();

    const MultiSig = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSig.deploy(
      [owner1.address, owner2.address, owner3.address],
      2
    );

    // fund wallet with 1 ETH
    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("1"),
    });

    // submit tx: send 0.4 ETH to recipient
    const submitTx = await wallet
      .connect(owner1)
      .submitTransaction(recipient.address, ethers.parseEther("0.4"), "0x");

    const receipt = await submitTx.wait();
    // txId should be 0 (first tx)
    const txId = 0;

    // confirm by owner1
    await wallet.connect(owner1).confirmTransaction(txId);

    // cannot execute yet (only 1 confirmation)
    await expect(wallet.connect(owner1).executeTransaction(txId)).to.be.revertedWith(
      "Not enough confirmations"
    );

    // confirm by owner2
    await wallet.connect(owner2).confirmTransaction(txId);

    // execute
    const recipientBalBefore = await ethers.provider.getBalance(recipient.address);
    const execTx = await wallet.connect(owner1).executeTransaction(txId);
    await execTx.wait();

    const recipientBalAfter = await ethers.provider.getBalance(recipient.address);
    expect(recipientBalAfter - recipientBalBefore).to.equal(ethers.parseEther("0.4"));

    // cannot execute twice
    await expect(wallet.connect(owner1).executeTransaction(txId)).to.be.revertedWith(
      "Tx already executed"
    );
  });

  it("allows revoke confirmation", async () => {
    const [owner1, owner2, owner3, recipient] = await ethers.getSigners();

    const MultiSig = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSig.deploy(
      [owner1.address, owner2.address, owner3.address],
      2
    );

    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("1"),
    });

    await wallet
      .connect(owner1)
      .submitTransaction(recipient.address, ethers.parseEther("0.2"), "0x");

    const txId = 0;

    await wallet.connect(owner1).confirmTransaction(txId);
    await wallet.connect(owner1).revokeConfirmation(txId);

    // owner1 can confirm again after revoke
    await wallet.connect(owner1).confirmTransaction(txId);

    // still need owner2
    await expect(wallet.connect(owner1).executeTransaction(txId)).to.be.revertedWith(
      "Not enough confirmations"
    );
  });

  it("rejects non-owners", async () => {
    const [owner1, owner2, owner3, outsider, recipient] = await ethers.getSigners();

    const MultiSig = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSig.deploy(
      [owner1.address, owner2.address, owner3.address],
      2
    );

    await expect(
      wallet.connect(outsider).submitTransaction(recipient.address, 0, "0x")
    ).to.be.revertedWith("Not owner");
  });
});

