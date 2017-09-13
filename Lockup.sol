import "OpusToken.sol";
import "SafeMath.sol";


contract Lockup {
    using SafeMath for uint256;

    address public foundation;
    address public candidate;
    address public multisig;
    address public tokenAddress = address(0x4355fC160f74328f9b383dF2EC589bB3dFd82Ba0);
    OpusToken public Opus = OpusToken(tokenAddress);
    uint256 public lockupBlocks = 1261000;
    uint256 public endBlock;

    modifier onlyFoundation() {
        if (msg.sender != foundation) {
          throw;
        }
        _;
    }

    function Lockup(address _multisig) {
        multisig = _multisig;
        foundation = msg.sender;
        endBlock = lockupBlocks.add(block.number);
    }

    function tokenFallback(address _from, uint256 _value, bytes  _data) external {
        return;
    }

    function withdraw(uint256 value) onlyFoundation {
        if(block.number < endBlock) {
            throw;
        }
        Opus.transfer(multisig, value);
    }

    function setMultisig(address addr) external onlyFoundation {
      	if (addr == address(0)) throw;
      	multisig = addr;
    }

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

}
