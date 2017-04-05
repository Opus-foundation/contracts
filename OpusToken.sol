
pragma solidity ^0.4.11;

import "../zeppelin-solidity/contracts/token/StandardToken.sol";



/* Inspired by firstblook.io */

contract OpusToken is StandardToken{
  string public constant name = "OpusCrowdSaleToken3";
  string public constant symbol = "OCST3";
  uint public constant decimals = 18;
  /* multisig wallet, to which all contributions will be sent*/
  address public multisig;
  /*owner address*/
  address public foundation;


    uint public startBlock; //crowdsale start block
    uint public phase1EndBlock; //Day 1 end block
    uint public phase2EndBlock; //Week 1 end block
    uint public phase3EndBlock; //Week 2 end block
    uint public phase4EndBlock; //Week 3 end block
    uint public endBlock; //grace period & whole crowdsale end block


    mapping (address => uint) contributions;

    uint public etherCap = 5 * (10**22); //max amount raised during crowdsale (50000 ether)
    uint public transferLockup = 5760; //transfers are locked for this many blocks after endBlock (assuming 14 second blocks, this is 2 months)
    uint public bountyAllocation = 5 * 10**16; //5% of tokens allocated post-crowdsale for the bounty fund
    uint public ecosystemAllocation = 5 * 10**16; //5% of token supply allocated post-crowdsale for the ecosystem fund
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

    function getStartBlock() constant returns(uint){
      return startBlock;
    }

    function getEndBlock() constant returns(uint){
      return endBlock;
    }

    function getCurrentBlock() constant returns(uint){
      return block.number;
    }


    function () payable {
      buy();
    }

    function buy() payable {
        buyRecipient(msg.sender);
    }

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

        Buy(recipient, msg.value, tokens);
    }


    function allocatefoundationTokens() public {
        if (msg.sender!=foundation) throw;
        if (block.number <= endBlock) throw;
        if (foundationAllocated) throw;
        if (!bountyAllocated) throw;
        uint foundationFund = presaleTokenSupply * foundationAllocation / (1 ether);
        balances[foundation] = balances[foundation].add(foundationFund);
        totalSupply = totalSupply.add(foundationFund);
        /*Re-entry prevention*/
        foundationAllocated = true;
        AllocatefoundationTokens(msg.sender);
    }


    function allocateBountyTokens() public {
        if (msg.sender!=foundation) throw;
        if (block.number <= endBlock) throw;
        if (bountyAllocated) throw;
        presaleTokenSupply = totalSupply;
        uint bountyFund = presaleTokenSupply* bountyAllocation / (1 ether);
        balances[foundation] = balances[foundation].add(bountyFund);
        totalSupply = totalSupply.add(bountyFund);
        /*Re-entry prevention*/
        bountyAllocated = true;
        AllocateBountyTokens(msg.sender);
    }

    /**
     * Emergency Stop ICO.
     */
    function halt() {
        if (msg.sender!=foundation) throw;
        halted = true;
    }

    function unhalt() {
        if (msg.sender!=foundation) throw;
        halted = false;
    }

    function returnRate() constant returns(uint) {
        if (gracePeriodOn) return 6000; //default price
        if (block.number>=startBlock || block.number<=phase1EndBlock) return 8888; //Day1 price
        if (block.number>phase1EndBlock || block.number<=phase2EndBlock) return 8000; //Week1 price
        if (block.number>phase2EndBlock || block.number<=phase3EndBlock) return 7500; //Week2 price
        if (block.number>phase3EndBlock || block.number<=phase4EndBlock) return 7000; //Week3 price
    }

    function perAddressCap() constant public returns(uint){
      //per address cap in Wei
        uint baseline = 1000 * (10**18);
        return baseline + presaleEtherRaised/100;
      }

    /**
     * Change foundation address (where ICO ETH is being forwarded).
     *
     * Applicable tests:
     *
     * - Test foundation change by hacker
     * - Test foundation change
     * - Test foundation token allocation twice
     */
    function changefoundation(address newfoundation) {
        if (msg.sender!=foundation) throw;
        foundation = newfoundation;
    }

	function OpusToken(address _multisig) {
  //Constructor: set foundation multisig wallet address and block number for phases
    multisig = _multisig;
    foundation = msg.sender;
	}

  function start() {
    if(msg.sender != foundation){
    /*only foundation*/
      throw;
    }
    if(startBlock != 0){
    /*prevent changing start block after start*/
      throw;
    }
    startBlock = block.number;
    phase1EndBlock = startBlock + 5760; //Day 1
    phase2EndBlock = startBlock + 40320; //Week 1
    phase3EndBlock = phase2EndBlock + 40320; //Week 2
    phase4EndBlock = phase3EndBlock + 40320; //Week 3
    endBlock = phase4EndBlock;
  }
  /**
	 * Allow to change the team multisig address in the case of emergency.
	 */
	function setMultisig(address addr) public {
    if (msg.sender!=foundation) throw;
		if (addr == address(0)) throw;
		multisig = addr;
	}



	function getBalance(address addr) returns(uint) {
		return balances[addr];
	}

	function transfer(address _to, uint _value) onlyPayloadSize(2 * 32){

			//standard function transfer similar to ERC20 transfer with no _data
			//added due to backwards compatibility reasons

      if(block.number <= endBlock + transferLockup){
      /*lock transfer during ICO and hours after it ends*/
        //throw;
      }
			if(blackList[_to]){
				throw;
			}

			bytes memory empty;
			if(isContract(_to)) {
					transferToContract(_to, _value, empty);
			}
			else {
					transferToAddress(_to, _value, empty);
			}
		}




		function transferToAddress(address _to, uint _value, bytes _data) private {
	    balances[msg.sender] = balances[msg.sender].sub(_value);
	    balances[_to] = balances[_to].add(_value);
	    Transfer(msg.sender, _to, _value);
	  }


	  function balanceOf(address _owner) constant returns (uint balance) {
	    return balances[_owner];
	  }

	  function transferToContract(address _to, uint _value, bytes _data) private returns(bool success){
	    balances[msg.sender] = balances[msg.sender].sub( _value);
	    balances[_to] = balances[_to].add( _value);
	    ContractReceiver reciever = ContractReceiver(_to);
	    reciever.tokenFallback(msg.sender, _value, _data);
	    Transfer(msg.sender, _to, _value);
	    //Transfer(msg.sender, _to, _value, _data);
	    return true;
	  }

    function purchaseLicense (address license, uint amount, bytes _data) external {
    /*entry point to purchase songs*/
      if(block.number <= endBlock + transferLockup){
      /*lock transfer during ICO and 24h after it ends*/
        //throw;
      }
      if(!isContract(license)){
        throw;
      }
      if(blackList[license]){
				throw;
			}
      transferToContract(license, amount, _data);
    }

		function getContractAddress() external constant returns(address) {
			return this;
		}


}
