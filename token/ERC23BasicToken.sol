pragma solidity ^0.4.8;


import './ERC20Basic.sol';
import '../SafeMath.sol';
import '../ownership/Ownable.sol';


contract ContractReceiver{
  function tokenFallback(address _from, uint _value, bytes  _data) external;
}

//Basic ERC23 token, backward compatible with ERC20 standards.
//The ERC23 transfer function with signature:
//function transfer(address _to, uint256 _value, bytes _data) is not implemented,
//as we consider it unnecessary to pass data in transfer, and also to prevent short address attacks.
contract ERC23BasicToken is ERC20Basic {
    using SafeMath for uint;
    mapping(address => bool) public blackList;
    mapping(address => uint) balances;
    event Transfer(address indexed from, address indexed to, uint value);
    event Transfer(address indexed from, address indexed to, uint value, bytes data);

    //Short address attack prevention
    modifier onlyPayloadSize(uint size) {
        if(msg.data.length != size + 4) {
            throw;
        }
        _;
    }

    function tokenFallback(address _from, uint _value, bytes  _data) external {
        throw;
    }

    function transfer(address _to, uint _value) onlyPayloadSize(2 * 32) returns (bool success) {

        //standard function transfer similar to ERC20 transfer with no _data
        //added due to backwards compatibility reasons

        bytes memory empty;
        if(isContract(_to)) {
            transferToContract(_to, _value, empty);
        }
        else {
            transferToAddress(_to, _value, empty);
        }
        return true;
    }

    function transferToAddress(address _to, uint _value, bytes _data) internal {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        Transfer(msg.sender, _to, _value, _data);
    }

    function transferToContract(address _to, uint _value, bytes _data) internal {
        balances[msg.sender] = balances[msg.sender].sub( _value);
        balances[_to] = balances[_to].add( _value);
        ContractReceiver receiver = ContractReceiver(_to);
        receiver.tokenFallback(msg.sender, _value, _data);
        Transfer(msg.sender, _to, _value);
        Transfer(msg.sender, _to, _value, _data);
    }

    function balanceOf(address _owner) constant returns (uint balance) {
        return balances[_owner];
    }

    //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
    function isContract(address _addr) returns (bool is_contract) {
          uint length;
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
