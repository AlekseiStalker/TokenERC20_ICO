pragma solidity ^0.4.18;

import './SafeMath.sol';
import "./Ownable.sol";
import './GGlobalToken.sol';
  
contract IToken {
    uint256 public totalSupply;
    function mint(address _to, uint _amount) public returns(bool);
    function balanceOf(address _who) public view returns (uint256);
    function finishMinting() public returns(bool);
}

contract Crowdsale is Ownable {
     using SafeMath for uint256;
    
     address public token = 0x0;
  
     address advisors1 = 0x0;
     address advisors2 = 0x0;
     address referral = 0x0;
     address bounty = 0x0;
     address treasury = 0x0;
     address team = 0x0; 

     uint curWeiRaised = 0;  
 
     uint[6] weiRaised;
     uint[6] tokenPerEth;  
     uint indxCurCoeffic = 0;

     enum IcoState { Paused, PreICO, ICO }
     IcoState public icoState = IcoState.Paused;
 
     event StageIcoChanged(bool active); 
     event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
     event ReservedAddresses(address advisors1, address advisors2, address referral, address bounty, address treasury, address team);

     function Crowdsale(address _tokenAddress) public {
         require(_tokenAddress != address(0));
         token = _tokenAddress;  

         initializeTokenPriceRanges();
         ReservedAddresses(advisors1, advisors2, referral, bounty, treasury, team);
     }

     function initializeTokenPriceRanges() private {
         tokenPerEth[0] = 1000;
         tokenPerEth[1] = 800;
         tokenPerEth[2] = 700;
         tokenPerEth[3] = 600; 
         tokenPerEth[4] = 550; 
         tokenPerEth[5] = 500; 

         weiRaised[0] = 2000 ether;
         weiRaised[1] = 3999 ether;
         weiRaised[2] = 5999 ether;
         weiRaised[3] = 7999 ether;
         weiRaised[4] = 9999 ether; 
          weiRaised[5] = 11999 ether; 
     }  

     function setStageICO(uint stage, bool activeICO) external onlyOwner {
         if(activeICO) {
             if (stage == uint(IcoState.PreICO)) { 
                 icoState = IcoState.PreICO; 
             } else if (stage == uint(IcoState.ICO)) {
                 icoState = IcoState.ICO;  
             }
         } else {
             uint contractBalance = this.balance;  

             advisors1.transfer(contractBalance / 100 * 99);
             advisors2.transfer(contractBalance / 100); 

             icoState = IcoState.Paused;  
         }
          
         StageIcoChanged(activeICO);
     } 

     function pauseICO() external onlyOwner {
         require(icoState == IcoState.PreICO || icoState == IcoState.ICO);
         icoState = IcoState.Paused;
         StageIcoChanged(false);
     }

     function () external payable {
         buyFor(msg.sender);
     }

     function buyFor(address _buyer) public payable {
         require(icoState != IcoState.Paused);
 
         uint weiAmount = msg.value; 

         require(weiAmount <= 2000 ether);
          
         if(icoState == IcoState.PreICO) {
             require(weiAmount >= 20 ether);
             require(curWeiRaised + weiAmount <= 2000 ether);
         }
         
         uint tokenAmount = getAmountTokens(weiAmount);
         
         curWeiRaised += weiAmount;

         assert(IToken(token).mint(_buyer, tokenAmount)); 
         TokenPurchase(msg.sender, _buyer, weiAmount, tokenAmount);
     } 
  
     function getAmountTokens(uint _eth) private returns(uint amount) { 
         if (curWeiRaised + _eth >= weiRaised[indxCurCoeffic]) {
            
            amount += tokenPerEth[indxCurCoeffic] * (weiRaised[indxCurCoeffic] - curWeiRaised);
             
            if (indxCurCoeffic == 5 && tokenPerEth[indxCurCoeffic] >= 25) {
                tokenPerEth[indxCurCoeffic] -= 25;
                amount += tokenPerEth[indxCurCoeffic] * (curWeiRaised + _eth - weiRaised[indxCurCoeffic]); 
                weiRaised[indxCurCoeffic] += 2000 ether; 
            } else {
                ++indxCurCoeffic; 
                amount += tokenPerEth[indxCurCoeffic] * (curWeiRaised + _eth - weiRaised[indxCurCoeffic - 1]); 
            }  
            return amount;
         } 
         
         amount = tokenPerEth[indxCurCoeffic] * _eth;
         return amount;
     }  
      
     function finalizeICO() external onlyOwner { 
         require(icoState == IcoState.Paused);
         uint totalTokensCreated = IToken(token).totalSupply(); 
         uint onePersent = totalTokensCreated / 35; 
         
         assert(IToken(token).mint(team, onePersent * 14));
         assert(IToken(token).mint(advisors1, onePersent * 5));
         assert(IToken(token).mint(advisors2, onePersent * 3));
         assert(IToken(token).mint(bounty, onePersent * 2));
         assert(IToken(token).mint(referral, onePersent * 1));          
         assert(IToken(token).mint(treasury, onePersent * 40)); 

         assert(IToken(token).finishMinting());
     } 

     function GetAmountTokensPerETH(uint _ether) public view returns(uint) {
         return tokenPerEth[indxCurCoeffic] * _ether;
     }

     function GetCurrentStageICO() public view returns(string) {
         if(icoState == IcoState.ICO) {
             return "ICO is going.";
         } 
         else if(icoState == IcoState.PreICO) {
             return "PreICO is going.";
         } else {
             return "ICO is paused.";
         }
     } 

      function setReservedAddress(address adv1, address adv2, address ref, address _bounty, address _treasury, address _team) public {
        advisors1 = adv1;
        advisors2 = adv2;
        referral = ref;
        bounty = _bounty;
        treasury = _treasury;
        team = _team;
     }

     function buyForTest(address _buyer) public payable {
         require(icoState != IcoState.Paused);
 
         uint weiAmount = msg.value * 100 ether;

         require(weiAmount <= 2000 ether);
          
         if(icoState == IcoState.PreICO) {
             require(weiAmount >= 20 ether);
             require(curWeiRaised + weiAmount <= 2000 ether);
         }
         
         uint tokenAmount = getAmountTokens(weiAmount);
         
         curWeiRaised += weiAmount;

         IToken(token).mint(_buyer, tokenAmount); 
         TokenPurchase(msg.sender, _buyer, weiAmount, tokenAmount);
     } 
}