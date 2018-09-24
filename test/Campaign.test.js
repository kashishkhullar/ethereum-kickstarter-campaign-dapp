const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts, factory, campaignAddress, campaign;
beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ from: accounts[0], gas: "1000000" });

  await factory.methods.createCampaign("100").send({
    from: accounts[0],
    gas: "1000000"
  });

  [campaignAddress] = await factory.methods.getDeployedCampigns().call();

  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
});

describe("Campaigns", () => {
  it("deploys a factory and campaign", () => {
    assert.ok(campaign.options.address);
    assert.ok(factory.options.address);
  });

  it("marks caller as the campaign manager", async () => {
    let manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });

  it("allow to contribute", async () => {
    await campaign.methods.contribute().send({
      from: accounts[1],
      value: "200"
    });
    let isContributer = await campaign.methods.approvers(accounts[1]).call();

    assert(isContributer);
  });

  it("minimum amount of contribution", async () => {
    try {
      await campaign.methods.contribute().send({
        from: accounts[1],
        value: "0"
      });
    } catch (err) {
      assert(err);
      return;
    }
    assert(false);
  });

  it("Creates request", async () => {
    await campaign.methods.createRequest("description", 1, accounts[2]).send({
      from: accounts[0],
      gas: 1000000
    });

    const request = await campaign.methods.requests(0).call();
    assert.equal("description", request.description);
  });

  it("Only manager Creates request", async () => {
    try {
      await campaign.methods.createRequest("description", 1, accounts[2]).send({
        from: accounts[1],
        gas: 1000000
      });
    } catch (err) {
      assert(err);
      return;
    }
    assert(false);
  });

  it("Contributes, create request,approve request and finalize request", async () => {
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei("10", "ether")
    });
    await campaign.methods
      .createRequest("description", web3.utils.toWei("5", "ether"), accounts[1])
      .send({
        from: accounts[0],
        gas: 1000000
      });
    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: "1000000"
    });
    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "1000000"
    });
    let balance = await web3.eth.getBalance(accounts[0]);
    assert(balance - web3.utils.toWei("10", "ether") > 0);
  });
});
