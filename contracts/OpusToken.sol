
pragma solidity ^0.4.11;

import "./ERC23StandardToken.sol";



// Based in part on code by Open-Zeppelin: https://github.com/OpenZeppelin/zeppelin-solidity.git
// Based in part on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
contract OpusToken is ERC23StandardToken {
    string public constant name = "Opus Token";
    string public constant symbol = "OPT";
    uint256 public constant decimals = 18;
    address public multisig=address(0x1426c1f91b923043F7C5FbabC6e369e7cBaef3f0); //multisig wallet, to which all contributions will be sent
    address public foundation; //owner address
    address public candidate; //owner candidate in 2-phase ownership transfer

    mapping (address => uint256) contributions; //keeps track of ether contributions in Wei of each contributor address
    uint256 public startBlock = 4023333; //pre-crowdsale start block (30min ealier than estimate) 
    uint256 public preEndBlock = 4057233; //pre-crowdsale end block(1h after estimated time)
    uint256 public phase1StartBlock = 4066633; //Crowdsale start block (1h earlier)
    uint256 public phase1EndBlock = 4100233; //Week 1 end block (estimate)
    uint256 public phase2EndBlock = 4133833; //Week 2 end block (estimate)
    uint256 public phase3EndBlock = 4201433; //Week 4 end block (2h later)
    uint256 public endBlock = 4201433; //whole crowdsale end block
    uint256 public crowdsaleTokenSupply = 900000000 * (10**18); //Amount of tokens for sale during crowdsale
    uint256 public ecosystemTokenSupply = 100000000 * (10**18); //Tokens for supporting the Opus eco-system, e.g. purchasing music licenses, artist bounties, etc.
    uint256 public foundationTokenSupply = 600000000 * (10**18); //Tokens distributed to the Opus foundation, developers and angel investors
    uint256 public crowdsaleTokenSold = 0; //Keeps track of the amount of tokens sold during the crowdsale
    uint256 public presaleEtherRaised = 0; //Keeps track of the Ether raised during the crowdsale
    uint256 public transferLockup = 9600;
    bool public halted = false; //Halt crowdsale in emergency
    event Halt(); //Halt event
    event Unhalt(); //Unhalt event

    modifier onlyFoundation() {
        //only do if call is from owner modifier
        if (msg.sender != foundation) throw;
        _;
    }

    modifier crowdsaleTransferLock() {
        // lockup during and after 48h of end of crowdsale
        if (block.number <= endBlock.add(transferLockup)) throw;
        _;
    }

    modifier whenNotHalted() {
        // only do when not halted modifier
        if (halted) throw;
        _;
    }

    //Constructor: set multisig crowdsale recipient wallet address and fund the foundation
    //Initialize total supply and allocate ecosystem & foundation tokens
  	function OpusToken() {
        foundation = msg.sender;
        totalSupply = ecosystemTokenSupply.add(foundationTokenSupply);
        balances[foundation] = totalSupply;
  	}

    //Fallback function when receiving Ether.
    function() payable {
        buy();
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
        if(!(preCrowdsaleOn()||crowdsaleOn())) throw;//only allows during presale/crowdsale
        if(contributions[recipient].add(msg.value)>perAddressCap()) throw;//per address cap
        uint256 tokens = msg.value.mul(returnRate()); //decimals=18, so no need to adjust for unit
        if(crowdsaleTokenSold.add(tokens)>crowdsaleTokenSupply) throw;//max supply limit

        balances[recipient] = balances[recipient].add(tokens);
        totalSupply = totalSupply.add(tokens);
        presaleEtherRaised = presaleEtherRaised.add(msg.value);
        contributions[recipient] = contributions[recipient].add(msg.value);
        crowdsaleTokenSold = crowdsaleTokenSold.add(tokens);
        if(crowdsaleTokenSold == crowdsaleTokenSupply){
        //If crowdsale token sold out, end crowdsale
            if(block.number < preEndBlock) {
                preEndBlock = block.number;
            }
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
        //propose new owner
        candidate = newFoundation;
    }

    function cancelFoundationTransfer() external onlyFoundation {
        candidate = address(0);
    }

    function acceptFoundationTransfer() external {
        //new owner accept transfer to complete transfer
        if(msg.sender != candidate) throw;
        foundation = candidate;
        candidate = address(0);
    }

    //Allow to change the recipient multisig address
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
        if (block.number>=startBlock && block.number<=preEndBlock) return 8888; //Pre-crowdsale
        if (block.number>=phase1StartBlock && block.number<=phase1EndBlock) return 8000; //Crowdsale phase1
        if (block.number>phase1EndBlock && block.number<=phase2EndBlock) return 7500; //Phase2
        if (block.number>phase2EndBlock && block.number<=phase3EndBlock) return 7000; //Phase3
    }

    //per address cap in Wei: 1000 ether + 1% of ether received at the given time.
    function perAddressCap() public constant returns(uint256) {
        uint256 baseline = 1000 * (10**18);
        return baseline.add(presaleEtherRaised.div(100));
    }

    function preCrowdsaleOn() public constant returns (bool) {
        //return whether presale is on according to block number
        return (block.number>=startBlock && block.number<=preEndBlock);
    }

    function crowdsaleOn() public constant returns (bool) {
        //return whether crowdsale is on according to block number
        return (block.number>=phase1StartBlock && block.number<=endBlock);
    }


    function getEtherRaised() external constant returns (uint256) {
        //getter function for etherRaised
        return presaleEtherRaised;
    }

    function getTokenSold() external constant returns (uint256) {
        //getter function for crowdsaleTokenSold
        return crowdsaleTokenSold;
    }

}
