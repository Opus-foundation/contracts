
pragma solidity ^0.4.8;

import "./contracts/token/StandardToken.sol";
import "./ConvertLib.sol";

contract OpusCoin is StandardToken{


	function OpusCoin() {
		balances[msg.sender] = 10000;
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
	 

	  function transferToContract(address _to, uint _value, bytes _data) private returns(bool success){
	    balances[msg.sender] = balances[msg.sender].sub( _value);
	    balances[_to] = balances[_to].add( _value);
	    Work reciever = Work(_to);
	    reciever.tokenFallback(msg.sender, _value, _data);
	    Transfer(msg.sender, _to, _value);
	    //Transfer(msg.sender, _to, _value, _data);
	    return true;
	  }


}
