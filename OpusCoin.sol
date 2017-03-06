
pragma solidity ^0.4.11;

import "../zeppelin-solidity/contracts/token/StandardToken.sol";
//import "./ConvertLib.sol";
//import './pay2own.sol';




contract OpusCoin is StandardToken{
  string public constant name = "OpusCrowdSaleToken2";
  string public constant symbol = "OCST2";
  uint public constant decimals = 18;
  address public multisig = "0x41A6b259baac5C2084Bdd623F3Ac03b4cfAC3887";
  uint public constant PRICE = 8888;

/**
 * @dev Fallback function which receives ether and sends the appropriate number of tokens to the
 * msg.sender.
 */
    uint public startBlock; //crowdsale start block (set in constructor)
    uint public phase1EndBlock; //Day 1 end block
    uint public phase2EndBlock; //Week 1 end block
    uint public phase3EndBlock; //Week 2 end block
    uint public phase4EndBlock; //Week 3 end block
    uint public endBlock; //grace period & whole crowdsale end block (set in constructor)

    // Initial founder address (set in constructor)
    // All deposited ETH will be instantly forwarded to this address.
    // Address is a multisig wallet.
    address public founder = multisig;
    mapping (address => uint) contributions;

    uint public perAddressCap = 200 * 10**18;//max amount per address can contribute;
    uint public etherCap = 5 * 10**18; //max amount raised during crowdsale (10M USD worth of ether will be measured with market price at beginning of the crowdsale)
    //uint public transferLockup = 370285; //transfers are locked for this many blocks after endBlock (assuming 14 second blocks, this is 2 months)
    uint public founderLockup = 2252571; //founder allocation cannot be created until this many blocks after endBlock (assuming 14 second blocks, this is 1 year)
    uint public bountyAllocation = 5 * 10**16; //5% of tokens allocated post-crowdsale for the bounty fund
    uint public ecosystemAllocation = 5 * 10**16; //5% of token supply allocated post-crowdsale for the ecosystem fund
    uint public founderAllocation = 40 * 10**16; //40% of token supply allocated post-crowdsale for the founder allocation
    bool public bountyAllocated = false; //this will change to true when the bounty fund is allocated
    bool public ecosystemAllocated = false; //this will change to true when the ecosystem fund is allocated
    bool public founderAllocated = false; //this will change to true when the founder fund is allocated
    uint public presaleTokenSupply = 0; //this will keep track of the token supply created during the crowdsale
    uint public presaleEtherRaised = 0; //this will keep track of the Ether raised during the crowdsale
    bool public halted = false; //the founder address can set this to true to halt the crowdsale due to emergency
    event Buy(address indexed sender, uint eth, uint fbt);
    event Withdraw(address indexed sender, address to, uint eth);
    event AllocateFounderTokens(address indexed sender);
    event AllocateBountyAndEcosystemTokens(address indexed sender);

    function getStartBlock() constant returns(uint){
      return startBlock;
    }

    function getEndBlock() constant returns(uint){
      return endBlock;
    }

    function getCurrentBlock() constant returns(uint){
      return block.number;
    }

 // Buy entry point
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
        if(block.number<startBlock || block.number>endBlock) throw;
        if(presaleEtherRaised.add(msg.value)>etherCap || halted) throw;
        if(contributions[recipient].add(msg.value)>perAddressCap) throw;


        uint tokens = msg.value.mul(returnRate());//As decimals=18, no need to adjust for unit
        balances[recipient] = balances[recipient].add(tokens);
        totalSupply = totalSupply.add(tokens);
        presaleEtherRaised = presaleEtherRaised.add(msg.value);
        contributions[recipient]=contributions[recipient].add(msg.value);

        if (!founder.send(msg.value)) throw; //immediately send Ether to founder address

        Buy(recipient, msg.value, tokens);
    }

    /**
     * Set up founder address token balance.
     *
     * allocateBountyAndEcosystemTokens() must be called first.
     *
     * Security review
     *
     * - Integer math: ok - only called once with fixed parameters
     *
     * Applicable tests:
     *
     * - Test bounty and ecosystem allocation
     * - Test bounty and ecosystem allocation twice
     *
     */
    function allocateFounderTokens() public {
        if (msg.sender!=founder) throw;
        if (block.number <= endBlock + founderLockup) throw;
        if (founderAllocated) throw;
        if (!bountyAllocated || !ecosystemAllocated) throw;
        balances[founder] = balances[founder].add(presaleTokenSupply * founderAllocation / (1 ether));
        totalSupply = totalSupply.add(presaleTokenSupply * founderAllocation / (1 ether));
        //Re-entry lock
        founderAllocated = true;
        AllocateFounderTokens(msg.sender);
    }


    function allocateBountyAndEcosystemTokens() public {
        if (msg.sender!=founder) throw;
        if (block.number <= endBlock) throw;
        if (bountyAllocated || ecosystemAllocated) throw;
        presaleTokenSupply = totalSupply;
        balances[founder] = balances[founder].add(presaleTokenSupply * ecosystemAllocation / (1 ether));
        totalSupply = totalSupply.add(presaleTokenSupply * ecosystemAllocation / (1 ether));
        balances[founder] = balances[founder].add(bountyAllocation);
        totalSupply = totalSupply.add(bountyAllocation* ecosystemAllocation / (1 ether));
        bountyAllocated = true;
        ecosystemAllocated = true;
        AllocateBountyAndEcosystemTokens(msg.sender);
    }

    /**
     * Emergency Stop ICO.
     */
    function halt() {
        if (msg.sender!=founder) throw;
        halted = true;
    }

    function unhalt() {
        if (msg.sender!=founder) throw;
        halted = false;
    }

    function returnRate() constant returns(uint) {
        if (block.number<startBlock || block.number>phase4EndBlock) return 5000; //default price
        if (block.number>=startBlock || block.number<=phase1EndBlock) return 9200; //Day1 price
        if (block.number>phase1EndBlock || block.number<=phase2EndBlock) return 8888; //Week1 price
        if (block.number>phase2EndBlock || block.number<=phase3EndBlock) return 7500; //Week2 price
        if (block.number>phase3EndBlock || block.number<=phase4EndBlock) return 6500; //Week3 price
    }

    /**
     * Change founder address (where ICO ETH is being forwarded).
     *
     * Applicable tests:
     *
     * - Test founder change by hacker
     * - Test founder change
     * - Test founder token allocation twice
     */
    function changeFounder(address newFounder) {
        if (msg.sender!=founder) throw;
        founder = newFounder;
    }

	function OpusCoin(address _founder, uint _startBlock) {
  //Constructor: set founder multisig wallet address and block number for phases
    founder = _founder;
    startBlock = _startBlock;
    phase1EndBlock = startBlock + 5760; //Day 1
    phase2EndBlock = startBlock + 40320; //Week 1
    phase3EndBlock = phase2EndBlock + 40320; //Week 2
    phase4EndBlock = phase3EndBlock + 40320; //Week 3
    endBlock = phase4EndBlock + 5760; //Grace period
	}



	function getBalance(address addr) returns(uint) {
		return balances[addr];
	}

	function checkBalance() returns (uint){
		return getBalance(msg.sender);
	}

	function getAddress() returns (address){
		return msg.sender;
	}
	function transfer(address _to, uint _value) onlyPayloadSize(2 * 32){

			//standard function transfer similar to ERC20 transfer with no _data
			//added due to backwards compatibility reasons

      if(block.number <= endBlock){
      //lock transfer before ICO ends
        throw;
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

	  /**
	  * @dev Gets the balance of the specified address.
	  * @param _owner The address to query the the balance of.
	  * @return An uint representing the amount owned by the passed address.
	  */
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
    //entry point to purchase songs
      if(block.number <= endBlock){
      //lock transfer before ICO ends
        throw;
      }
      if(!isContract(license)){
        throw;
      }
      transferToContract(license, amount, _data);
    }

		function getContractAddress() external constant returns(address) {
			return this;
		}


}
