import Constants from './constants.js';
import Utils from './utils.js';
var etherscanUrl = "https://ropsten.etherscan.io/token/" + Utils.escapeHtml(Constants.tokenAddress);
var Tip = {
  tips: [
    `Welcome to Opus demo! Please ensure you have installed and logged into MetaMask or Mist.
    <a href="#" style="color:#f73e81">Tutorials</a>`,
    "If you change your wallet account in MetaMask/Mist, please refresh the page.",
    "Transactions on the blockchain (e.g. transfers & purchases) typically takes 15s to process.",
    `You can inspect your demo token transactions on
    <a href="`+ etherscanUrl + `" style="color:#f73e81" target="_blank">Etherscan</a>`,
    `Sometimes your ownership status of songs won't be updated immediately after the purchase;
    refreshing the page will solve the problem.`
  ],
  currentTipIndex: 0,
  setStatus: (message)=>{
    var status = document.getElementById("status");
    var tips = document.getElementById("tips");
    status.innerHTML = message;
    tips.style.display = "block";
  },
  displayTip: ()=>{
    Tip.setStatus(Tip.tips[Tip.currentTipIndex]);
  },
  next: ()=>{
    Tip.currentTipIndex += 1;
    if(Tip.currentTipIndex >= Tip.tips.length){
      Tip.currentTipIndex = 0;
    }
    Tip.displayTip();
  },
  hide: ()=>{
    var tips = document.getElementById("tips");
    tips.style.display = "none";
  },
};
export default Tip;
