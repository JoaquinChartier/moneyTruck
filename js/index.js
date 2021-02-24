window.onload = async () => {
    let mtContractReader;
    let mtContractSigner;
    let userAddress;
    const contractAddress = ""; //MovingTruck contract address
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

    function verifyToken(tokenContractAddress) {
        //Check available balance on specified token and approvals
        let tokenContract = new ethers.Contract(
            tokenContractAddress,
            erc20ABI,
            provider
        );
        let name = tokenContract.name();
        let symbol = tokenContract.symbol();
        let balance = await tokenContract.balanceOf(userAddress);
        balance = ethers.utils.formatUnits(balance, 18);
        let hasApproval = tokenContract.allowance(userAddress)
    }

    function moveTokens(ethValue,tokensArray,quantityArray,recipient,sendTip) {
        if (tokensArray.length != quantityArray.length) {
            throw "Arrays don´t match";
        }

        ethValue = !ethValue || ethValue == undefined ? 0 : ethValue;
        let overrides = {
            // To convert Ether to Wei:
            value: ethers.utils.parseEther(ethValue.toString()),
        };
        tx = mtContractSigner.move(
            tokensArray,
            quantityArray,
            recipient,
            sendTip,
            overrides
        );
    }

    let data = await getJSON("../ABI/movingTruck.json");
    const contractABI = data.abi;
    //console.log(contractABI)
    mtContractReader = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
    );
    mtContractSigner = mtContractReader.connect(signer);
    userAddress = await signer.getAddress();
    
    let txtAddress = `Your current address is ${userAddress}, it´s correct?. Check it on <a target="_blank" href="https://etherscan.io/address/${userAddress}">Etherscan</a>`;
    document.getElementById("lblSender").innerHTML = txtAddress;
};