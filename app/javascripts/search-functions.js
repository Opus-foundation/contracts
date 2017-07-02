var _ = require('lodash');


const Search = {
  in: (text, work) => {
    text = text.trim();
    if(text == ""){
      return false;
    }
    console.log(work);
    if((!work.name) || (!work.artist)){
      return false;
    }
    text = text.toLowerCase();
    var title = work.name.toLowerCase();
    //var genre = work.genre.toLowerCase();
    var artist = work.artist.toLowerCase();
    return (title.includes(text) || artist.includes(text));
  },

  search: (text, worklist) => {
    var result = {};
    _.forIn(worklist, (value, key) => {
      if(Search.in(text, value)){
        result[key] = value;
      }
    });
    return result;
  },

};

export default Search;
