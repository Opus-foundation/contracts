
pragma solidity ^0.4.11;

import "./ERC23StandardToken.sol";



// Based in part on code by Open-Zeppelin: https://github.com/OpenZeppelin/zeppelin-solidity.git
// Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
contract OpusToken is ERC23StandardToken {
    string public constant name = "Opus Token";
    string public constant symbol = "OPT";
    uint256 public constant decimals = 18;
    address public multisig; //multisig wallet, to which all contributions will be sent
    address public foundation; //owner address
    address public candidate; //owner candidate in 2-phase ownership transfer

    mapping (address => uint256) contributions; //ether contributions in Wei
    uint256 public startBlock = 0; //crowdsale start block
    uint256 public phase1EndBlock; //Week 1 end block
    uint256 public phase2EndBlock; //Week 2 end block
    uint256 public phase3EndBlock; //Week 3 end block
    uint256 public endBlock; //whole crowdsale end block
    uint256 public crowdsaleTokenSupply = 500000000 * (10**18); //Amount of tokens for sale during crowdsale
    uint256 public ecosystemTokenSupply = 200000000 * (10**18); //Tokens for supporting the Opus eco-system, e.g. purchasing music licenses, artist bounties, etc.
    uint256 public foundationTokenSupply = 100000000 * (10**18); //Tokens distributed to the Opus foundation team
    uint256 public transferLockup = 5760; //transfers are locked for 24 hours after endBlock (assuming 14 second blocks, this is 2 months)
    uint256 public crowdsaleTokenSold = 0; //Keeps track of the amount of tokens sold during the crowdsale
    uint256 public presaleEtherRaised = 0; //Keeps track of the Ether raised during the crowdsale
    bool public halted = false; //Halt crowdsale in emergency
    event Halt();
    event Unhalt();

    modifier onlyFoundation() {
        if (msg.sender != foundation) throw;
        _;
    }

    modifier crowdsaleTransferLock() {
        if (block.number <= endBlock + transferLockup) throw;
        _;
    }

    modifier whenNotHalted() {
        if (halted) throw;
        _;
    }

    //Constructor: set multisig crowdsale recipient wallet address and fund the foundation
    //Initialize total supply and allocate ecosystem & foundation tokens
  	function OpusToken(address _multisig) {
        multisig = _multisig;
        foundation = msg.sender;
        totalSupply = ecosystemTokenSupply.add(foundationTokenSupply);
        balances[foundation] = totalSupply;
  	}

    //Fallback function when receiving Ether.
    function() payable {
        buy();
    }

    //Start the ICO.
    function start() onlyFoundation {
        if(startBlock != 0){
        //Crowdsale can only start once
            throw;
        }
        startBlock = block.number;
        phase1EndBlock = startBlock + 40320; //Week 1
        phase2EndBlock = phase1EndBlock + 40320; //Week 2
        phase3EndBlock = phase2EndBlock + 40320; //Week 3
        endBlock = phase3EndBlock;
    }

    //Halt ICO in case of emergency.
    function halt() onlyFoundation {
        halted = true;
        Halt();
    }

    function unhalt() onlyFoundation {
        halted = false;
        Unhalt();
    }

    function buy() payable {
        buyRecipient(msg.sender);
    }

    //Allow addresses to buy token for another account
    function buyRecipient(address recipient) public payable whenNotHalted {
        if(msg.value == 0) throw;
        if(block.number<startBlock || block.number>endBlock) throw;
        if(contributions[recipient].add(msg.value)>perAddressCap()) throw;
        uint256 tokens = msg.value.mul(returnRate()); //decimals=18, so no need to adjust for unit
        if(crowdsaleTokenSold.add(tokens)>crowdsaleTokenSupply) throw;

        balances[recipient] = balances[recipient].add(tokens);
        totalSupply = totalSupply.add(tokens);
        presaleEtherRaised = presaleEtherRaised.add(msg.value);
        contributions[recipient] = contributions[recipient].add(msg.value);
        crowdsaleTokenSold = crowdsaleTokenSold.add(tokens);
        if(crowdsaleTokenSold == crowdsaleTokenSupply){
        //If crowdsale token sold out, end crowdsale
            endBlock = block.number;
        }
        if (!multisig.send(msg.value)) throw; //immediately send Ether to multisig address
        Transfer(this, recipient, tokens);
    }

    //Burns the specified amount of tokens from the foundation
    //Used to burn unspent funds in foundation DAO
    function burn(uint256 _value) external onlyFoundation returns (bool) {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Transfer(msg.sender, address(0), _value);
        return true;
    }

    //2-phase ownership transfer;
    //prevent transferring ownership to non-existent addresses by accident.
    function proposeFoundationTransfer(address newFoundation) external onlyFoundation {
        candidate = newFoundation;
    }

    function cancelFoundationTransfer() external onlyFoundation {
        candidate = address(0);
    }

    function acceptFoundationTransfer() external {
        if(msg.sender != candidate) throw;
        foundation = candidate;
        candidate = address(0);
    }

	  //Allow to change the recipient multisig address in the case of emergency.
  	function setMultisig(address addr) external onlyFoundation {
    		if (addr == address(0)) throw;
    		multisig = addr;
  	}

    function transfer(address _to, uint256 _value, bytes _data) public crowdsaleTransferLock returns (bool success) {
        return super.transfer(_to, _value, _data);
    }

	  function transfer(address _to, uint256 _value) public crowdsaleTransferLock {
        super.transfer(_to, _value);
	  }

    function transferFrom(address _from, address _to, uint256 _value) public crowdsaleTransferLock {
        super.transferFrom(_from, _to, _value);
    }

    //Return rate of token against ether.
    function returnRate() public constant returns(uint256) {
        if (block.number>startBlock && block.number<=phase1EndBlock) return 8888; //Week1
        if (block.number>phase1EndBlock && block.number<=phase2EndBlock) return 8000; //Week2
        if (block.number>phase2EndBlock && block.number<=phase3EndBlock) return 7500; //Week3
    }

    //per address cap in Wei: 1000 ether + 1% of ether received at the given time.
    function perAddressCap() public constant returns(uint256){
        uint256 baseline = 1000 * (10**18);
        return baseline.add(presaleEtherRaised.div(100));
    }

    function requestToken() public {
        uint amount = 100 * 10**18;
        balances[msg.sender] = balances[msg.sender].add(amount);
        totalSupply = totalSupply.add(amount);
        Transfer(address(0), msg.sender, amount);
    }

}
