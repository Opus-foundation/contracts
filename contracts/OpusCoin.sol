pragma solidity ^0.4.2;

import "./ConvertLib.sol";

//TODO: change id mechanism to hash of resourceURL
//TODO: maybe seperate structs into independent contracts
contract OpusCoin{

	mapping (address => uint) balances;
  struct work{
    uint id;
    string name;
    uint price;
    address owner;
    string resourceURL;
  }

	uint[] ids;

  mapping (uint => work) private id2work;
  //TODO: compare gas cost between using a mapping or an array
  mapping (address => uint[]) private workOwnership;

	function getIds() returns (uint[]){
	  return ids;
	}

	function getWork(uint id) returns
	  (
	  uint _id,
	  string name,
	  uint price,
	  address owner
	  ){
	  if(!workExist(id)){
	    throw;
	  }
	  work _work = id2work[id];
	  _id = id;
	  name = _work.name;
	  price = _work.price;
	  owner = _work.owner;
	}

  function workExist(uint id) returns (bool){
    return (id2work[id].id == id);
  }

  function fetchURL(uint id) private returns (string){
    if(!workExist(id)){
      throw;
    }
    work _work = id2work[id];
    return _work.resourceURL;
  }

  function requestURL(uint id) returns (string){
    if(!ownWork(id)){
			return "you do not own it";
		}
		return fetchURL(id);
  }

	function ownWork (uint id) returns (bool){
		if(!workExist(id)){
			return false;
		}
		uint[] works = workOwnership[msg.sender];
    for(uint i=0; i<works.length; i++){
      if (id == works[i]){
        return true;
      }
	}
	return false;
	}

	function getOwnedWorks() returns (uint[]){
		return workOwnership[msg.sender];
	}

  function purchaseWork (uint id) {
    if (!workExist(id)){
			throw;
      //return 1;
    }
		if (ownWork(id)){
			throw;
			//return 2;
		}
    work _work = id2work[id];
    if(sendCoin(_work.owner, _work.price)){
      workOwnership[msg.sender].push(id);
			PurchaseWork(msg.sender, _work.id, _work.owner, _work.price);
    }
  }


	function uploadWork(string _name, uint _price, string _resourceURL) {
	//TODO: add log
		lastId += 1;
		work memory _work = work(lastId, _name, _price, msg.sender, _resourceURL);
		id2work[lastId] = _work;
		workOwnership[msg.sender].push(lastId);
		ids.push(lastId);
	}

	function getLastId() returns (uint) {
		return lastId;
	}

	event Transfer(address indexed _from, address indexed _to, uint256 _value);
	event PurchaseWork(address purchaser, uint _id, address _owner, uint _price);
	function OpusCoin() {
		balances[tx.origin] = 10000;
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

	function checkBalance() returns (uint){
		return getBalance(msg.sender);
	}

	function getAddress() returns (address){
		return msg.sender;
	}
}
