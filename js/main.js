"use strict";
window.onload = async () => {
    let mtContractReader; //Can Read
    let mtContractSigner; //Can Sign
    let userAddress; //Metamask address
    const contractAddress = "0x82E60f74D7F809DB197428aFcD154314d140eFA0"; //MovingTruck contract address
    //Open metamask and load
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    //Load ERC20 ABI
    let data = await getJSON("../ABI/ERC20Preset.json");
    const erc20ABI = data.abi;
    function getJSON(url) {
        //Get JSON ABI
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((response) => {
                resolve(response.json());
            })
                .then((data) => reject(data));
        });
    }
    async function verifyToken(tokenContractAddress) {
        //Check available balance on specified token and approvals
        let tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
        let name = await tokenContract.name();
        let symbol = await tokenContract.symbol();
        let balance = await tokenContract.balanceOf(userAddress);
        balance = ethers.utils.formatUnits(balance, 18);
        let amountApproved = await tokenContract.allowance(userAddress, contractAddress);
        console.log(amountApproved, name, symbol, balance);
    }
    async function approveToken(tokenContractAddress) {
        //Approve token contract to spend funds
        let tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
        let tokenContractSigner = tokenContract.connect(signer); //Can Sign
        let tx = await tokenContractSigner.approve(contractAddress);
        console.log('tx', tx);
    }
    function moveTokens(ethValue, tokensArray, quantityArray, recipient, sendTip) {
        if (tokensArray.length != quantityArray.length) {
            throw "Arrays don´t match";
        }
        ethValue = !ethValue || ethValue == undefined ? 0 : ethValue;
        let overrides = {
            // To convert Ether to Wei:
            value: ethers.utils.parseEther(ethValue.toString()),
        };
        let tx = mtContractSigner.move(tokensArray, quantityArray, recipient, sendTip, overrides);
    }
    function test() {
        let arr = ["0x14A7E77FbFC96e90F8A5Cbec53De86797aa67695", "0x5164a7fEC539B2E54D2A2Cfb9324483F6F42DdbE"];
        arr.forEach(element => {
            verifyToken(element);
        });
        approveToken(arr[1]);
    }
    data = await getJSON("../ABI/movingTruck.json");
    const contractABI = data.abi;
    //console.log(contractABI)
    mtContractReader = new ethers.Contract(contractAddress, contractABI, provider);
    mtContractSigner = mtContractReader.connect(signer);
    userAddress = await signer.getAddress();
    let txtAddress = `Your current address is ${userAddress}, it´s correct?. Check it on <a target="_blank" href="https://etherscan.io/address/${userAddress}">Etherscan</a>`;
    test();
    document.getElementById("lblSender").innerHTML = txtAddress;
};
