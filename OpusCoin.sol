
pragma solidity ^0.4.8;

import "./contracts/token/StandardToken.sol";
import "./ConvertLib.sol";

contract OpusCoin is StandardToken{
//TODO: change id mechanism to hash of resourceURL
//TODO: maybe seperate structs into independent contracts
	uint private lastId = 0;
	//mapping (address => uint) balances;
  struct work{
    uint id;
    string name;
    uint price;
    address owner;
    string resourceURL;
		string artist;
  }

	uint[] ids;

  mapping (uint => work) private id2work;
  //TODO: compare gas cost between using a mapping or an array
  mapping (address => uint[]) private workOwnership;

	function getIds() returns (uint[]){
		return ids;
	}

	function getWork(uint id) constant returns
		(
		uint _id,
		string name,
		string artist,
		uint price
		//address owner
		){
		if(!workExist(id)){
			throw;
		}
		work _work = id2work[id];
		_id = id;
		name = _work.name;
		price = _work.price;
		//owner = _work.owner;
		artist = _work.artist;
	}

  function workExist(uint id) constant returns (bool){
    //assuming id of an empty work is default 0
    return (id2work[id].id == id);
  }

  function fetchURL(uint id) private constant returns (string){
    if(!workExist(id)){
      throw;
    }
    work _work = id2work[id];
    return _work.resourceURL;
  }

  function requestURL(uint id) constant returns (string){
		//TODO: add log
		//TODO: optimize checking cost; consider using mapping
		//TODO: optimize for work owner
		//Debug: when user does not own song
    if(!ownWork(id)){
			throw;
			//return "you do not own it";
		}
		return fetchURL(id);
  }


	function ownWork (uint id) constant returns (bool){
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

	function getOwnedWorks() constant returns (uint[]){
		return workOwnership[msg.sender];
	}

  function purchaseWork (address placeholder, uint id) {
	//redundant parameter to prevent short address attack
    if (!workExist(id)){
			throw;
      //return 1;
    }
		if (ownWork(id)){
			throw;
			//return 2;
		}
    work _work = id2work[id];
    workOwnership[msg.sender].push(id);
		transfer(_work.owner, _work.price);
		//PurchaseWork(msg.sender, _work.id, _work.owner, _work.price);
  }


	function uploadWork(string _name, uint _price, string _resourceURL, string _artist) {
	//TODO: add log
		lastId += 1;
		work memory _work = work(lastId, _name, _price, msg.sender, _resourceURL, _artist);
		id2work[lastId] = _work;
		workOwnership[msg.sender].push(lastId);
		ids.push(lastId);
	}

	function getLastId() returns (uint) {
		return lastId;
	}


  //mapping private (address => uint) workOwnership;
  //mapping private (uint => string) id2url;
	//event Transfer(address indexed _from, address indexed _to, uint256 _value);
	event PurchaseWork(address purchaser, uint _id, address _owner, uint _price);
	function OpusCoin() {
		balances[msg.sender] = 10000;
	}

	function getBalanceInEth(address addr) returns(uint){
		return ConvertLib.convert(getBalance(addr),2);
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
