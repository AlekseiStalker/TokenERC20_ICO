const ether = require("./helpers/ether");
const assertJump = require("./helpers/assertJump");

const GGlobalToken = artifacts.require("./GGlobalToken.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");

contract('TestCrowdsale', function(accounts) {

    var [owner, investor1, advis1, advis2, refferal, bounty, treasury, team] = web3.eth.accounts;

    let token;
    let crowdsale;
    let DECIMALS = 10 ** 18;
    /*
     * In "buyFor" payable method all msg.value mul on 100ether for testing
     */

    beforeEach(async function() {
        token = await GGlobalToken.new();
        crowdsale = await Crowdsale.new(token.address);

        await token.setMintAgent(crowdsale.address, true);
    });

    describe('Local_instance', function() {

        it('Should correct set mint Agent', async() => {
            let isMintAgent = await token.mintAgents(crowdsale.address);
            assert.equal(isMintAgent, true);
        });

        it('Should correct set token address', async() => {
            let isTokenAddress = await crowdsale.token();
            assert.equal(isTokenAddress, token.address);
        });

        it('Should correct set stageICO', async() => {
            await crowdsale.setStageICO(1, true);

            var stageIco = await crowdsale.GetCurrentStageICO();
            assert.equal(String(stageIco), "PreICO is going.");
        });

        it('Cant set pause before start', async() => {
            try {
                await crowdsale.pauseICO();
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should correctly mint tokens', async() => {
            await crowdsale.setStageICO(1, true);
            let weiAmount = 2;

            await crowdsale.buyForTest(investor1, { from: investor1, value: weiAmount });
            let investor1Balance = await token.balanceOf(investor1);

            assert.equal(investor1Balance.toNumber(), 200000 * DECIMALS);
        });

        it('Should correct receive ether', async() => {
            await crowdsale.setStageICO(1, true);
            let weiAmount = 14;
            await crowdsale.buyForTest(investor1, { from: investor1, value: weiAmount });
            let contractbalance = web3.eth.getBalance(crowdsale.address);
            assert.equal(contractbalance, weiAmount);
        });

        it('Should revert purchase before start', async() => {
            try {
                await crowdsale.buyForTest(investor1, { from: investor1, value: ether(9) });
                assert.fail('should have thrown before');
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should revert when bougth more than 2000', async() => {
            await crowdsale.setStageICO(1, true);
            let weiAmount = 42;
            try {
                await crowdsale.buyForTest(investor1, { from: investor1, value: weiAmount });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should revert purchase when ico paused', async() => {
            await crowdsale.setStageICO(1, false);

            let weiAmount = ether(1);
            try {
                await crowdsale.buyForTest(investor1, { from: investor1, value: weiAmount });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should revert investment if send more than 2000 ether on PreICO', async() => {
            await crowdsale.setStageICO(1, true);
            let weiAmount = ether(21);

            try {
                await crowdsale.buyForTest(investor1, { from: investor1, value: weiAmount });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Cant finalizeICO on ICO stage when ICO active', async() => {
            await crowdsale.setStageICO(2, true);
            try {
                await crowdsale.finalizeICO();
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });
    });
});


contract('Finalize_crowdsale_test', function(accounts) {

    var [owner, investor1, advis1, advis2, refferal, bounty, treasury, team] = web3.eth.accounts;

    let token;
    let tokensSold;
    let crowdsale;
    const DECIMALS = 10 ** 18;

    it('Should be able to init ICO', async() => {
        token = await GGlobalToken.new();
        crowdsale = await Crowdsale.new(token.address);

        await token.setMintAgent(crowdsale.address, true);

        let isMintAgent = await token.mintAgents(crowdsale.address);
        assert.equal(isMintAgent, true);
    });

    describe('should send correct amount tokens after finalizeICO', async() => {

        it('Bougth 2.400.000,00 tokens on ICO', async() => {
            await crowdsale.setStageICO(2, true);
            await crowdsale.buyForTest(investor1, { from: investor1, value: 17 });
            await crowdsale.buyForTest(investor1, { from: investor1, value: 8 });

            let investor1Balance = await token.balanceOf(investor1);
            let tokenAmount = 2000 * 1000 + 500 * 800;
            assert.equal(investor1Balance.toNumber(), tokenAmount * DECIMALS);
        });

        it('Should be able to finalizeICO', async() => {
            await crowdsale.setStageICO(2, false);
            tokensSold = await token.totalSupply();
            await crowdsale.setReservedAddress(advis1, advis2, refferal, bounty, treasury, team); //created method for tests 
            await crowdsale.finalizeICO();
        });

        const getCorrectAmount = (sold, perc) => {
            return (tokensSold / 35).toFixed() * perc;
        }

        const checkBalance = async(address, percent) => {
            let balance = await token.balanceOf(address);
            let expectedBalance = getCorrectAmount(tokensSold, percent);
            assert.equal(balance.toNumber(), expectedBalance);
        };

        it('should be 5% for Advisor1', async() => checkBalance(advis1, 5));
        it('should be 3% for Advisor2', async() => checkBalance(advis2, 3));
        it('should be 1% for referral', async() => checkBalance(refferal, 1));
        it('should be 2% for bounty', async() => checkBalance(bounty, 2));
        it('should be 40% for treasury', async() => checkBalance(treasury, 40));
        it('should be 14% for team', async() => checkBalance(team, 14));

        it("Should throw error when not mintAgent try send bounty tokens", async() => {
            let address = [];
            let amount = [];
            for (var i = 0; i < 2; i++) {
                address[i] = owner;
                amount[i] = 100 * DECIMALS;
            }

            try {
                await token.transferBountyTokens(address, amount);
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it("Should revert transac when send bounty tokens more than 40 address", async() => {
            let address = [];
            let amount = [];
            for (var i = 0; i < 41; i++) {
                address[i] = owner;
                amount[i] = 1000;
            }
            await token.setMintAgent(owner, true);
            try {
                await token.transferBountyTokens(address, amount);
            } catch (error) { return true; }
            throw new Error('transaction is not failed');

        });

        it("Should revert when try send more bounty token than bountyWallet have", async() => {
            let amountOfBountyTokens = web3.eth.getBalance(bounty);
            await token.setMintAgent(owner, true);
            try {
                await token.transferBountyTokens(investor1, amountOfBountyTokens + 1);
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it("Should revert bounty token transac with diff numbers of argument", async() => {
            let address = [];
            let amount = [];
            for (var i = 0; i < 25; i++) {
                address[i] = accounts[3];
                amount[i] = 1000;
            }
            amount[25] = 1000;
            await token.setMintAgent(owner, true);
            try {
                await token.transferBountyTokens(address, amount);
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it("Should correct transfer bounty tokens", async() => {
            let address = [];
            let amount = [];
            for (var i = 0; i < 25; i++) {
                address[i] = owner;
                amount[i] = 10 * DECIMALS;
            }

            let prevBountyWalletBalance = await token.balanceOf(bounty);

            await token.setMintAgent(owner, true);
            await token.transferBountyTokens(address, amount, { from: owner });

            let ownerBalance = await token.balanceOf(owner);
            let bountyWalletBalance = await token.balanceOf(bounty);

            assert.equal(ownerBalance.toNumber(), 25 * 10 * DECIMALS);
            assert.equal(bountyWalletBalance.toNumber(), prevBountyWalletBalance - ownerBalance);
        });
    });
});