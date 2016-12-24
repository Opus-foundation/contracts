pragma solidity ^0.4.2;


contract OpusCoin {
	mapping (address => uint) balances;

	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	function OpusCoin() {
		balances[msg.sender] = 10000;
	}

	function transfer(address receiver, uint amount) returns(bool success) {
		if (balances[msg.sender] < amount) throw;
		balances[msg.sender] -= amount;
		balances[receiver] += amount;
		Transfer(msg.sender, receiver, amount);
		return true;
	}

	function balanceOf(address addr) returns(uint) {
		return balances[addr];
	}
}
