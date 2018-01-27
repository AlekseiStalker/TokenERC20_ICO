const ether = require("./helpers/ether");
const assertJump = require("./helpers/assertJump");

const GGlobalToken = artifacts.require("./GGlobalToken.sol");
const MigrationToken = artifacts.require("./MigrationToken_test.sol");

contract('GGlobalToken_test', function(accounts) {

    var [owner, owner2, user1, user2] = web3.eth.accounts;

    let token;

    let totalSupplyPrevToken;
    let totalSupplyNewToken;

    const DECIMALS = 10 ** 18;

    describe('Ownable_test', function() {

        it('Should be able to create Token', async() => {
            token = await GGlobalToken.new();

            let tokenName = await token.name();
            let tokenSymbol = await token.symbol();
            let tokenDecimals = await token.decimals();

            assert.equal(String(tokenName), "GGlobal");
            assert.equal(String(tokenSymbol), "GGB");
            assert.equal(tokenDecimals.toNumber(), 18);
        });

        it('OnlyOwner can change owner', async() => {
            try {
                await token.transferOwnership(user1, { from: user2 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should correct change owner', async() => {
            await token.transferOwnership(owner2);
            await token.acceptOwnership({ from: owner2 });

            let contractOwner = await token.owner();
            assert.equal(contractOwner, owner2);
        });

        it('Should throw error when somebody else acceptOwnership', async() => {
            await token.transferOwnership(owner, { from: owner2 });

            try {
                await token.acceptOwnership({ from: user1 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });
    });

    describe('MintableToken_test', function() {
        it('OnlyOwner can change mintAgents', async() => {
            await token.transferOwnership(owner, { from: owner2 });
            await token.acceptOwnership({ from: owner }); //return default owner

            try {
                await token.setMintAgent(user2, true, { from: user1 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Only mintAgents can mint tokens', async() => {
            try {
                await token.mint(user2, 20000000000, { from: user1 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should correctly set mint agent', async() => {
            await token.setMintAgent(owner2, true);
            let isMintAgent = await token.mintAgents(owner2);
            assert.equal(isMintAgent, true);
        });

        it('Only mintAgents can finishMinting', async() => {
            try {
                await token.finishMinting({ from: user1 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Slould throw error if after fnishMinting agent try mint token', async() => {
            await token.finishMinting({ from: owner2 });
            try {
                await token.mint(user1, 20000000, { from: owner2 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });
    });

    describe('MigrationToken_test', function() {

        let migrationToken;

        it('Should be able to create Token for migration', async() => {
            token = await GGlobalToken.new();
            migrationToken = await MigrationToken.new(token.address);
            let prevTokenAddress = await migrationToken.prevToken();
            assert.equal(prevTokenAddress, token.address);
        });

        it('Should throw error if try migrate before migrationToken set', async() => {
            await token.setMintAgent(owner2, true);

            await token.mint(user1, 250 * DECIMALS, { from: owner2 });
            await token.mint(user2, 12 * DECIMALS, { from: owner2 });
            await token.mint(user2, 18 * DECIMALS, { from: owner2 });

            try {
                await token.migrate(200 * DECIMALS, { from: user1 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should throw error if try migrate more tokens than have on balance', async() => {
            await token.finishMinting({ from: owner2 });
            await token.setMigrationToken(migrationToken.address);
            try {
                await token.migrate(300 * DECIMALS, { from: user1 });
            } catch (error) { return true; }
            throw new Error('transaction is not failed');
        });

        it('Should correctly migrate all users on newToken', async() => {
            totalSupplyPrevToken = await token.totalSupply();

            await token.migrate(250 * DECIMALS, { from: user1 });
            await token.migrate(10 * DECIMALS, { from: user2 });
            await token.migrate(20 * DECIMALS, { from: user2 });

            let nBalanceUser1 = await migrationToken.balanceOf(user1);
            let nBalanceUser2 = await migrationToken.balanceOf(user2);

            assert.equal(nBalanceUser1.toNumber(), 250 * DECIMALS);
            assert.equal(nBalanceUser2.toNumber(), 30 * DECIMALS);
        });

        it('Should return correct totalSupply on mew Token', async() => {
            totalSupplyNewToken = await migrationToken.totalSupply();
            assert.equal(totalSupplyPrevToken.toNumber(), totalSupplyNewToken.toNumber());
        });
    });

});