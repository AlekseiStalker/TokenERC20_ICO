pragma solidity ^0.4.18;


library SafeMath {
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if(a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract ERC179 {
    uint256 public totalSupply;

    function balanceOf(address who) public view returns(uint256);
    function transfer(address to, uint256 value) public returns (bool); 

    event Transfer(address indexed from, address indexed to, uint256 value); 
}


contract StandardToken is ERC179 {
    using SafeMath for uint256;

    mapping(address => uint256) balances; 

    modifier onlyPayloadSize(uint size) { 
        require(msg.data.length >= size + 4);
        _;
    } 

    function transfer(address _to, uint256 _value) onlyPayloadSize(2*32) public returns (bool) { 
        require(_to != address(0)); 

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value); 
        Transfer(msg.sender, _to, _value); 
        return true;
    }   

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }  
} 

contract MigrationToken_test is StandardToken {
    string public constant name = "newGGlobal";
    string public constant symbol = "nGGB";
    uint8 public constant decimals = 18;
    
    address public prevToken = 0x0;

    function MigrationToken_test(address _tokenAddress) public {
        prevToken = _tokenAddress;
    }

     function migrateFrom(address _who, uint256 _amount) public {
         require(msg.sender == prevToken);
         balances[_who] = balances[_who].add(_amount);
         totalSupply = totalSupply.add(_amount);
     }
}