pragma solidity ^0.4.8;
contract SongList{
  address[] public songList;
  mapping (address => address[]) public ownedSongs;
  function addSong() external {
    songList.push(msg.sender);
  }
  function getList() external constant returns(address[]){
    return songList;
  }
  function ownSong(address guy) public {
    ownedSongs[guy].push(msg.sender);
  }
  function getOwnedSongs() external constant returns(address[]){
    return ownedSongs[msg.sender];
  }

  function getContractAddress() external constant returns(address) {
    return this;
  }
}
