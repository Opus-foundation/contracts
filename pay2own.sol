import '../zeppelin-solidity/contracts/SafeMath.sol';
import './SongList.sol';
import './OpusCoin.sol';

contract Work {
    using SafeMath for uint;
    //enum WorkType {score, lyrics, recording}

    //MusicoinLogger public logger;
    address owner;
    address private songListAddress;
    SongList songList;
    address private tokenAddress;
    OpusCoin token;
    //WorkType public workType;
    string public title;
    string public artist;

    // reference to a complete set of metadata
    //string public metadataUrl;
    //string public imageUrl;
    string private audioUrl;
    uint public price;
    mapping (address => bool) private ownership;
    string public imgUrl;

    function Work(
        //address _owner,
        address _token,
        address _songList,
        //address _loggerAddress,
        //WorkType _workType,
        string _title,
        string _artist,
        //string _imageUrl,
        //string _metadataUrl
        string _audioUrl,
        uint _price
        ) {
        owner = msg.sender;
        tokenAddress = _token;
        token = OpusCoin(_token);
        songListAddress = _songList;
        songList = SongList(_songList);
        //logger = MusicoinLogger(_loggerAddress);
        //workType = _workType;
        title = _title;
        artist = _artist;
        //metadataUrl = _metadataUrl;
        //imageUrl = _imageUrl;
        //logger.logWorkReleased(msg.sender, _title, _artist);
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
      bool bounty = false;
      if(_data){
        bounty = true;
        address sharer = _data;
      }
      if(ownership[_from] || !(msg.sender == tokenAddress)){
        throw;
      }
      if(bounty && (sharer == _from)){
        throw;
      }

      if(_value < price){
        throw;
      }
      ownership[_from] = true;
      uint refund = price.sub(_value);
      if(bounty){
        uint artistRevenue = price.sub(bountyAmount);
        token.transfer(owner, artistRevenue);
        token.transfer(sharer, bountyAmount);
        PurchaseWithBounty(_from, sharer);
      }else{
        token.transfer(owner, price);
        Purchase(_from);
      }

      if(refund > 0){
        token.transfer(_from, refund);
      }
    }



    function getPrice() external returns(uint){
      return price;
    }
    function getSong() external constant returns(
      string _title,
      string _artist,
      uint _price,
      bool _owned,
      address _addr,
      string _imgUrl
    ){
    _title = title;
    _artist = artist;
    _price = price;
    _owned = ownership[msg.sender];
    _addr = this;
    _imgUrl = imgUrl;
    }

    function setImg(string url) external {
      if(msg.sender != owner){
        throw;
      }
      imgUrl = url;
    }

}
