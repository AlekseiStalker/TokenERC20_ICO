pragma solidity ^0.4.18;

import "./MintableToken.sol";

contract MigrationAgent {
    function migrateFrom(address _from, uint256 _value) public;
}

contract GGlobalToken is MintableToken {
    string public constant name = "GGlobal";
    string public constant symbol = "GGT";
    uint8 public constant decimals = 18;

    address bountyWallet = 0xe9457068f9c3efc77730970068b1b85ac5a851dd;

    address public migrationToken = 0x0;
    uint256 public totalMigrated = 0;

    event Migrate(address indexed _from, address indexed _to, uint256 _value);
  
    function setMigrationToken(address _token) external onlyOwner {
        require(mintingFinished); 

        migrationToken = _token;
    }

    function migrate(uint _value) external {
        require(migrationToken != 0x0);
        require(_value > 0); 

        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        totalMigrated = totalMigrated.add(_value);
        MigrationAgent(migrationToken).migrateFrom(msg.sender, _value);
        Migrate(msg.sender, migrationToken, _value); 
    } 

    
     function transferBountyTokens(address[] _recivers, uint[] _amountTokens) public onlyMintAgent returns(bool) {
        require(_recivers.length == _amountTokens.length);
        require(_recivers.length <= 40);
        
        for(uint i = 0; i < _recivers.length; i++) { 
            balances[bountyWallet] = balances[bountyWallet].sub(_amountTokens[i]);
            balances[_recivers[i]] = balances[_recivers[i]].add(_amountTokens[i]);

            Transfer(bountyWallet, _recivers[i], _amountTokens[i]); 
        }
    }
}