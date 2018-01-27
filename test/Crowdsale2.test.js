 const ether = require("./helpers/ether");
 const assertJump = require("./helpers/assertJump");

 const GGlobalToken = artifacts.require("./GGlobalToken.sol");
 const Crowdsale = artifacts.require("./Crowdsale.sol");

 contract('Crowdsale_test', function(accounts) {

     var [owner, investor1, investor2, investor3, user1, user2, user3] = web3.eth.accounts;

     let token;
     let crowdsale;

     const DECIMALS = 10 ** 18;

     describe('Global_scenario_(TEST PURCHASE LOGIC)', function() {
         /*
          * "buyFor" payable method mul on 100ether all msg.value for testing
          */

         it('Should correctly send tokens of all investmens', async() => {
             token = await GGlobalToken.new();
             crowdsale = await Crowdsale.new(token.address);

             await token.setMintAgent(crowdsale.address, true);
             await crowdsale.setStageICO(2, true);

             await crowdsale.buyFor(investor1, { from: investor1, value: ether(0.02341) });
             //0.02341 * 1000 = 23.41000000..
             let investor1Balance = await token.balanceOf(investor1);

             await crowdsale.buyFor(investor2, { from: investor2, value: ether(23.4) });
             //23.4 * 1000 = 23400.00000000...
             let investor2Balance = await token.balanceOf(investor2);

             await crowdsale.buyFor(investor3, { from: investor3, value: ether(1.2) });
             //1.2 * 1000 = 1200.0000000....
             let investor3Balance = await token.balanceOf(investor3);

             assert.equal(investor1Balance.toNumber(), 23.41 * DECIMALS);
             assert.equal(investor2Balance.toNumber(), 23400 * DECIMALS);
             assert.equal(investor3Balance.toNumber(), 1200 * DECIMALS);
         });

         it('Should return correct increase token price after cap 2000 ether', async() => {
             token = await GGlobalToken.new();
             crowdsale = await Crowdsale.new(token.address);

             await token.setMintAgent(crowdsale.address, true);

             await crowdsale.setStageICO(2, true);
             await crowdsale.buyForTest(investor1, { from: investor1, value: 2 });

             await crowdsale.buyForTest(investor2, { from: investor2, value: 19 });
             await crowdsale.buyForTest(investor2, { from: investor2, value: 6 });
             //1800 * 1000 + 700 * 800 = 1085600
             let investor1Balance = await token.balanceOf(investor1);
             let investor2Balance = await token.balanceOf(investor2);
             assert.equal(investor1Balance.toNumber(), 200000 * DECIMALS);
             assert.equal(investor2Balance.toNumber(), 2360000 * DECIMALS);
         });

         it('Should return correct balance after transfer', async() => {
             await token.transfer(user1, 5500 * DECIMALS, { from: investor1 });

             let balanceInvestor1 = await token.balanceOf(investor1);
             let balanceUser1 = await token.balanceOf(user1);

             assert.equal(balanceInvestor1.toNumber(), (200000 - 5500) * DECIMALS);
             assert.equal(balanceUser1.toNumber(), 5500 * DECIMALS);
         });

         it('verifies that a transfer fires a transfer event', async() => {
             let res = await token.transfer(owner, 100 * DECIMALS, { from: investor1 });
             assert(res.logs.length > 0 && res.logs[0].event == 'Transfer');
         });

         it('Should throw error when attempting transfer more than balance', async() => {
             try {
                 await token.transfer(user2, 5600 * DECIMALS, { from: user1 });
                 assert.fail('should have thrown before');
             } catch (error) { return true; }
             throw new Error('transaction is not failed');
         });

         it('Should throw error when attempting transfer to an invalid address', async() => {
             try {
                 await token.transfer(0x0, 100 * DECIMALS, { from: user1 });
                 assert.fail('should have thrown before');
             } catch (error) { return true; }
             throw new Error('transaction is not failed');
         });

         it('verefies the allowance after an approval (fires an Approval event)', async() => {
             let res = await token.approve(user2, 100 * DECIMALS, { from: user1 });
             let allowance = await token.allowance(user1, user2);
             assert.equal(allowance.toNumber(), 100 * DECIMALS);
             assert(res.logs.length > 0 && res.logs[0].event == 'Approval');
         });

         it('Should return correct balance after transfering from another account (fires Transfer event)', async() => {
             let res = await token.transferFrom(user1, user3, 55 * DECIMALS, { from: user2 });

             let balanceUser1 = await token.balanceOf(user1);
             let balanceUser3 = await token.balanceOf(user3);

             assert.equal(balanceUser1, (5500 - 55) * DECIMALS);
             assert.equal(balanceUser3, 55 * DECIMALS);
             assert(res.logs.length > 0 && res.logs[0].event == 'Transfer');
         });

         it('verefies new allowance after transfering from another account', async() => {
             let allowance = await token.allowance(user1, user2);
             assert.equal(allowance, (100 - 55) * DECIMALS);
         });

         it('Should throw error when attempting to transferFrom more than allowance', async() => {
             try {
                 await token.transferFrom(user1, user3, 55 * DECIMALS, { from: user2 });
                 assert.fail('should have thrown before');
             } catch (error) { return true; }
             throw new Error('transaction is not failed');
         });

         it('Should throw error when attempting transferFrom to an invalid address', async() => {
             try {
                 await token.transferFrom(user1, 0x0, 1 * DECIMALS, { from: user2 });
                 assert.fail('should have thrown before');
             } catch (error) { return true; }
             throw new Error('transaction is not failed');
         });
     });
 });