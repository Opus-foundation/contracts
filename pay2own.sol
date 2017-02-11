import './contracts/SafeMath.sol';
import './SongList.sol';
import './OpusCoin.sol';

contract Work {
    using SafeMath for uint;
    address owner;
    address private songListAddress;
    SongList songList;
    address private tokenAddress;
    OpusCoin token;    string public title;
    string public artist;
    string public metadataUrl;
    string public imageUrl;
    string private audioUrl;
    uint public price;
    mapping (address => bool) private ownership;

    function Work(
        address _token,
        address _songList,
        string _title,
        string _artist,
        string _audioUrl,
        uint _price
        ) {
        owner = msg.sender;
        tokenAddress = _token;
        token = OpusCoin(_token);
        songListAddress = _songList;
        songList = SongList(_songList);
        title = _title;
        artist = _artist;
        audioUrl = _audioUrl;
        price = _price;

        //songList.addSong();
    }

    function addSong(){
      songList.addSong();
    }

    function owned(address addr) constant external returns(bool){
      return ownership[addr];
    }

    function requestUrl() public constant returns(string){
      if(!ownership[msg.sender]){
        throw;
      }
      return audioUrl;
    }

    function tokenFallback(address _from, uint _value, bytes  _data) public {
      if(ownership[_from]){
        throw;
      }
      if(!(msg.sender == tokenAddress)){
        throw;
      }
      if(_value < price){
        throw;
      }
      ownership[_from] = true;
      uint refund = price.sub(_value);
      token.transfer(owner, price);
      if(refund > 0){
        token.transfer(_from, refund);
      }
      //songList.ownSong(_from);
    }

    function getPrice() external returns(uint){
      return price;
    }
    function getSong() external constant returns(
      string _title,
      string _artist,
      uint _price,
      bool _owned,
      address _addr
    ){
    _title = title;
    _artist = artist;
    _price = price;
    _owned = ownership[msg.sender];
    _addr = this;
    }
}
