
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
    uint public endBlock; //crowdsale end block (set in constructor)

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


        uint tokens = msg.value.mul(priceAgainstEther());//As decimals=18, no need to adjust for unit
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

    /**
     * Set up founder address token balance.
     *
     * Set up bounty pool.
     *
     * Security review
     *
     * - Integer math: ok - only called once with fixed parameters
     *
     * Applicable tests:
     *
     * - Test founder token allocation too early
     * - Test founder token allocation on time
     * - Test founder token allocation twice
     *
     */
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
     *
     *  Applicable tests:
     *
     * - Test unhalting, buying, and succeeding
     */
    function halt() {
        if (msg.sender!=founder) throw;
        halted = true;
    }

    function unhalt() {
        if (msg.sender!=founder) throw;
        halted = false;
    }

    function priceAgainstEther() constant returns(uint) {
        if (block.number>=startBlock && block.number<startBlock+20) return 10000; //first 5min
        if (block.number<startBlock || block.number>endBlock) return 5000; //default price
        return 8888; //crowdsale price
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

	function OpusCoin() {
		//balances[tx.origin] = 10000;
    startBlock = block.number;
    endBlock = startBlock + 60;
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

		function getContractAddress() external constant returns(address) {
			return this;
		}


}
