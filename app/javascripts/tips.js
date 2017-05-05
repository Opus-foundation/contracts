
const Tip = {
  tips: [
    `Welcome to Opus demo! Please ensure you have installed and logged into MetaMask or Mist.
    <a href="#" style="color:#f73e81">Tutorials</a>`,
    "If you change your wallet account in MetaMask/Mist, please refresh the page.",
    "Transactions on the blockchain (e.g. transfers & purchases) typically takes 15s to process.",
    `You can inspect your demo token transactions on
    <a href="#" style="color:#f73e81">Etherscan</a>`,
  ],
  currentTipIndex: 0,
  setStatus: (message)=>{
    var status = document.getElementById("status");
    status.innerHTML = message;
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
};
export default Tip;
