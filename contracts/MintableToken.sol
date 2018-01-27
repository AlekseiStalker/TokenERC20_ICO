pragma solidity ^0.4.18;

import "./StandardToken.sol";
import "./Ownable.sol";

contract MintableToken is StandardToken, Ownable {

    using SafeMath for uint;

    bool public mintingFinished = false;

    mapping (address => bool) public mintAgents;

    event MintingAgentChanged(address addr, bool state);
    event Mint(address indexed to, uint256 amount);
    event MintFinished();

    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    modifier onlyMintAgent() {
        require(mintAgents[msg.sender]);
        _;
    }

    function setMintAgent(address _address, bool _state) public onlyOwner {
        mintAgents[_address] = _state;
        MintingAgentChanged(_address, _state);
    }

    function mint(address _to, uint _amount) public onlyMintAgent canMint returns(bool) {
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        Mint(_to, _amount);
        Transfer(address(0), _to, _amount);
        return true;
    }

    function finishMinting() public onlyMintAgent canMint returns(bool) {
        mintingFinished = true;
        MintFinished();
        return true;
    }
}