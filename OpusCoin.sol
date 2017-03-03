
pragma solidity ^0.4.8;

import "../zeppelin-solidity/contracts/token/StandardToken.sol";
import "./ConvertLib.sol";
import './pay2own.sol';



contract OpusCoin is StandardToken{
string public constant name = "OpusCrowdSaleToken1";
string public constant symbol = "OCST1";
uint public constant decimals = 1;
address public constant multisig = "0x41A6b259baac5C2084Bdd623F3Ac03b4cfAC3887";
function () payable {
	createTokens(msg.sender);
}

function createTokens(address recipient) payable {
	if (msg.value == 0) {
		throw;
	}

	uint tokens = msg.value.mul(getPrice()).div(10**18);
	totalSupply = totalSupply.add(tokens);

	balances[recipient] = balances[recipient].add(tokens);

	if (!multisig.send(msg.value)) {
		throw;
	}
}

/**
 * @dev replace this with any other price function
 * @return The price per unit of token.
 */
function getPrice() constant returns (uint result) {
	return PRICE;
}

	function OpusCoin() {
		//balances[tx.origin] = 10000;
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
	    Work reciever = Work(_to);
	    reciever.tokenFallback(msg.sender, _value, _data);
	    Transfer(msg.sender, _to, _value);
	    //Transfer(msg.sender, _to, _value, _data);
	    return true;
	  }

		function getContractAddress() external constant returns(address) {
			return this;
		}


}
