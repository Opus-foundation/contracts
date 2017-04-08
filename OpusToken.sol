
pragma solidity ^0.4.11;

import "../zeppelin-solidity/contracts/token/StandardToken.sol";


// Inspired by firstblook.io

contract OpusToken is StandardToken{
    string public constant name = "OpusCrowdSaleToken3";
    string public constant symbol = "OCST3";
    uint public constant decimals = 18;
    //multisig wallet, to which all contributions will be sent
    address public multisig;
    //owner address
    address public foundation;
    //owner candidate in 2-phase ownership transfer
    address public candidate;
    uint public startBlock; //crowdsale start block
    uint public phase1EndBlock; //Day 1 end block
    uint public phase2EndBlock; //Week 1 end block
    uint public phase3EndBlock; //Week 2 end block
    uint public phase4EndBlock; //Week 3 end block
    uint public endBlock; //grace period & whole crowdsale end block

    mapping (address => uint) contributions; //Contributions in Wei

    uint public etherCap = 5 * (10**22); //max amount raised during crowdsale (50000 ether)
    uint public transferLockup = 5760; //transfers are locked for this many blocks after endBlock (assuming 14 second blocks, this is 2 months)
    uint public bountyAllocation = 5 * 10**16; //5% of tokens allocated post-crowdsale for the bounty fund
    uint public foundationAllocation = 40 * 10**16; //40% of token supply allocated post-crowdsale for the foundation allocation
    bool public bountyAllocated = false; //this will change to true when the bounty fund is allocated
    bool public foundationAllocated = false; //this will change to true when the foundation fund is allocated
    uint public presaleTokenSupply = 0; //this will keep track of the token supply created during the crowdsale
    uint public presaleEtherRaised = 0; //this will keep track of the Ether raised during the crowdsale
    bool public halted = false; //the foundation address can set this to true to halt the crowdsale due to emergency
    bool public gracePeriodOn = false; //activated once maximum cap is reached
    event Buy(address indexed sender, uint eth, uint fbt);
    event Withdraw(address indexed sender, address to, uint eth);
    event AllocatefoundationTokens(address indexed sender);
    event AllocateBountyTokens(address indexed sender);

    modifier onlyFoundation() {
        if (msg.sender != foundation) {
          throw;
        }
        _;
    }

    function() payable {
        buy();
    }

    function buy() payable {
        buyRecipient(msg.sender);
    }

    //Allow addresses to buy token for another account
    function buyRecipient(address recipient) payable {
        if(msg.value == 0){
          throw;
        }
        if(block.number<startBlock || block.number>endBlock || halted) throw;
        if(contributions[recipient].add(msg.value)>perAddressCap()) throw;
        if(presaleEtherRaised.add(msg.value)>etherCap && !gracePeriodOn) {
          endBlock = block.number + 11520; //48h grace period begins
          gracePeriodOn = true;
        }


        uint tokens = msg.value.mul(returnRate());//As decimals=18, no need to adjust for unit
        balances[recipient] = balances[recipient].add(tokens);
        totalSupply = totalSupply.add(tokens);
        presaleEtherRaised = presaleEtherRaised.add(msg.value);
        contributions[recipient]=contributions[recipient].add(msg.value);

        if (!multisig.send(msg.value)) throw; //immediately send Ether to multisig address
        Transfer(this, recipient, tokens);
        Buy(recipient, msg.value, tokens);
    }


     //Set up foundation address token balance.
     //allocateBountyTokens() must be called first.
    function allocatefoundationTokens() public onlyFoundation {
        if (block.number <= endBlock) throw;
        if (foundationAllocated) throw;
        if (!bountyAllocated) throw;
        uint foundationFund = presaleTokenSupply * foundationAllocation / (1 ether);
        balances[foundation] = balances[foundation].add(foundationFund);
        totalSupply = totalSupply.add(foundationFund);
        //Fund should only be allocated once
        foundationAllocated = true;
        AllocatefoundationTokens(msg.sender);
    }


    function allocateBountyTokens() public onlyFoundation {
        if (block.number <= endBlock) throw;
        if (bountyAllocated) throw;
        presaleTokenSupply = totalSupply;
        uint bountyFund = presaleTokenSupply* bountyAllocation / (1 ether);
        balances[foundation] = balances[foundation].add(bountyFund);
        totalSupply = totalSupply.add(bountyFund);
        //Fund should only be allocated once
        bountyAllocated = true;
        AllocateBountyTokens(msg.sender);
    }

    //Halt ICO in case of emergency
    function halt() onlyFoundation {
        halted = true;
    }

    function unhalt() onlyFoundation {
        halted = false;
    }

    //Return rate of token against ether
    function returnRate() constant returns(uint) {
        if (gracePeriodOn) return 6000; //default price
        if (block.number>=startBlock && block.number<=phase1EndBlock) return 8888; //Day1
        if (block.number>phase1EndBlock && block.number<=phase2EndBlock) return 8000; //Week1
        if (block.number>phase2EndBlock && block.number<=phase3EndBlock) return 7500; //Week2
        if (block.number>phase3EndBlock && block.number<=phase4EndBlock) return 7000; //Week3
    }

    //per address cap in Wei: 1000 ether + 1% of ether received at the given time
    function perAddressCap() constant public returns(uint) {
        uint baseline = 1000 * (10**18);
        return baseline + presaleEtherRaised/100;
    }

    //Change owner address
    function proposeFoundationTransfer(address newFoundation) onlyFoundation {
        candidate = newFoundation;
    }

    function cancelFoundationTransfer() onlyFoundation {
        candidate = address(0);
    }

    function acceptFoundationTransfer() {
        if(msg.sender!=candidate){
            throw;
        }
        foundation = candidate;
        candidate = address(0);
    }

    //Constructor: set multisig crowdsale recipient wallet address
  	function OpusToken(address _multisig) {
        multisig = _multisig;
        foundation = msg.sender;
  	}

    //Start the ICO
    function start() onlyFoundation {
        if(startBlock != 0){
        //Crowdsale can only start once
          throw;
        }
        startBlock = block.number;
        phase1EndBlock = startBlock + 5760; //Day 1
        phase2EndBlock = startBlock + 40320; //Week 1
        phase3EndBlock = phase2EndBlock + 40320; //Week 2
        phase4EndBlock = phase3EndBlock + 40320; //Week 3
        endBlock = phase4EndBlock;
    }

	  //Allow to change the recipient multisig address in the case of emergency.
  	function setMultisig(address addr) public onlyFoundation {
    		if (addr == address(0)) throw;
    		multisig = addr;
  	}

	  function transfer(address _to, uint _value) onlyPayloadSize(2 * 32) returns (bool success) {
        if (block.number <= endBlock + transferLockup && msg.sender!=foundation) {
            throw;
        }
        return super.transfer(_to, _value);
	  }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        if (block.number <= endBlock + transferLockup && msg.sender!=foundation) {
            throw;
        }
        return super.transferFrom(_from, _to, _value);
    }
}
