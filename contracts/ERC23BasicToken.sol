pragma solidity ^0.4.11;

import './SafeMath.sol';


contract ContractReceiver{
    function tokenFallback(address _from, uint256 _value, bytes  _data) external;
}


//Basic ERC23 token, backward compatible with ERC20 transfer function.
//Based in part on code by open-zeppelin: https://github.com/OpenZeppelin/zeppelin-solidity.git
contract ERC23BasicToken {
    using SafeMath for uint256;
    uint256 public totalSupply;
    mapping(address => uint256) balances;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value, bytes data);

    function tokenFallback(address _from, uint256 _value, bytes  _data) external {
        throw;
    }

    function transfer(address _to, uint256 _value, bytes _data) returns (bool success) {

        //Standard ERC23 transfer function

        if(isContract(_to)) {
            transferToContract(_to, _value, _data);
        }
        else {
            transferToAddress(_to, _value, _data);
        }
        return true;
    }

    function transfer(address _to, uint256 _value) {

        //standard function transfer similar to ERC20 transfer with no _data
        //added due to backwards compatibility reasons

        bytes memory empty;
        if(isContract(_to)) {
            transferToContract(_to, _value, empty);
        }
        else {
            transferToAddress(_to, _value, empty);
        }
    }

    function transferToAddress(address _to, uint256 _value, bytes _data) internal {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        Transfer(msg.sender, _to, _value, _data);
    }

    function transferToContract(address _to, uint256 _value, bytes _data) internal {
        balances[msg.sender] = balances[msg.sender].sub( _value);
        balances[_to] = balances[_to].add( _value);
        ContractReceiver receiver = ContractReceiver(_to);
        receiver.tokenFallback(msg.sender, _value, _data);
        Transfer(msg.sender, _to, _value);
        Transfer(msg.sender, _to, _value, _data);
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
    function isContract(address _addr) returns (bool is_contract) {
          uint256 length;
          assembly {
              //retrieve the size of the code on target address, this needs assembly
              length := extcodesize(_addr)
          }
          if(length>0) {
              return true;
          }
          else {
              return false;
          }
    }
}
